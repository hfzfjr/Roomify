import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ensureCustomerRecord } from '@/lib/customer'
import { getPaymentDeadline, isPendingPaymentExpired } from '@/utils/booking'
import { formatDateForDatabase } from '@/utils/formatDate'

type BookingRecord = {
  booking_id: string
  booking_date: string
  check_in: string
  check_out: string
  total_cost: number
  status: string
  notes?: string | null
  customer_id: string
  room_id: string
}

type RoomRecord = {
  room_id: string
  name: string
  location: string
  capacity: number
  type?: string | null
  price_per_hour: number
  description?: string | null
  image_url?: string | null
}

type AmenityRecord = {
  amenity: string
}

type UserRecord = {
  name: string
  email: string
}

async function expirePendingBookings(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: pendingBookings, error: pendingBookingsError } = await supabase
    .from('booking')
    .select('booking_id, booking_date, status')
    .eq('status', 'pending')

  if (pendingBookingsError) {
    throw pendingBookingsError
  }

  const expiredBookingIds = (pendingBookings ?? [])
    .filter(booking => isPendingPaymentExpired(booking.status, booking.booking_date))
    .map(booking => booking.booking_id)

  if (expiredBookingIds.length === 0) {
    return
  }

  const { error: deleteFacilityRequestError } = await supabase
    .from('facility_request')
    .delete()
    .in('booking_id', expiredBookingIds)

  if (deleteFacilityRequestError) {
    throw deleteFacilityRequestError
  }

  const { error: updateBookingError } = await supabase
    .from('booking')
    .update({ status: 'cancelled' })
    .in('booking_id', expiredBookingIds)

  if (updateBookingError) {
    throw updateBookingError
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ booking_id: string }> }
) {
  try {
    const { booking_id } = await params
    const { searchParams } = new URL(request.url)
    const user_id = searchParams.get('user_id')

    if (!user_id || !booking_id) {
      return NextResponse.json(
        { success: false, message: 'user_id dan booking_id wajib diisi.' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    const customerRecord = await ensureCustomerRecord(user_id)
    await expirePendingBookings(supabase)

    const { data: booking, error: bookingError } = await supabase
      .from('booking')
      .select('booking_id, booking_date, check_in, check_out, total_cost, status, notes, customer_id, room_id')
      .eq('booking_id', booking_id)
      .maybeSingle<BookingRecord>()

    if (bookingError) {
      return NextResponse.json({ success: false, message: bookingError.message }, { status: 500 })
    }

    if (!booking) {
      return NextResponse.json({ success: false, message: 'Booking tidak ditemukan.' }, { status: 404 })
    }

    if (booking.customer_id !== customerRecord.customer_id) {
      return NextResponse.json(
        { success: false, message: 'Booking ini bukan milik Anda.' },
        { status: 403 }
      )
    }

    const { data: room, error: roomError } = await supabase
      .from('room')
      .select('room_id, name, location, capacity, type, price_per_hour, description, image_url')
      .eq('room_id', booking.room_id)
      .maybeSingle<RoomRecord>()

    if (roomError) {
      return NextResponse.json({ success: false, message: roomError.message }, { status: 500 })
    }

    if (!room) {
      return NextResponse.json({ success: false, message: 'Ruangan tidak ditemukan.' }, { status: 404 })
    }

    const { data: amenities, error: amenitiesError } = await supabase
      .from('room_amenity')
      .select('amenity')
      .eq('room_id', booking.room_id)
      .returns<AmenityRecord[]>()

    if (amenitiesError) {
      return NextResponse.json({ success: false, message: amenitiesError.message }, { status: 500 })
    }

    const { data: customerUser, error: userError } = await supabase
      .from('users')
      .select('name, email')
      .eq('user_id', user_id)
      .maybeSingle<UserRecord>()

    if (userError) {
      return NextResponse.json({ success: false, message: userError.message }, { status: 500 })
    }

    const checkInDate = new Date(booking.check_in)
    const checkOutDate = new Date(booking.check_out)
    const durationHours = checkOutDate > checkInDate
      ? (checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60)
      : 0
    const serviceFee = 2500
    const taxAmount = Math.round((booking.total_cost + serviceFee) * 0.11)

    return NextResponse.json({
      success: true,
      data: {
        booking: {
          ...booking,
          payment_due_at: booking.booking_date ? getPaymentDeadline(booking.booking_date).toISOString() : null
        },
        room: {
          ...room,
          image_url: room.image_url ?? null,
          images: room.image_url ? [room.image_url] : [],
          facilities: (amenities ?? []).map(item => item.amenity)
        },
        customer: {
          name: customerUser?.name ?? 'Customer',
          email: customerUser?.email ?? '-'
        },
        summary: {
          price_per_hour: room.price_per_hour,
          duration_hours: durationHours,
          subtotal: booking.total_cost,
          service_fee: serviceFee,
          tax_amount: taxAmount,
          total_payment: booking.total_cost + serviceFee + taxAmount
        },
        generated_at: formatDateForDatabase()
      }
    })
  } catch (error) {
    console.error('Payment detail GET error:', error)
    return NextResponse.json({ success: false, message: 'Terjadi kesalahan.' }, { status: 500 })
  }
}

