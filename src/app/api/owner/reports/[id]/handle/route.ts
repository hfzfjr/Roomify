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
      .select('status')
      .eq('report_id', id)
      .single()

    if (fetchError || !report) {
      return NextResponse.json({ success: false, message: 'Laporan tidak ditemukan' }, { status: 404 })
    }

    // Validate status transition
    if (report.status !== 'pending') {
      return NextResponse.json({ success: false, message: 'Status laporan tidak valid untuk ditangani' }, { status: 400 })
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
      console.error('Handle report error:', updateError)
      return NextResponse.json({ success: false, message: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Laporan berhasil ditangani' })
  } catch (error) {
    console.error('Handle report API error:', error)
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
  }
}
