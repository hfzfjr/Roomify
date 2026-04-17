import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { nama, email, password } = body as {
      nama?: string
      email?: string
      password?: string
    }

    if (!nama || !email || !password) {
      return NextResponse.json(
        { success: false, message: 'Nama, email, dan password wajib diisi.' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    const { data: existingUser, error: existingError } = await supabase
      .from('users')
      .select('user_id')
      .eq('email', email)
      .maybeSingle()

    if (existingError) {
      console.error('Supabase register check error:', existingError)
      return NextResponse.json(
        { success: false, message: 'Terjadi kesalahan saat memeriksa email.' },
        { status: 500 }
      )
    }

    if (existingUser) {
      return NextResponse.json(
        { success: false, message: 'Email sudah terdaftar. Silakan login.' },
        { status: 409 }
      )
    }

    const { data: allUsers, error: usersError } = await supabase
      .from('users')
      .select('user_id')

    if (usersError) {
      console.error('Supabase user_id query error:', usersError)
      return NextResponse.json(
        { success: false, message: 'Terjadi kesalahan saat memproses pendaftaran.' },
        { status: 500 }
      )
    }

    const nextIteration = (allUsers ?? [])
      .map((item) => Number(item.user_id?.split('-')[1] ?? 0))
      .reduce((prev, current) => Math.max(prev, current), 0) + 1

    const newUserId = `u-${nextIteration}`
    const hashedPassword = bcrypt.hashSync(password, 10)

    const { error: insertError } = await supabase.from('users').insert({
      user_id: newUserId,
      name: nama,
      email,
      password: hashedPassword,
      role: 'customer',
      phone_number: null,
      created_at: new Date().toISOString(),
    })

    if (insertError) {
      console.error('Supabase insert error:', insertError)
      return NextResponse.json(
        { success: false, message: 'Gagal membuat akun baru.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Register route error:', error)
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan saat memproses pendaftaran.' },
      { status: 500 }
    )
  }
}
