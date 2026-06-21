import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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
      .select('status, room_id')
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

    return NextResponse.json({ success: true, message: 'Ruangan berhasil ditangguhkan' })
  } catch (error) {
    console.error('Suspend room API error:', error)
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
  }
}
