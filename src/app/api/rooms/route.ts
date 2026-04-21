import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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
        .select('room_id')
        .in('room_id', roomIds)
        .lt('check_in', dayEnd)
        .gt('check_out', dayStart)
        .neq('status', 'cancelled')

      if (bookingError) {
        return NextResponse.json({ success: false, message: bookingError.message }, { status: 500 })
      }

      const bookedRoomIds = new Set((bookedRooms ?? []).map(booking => booking.room_id))
      rooms = rooms.filter(room => !bookedRoomIds.has(room.room_id))
    }

    if (limit) {
      rooms = rooms.slice(0, parseInt(limit))
    }

    if (!rooms || rooms.length === 0) {
      return NextResponse.json({ success: true, data: [] })
    }

    // Get amenities for each room
    const roomIds = rooms.map(room => room.room_id)
    const { data: amenities, error: amenityError } = await supabase
      .from('room_amenity')
      .select('room_id, amenity')
      .in('room_id', roomIds)

    if (amenityError) {
      console.warn('Error fetching amenities:', amenityError.message)
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

    // Combine rooms with their amenities
    const roomsWithAmenities = rooms.map(room => ({
      ...room,
      facilities: amenitiesByRoom[room.room_id] || []
    }))

    return NextResponse.json({ success: true, data: roomsWithAmenities })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ success: false, message: 'Terjadi kesalahan.' }, { status: 500 })
  }
}
