import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createNotification } from '@/lib/notifications'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Get current report status and room_id
    const { data: report, error: fetchError } = await supabase
      .from('report')
      .select('status, room_id, customer_id')
      .eq('report_id', id)
      .single()

    if (fetchError || !report) {
      return NextResponse.json({ success: false, message: 'Laporan tidak ditemukan' }, { status: 404 })
    }

    // Validate status transition
    if (report.status !== 'pending' && report.status !== 'in_progress') {
      return NextResponse.json({ success: false, message: 'Status laporan tidak valid untuk suspend' }, { status: 400 })
    }

    // Update both room status and report status in a transaction
    const { error: roomError } = await supabase
      .from('room')
      .update({
        status: 'suspend',
      })
      .eq('room_id', report.room_id)

    if (roomError) {
      console.error('Suspend room error:', roomError)
      return NextResponse.json({ success: false, message: roomError.message }, { status: 500 })
    }

    const { error: reportError } = await supabase
      .from('report')
      .update({
        status: 'resolved',
        updated_at: new Date().toISOString(),
      })
      .eq('report_id', id)

    if (reportError) {
      console.error('Update report error:', reportError)
      // Rollback room status if report update fails
      await supabase
        .from('room')
        .update({ status: 'aktif' })
        .eq('room_id', report.room_id)
      return NextResponse.json({ success: false, message: reportError.message }, { status: 500 })
    }

    // Notify customer that report has been resolved (room suspended)
    const { data: customerUser } = await supabase
      .from('customer')
      .select('user_id')
      .eq('customer_id', report.customer_id)
      .maybeSingle()

    if (customerUser?.user_id) {
      await createNotification({
        user_id: customerUser.user_id,
        title: 'Laporan Telah Diselesaikan',
        description: 'Laporan Anda telah diselesaikan. Ruangan terkait telah ditangguhkan sementara.',
        type: 'system',
        priority: 'medium',
        related_id: id,
        related_type: 'report'
      })
    }

    // Notify owner that room has been suspended
    const { data: room } = await supabase
      .from('room')
      .select('owner_id')
      .eq('room_id', report.room_id)
      .maybeSingle()

    if (room?.owner_id) {
      const { data: ownerUser } = await supabase
        .from('owner')
        .select('user_id')
        .eq('owner_id', room.owner_id)
        .maybeSingle()

      if (ownerUser?.user_id) {
        await createNotification({
          user_id: ownerUser.user_id,
          title: 'Laporan Telah Diselesaikan',
          description: 'Laporan terkait telah diselesaikan. Ruangan Anda telah ditangguhkan sementara.',
          type: 'system',
          priority: 'medium',
          related_id: id,
          related_type: 'report'
        })
      }
    }

    return NextResponse.json({ success: true, message: 'Ruangan berhasil ditangguhkan' })
  } catch (error) {
    console.error('Suspend room API error:', error)
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
  }
}
