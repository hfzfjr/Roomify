import { NextResponse } from 'next/server'
import QRCode from 'qrcode'
import { createClient } from '@/lib/supabase/server'
import { ensureCustomerRecord } from '@/lib/customer'
import { isPendingPaymentExpired } from '@/utils/booking'
import { buildDynamicQrisPayload } from '@/utils/qris'

type BookingRecord = {
  booking_id: string
  customer_id: string
  booking_date: string
  total_cost: number
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
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

    const qrisBasePayload = process.env.QRIS_MERCHANT_PAYLOAD

    if (!qrisBasePayload) {
      return NextResponse.json(
        {
          success: false,
          message: 'QRIS merchant belum dikonfigurasi. Isi env QRIS_MERCHANT_PAYLOAD terlebih dahulu.'
        },
        { status: 503 }
      )
    }

    const supabase = await createClient()
    const customerRecord = await ensureCustomerRecord(user_id)

    const { data: booking, error: bookingError } = await supabase
      .from('booking')
      .select('booking_id, customer_id, booking_date, total_cost, status')
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

    if (booking.status !== 'pending') {
      return NextResponse.json(
        { success: false, message: 'QRIS hanya tersedia untuk booking pending.' },
        { status: 409 }
      )
    }

    if (isPendingPaymentExpired(booking.status, booking.booking_date)) {
      return NextResponse.json(
        { success: false, message: 'Waktu pembayaran sudah habis.' },
        { status: 409 }
      )
    }

    const subtotal = Number(booking.total_cost) || 0
    const serviceFee = 2500
    const taxAmount = Math.round((subtotal + serviceFee) * 0.11)
    const totalPayment = Math.round(subtotal + serviceFee + taxAmount)

    const qrisPayload = buildDynamicQrisPayload(qrisBasePayload, totalPayment)
    const qrisImageDataUrl = await QRCode.toDataURL(qrisPayload, {
      errorCorrectionLevel: 'M',
      margin: 1,
      width: 320,
      color: {
        dark: '#0f172a',
        light: '#FFFFFFFF'
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        booking_id: booking.booking_id,
        amount: totalPayment,
        qr_payload: qrisPayload,
        qr_image_data_url: qrisImageDataUrl
      }
    })
  } catch (error) {
    console.error('QRIS GET error:', error)
    return NextResponse.json({ success: false, message: 'Terjadi kesalahan.' }, { status: 500 })
  }
}
