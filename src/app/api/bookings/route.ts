import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ensureCustomerRecord } from '@/lib/customer'
import { formatDateForDatabase } from '@/utils/formatDate'

function getNextBookingId(existingIds: Array<{ booking_id: string }>) {
  const nextIteration = existingIds
    .map(item => Number(item.booking_id?.split('-')[1] ?? 0))
    .reduce((highest, value) => Math.max(highest, value), 0) + 1

  return `b-${String(nextIteration).padStart(2, '0')}`
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const user_id = searchParams.get('user_id')

    if (!user_id) {
      return NextResponse.json({ success: false, message: 'user_id wajib diisi.' }, { status: 400 })
    }

    const supabase = await createClient()
    const customerRecord = await ensureCustomerRecord(user_id)

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
        room (
          room_id,
          name,
          location,
          image_url
        )
      `)
      .eq('customer_id', customerRecord.customer_id)
      .order('booking_date', { ascending: false })

    if (error) {
      return NextResponse.json({ success: false, message: error.message }, { status: 500 })
    }

    const normalizedData = (data ?? []).map(booking => ({
      ...booking,
      room: booking.room
        ? {
            ...booking.room,
            image_url: booking.room.image_url ?? null,
            images: booking.room.image_url ? [booking.room.image_url] : []
          }
        : null
    }))

    return NextResponse.json({ success: true, data: normalizedData })
  } catch (error) {
    console.error('Booking GET error:', error)
    return NextResponse.json({ success: false, message: 'Terjadi kesalahan.' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      user_id,
      room_id,
      date,
      start_time,
      end_time,
      notes
    } = body as {
      user_id?: string
      room_id?: string
      date?: string
      start_time?: string
      end_time?: string
      notes?: string
    }

    if (!user_id || !room_id || !date || !start_time || !end_time) {
      return NextResponse.json(
        { success: false, message: 'user_id, room_id, date, start_time, dan end_time wajib diisi.' },
        { status: 400 }
      )
    }

    const checkInDate = new Date(`${date}T${start_time}:00`)
    const checkOutDate = new Date(`${date}T${end_time}:00`)

    if (Number.isNaN(checkInDate.getTime()) || Number.isNaN(checkOutDate.getTime())) {
      return NextResponse.json(
        { success: false, message: 'Format tanggal atau waktu tidak valid.' },
        { status: 400 }
      )
    }

    if (checkOutDate <= checkInDate) {
      return NextResponse.json(
        { success: false, message: 'Jam selesai harus lebih besar dari jam mulai.' },
        { status: 400 }
      )
    }

    if (checkInDate < new Date()) {
      return NextResponse.json(
        { success: false, message: 'Waktu booking tidak boleh di masa lalu.' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    const customerRecord = await ensureCustomerRecord(user_id)

    const { data: room, error: roomError } = await supabase
      .from('room')
      .select('room_id, name, price_per_hour, is_available')
      .eq('room_id', room_id)
      .maybeSingle()

    if (roomError) {
      return NextResponse.json({ success: false, message: roomError.message }, { status: 500 })
    }

    if (!room) {
      return NextResponse.json(
        { success: false, message: 'Ruangan tidak ditemukan.' },
        { status: 404 }
      )
    }

    if (!room.is_available) {
      return NextResponse.json(
        { success: false, message: 'Ruangan sedang tidak tersedia untuk dibooking.' },
        { status: 409 }
      )
    }

    const checkInValue = formatDateForDatabase(checkInDate)
    const checkOutValue = formatDateForDatabase(checkOutDate)

    const { data: conflictingBookings, error: conflictError } = await supabase
      .from('booking')
      .select('booking_id')
      .eq('room_id', room_id)
      .lt('check_in', checkOutValue)
      .gt('check_out', checkInValue)
      .neq('status', 'cancelled')

    if (conflictError) {
      return NextResponse.json({ success: false, message: conflictError.message }, { status: 500 })
    }

    if ((conflictingBookings ?? []).length > 0) {
      return NextResponse.json(
        { success: false, message: 'Jadwal yang dipilih sudah terisi. Silakan pilih jam lain.' },
        { status: 409 }
      )
    }

    const { data: bookingIds, error: bookingIdError } = await supabase
      .from('booking')
      .select('booking_id')

    if (bookingIdError) {
      return NextResponse.json({ success: false, message: bookingIdError.message }, { status: 500 })
    }

    const durationHours = (checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60)
    const totalCost = durationHours * Number(room.price_per_hour)

    const { data: insertedBooking, error: insertError } = await supabase
      .from('booking')
      .insert({
        booking_id: getNextBookingId(bookingIds ?? []),
        customer_id: customerRecord.customer_id,
        room_id,
        booking_date: formatDateForDatabase(),
        check_in: checkInValue,
        check_out: checkOutValue,
        total_cost: totalCost,
        status: 'pending',
        notes: notes?.trim() || null
      })
      .select('booking_id, status')
      .maybeSingle()

    if (insertError) {
      return NextResponse.json({ success: false, message: insertError.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: {
        booking_id: insertedBooking?.booking_id ?? null,
        status: insertedBooking?.status ?? 'pending',
        total_cost: totalCost
      },
      message: `Booking untuk ${room.name} berhasil dibuat.`
    })
  } catch (error) {
    console.error('Booking POST error:', error)
    return NextResponse.json({ success: false, message: 'Terjadi kesalahan.' }, { status: 500 })
  }
}
