import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const roomId = searchParams.get('room_id')
    const userId = searchParams.get('user_id')

    // Jika room_id disediakan, fetch reviews untuk room tersebut (public)
    if (roomId) {
      const { data: reviewsData, error: reviewsError } = await supabase
        .from('review')
        .select(`
          review_id,
          rating,
          comment,
          created_at,
          room_id
        `)
        .eq('room_id', roomId)
        .order('created_at', { ascending: false })

      if (reviewsError) {
        console.error('Reviews fetch error:', reviewsError)
        return NextResponse.json({ error: reviewsError.message }, { status: 500 })
      }

      const formattedReviews = (reviewsData || []).map((r: any) => ({
        id: r.review_id,
        rating: r.rating,
        review: r.comment || '',
        date: new Date(r.created_at).toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        }),
      }))

      return NextResponse.json({
        success: true,
        data: formattedReviews,
      })
    }

    // Jika user_id disediakan, fetch reviews untuk owner (authenticated)
    if (userId) {
      // Get owner_id dari user_id
      const { data: ownerRecord, error: ownerLookupError } = await supabase
        .from('owner')
        .select('owner_id')
        .eq('user_id', userId)
        .maybeSingle()

      if (ownerLookupError) {
        console.error('Owner lookup error:', ownerLookupError)
        return NextResponse.json({ error: ownerLookupError.message }, { status: 500 })
      }

      if (!ownerRecord?.owner_id) {
        console.log('No owner_id found for user')
        return NextResponse.json({ reviews: [], rooms: [] })
      }

      const ownerId = ownerRecord.owner_id

      // Fetch rooms milik owner
      const { data: roomsData, error: roomsError } = await supabase
        .from('room')
        .select('room_id, name')
        .eq('owner_id', ownerId)
        .eq('is_available', true)
        .in('status', ['approved', 'active'])

      if (roomsError) {
        console.error('Rooms fetch error:', roomsError)
        return NextResponse.json({ error: roomsError.message }, { status: 500 })
      }

      if (!roomsData || roomsData.length === 0) {
        console.log('No rooms found for owner')
        return NextResponse.json({ reviews: [], rooms: [] })
      }

      const ownerRoomIds = roomsData.map((r: any) => r.room_id)

      // Fetch reviews untuk room milik owner
      const { data: reviewsData, error: reviewsError } = await supabase
        .from('review')
        .select(`
          review_id,
          rating,
          comment,
          created_at,
          room_id,
          room!review_room_id_fkey (
            name
          )
        `)
        .in('room_id', ownerRoomIds)
        .order('created_at', { ascending: false })

      if (reviewsError) {
        console.error('Reviews fetch error:', reviewsError)
        return NextResponse.json({ error: reviewsError.message }, { status: 500 })
      }

      const formattedReviews = (reviewsData || []).map((r: any) => {
        const roomName = Array.isArray(r.room)
          ? r.room[0]?.name ?? 'Unknown'
          : r.room?.name ?? 'Unknown'

        return {
          id: r.review_id,
          roomName,
          rating: r.rating,
          review: r.comment || '',
          date: new Date(r.created_at).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          }),
        }
      })

      return NextResponse.json({
        reviews: formattedReviews,
        rooms: roomsData.map((r: any) => r.name),
      })
    }

    // Jika tidak ada parameter, return error
    return NextResponse.json({ error: 'room_id or user_id required' }, { status: 400 })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}