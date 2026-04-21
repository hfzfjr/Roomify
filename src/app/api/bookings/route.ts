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

    const { data: customerRecord, error: customerLookupError } = await supabase
      .from('customer')
      .select('customer_id')
      .eq('user_id', user_id)
      .maybeSingle()

    if (customerLookupError) {
      return NextResponse.json({ success: false, message: customerLookupError.message }, { status: 500 })
    }

    if (!customerRecord?.customer_id) {
      return NextResponse.json({ success: true, data: [] })
    }

    const { data, error } = await supabase
      .from('booking')
      .select(`
        booking_id,
        booking_date,
        check_in,
        check_out,
        total_cost,
        status,
        room (
          room_id,
          name,
          location,
          images
        )
      `)
      .eq('customer_id', customerRecord.customer_id)
      .order('booking_date', { ascending: false })

    if (error) {
      return NextResponse.json({ success: false, message: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Terjadi kesalahan.' }, { status: 500 })
  }
}
