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
    const body = await request.json()
    const { reason } = body

    if (!reason) {
      return NextResponse.json({ success: false, message: 'Alasan penolakan wajib diisi' }, { status: 400 })
    }

    // Get current report status
    const { data: report, error: fetchError } = await supabase
      .from('report')
      .select('status, customer_id')
      .eq('report_id', id)
      .single()

    if (fetchError || !report) {
      return NextResponse.json({ success: false, message: 'Laporan tidak ditemukan' }, { status: 404 })
    }

    // Validate status transition
    if (report.status !== 'pending' && report.status !== 'in_progress') {
      return NextResponse.json({ success: false, message: 'Status laporan tidak valid untuk ditolak' }, { status: 400 })
    }

    // Update report status and rejection reason
    const { error: updateError } = await supabase
      .from('report')
      .update({
        status: 'rejected',
        rejection_reason: reason,
        updated_at: new Date().toISOString(),
      })
      .eq('report_id', id)

    if (updateError) {
      console.error('Reject report error:', updateError)
      return NextResponse.json({ success: false, message: updateError.message }, { status: 500 })
    }

    // Notify customer about rejection
    const { data: customerUser } = await supabase
      .from('customer')
      .select('user_id')
      .eq('customer_id', report.customer_id)
      .maybeSingle()

    if (customerUser?.user_id) {
      await createNotification({
        user_id: customerUser.user_id,
        title: 'Laporan Anda Ditolak',
        description: `Laporan Anda telah ditolak. Alasan: ${reason}`,
        type: 'system',
        priority: 'medium',
        related_id: id,
        related_type: 'report'
      })
    }

    return NextResponse.json({ success: true, message: 'Laporan berhasil ditolak' })
  } catch (error) {
    console.error('Reject report API error:', error)
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
  }
}
