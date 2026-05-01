import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isPendingPaymentExpired } from '@/utils/booking'
import { formatDateForDatabase } from '@/utils/formatDate'

type RegionLocation = {
  region_id: string
  name: string
  province_id?: string | null
}

function getNextDate(date: string) {
  const [year, month, day] = date.split('-').map(Number)
  const nextDay = new Date(Date.UTC(year, month - 1, day))
  nextDay.setUTCDate(nextDay.getUTCDate() + 1)
  return nextDay.toISOString().slice(0, 10)
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const locationId = searchParams.get('location_id')
    const locationName = searchParams.get('location_name') ?? searchParams.get('location')
    const locationType = searchParams.get('location_type')
    const capacity = searchParams.get('capacity')
    const date = searchParams.get('date')
    const limit = searchParams.get('limit')

    const supabase = await createClient()

    // First get rooms
    let roomQuery = supabase
      .from('room')
      .select('room_id, name, capacity, price_per_hour, location, region_id, is_available, description, type')
      .eq('is_available', true)

    if (type) roomQuery = roomQuery.eq('type', type)
    if (capacity) roomQuery = roomQuery.gte('capacity', parseInt(capacity))

    const { data: roomData, error: roomError } = await roomQuery

    if (roomError) {
      return NextResponse.json({ success: false, message: roomError.message }, { status: 500 })
    }

    let rooms = roomData ?? []

    if (locationId || locationName) {
      const matchedProvinces = new Map<string, { province_id: string; name: string }>()
      const matchedRegions = new Map<string, RegionLocation>()

      if (locationType === 'province') {
        if (locationId) {
          const { data: provincesById, error: provinceByIdError } = await supabase
            .from('province')
            .select('province_id, name')
            .eq('province_id', locationId)

          if (provinceByIdError) {
            return NextResponse.json({ success: false, message: provinceByIdError.message }, { status: 500 })
          }

          provincesById?.forEach(province => {
            matchedProvinces.set(province.province_id, province)
          })
        } else if (locationName) {
          const { data: provincesByName, error: provinceByNameError } = await supabase
            .from('province')
            .select('province_id, name')
            .ilike('name', locationName.trim())

          if (provinceByNameError) {
            return NextResponse.json({ success: false, message: provinceByNameError.message }, { status: 500 })
          }

          provincesByName?.forEach(province => {
            matchedProvinces.set(province.province_id, province)
          })
        }
      }

      if (locationType !== 'province') {
        if (locationId) {
          const { data: regionsById, error: regionByIdError } = await supabase
            .from('region')
            .select('region_id, name, province_id')
            .eq('region_id', locationId)

          if (regionByIdError) {
            return NextResponse.json({ success: false, message: regionByIdError.message }, { status: 500 })
          }

          regionsById?.forEach(region => {
            matchedRegions.set(region.region_id, region)
          })
        } else if (locationName) {
          const { data: regionsByName, error: regionByNameError } = await supabase
            .from('region')
            .select('region_id, name, province_id')
            .ilike('name', locationName.trim())

          if (regionByNameError) {
            return NextResponse.json({ success: false, message: regionByNameError.message }, { status: 500 })
          }

          regionsByName?.forEach(region => {
            matchedRegions.set(region.region_id, region)
          })
        }
      }

      const regionIds = new Set<string>()

      if (locationType === 'province') {
        const provinceIds = Array.from(matchedProvinces.keys())

        if (provinceIds.length > 0) {
          const { data: provinceRegions, error: provinceRegionsError } = await supabase
            .from('region')
            .select('region_id, name, province_id')
            .in('province_id', provinceIds)

          if (provinceRegionsError) {
            return NextResponse.json({ success: false, message: provinceRegionsError.message }, { status: 500 })
          }

          provinceRegions?.forEach(region => {
            matchedRegions.set(region.region_id, region)
          })
        }
      }

      matchedRegions.forEach(region => {
        regionIds.add(region.region_id)
      })

      rooms = rooms.filter(room => room.region_id && regionIds.has(room.region_id))
    }

    if (date && rooms.length > 0) {
      const dayStart = `${date}T00:00:00`
      const dayEnd = `${getNextDate(date)}T00:00:00`
      const roomIds = rooms.map(room => room.room_id)

      const { data: bookedRooms, error: bookingError } = await supabase
        .from('booking')
        .select('room_id, status, booking_date')
        .in('room_id', roomIds)
        .lt('check_in', dayEnd)
        .gt('check_out', dayStart)
        .neq('status', 'cancelled')

      if (bookingError) {
        return NextResponse.json({ success: false, message: bookingError.message }, { status: 500 })
      }

      const bookedRoomIds = new Set(
        (bookedRooms ?? [])
          .filter(booking => !isPendingPaymentExpired(booking.status, booking.booking_date))
          .map(booking => booking.room_id)
      )
      rooms = rooms.filter(room => !bookedRoomIds.has(room.room_id))
    }

    if (limit) {
      rooms = rooms.slice(0, parseInt(limit))
    }

    if (!rooms || rooms.length === 0) {
      return NextResponse.json({ success: true, data: [] })
    }

    // Get amenities and images for each room
    const roomIds = rooms.map(room => room.room_id)

    const { data: amenities, error: amenityError } = await supabase
      .from('room_amenity')
      .select('room_id, amenity')
      .in('room_id', roomIds)

    if (amenityError) {
      console.warn('Error fetching amenities:', amenityError.message)
    }

    const { data: roomImages, error: imagesError } = await supabase
      .from('room_image')
      .select('room_id, image_url, is_primary, sort_order')
      .in('room_id', roomIds)
      .order('sort_order', { ascending: true })

    if (imagesError) {
      console.warn('Error fetching room images:', imagesError.message)
    }

    // Group amenities by room_id
    const amenitiesByRoom: { [key: string]: string[] } = {}
    if (amenities) {
      amenities.forEach(amenity => {
        if (!amenitiesByRoom[amenity.room_id]) {
          amenitiesByRoom[amenity.room_id] = []
        }
        amenitiesByRoom[amenity.room_id].push(amenity.amenity)
      })
    }

    // Group images by room_id
    const imagesByRoom: { [key: string]: string[] } = {}
    if (roomImages) {
      roomImages.forEach(img => {
        if (!imagesByRoom[img.room_id]) {
          imagesByRoom[img.room_id] = []
        }
        imagesByRoom[img.room_id].push(img.image_url)
      })
    }

    // Combine rooms with their amenities and images
    const roomsWithAmenities = rooms.map(room => ({
      ...room,
      image_url: imagesByRoom[room.room_id]?.[0] ?? null,
      images: imagesByRoom[room.room_id] || [],
      facilities: amenitiesByRoom[room.room_id] || []
    }))

    return NextResponse.json({ success: true, data: roomsWithAmenities })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ success: false, message: 'Terjadi kesalahan.' }, { status: 500 })
  }
}

async function generateRoomId(supabase: Awaited<ReturnType<typeof createClient>>) {
  // Get the highest existing room_id with format r-[number]
  const { data: rooms, error } = await supabase
    .from('room')
    .select('room_id')
    .like('room_id', 'r-%')
    .order('room_id', { ascending: false })
    .limit(1)

  if (error) {
    throw new Error('Failed to generate room ID: ' + error.message)
  }

  let nextNumber = 1
  if (rooms && rooms.length > 0) {
    const lastId = rooms[0].room_id
    const match = lastId.match(/r-(\d+)/)
    if (match) {
      nextNumber = parseInt(match[1], 10) + 1
    }
  }

  return `r-${nextNumber}`
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as {
      user_id?: string
      name?: string
      description?: string
      capacity?: number
      price_per_hour?: number
      location?: string
      type?: string
      region_id?: string
    }

    const { user_id, name, description, capacity, price_per_hour, location, type, region_id } = body

    // Validation
    if (!user_id || !name || !capacity || !price_per_hour || !location || !type || !region_id) {
      return NextResponse.json(
        { success: false, message: 'Field wajib belum lengkap. Mohon isi semua field yang diperlukan.' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Get owner_id from user_id
    const { data: ownerRecord, error: ownerError } = await supabase
      .from('owner')
      .select('owner_id')
      .eq('user_id', user_id)
      .maybeSingle()

    if (ownerError) {
      return NextResponse.json({ success: false, message: ownerError.message }, { status: 500 })
    }

    if (!ownerRecord?.owner_id) {
      return NextResponse.json(
        { success: false, message: 'Owner tidak ditemukan. Pastikan akun Anda sudah terdaftar sebagai owner.' },
        { status: 404 }
      )
    }

    const roomId = await generateRoomId(supabase)
    const now = formatDateForDatabase()

    // Insert room
    const { error: insertError } = await supabase.from('room').insert({
      room_id: roomId,
      owner_id: ownerRecord.owner_id,
      name: name.trim(),
      description: description?.trim() || null,
      capacity: Number(capacity),
      price_per_hour: Number(price_per_hour),
      location: location.trim(),
      type: type.trim(),
      region_id: region_id.trim(),
      is_available: true,
      status: 'active',
      created_at: now,
    })

    if (insertError) {
      return NextResponse.json({ success: false, message: insertError.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Ruangan berhasil ditambahkan.',
      data: { room_id: roomId },
    })
  } catch (error) {
    console.error('Create room API error:', error)
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan saat menambahkan ruangan.' },
      { status: 500 }
    )
  }
}
