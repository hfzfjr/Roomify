import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(request: Request) {
  try {
    const body = await request.json() as { user_id?: string }

    if (!body.user_id) {
      return NextResponse.json({ success: false, message: 'user_id wajib diisi.' }, { status: 400 })
    }

    const supabase = await createClient()

    // Mark all notifications as read for the user
    const { error: updateError } = await supabase
      .from('notifications')
      .update({ is_read: true, updated_at: new Date().toISOString() })
      .eq('user_id', body.user_id)
      .eq('is_read', false)

    if (updateError) {
      return NextResponse.json({ success: false, message: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Semua notifikasi ditandai sebagai dibaca.' })
  } catch (error) {
    console.error('Mark all read PATCH error:', error)
    return NextResponse.json({ success: false, message: 'Terjadi kesalahan saat memperbarui notifikasi.' }, { status: 500 })
  }
}
