import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }  // ← Next.js 15: params adalah Promise
) {
  try {
    const { id } = await params  // ← wajib di-await
    const body = await request.json() as { user_id?: string }

    console.log('PATCH notification - ID:', id, 'user_id:', body.user_id)

    if (!id) {
      return NextResponse.json({ success: false, message: 'ID notifikasi tidak valid.' }, { status: 400 })
    }

    if (!body.user_id) {
      return NextResponse.json({ success: false, message: 'user_id wajib diisi.' }, { status: 400 })
    }

    const supabase = await createClient()

    // Verify notification belongs to user
    const { data: notification, error: fetchError } = await supabase
      .from('notifications')
      .select('user_id, is_read')
      .eq('id', id)
      .eq('user_id', body.user_id)
      .maybeSingle()

    if (fetchError) {
      console.error('Error fetching notification:', fetchError)
      return NextResponse.json({ success: false, message: fetchError.message }, { status: 500 })
    }

    if (!notification) {
      console.log('Notification not found - ID:', id, 'user_id:', body.user_id)
      return NextResponse.json({ success: false, message: 'Notifikasi tidak ditemukan.' }, { status: 404 })
    }

    // Skip jika sudah dibaca
    if (notification.is_read) {
      return NextResponse.json({ success: true, message: 'Notifikasi sudah dibaca.' })
    }

    const { error: updateError } = await supabase
      .from('notifications')
      .update({ is_read: true, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', body.user_id)

    if (updateError) {
      console.error('Error updating notification:', updateError)
      return NextResponse.json({ success: false, message: updateError.message }, { status: 500 })
    }

    console.log('Notification marked as read - ID:', id)
    return NextResponse.json({ success: true, message: 'Notifikasi ditandai sebagai dibaca.' })
  } catch (error) {
    console.error('Notification PATCH error:', error)
    return NextResponse.json({ success: false, message: 'Terjadi kesalahan saat memperbarui notifikasi.' }, { status: 500 })
  }
}