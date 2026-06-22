import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createNotification } from '@/lib/notifications'

// Validasi CRON_SECRET agar endpoint tidak bisa diakses sembarangan
function isAuthorized(request: Request): boolean {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) return true // jika tidak di-set, skip validasi (development)
  return authHeader === `Bearer ${cronSecret}`
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
  }
  return handleCheckReminders()
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
  }
  return handleCheckReminders()
}

// Helper: format timestamp UTC → jam WIB (GMT+7)
function formatWIB(dateString: string): string {
  const date = new Date(dateString)
  const wibOffset = 7 * 60 * 60 * 1000
  const dateWIB = new Date(date.getTime() + wibOffset)
  return dateWIB.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB'
}

async function handleCheckReminders() {
  try {
    const supabase = await createClient()
    const now = new Date()

    let reminded24h = 0
    let reminded1h = 0
    let remindedCompleted = 0

    // ================================================================
    // REMINDER H-1 HARI: window check_in antara 23–25 jam dari sekarang
    // ================================================================
    const h1DayMin = new Date(now.getTime() + 23 * 60 * 60 * 1000)
    const h1DayMax = new Date(now.getTime() + 25 * 60 * 60 * 1000)

    const { data: bookings24h } = await supabase
      .from('booking')
      .select(`
        booking_id, customer_id, check_in, room_id,
        room:room_id ( name, owner_id )
      `)
      .eq('status', 'confirmed')
      .gte('check_in', h1DayMin.toISOString())
      .lte('check_in', h1DayMax.toISOString())

    if (bookings24h) {
      for (const booking of bookings24h) {
        const roomName = (booking.room as any)?.name || 'ruangan'
        const checkInWIB = formatWIB(booking.check_in)

        // Cek duplikat
        const { data: existingNotif } = await supabase
          .from('notifications')
          .select('id')
          .eq('related_id', booking.booking_id)
          .eq('title', 'Pengingat: Jadwal Booking Besok')
          .maybeSingle()

        if (existingNotif) continue

        // Notifikasi Customer
        const { data: customer } = await supabase
          .from('customer')
          .select('user_id')
          .eq('customer_id', booking.customer_id)
          .maybeSingle()

        if (customer?.user_id) {
          await createNotification({
            user_id: customer.user_id,
            title: 'Pengingat: Jadwal Booking Besok',
            description: `Booking Anda untuk ${roomName} dijadwalkan check-in besok pada ${checkInWIB}. Pastikan Anda sudah siap!`,
            type: 'reminder',
            priority: 'high',
            related_id: booking.booking_id,
            related_type: 'booking'
          })
          reminded24h++
        }

        // Notifikasi Owner
        const ownerId = (booking.room as any)?.owner_id
        if (ownerId) {
          const { data: owner } = await supabase
            .from('owner')
            .select('user_id')
            .eq('owner_id', ownerId)
            .maybeSingle()

          if (owner?.user_id) {
            await createNotification({
              user_id: owner.user_id,
              title: 'Pengingat: Ada Check-in Besok',
              description: `Customer akan check-in untuk ruangan ${roomName} besok pada ${checkInWIB}. Booking ID: ${booking.booking_id}.`,
              type: 'reminder',
              priority: 'high',
              related_id: booking.booking_id,
              related_type: 'booking'
            })
          }
        }
      }
    }

    // ================================================================
    // REMINDER H-1 JAM: window check_in antara 50–70 menit dari sekarang
    // ================================================================
    const h1HourMin = new Date(now.getTime() + 50 * 60 * 1000)
    const h1HourMax = new Date(now.getTime() + 70 * 60 * 1000)

    const { data: bookings1h } = await supabase
      .from('booking')
      .select(`
        booking_id, customer_id, check_in, room_id,
        room:room_id ( name, owner_id )
      `)
      .eq('status', 'confirmed')
      .gte('check_in', h1HourMin.toISOString())
      .lte('check_in', h1HourMax.toISOString())

    if (bookings1h) {
      for (const booking of bookings1h) {
        const roomName = (booking.room as any)?.name || 'ruangan'
        const checkInWIB = formatWIB(booking.check_in)

        // Cek duplikat
        const { data: existingNotif } = await supabase
          .from('notifications')
          .select('id')
          .eq('related_id', booking.booking_id)
          .eq('title', 'Pengingat: Check-in dalam 1 Jam')
          .maybeSingle()

        if (existingNotif) continue

        // Notifikasi Customer
        const { data: customer } = await supabase
          .from('customer')
          .select('user_id')
          .eq('customer_id', booking.customer_id)
          .maybeSingle()

        if (customer?.user_id) {
          await createNotification({
            user_id: customer.user_id,
            title: 'Pengingat: Check-in dalam 1 Jam',
            description: `Booking Anda untuk ${roomName} akan check-in dalam 1 jam (${checkInWIB}). Segera persiapkan diri Anda.`,
            type: 'reminder',
            priority: 'high',
            related_id: booking.booking_id,
            related_type: 'booking'
          })
          reminded1h++
        }

        // Notifikasi Owner
        const ownerId = (booking.room as any)?.owner_id
        if (ownerId) {
          const { data: owner } = await supabase
            .from('owner')
            .select('user_id')
            .eq('owner_id', ownerId)
            .maybeSingle()

          if (owner?.user_id) {
            await createNotification({
              user_id: owner.user_id,
              title: 'Pengingat: Check-in dalam 1 Jam',
              description: `Customer akan check-in untuk ruangan ${roomName} dalam 1 jam (${checkInWIB}). Booking ID: ${booking.booking_id}.`,
              type: 'reminder',
              priority: 'high',
              related_id: booking.booking_id,
              related_type: 'booking'
            })
          }
        }
      }
    }

    // ================================================================
    // SYSTEM: Review reminder — hanya booking completed dalam 24 jam terakhir
    // ================================================================
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)

    const { data: completedBookings } = await supabase
      .from('booking')
      .select(`
        booking_id, customer_id, check_out, room_id,
        room:room_id ( name )
      `)
      .eq('status', 'completed')
      .gte('check_out', twentyFourHoursAgo.toISOString()) // ← batasi 24 jam terakhir
      .lte('check_out', now.toISOString())

    if (completedBookings) {
      for (const booking of completedBookings) {
        const roomName = (booking.room as any)?.name || 'ruangan'

        const { data: existingNotif } = await supabase
          .from('notifications')
          .select('id')
          .eq('related_id', booking.booking_id)
          .eq('title', 'Bagaimana Pengalaman Anda?')
          .maybeSingle()

        if (existingNotif) continue

        const { data: customer } = await supabase
          .from('customer')
          .select('user_id')
          .eq('customer_id', booking.customer_id)
          .maybeSingle()

        if (customer?.user_id) {
          await createNotification({
            user_id: customer.user_id,
            title: 'Bagaimana Pengalaman Anda?',
            description: `Booking Anda untuk ${roomName} telah selesai. Berikan ulasan untuk ruangan yang Anda gunakan.`,
            type: 'system',
            priority: 'low',
            related_id: booking.booking_id,
            related_type: 'booking'
          })
          remindedCompleted++
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Reminder check completed',
      data: {
        reminded24h,
        reminded1h,
        remindedCompleted
      }
    })
  } catch (error) {
    console.error('Check reminders error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}