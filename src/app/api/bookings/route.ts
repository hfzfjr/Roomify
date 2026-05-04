import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ensureCustomerRecord } from '@/lib/customer'
import { getPaymentDeadline, isPendingPaymentExpired } from '@/utils/booking'
import { formatDateForDatabase } from '@/utils/formatDate'

type BookingRoomRecord = {
  room_id: string
  name: string
  location: string
  capacity: number
  image_url?: string | null
  images?: string[]
  region?: Array<{
    name: string
    province?: Array<{
      name: string
    }> | null
  }> | null
}

function getNextBookingId(existingIds: Array<{ booking_id: string }>) {
  const nextIteration = existingIds
    .map(item => Number(item.booking_id?.split('-')[1] ?? 0))
    .reduce((highest, value) => Math.max(highest, value), 0) + 1

  return `b-${String(nextIteration).padStart(2, '0')}`
}

function getNextFacilityRequestId(existingIds: Array<{ request_id: string }>) {
  const nextIteration = existingIds
    .map(item => Number(item.request_id?.split('-')[1] ?? 0))
    .reduce((highest, value) => Math.max(highest, value), 0) + 1

  return `fr-${String(nextIteration).padStart(2, '0')}`
}

function getNextPaymentId(existingIds: Array<{ payment_id: string }>) {
  const nextIteration = existingIds
    .map(item => Number(item.payment_id?.split('-')[1] ?? 0))
    .reduce((highest, value) => Math.max(highest, value), 0) + 1

  return `p-${String(nextIteration).padStart(2, '0')}`
}

function getNextInvoiceId(existingIds: Array<{ invoice_id: string }>) {
  const nextIteration = existingIds
    .map(item => Number(item.invoice_id?.split('-')[1] ?? 0))
    .reduce((highest, value) => Math.max(highest, value), 0) + 1

  return `inv-${String(nextIteration).padStart(2, '0')}`
}

function isHalfHourSlot(date: Date) {
  const minutes = date.getMinutes()
  return minutes === 0 || minutes === 30
}

function normalizeBookingRoom(room: BookingRoomRecord | BookingRoomRecord[] | null, roomImages?: string[]) {
  if (!room) {
    return null
  }

  const normalizedRoom = Array.isArray(room) ? room[0] : room

  if (!normalizedRoom) {
    return null
  }

  const regionData = normalizedRoom.region?.[0]
  const provinceData = regionData?.province?.[0]

  const images = roomImages ?? normalizedRoom.images ?? []

  return {
    room_id: normalizedRoom.room_id,
    name: normalizedRoom.name,
    location: normalizedRoom.location,
    capacity: normalizedRoom.capacity,
    image_url: images[0] ?? null,
    images: images,
    region_name: regionData?.name ?? null,
    province_name: provinceData?.name ?? null
  }
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

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const user_id = searchParams.get('user_id')

    if (!user_id) {
      return NextResponse.json({ success: false, message: 'user_id wajib diisi.' }, { status: 400 })
    }

    const supabase = await createClient()
    const customerRecord = await ensureCustomerRecord(user_id)
    await expirePendingBookings(supabase)

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
          capacity,
          region (
            name,
            province (
              name
            )
          )
        )
      `)
      .eq('customer_id', customerRecord.customer_id)
      .order('booking_date', { ascending: false })

    if (error) {
      return NextResponse.json({ success: false, message: error.message }, { status: 500 })
    }

    // Get all room IDs to fetch images
    const roomIds = (data ?? []).map(b => {
      const roomData = b.room as unknown as BookingRoomRecord | BookingRoomRecord[] | null
      const room = Array.isArray(roomData) ? roomData[0] : roomData
      return room?.room_id
    }).filter((id): id is string => Boolean(id))

    // Fetch images from room_image table
    let imagesByRoom: { [key: string]: string[] } = {}
    if (roomIds.length > 0) {
      const { data: roomImages, error: imagesError } = await supabase
        .from('room_image')
        .select('room_id, image_url, sort_order')
        .in('room_id', roomIds)
        .order('sort_order', { ascending: true })

      if (imagesError) {
        console.warn('Error fetching room images:', imagesError.message)
      } else if (roomImages) {
        roomImages.forEach(img => {
          if (!imagesByRoom[img.room_id]) {
            imagesByRoom[img.room_id] = []
          }
          imagesByRoom[img.room_id].push(img.image_url)
        })
      }
    }

    const normalizedData = (data ?? []).map(booking => {
      const room = booking.room as unknown as BookingRoomRecord | BookingRoomRecord[] | null
      const roomId = (Array.isArray(room) ? room[0]?.room_id : room?.room_id) ?? ''
      const roomImages = roomId ? imagesByRoom[roomId] || [] : []

      return {
        ...booking,
        payment_due_at: booking.booking_date ? getPaymentDeadline(booking.booking_date).toISOString() : null,
        room: normalizeBookingRoom(room, roomImages)
      }
    })

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
      notes,
      additional_message
    } = body as {
      user_id?: string
      room_id?: string
      date?: string
      start_time?: string
      end_time?: string
      notes?: string
      additional_message?: string
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

    if (!isHalfHourSlot(checkInDate) || !isHalfHourSlot(checkOutDate)) {
      return NextResponse.json(
        { success: false, message: 'Menit booking hanya boleh 00 atau 30.' },
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
    await expirePendingBookings(supabase)

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
    const trimmedMessage = additional_message?.trim() || notes?.trim() || null

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
        notes: trimmedMessage
      })
      .select('booking_id, status')
      .maybeSingle()

    if (insertError) {
      return NextResponse.json({ success: false, message: insertError.message }, { status: 500 })
    }

    if (trimmedMessage && insertedBooking?.booking_id) {
      const { data: requestIds, error: requestIdsError } = await supabase
        .from('facility_request')
        .select('request_id')

      if (requestIdsError) {
        await supabase.from('booking').delete().eq('booking_id', insertedBooking.booking_id)
        return NextResponse.json({ success: false, message: requestIdsError.message }, { status: 500 })
      }

      const { error: facilityRequestError } = await supabase
        .from('facility_request')
        .insert({
          request_id: getNextFacilityRequestId(requestIds ?? []),
          booking_id: insertedBooking.booking_id,
          customer_id: customerRecord.customer_id,
          details: trimmedMessage,
          priority: 'normal',
          status: 'pending',
          created_at: formatDateForDatabase()
        })

      if (facilityRequestError) {
        await supabase.from('booking').delete().eq('booking_id', insertedBooking.booking_id)
        return NextResponse.json({ success: false, message: facilityRequestError.message }, { status: 500 })
      }
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

export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const {
      booking_id,
      user_id,
      action,
      payment_method
    } = body as {
      booking_id?: string
      user_id?: string
      action?: 'confirm_payment' | 'cancel'
      payment_method?: string
    }

    if (!booking_id || !user_id || !action) {
      return NextResponse.json(
        { success: false, message: 'booking_id, user_id, dan action wajib diisi.' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    const customerRecord = await ensureCustomerRecord(user_id)
    await expirePendingBookings(supabase)

    const { data: booking, error: bookingError } = await supabase
      .from('booking')
      .select('booking_id, customer_id, status, booking_date')
      .eq('booking_id', booking_id)
      .maybeSingle()

    if (bookingError) {
      return NextResponse.json({ success: false, message: bookingError.message }, { status: 500 })
    }

    if (!booking) {
      return NextResponse.json({ success: false, message: 'Booking tidak ditemukan.' }, { status: 404 })
    }

    if (booking.customer_id !== customerRecord.customer_id) {
      return NextResponse.json({ success: false, message: 'Booking ini bukan milik Anda.' }, { status: 403 })
    }

    if (action === 'confirm_payment') {
      if (booking.status !== 'pending') {
        return NextResponse.json({ success: false, message: 'Hanya booking pending yang bisa dibayar.' }, { status: 409 })
      }

      if (isPendingPaymentExpired(booking.status, booking.booking_date)) {
        return NextResponse.json({ success: false, message: 'Waktu pembayaran sudah habis.' }, { status: 409 })
      }

      // Get booking details with room info for payment/invoice
      const { data: bookingDetails, error: bookingDetailsError } = await supabase
        .from('booking')
        .select('booking_id, room_id, total_cost, customer_id')
        .eq('booking_id', booking_id)
        .maybeSingle()

      if (bookingDetailsError) {
        return NextResponse.json({ success: false, message: bookingDetailsError.message }, { status: 500 })
      }

      const { data: updatedBooking, error: updateError } = await supabase
        .from('booking')
        .update({ status: 'confirmed' })
        .eq('booking_id', booking_id)
        .eq('status', 'pending')
        .select('booking_id, status')
        .maybeSingle()

      if (updateError) {
        return NextResponse.json({ success: false, message: updateError.message }, { status: 500 })
      }

      // Get existing payment IDs for sequential generation
      const { data: paymentIds } = await supabase
        .from('payment')
        .select('payment_id')

      // Create or update payment record
      const paymentId = getNextPaymentId(paymentIds ?? [])
      const now = formatDateForDatabase()
      const actualPaymentMethod = (payment_method || 'manual_confirmation').toUpperCase()
      
      // Check if payment already exists for this booking
      const { data: existingPayment } = await supabase
        .from('payment')
        .select('payment_id')
        .eq('booking_id', booking_id)
        .maybeSingle()

      if (existingPayment) {
        // Update existing payment
        await supabase
          .from('payment')
          .update({
            payment_method: actualPaymentMethod,
            amount: bookingDetails?.total_cost || 0,
            status: 'success',
            paid_at: now
          })
          .eq('booking_id', booking_id)
      } else {
        // Insert new payment record
        await supabase
          .from('payment')
          .insert({
            payment_id: paymentId,
            booking_id: booking_id,
            payment_method: actualPaymentMethod,
            amount: bookingDetails?.total_cost || 0,
            status: 'success',
            paid_at: now
          })
      }

      // Get the payment record (either newly created or updated)
      const { data: paymentRecord } = await supabase
        .from('payment')
        .select('payment_id')
        .eq('booking_id', booking_id)
        .maybeSingle()

      // Create invoice if payment record exists
      if (paymentRecord && bookingDetails) {
        const serviceFee = 2500
        const subtotal = bookingDetails.total_cost || 0
        const taxAmount = Math.round((subtotal + serviceFee) * 0.11)
        const totalAmount = subtotal + serviceFee + taxAmount

        // Check if invoice already exists
        const { data: existingInvoice } = await supabase
          .from('invoice')
          .select('invoice_id')
          .eq('booking_id', booking_id)
          .maybeSingle()

        if (!existingInvoice) {
          // Get existing invoice IDs for sequential generation
          const { data: invoiceIds } = await supabase
            .from('invoice')
            .select('invoice_id')

          await supabase
            .from('invoice')
            .insert({
              invoice_id: getNextInvoiceId(invoiceIds ?? []),
              payment_id: paymentRecord.payment_id,
              booking_id: booking_id,
              customer_id: bookingDetails.customer_id,
              room_id: bookingDetails.room_id,
              total_amount: totalAmount,
              printed_at: now
            })
        }
      }

      return NextResponse.json({
        success: true,
        data: updatedBooking,
        message: 'Pembayaran berhasil dikonfirmasi. Booking Anda sudah lunas.'
      })
    }

    if (booking.status !== 'pending') {
      return NextResponse.json({ success: false, message: 'Hanya booking pending yang bisa dibatalkan.' }, { status: 409 })
    }

    const { error: deleteFacilityRequestError } = await supabase
      .from('facility_request')
      .delete()
      .eq('booking_id', booking_id)

    if (deleteFacilityRequestError) {
      return NextResponse.json({ success: false, message: deleteFacilityRequestError.message }, { status: 500 })
    }

    const { data: updatedBooking, error: cancelError } = await supabase
      .from('booking')
      .update({ status: 'cancelled' })
      .eq('booking_id', booking_id)
      .eq('status', 'pending')
      .select('booking_id, status')
      .maybeSingle()

    if (cancelError) {
      return NextResponse.json({ success: false, message: cancelError.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: updatedBooking,
      message: 'Booking berhasil dibatalkan.'
    })
  } catch (error) {
    console.error('Booking PATCH error:', error)
    return NextResponse.json({ success: false, message: 'Terjadi kesalahan.' }, { status: 500 })
  }
}
