import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('user_id')

    if (!userId) {
      return NextResponse.json({ success: false, message: 'User ID required' }, { status: 400 })
    }

    const supabase = await createClient()

    // Get owner_id from user_id
    const { data: ownerData, error: ownerError } = await supabase
      .from('owner')
      .select('owner_id')
      .eq('user_id', userId)
      .single()

    if (ownerError || !ownerData) {
      return NextResponse.json({ success: false, message: 'Owner not found' }, { status: 404 })
    }

    const ownerId = ownerData.owner_id

    // Get all room_ids owned by this owner
    const { data: roomsData, error: roomsError } = await supabase
      .from('room')
      .select('room_id')
      .eq('owner_id', ownerId)

    if (roomsError) {
      console.error('Error fetching rooms:', roomsError)
      return NextResponse.json({ success: false, message: roomsError.message }, { status: 500 })
    }

    const roomIds = roomsData?.map(r => r.room_id) || []

    if (roomIds.length === 0) {
      return NextResponse.json({ success: true, data: { reports: [] } })
    }

    // Fetch reports for these rooms
    const { data: reports, error: reportsError } = await supabase
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
        report_image,
        resolution_image,
        resolution_description,
        resolution_submitted_at,
        rejection_reason,
        room (
          room_id,
          name,
          type
        )
      `)
      .in('room_id', roomIds)
      .order('created_at', { ascending: false })

    if (reportsError) {
      console.error('Error fetching reports:', reportsError)
      return NextResponse.json({ success: false, message: reportsError.message }, { status: 500 })
    }

    // Collect customer_ids
    const customerIds = Array.from(new Set((reports || []).map(r => r.customer_id).filter(Boolean)))

    // Fetch customer users
    let customerMap = new Map()
    if (customerIds.length > 0) {
      const { data: customersData } = await supabase.from('customer').select('customer_id, user_id').in('customer_id', customerIds)
      const customerUserIds = (customersData || []).map(c => c.user_id)

      if (customerUserIds.length > 0) {
        const { data: usersData } = await supabase.from('users').select('user_id, name, email').in('user_id', customerUserIds)
        const userMap = new Map((usersData || []).map(u => [u.user_id, u]))
        const customerToUserMap = new Map((customersData || []).map(c => [c.customer_id, c.user_id]))

        customerMap = new Map((customersData || []).map(c => [c.customer_id, {
          name: userMap.get(c.user_id)?.name || 'Unknown',
          email: userMap.get(c.user_id)?.email || null,
        }]))
      }
    }

    // Format report data
    const formattedReports = (reports || []).map((report: any) => {
      const statusMap: Record<string, string> = {
        'pending': 'Perlu tindakan',
        'in_progress': 'Proses',
        'resolved': 'Selesai',
        'rejected': 'Ditolak',
      }

      const roomData = Array.isArray(report.room) ? report.room[0] : report.room
      const customerData = customerMap.get(report.customer_id)

      const date = new Date(report.created_at).toLocaleDateString('id-ID', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      }).replace(/\//g, '/')

      return {
        id: report.report_id,
        date: date,
        roomName: roomData?.name || 'Unknown',
        reporter: customerData?.name || 'Unknown',
        reporterEmail: customerData?.email || null,
        status: statusMap[report.status] || 'Perlu tindakan',
        category: report.category,
        roomId: roomData?.room_id || null,
        roomType: roomData?.type || null,
        transactionId: report.booking_id || null,
        description: report.description,
        attachments: report.report_image || [],
        resolutionImage: report.resolution_image || [],
        resolutionDescription: report.resolution_description || null,
        resolutionSubmittedAt: report.resolution_submitted_at || null,
        rejectionReason: report.rejection_reason || null,
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        reports: formattedReports,
      }
    })
  } catch (error) {
    console.error('Owner reports API error:', error)
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
  }
}
