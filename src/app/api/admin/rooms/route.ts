import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const type = searchParams.get('type')
    const status = searchParams.get('status')

    const supabase = await createClient()

    // Fetch rooms with owner information (no nested user join)
    let query = supabase
      .from('room')
      .select(`
        room_id,
        name,
        capacity,
        type,
        status,
        price_per_hour,
        is_available,
        owner_id
      `)
      .order('room_id', { ascending: true })

    // Apply filters
    if (type) {
      query = query.eq('type', type)
    }
    if (status) {
      query = query.eq('status', status)
    }

    const { data: rooms, error: roomsError } = await query

    if (roomsError) {
      console.error('Rooms error:', roomsError)
      return NextResponse.json({ success: false, message: roomsError.message }, { status: 500 })
    }

    // Get owner IDs and fetch owner data separately
    const ownerIds = Array.from(new Set((rooms || []).map((room: any) => room.owner_id).filter(Boolean)))
    
    let ownerMap: Map<string, { user_id: string; business_name: string }> = new Map()
    
    if (ownerIds.length > 0) {
      const { data: ownersData, error: ownersError } = await supabase
        .from('owner')
        .select('owner_id, user_id, business_name')
        .in('owner_id', ownerIds)

      if (ownersError) {
        console.warn('Error fetching owners:', ownersError.message)
      } else {
        ownerMap = new Map((ownersData || []).map(owner => [owner.owner_id, owner]))
      }
    }

    // Get user IDs and fetch user data separately
    const userIds = Array.from(new Set((rooms || []).map((room: any) => ownerMap.get(room.owner_id)?.user_id).filter(Boolean)))
    
    let userMap: Map<string, string> = new Map()
    
    if (userIds.length > 0) {
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('user_id, name')
        .in('user_id', userIds)

      if (usersError) {
        console.warn('Error fetching users:', usersError.message)
      } else {
        userMap = new Map((usersData || []).map(user => [user.user_id, user.name]))
      }
    }

    // Format room data
    const formattedRooms = (rooms || []).map((room: any) => {
      const ownerData = ownerMap.get(room.owner_id)
      const ownerUserId = ownerData?.user_id
      
      return {
        id: room.room_id,
        name: room.name,
        owner: (ownerUserId ? userMap.get(ownerUserId) : null) || ownerData?.business_name || 'Unknown',
        type: room.type,
        capacity: room.capacity,
        status: room.status === 'aktif' ? 'Aktif' : 'Tidak aktif',
      }
    })

    // Apply search filter
    let filteredRooms = formattedRooms
    if (search) {
      const searchLower = search.toLowerCase()
      filteredRooms = formattedRooms.filter(room =>
        room.id.toLowerCase().includes(searchLower) ||
        room.name.toLowerCase().includes(searchLower) ||
        room.owner.toLowerCase().includes(searchLower)
      )
    }

    return NextResponse.json({
      success: true,
      data: filteredRooms
    })
  } catch (error) {
    console.error('Admin rooms API error:', error)
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
  }
}
