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

    // Get current report status
    const { data: report, error: fetchError } = await supabase
      .from('report')
      .select('status, room_id')
      .eq('report_id', id)
      .single()

    if (fetchError || !report) {
      return NextResponse.json({ success: false, message: 'Laporan tidak ditemukan' }, { status: 404 })
    }

    // Validate status transition
    if (report.status !== 'pending') {
      return NextResponse.json({ success: false, message: 'Status laporan tidak valid untuk dikirim teguran' }, { status: 400 })
    }

    // Update report status to in_progress
    const { error: updateError } = await supabase
      .from('report')
      .update({
        status: 'in_progress',
        updated_at: new Date().toISOString(),
      })
      .eq('report_id', id)

    if (updateError) {
      console.error('Warn owner error:', updateError)
      return NextResponse.json({ success: false, message: updateError.message }, { status: 500 })
    }

    // Notify owner about warning
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
          title: 'Anda Menerima Teguran dari Admin',
          description: 'Admin telah mengirim teguran terkait laporan yang masuk. Segera perbaiki masalah yang dilaporkan.',
          type: 'system',
          priority: 'high',
          related_id: id,
          related_type: 'report'
        })
      }
    }

    return NextResponse.json({ success: true, message: 'Teguran berhasil dikirim ke owner' })
  } catch (error) {
    console.error('Warn owner API error:', error)
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
  }
}
