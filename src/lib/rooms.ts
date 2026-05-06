import { createClient } from '@/lib/supabase/server'
import { RoomDetail, UpcomingBooking } from '@/types'
import { isPendingPaymentExpired } from '@/utils/booking'
import { formatDateForDatabase } from '@/utils/formatDate'
import { normalizeRoom } from '@/utils/room'

type RoomRecord = {
  room_id: string
  name: string
  description?: string | null
  capacity: number
  price_per_hour: number
  location: string
  region_id?: string | null
  is_available: boolean
  status?: string | null
  created_at?: string | null
  type?: string | null
}

type RegionRecord = {
  region_id: string
  name: string
  province_id?: string | null
}

type ProvinceRecord = {
  province_id: string
  name: string
}

type AmenityRecord = {
  amenity: string
}

type BookingRecord = UpcomingBooking & {
  booking_date: string
}

export async function getRoomDetail(roomId: string): Promise<RoomDetail | null> {
  const supabase = await createClient()

  const { data: room, error: roomError } = await supabase
    .from('room')
    .select('room_id, name, description, capacity, price_per_hour, location, region_id, is_available, status, created_at, type')
    .eq('room_id', roomId)
    .maybeSingle<RoomRecord>()

  if (roomError) {
    throw new Error(roomError.message)
  }

  if (!room) {
    return null
  }

  const { data: amenities, error: amenitiesError } = await supabase
    .from('room_amenity')
    .select('amenity')
    .eq('room_id', roomId)
    .returns<AmenityRecord[]>()

  if (amenitiesError) {
    throw new Error(amenitiesError.message)
  }

  // Get room images from room_image table
  const { data: roomImages, error: imagesError } = await supabase
    .from('room_image')
    .select('image_url, is_primary, sort_order')
    .eq('room_id', roomId)
    .order('sort_order', { ascending: true })

  if (imagesError) {
    console.warn('Error fetching room images:', imagesError.message)
  }

  let regionName: string | null = null
  let provinceName: string | null = null

  if (room.region_id) {
    const { data: region, error: regionError } = await supabase
      .from('region')
      .select('region_id, name, province_id')
      .eq('region_id', room.region_id)
      .maybeSingle<RegionRecord>()

    if (regionError) {
      throw new Error(regionError.message)
    }

    regionName = region?.name ?? null

    if (region?.province_id) {
      const { data: province, error: provinceError } = await supabase
        .from('province')
        .select('province_id, name')
        .eq('province_id', region.province_id)
        .maybeSingle<ProvinceRecord>()

      if (provinceError) {
        throw new Error(provinceError.message)
      }

      provinceName = province?.name ?? null
    }
  }

  const now = formatDateForDatabase()
  const { data: upcomingBookings, error: bookingError } = await supabase
    .from('booking')
    .select('booking_id, booking_date, check_in, check_out, status')
    .eq('room_id', roomId)
    .gte('check_out', now)
    .neq('status', 'cancelled')
    .order('check_in', { ascending: true })
    .returns<BookingRecord[]>()

  if (bookingError) {
    throw new Error(bookingError.message)
  }

  const roomImagesList = roomImages?.map(img => img.image_url) || []
  const normalizedRoom = normalizeRoom({
    ...room,
    description: room.description ?? undefined,
    type: room.type ?? undefined,
    facilities: (amenities ?? []).map(item => item.amenity),
    image_url: roomImagesList[0] ?? null,
    images: roomImagesList
  })

  const activeUpcomingBookings = (upcomingBookings ?? []).filter(
    booking => !isPendingPaymentExpired(booking.status, booking.booking_date)
  )

  const { data: reviewStats, error: reviewError } = await supabase
    .from('review')
    .select('rating')
    .eq('room_id', roomId)

  if (reviewError) {
    throw new Error(reviewError.message)
  }

  const reviews = reviewStats ?? []
  const review_count = reviews.length
  const rating = review_count > 0
    ? Number((reviews.reduce((sum, r) => sum + r.rating, 0) / review_count).toFixed(1))
    : 0

  return {
    ...normalizedRoom,
    status: room.status ?? null,
    created_at: room.created_at ?? null,
    region_name: regionName,
    province_name: provinceName,
    upcoming_booking_count: activeUpcomingBookings.length,
    upcoming_bookings: activeUpcomingBookings,
    next_booking: activeUpcomingBookings[0] ?? null,
    rating,
    review_count
  }
}
