import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ booking_id: string }> }
) {
  try {
    const { booking_id } = await params

    if (!booking_id) {
      return NextResponse.json({ success: false, message: 'booking_id wajib diisi.' }, { status: 400 })
    }

    const supabase = await createClient()

    const { data, error } = await supabase
      .from('booking')
      .select(`
        booking_id,
        booking_date,
        check_in,
        check_out,
        total_cost,
        status,
        notes,
        customer_id,
        room_id,
        room (
          room_id,
          name,
          type,
          location,
          capacity
        )
      `)
      .eq('booking_id', booking_id)
      .single()

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json({ success: false, message: error.message }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ success: false, message: 'Booking tidak ditemukan' }, { status: 404 })
    }

    console.log('Booking data fetched:', data)
    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Booking GET by ID error:', error)
    return NextResponse.json({ success: false, message: 'Terjadi kesalahan.' }, { status: 500 })
  }
}
