import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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

    // TODO: Send notification/email to owner about the warning
    console.log(`TODO: Send warning notification to owner for room ${report.room_id}`)

    return NextResponse.json({ success: true, message: 'Teguran berhasil dikirim ke owner' })
  } catch (error) {
    console.error('Warn owner API error:', error)
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
  }
}
