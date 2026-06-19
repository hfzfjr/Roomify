import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const status = searchParams.get('status')
    const category = searchParams.get('category')

    const supabase = await createClient()

    // Fetch reports with room data (no nested user joins)
    let query = supabase
      .from('report')
      .select(`
        report_id,
        description,
        status,
        category,
        created_at,
        updated_at,
        customer_id,
        room_id,
        booking_id,
        room (
          room_id,
          name,
          owner_id,
          type
        )
      `)
      .order('created_at', { ascending: false })

    // Apply status filter
    if (status) {
      const statusMap: Record<string, string> = {
        'Pending': 'pending',
        'Perlu tindakan': 'in_progress',
        'Selesai': 'resolved',
      }
      query = query.eq('status', statusMap[status] || status)
    }

    // Apply category filter
    if (category) {
      query = query.eq('category', category)
    }

    const { data: reports, error: reportsError } = await query

    if (reportsError) {
      return NextResponse.json({ success: false, message: reportsError.message }, { status: 500 })
    }

    // Collect all customer_ids and owner_ids
    const customerIds = Array.from(new Set((reports || []).map(r => r.customer_id).filter(Boolean)))
    const ownerIds = Array.from(new Set((reports || []).map((r: any) => {
      const roomData = Array.isArray(r.room) ? r.room[0] : r.room
      return roomData?.owner_id
    }).filter(Boolean)))

    // Fetch customer users and owner users separately
    const [customersData, ownersData] = await Promise.all([
      customerIds.length > 0
        ? supabase.from('customer').select('customer_id, user_id').in('customer_id', customerIds)
        : Promise.resolve({ data: [], error: null }),
      ownerIds.length > 0
        ? supabase.from('owner').select('owner_id, user_id, business_name').in('owner_id', ownerIds)
        : Promise.resolve({ data: [], error: null })
    ])

    const customerMap = new Map((customersData.data || []).map(c => [c.customer_id, c.user_id]))
    const ownerMap = new Map((ownersData.data || []).map(o => [o.owner_id, o]))

    // Fetch all user data
    const allUserIds = Array.from(new Set([
      ...(customersData.data || []).map(c => c.user_id),
      ...(ownersData.data || []).map(o => o.user_id)
    ])).filter(Boolean)

    let userData: any[] = []
    if (allUserIds.length > 0) {
      const { data: usersData } = await supabase.from('users').select('user_id, name, email').in('user_id', allUserIds)
      userData = usersData || []
    }

    const userMap = new Map(userData.map(u => [u.user_id, u.name]))
    const userEmailMap = new Map(userData.map(u => [u.user_id, u.email]))

    // Format report data
    const formattedReports = (reports || []).map((report: any) => {
      const statusMap: Record<string, 'Pending' | 'Perlu tindakan' | 'Selesai'> = {
        'pending': 'Pending',
        'in_progress': 'Perlu tindakan',
        'resolved': 'Selesai',
      }

      const roomData = Array.isArray(report.room) ? report.room[0] : report.room
      const ownerData = ownerMap.get(roomData?.owner_id)
      const customerUserId = customerMap.get(report.customer_id)

      const date = new Date(report.created_at).toLocaleDateString('id-ID', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      }).replace(/\//g, '/')

      return {
        id: report.report_id,
        date: date,
        roomName: roomData?.name || 'Unknown',
        owner: userMap.get(ownerData?.user_id) || ownerData?.business_name || 'Unknown',
        reporter: userMap.get(customerUserId) || 'Unknown',
        reporterEmail: userEmailMap.get(customerUserId) || null,
        businessName: ownerData?.business_name || null,
        transactionId: report.booking_id || null,
        roomId: roomData?.room_id || null,
        roomType: roomData?.type || null,
        status: statusMap[report.status] || 'Pending',
        description: report.description,
        category: report.category,
      }
    })

    // Apply search filter
    let filteredReports = formattedReports
    if (search) {
      const searchLower = search.toLowerCase()
      filteredReports = formattedReports.filter(report =>
        (report.id?.toLowerCase() || '').includes(searchLower) ||
        (report.roomName?.toLowerCase() || '').includes(searchLower) ||
        (report.owner?.toLowerCase() || '').includes(searchLower) ||
        (report.reporter?.toLowerCase() || '').includes(searchLower)
      )
    }

    // Calculate stats
    const totalNew = formattedReports.filter(r => r.status === 'Pending').length
    const waitingAction = formattedReports.filter(r => r.status === 'Perlu tindakan').length
    const solved = formattedReports.filter(r => r.status === 'Selesai').length

    return NextResponse.json({
      success: true,
      data: {
        reports: filteredReports,
        stats: {
          totalNew,
          waitingAction,
          solved,
        }
      }
    })
  } catch (error) {
    console.error('Admin reports API error:', error)
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
  }
}
