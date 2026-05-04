import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ensureCustomerRecord } from '@/lib/customer'

type InvoiceRecord = {
  invoice_id: string
  payment_id: string
  booking_id: string
  customer_id: string
  room_id: string
  total_amount: number
  printed_at: string | null
  pdf_url: string | null
}

type PaymentRecord = {
  payment_id: string
  payment_method: string
  amount: number
  status: string
  paid_at: string | null
}

type BookingRecord = {
  booking_id: string
  booking_date: string
  check_in: string
  check_out: string
  status: string
  room_id: string
  total_cost: number
}

type RoomRecord = {
  room_id: string
  name: string
  location: string
  price_per_hour: number
}

type CustomerUserRecord = {
  name: string
  email: string
}

function getNextInvoiceId(existingIds: Array<{ invoice_id: string }>) {
  const nextIteration = existingIds
    .map(item => Number(item.invoice_id?.split('-')[1] ?? 0))
    .reduce((highest, value) => Math.max(highest, value), 0) + 1

  return `inv-${String(nextIteration).padStart(2, '0')}`
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

    // Check if booking exists and belongs to customer
    const { data: booking, error: bookingError } = await supabase
      .from('booking')
      .select('booking_id, booking_date, check_in, check_out, status, room_id')
      .eq('booking_id', booking_id)
      .maybeSingle<BookingRecord>()

    if (bookingError) {
      return NextResponse.json({ success: false, message: bookingError.message }, { status: 500 })
    }

    if (!booking) {
      return NextResponse.json({ success: false, message: 'Booking tidak ditemukan.' }, { status: 404 })
    }

    if (booking.status !== 'confirmed' && booking.status !== 'completed') {
      return NextResponse.json(
        { success: false, message: 'Invoice hanya tersedia untuk booking yang sudah dibayar.' },
        { status: 400 }
      )
    }

    // Try to get existing invoice
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoice')
      .select('*')
      .eq('booking_id', booking_id)
      .maybeSingle<InvoiceRecord>()

    if (invoiceError) {
      return NextResponse.json({ success: false, message: invoiceError.message }, { status: 500 })
    }

    // Get payment details if invoice exists
    let payment: PaymentRecord | null = null
    if (invoice?.payment_id) {
      const { data: paymentData, error: paymentError } = await supabase
        .from('payment')
        .select('payment_id, payment_method, amount, status, paid_at')
        .eq('payment_id', invoice.payment_id)
        .maybeSingle<PaymentRecord>()
      
      if (!paymentError) {
        payment = paymentData
      }
    }

    // Get room details
    const roomId = invoice?.room_id || booking.room_id
    const { data: room, error: roomError } = await supabase
      .from('room')
      .select('room_id, name, location, price_per_hour')
      .eq('room_id', roomId)
      .maybeSingle<RoomRecord>()

    if (roomError) {
      return NextResponse.json({ success: false, message: roomError.message }, { status: 500 })
    }

    // Get customer user details
    const { data: customerUser, error: userError } = await supabase
      .from('users')
      .select('name, email')
      .eq('user_id', user_id)
      .maybeSingle<CustomerUserRecord>()

    if (userError) {
      return NextResponse.json({ success: false, message: userError.message }, { status: 500 })
    }

    // Calculate amounts for response
    const checkInDate = new Date(booking.check_in)
    const checkOutDate = new Date(booking.check_out)
    const durationHours = checkOutDate > checkInDate
      ? (checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60)
      : 0

    const serviceFee = 2500
    const subtotal = booking.total_cost || (room?.price_per_hour || 0) * durationHours
    const taxAmount = Math.round((subtotal + serviceFee) * 0.11)
    const totalAmount = invoice?.total_amount || (subtotal + serviceFee + taxAmount)

    return NextResponse.json({
      success: true,
      data: {
        invoice: invoice ? {
          ...invoice,
          payment_method: payment?.payment_method || '-',
          paid_at: payment?.paid_at || invoice.printed_at
        } : null,
        booking: {
          booking_id: booking.booking_id,
          booking_date: booking.booking_date,
          check_in: booking.check_in,
          check_out: booking.check_out,
          status: booking.status,
          duration_hours: durationHours
        },
        room: room || { name: '-', location: '-', price_per_hour: 0 },
        customer: {
          name: customerUser?.name || 'Customer',
          email: customerUser?.email || '-',
          customer_id: customerRecord.customer_id
        },
        summary: {
          subtotal: subtotal,
          service_fee: serviceFee,
          tax_amount: taxAmount,
          total_amount: totalAmount
        }
      }
    })
  } catch (error) {
    console.error('Invoice GET error:', error)
    return NextResponse.json({ success: false, message: 'Terjadi kesalahan.' }, { status: 500 })
  }
}

// POST endpoint to create invoice when payment is confirmed
export async function POST(
  request: Request,
  { params }: { params: Promise<{ booking_id: string }> }
) {
  try {
    const { booking_id } = await params
    const body = await request.json()
    const { user_id, payment_id, room_id, total_amount } = body

    if (!user_id || !booking_id || !payment_id || !room_id || !total_amount) {
      return NextResponse.json(
        { success: false, message: 'Data invoice tidak lengkap. Diperlukan: payment_id, room_id, total_amount.' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    const customerRecord = await ensureCustomerRecord(user_id)

    // Check if booking exists and belongs to customer
    const { data: booking, error: bookingError } = await supabase
      .from('booking')
      .select('booking_id, status, customer_id, room_id')
      .eq('booking_id', booking_id)
      .maybeSingle()

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

    // Check if invoice already exists
    const { data: existingInvoice } = await supabase
      .from('invoice')
      .select('invoice_id')
      .eq('booking_id', booking_id)
      .maybeSingle()

    if (existingInvoice) {
      return NextResponse.json(
        { success: false, message: 'Invoice sudah ada untuk booking ini.' },
        { status: 409 }
      )
    }

    // Get existing invoice IDs for sequential generation
    const { data: invoiceIds } = await supabase
      .from('invoice')
      .select('invoice_id')

    // Create invoice
    const { data: invoice, error: createError } = await supabase
      .from('invoice')
      .insert({
        invoice_id: getNextInvoiceId(invoiceIds ?? []),
        payment_id: payment_id,
        booking_id: booking_id,
        customer_id: customerRecord.customer_id,
        room_id: room_id || booking.room_id,
        total_amount: total_amount
      })
      .select()
      .single()

    if (createError) {
      return NextResponse.json({ success: false, message: createError.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Invoice berhasil dibuat.',
      data: invoice
    })
  } catch (error) {
    console.error('Invoice POST error:', error)
    return NextResponse.json({ success: false, message: 'Terjadi kesalahan.' }, { status: 500 })
  }
}
