import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, password } = body as { email?: string; password?: string }

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'Email dan password wajib diisi.' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    const { data: user, error } = await supabase
      .from('users')
      .select('user_id, name, email, password, role')
      .eq('email', email)
      .limit(1)
      .maybeSingle()

    if (error) {
      console.error('Supabase login query error:', error)
      return NextResponse.json(
        { success: false, message: 'Terjadi kesalahan saat login.' },
        { status: 500 }
      )
    }

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Email atau password tidak terdaftar.' },
        { status: 401 }
      )
    }

    const isValid = await bcrypt.compare(password, user.password)
    
    // Fallback untuk plain text password (untuk data lama)
    const isPlainTextValid = password === user.password
    
    if (!isValid && !isPlainTextValid) {
      return NextResponse.json(
        { success: false, message: 'Email atau password salah.' },
        { status: 401 }
      )
    }

    return NextResponse.json({
      success: true,
      user: {
        user_id: user.user_id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    })
  } catch (error) {
    console.error('Login route error:', error)
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan saat memproses login.' },
      { status: 500 }
    )
  }
}
