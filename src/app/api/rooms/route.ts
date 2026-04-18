import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const type     = searchParams.get('type')
    const capacity = searchParams.get('capacity')
    const limit    = searchParams.get('limit')

    const supabase = await createClient()

    // First get rooms
    let roomQuery = supabase
      .from('room')
      .select('room_id, name, capacity, price_per_hour, location, is_available, description')
      .eq('is_available', true)

    if (type)     roomQuery = roomQuery.eq('type', type)
    if (capacity) roomQuery = roomQuery.gte('capacity', parseInt(capacity))
    if (limit)    roomQuery = roomQuery.limit(parseInt(limit))

    const { data: rooms, error: roomError } = await roomQuery

    if (roomError) {
      return NextResponse.json({ success: false, message: roomError.message }, { status: 500 })
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
