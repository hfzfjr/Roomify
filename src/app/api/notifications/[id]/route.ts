import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json() as { user_id?: string }

    if (!body.user_id) {
      return NextResponse.json({ success: false, message: 'user_id wajib diisi.' }, { status: 400 })
    }

    const supabase = await createClient()

    // Verify that the notification belongs to the user
    const { data: notification, error: fetchError } = await supabase
      .from('notifications')
      .select('user_id')
      .eq('id', id)
      .eq('user_id', body.user_id)
      .maybeSingle()

    if (fetchError) {
      return NextResponse.json({ success: false, message: fetchError.message }, { status: 500 })
    }

    if (!notification) {
      return NextResponse.json({ success: false, message: 'Notifikasi tidak ditemukan.' }, { status: 404 })
    }

    // Mark as read
    const { error: updateError } = await supabase
      .from('notifications')
      .update({ is_read: true, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', body.user_id)

    if (updateError) {
      return NextResponse.json({ success: false, message: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Notifikasi ditandai sebagai dibaca.' })
  } catch (error) {
    console.error('Notification PATCH error:', error)
    return NextResponse.json({ success: false, message: 'Terjadi kesalahan saat memperbarui notifikasi.' }, { status: 500 })
  }
}
