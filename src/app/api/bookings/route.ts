import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const user_id = searchParams.get('user_id')

    if (!user_id) {
      return NextResponse.json({ success: false, message: 'user_id wajib diisi.' }, { status: 400 })
    }

    const supabase = await createClient()

    const { data, error } = await supabase
      .from('bookings')
      .select(`
        booking_id,
        start_time,
        end_time,
        total_price,
        status,
        created_at,
        rooms (
          room_id,
          name,
          location,
          images
        )
      `)
      .eq('user_id', user_id)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ success: false, message: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Terjadi kesalahan.' }, { status: 500 })
  }
}
