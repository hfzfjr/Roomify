import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('user_id')

    if (!userId) {
      return NextResponse.json({ success: false, message: 'user_id wajib diisi.' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: user, error } = await supabase
      .from('users')
      .select('user_id, name, email, role, phone_number')
      .eq('user_id', userId)
      .maybeSingle()

    if (error) {
      return NextResponse.json({ success: false, message: error.message }, { status: 500 })
    }

    if (!user) {
      return NextResponse.json({ success: false, message: 'User tidak ditemukan.' }, { status: 404 })
    }

    return NextResponse.json({ success: true, user })
  } catch (error) {
    console.error('Auth GET error:', error)
    return NextResponse.json({ success: false, message: 'Terjadi kesalahan saat mengambil data user.' }, { status: 500 })
  }
}
