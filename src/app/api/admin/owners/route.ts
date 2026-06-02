import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const status = searchParams.get('status')

    const supabase = await createClient()

    // Fetch owners without nested user join
    let query = supabase
      .from('owner')
      .select(`
        owner_id,
        user_id,
        business_name,
        business_phone,
        status,
        applied_at,
        approved_at
      `)
      .order('applied_at', { ascending: false })

    // Apply status filter
    if (status) {
      const statusMap: Record<string, string> = {
        'Aktif': 'active',
        'Tidak aktif': 'rejected',
      }
      query = query.eq('status', statusMap[status] || status)
    }

    const { data: owners, error: ownersError } = await query

    if (ownersError) {
      return NextResponse.json({ success: false, message: ownersError.message }, { status: 500 })
    }

    // Get room counts for each owner
    const ownerIds = Array.from(new Set((owners || []).map(owner => owner.owner_id).filter(Boolean)))
    let roomCounts: { [key: string]: number } = {}
    
    if (ownerIds.length > 0) {
      const { data: roomsData, error: roomsError } = await supabase
        .from('room')
        .select('owner_id')
        .in('owner_id', ownerIds)

      if (roomsError) {
        console.warn('Error fetching room counts:', roomsError.message)
      } else {
        roomCounts = (roomsData || []).reduce((acc, room) => {
          acc[room.owner_id] = (acc[room.owner_id] || 0) + 1
          return acc
        }, {} as { [key: string]: number })
      }
    }

    // Fetch user data separately
    const userIds = Array.from(new Set((owners || []).map(owner => owner.user_id).filter(Boolean)))
    let userMap: Map<string, { name: string; email: string; phone_number: string }> = new Map()
    
    if (userIds.length > 0) {
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('user_id, name, email, phone_number')
        .in('user_id', userIds)

      if (usersError) {
        console.warn('Error fetching users:', usersError.message)
      } else {
        userMap = new Map((usersData || []).map(user => [user.user_id, user]))
      }
    }

    // Format owner data
    const formattedOwners = (owners || []).map((owner: any) => {
      const statusMap: Record<string, 'Aktif' | 'Tidak aktif'> = {
        'active': 'Aktif',
        'rejected': 'Tidak aktif',
        'pending': 'Tidak aktif',
      }
      
      const joinedDate = owner.applied_at 
        ? new Date(owner.applied_at).toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
          })
        : '-'

      const userData = userMap.get(owner.user_id)

      return {
        id: owner.owner_id,
        businessName: owner.business_name || '-',
        ownerName: userData?.name || '-',
        status: statusMap[owner.status] || 'Tidak aktif',
        email: userData?.email || '-',
        phone: owner.business_phone || userData?.phone_number || '-',
        joinedDate: joinedDate,
        totalRooms: roomCounts[owner.owner_id] || 0,
        totalReports: 0, // TODO: Implement when reports table is created
      }
    })

    // Apply search filter
    let filteredOwners = formattedOwners
    if (search) {
      const searchLower = search.toLowerCase()
      filteredOwners = formattedOwners.filter(owner =>
        owner.id.toLowerCase().includes(searchLower) ||
        owner.businessName.toLowerCase().includes(searchLower) ||
        owner.ownerName.toLowerCase().includes(searchLower)
      )
    }

    return NextResponse.json({
      success: true,
      data: filteredOwners
    })
  } catch (error) {
    console.error('Admin owners API error:', error)
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
  }
}
