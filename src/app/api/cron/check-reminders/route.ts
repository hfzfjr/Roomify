import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createNotification } from '@/lib/notifications'

export async function GET(request: Request) {
  return handleCheckReminders()
}

export async function POST(request: Request) {
  return handleCheckReminders()
}

async function handleCheckReminders() {
  try {
    const supabase = await createClient()
    const now = new Date()

    // === REMINDER: 24 hours before booking (23-25 hour window) ===
    const twentyFourHoursLater = new Date(now.getTime() + 24 * 60 * 60 * 1000)
    const twentyThreeHoursLater = new Date(now.getTime() + 23 * 60 * 60 * 1000)
    const twentyFiveHoursLater = new Date(now.getTime() + 25 * 60 * 60 * 1000)

    const { data: bookings24h } = await supabase
      .from('booking')
      .select('booking_id, customer_id, check_in, room_id')
      .eq('status', 'confirmed')
      .gte('check_in', twentyThreeHoursLater.toISOString())
      .lte('check_in', twentyFiveHoursLater.toISOString())

    if (bookings24h) {
      for (const booking of bookings24h) {
        // Check if similar notification already exists
        const { data: existingNotif } = await supabase
          .from('notifications')
          .select('id')
          .eq('related_id', booking.booking_id)
          .eq('title', 'Pengingat: Jadwal Booking Besok')
          .maybeSingle()

        if (!existingNotif) {
          // Get customer user_id
          const { data: customer } = await supabase
            .from('customer')
            .select('user_id')
            .eq('customer_id', booking.customer_id)
            .maybeSingle()

          if (customer?.user_id) {
            await createNotification({
              user_id: customer.user_id,
              title: 'Pengingat: Jadwal Booking Besok',
              description: `Booking ${booking.booking_id} akan dimulai besok. Pastikan Anda sudah siap.`,
              type: 'reminder',
              priority: 'medium',
              related_id: booking.booking_id,
              related_type: 'booking'
            })
          }
        }
      }
    }

    // === REMINDER: 1 hour before booking (50-70 minute window) ===
    const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000)
    const fiftyMinutesLater = new Date(now.getTime() + 50 * 60 * 1000)
    const seventyMinutesLater = new Date(now.getTime() + 70 * 60 * 1000)

    const { data: bookings1h } = await supabase
      .from('booking')
      .select('booking_id, customer_id, check_in, room_id')
      .eq('status', 'confirmed')
      .gte('check_in', fiftyMinutesLater.toISOString())
      .lte('check_in', seventyMinutesLater.toISOString())

    if (bookings1h) {
      for (const booking of bookings1h) {
        // Check if similar notification already exists
        const { data: existingNotif } = await supabase
          .from('notifications')
          .select('id')
          .eq('related_id', booking.booking_id)
          .eq('title', 'Pengingat: Jadwal Segera Mulai')
          .maybeSingle()

        if (!existingNotif) {
          // Get customer user_id
          const { data: customer } = await supabase
            .from('customer')
            .select('user_id')
            .eq('customer_id', booking.customer_id)
            .maybeSingle()

          if (customer?.user_id) {
            await createNotification({
              user_id: customer.user_id,
              title: 'Pengingat: Jadwal Segera Mulai',
              description: `Booking ${booking.booking_id} akan dimulai dalam 1 jam. Segera menuju lokasi.`,
              type: 'reminder',
              priority: 'high',
              related_id: booking.booking_id,
              related_type: 'booking'
            })
          }

          // Optional: Notify owner as well
          const { data: room } = await supabase
            .from('room')
            .select('owner_id')
            .eq('room_id', booking.room_id)
            .maybeSingle()

          if (room?.owner_id) {
            const { data: owner } = await supabase
              .from('owner')
              .select('user_id')
              .eq('owner_id', room.owner_id)
              .maybeSingle()

            if (owner?.user_id) {
              await createNotification({
                user_id: owner.user_id,
                title: 'Pengingat: Booking Segera Dimulai',
                description: `Booking ${booking.booking_id} akan dimulai dalam 1 jam. Siapkan ruangan.`,
                type: 'reminder',
                priority: 'medium',
                related_id: booking.booking_id,
                related_type: 'booking'
              })
            }
          }
        }
      }
    }

    // === SYSTEM: Review reminder for completed bookings ===
    const { data: completedBookings } = await supabase
      .from('booking')
      .select('booking_id, customer_id, check_out, room_id')
      .eq('status', 'completed')
      .lt('check_out', now.toISOString())

    if (completedBookings) {
      for (const booking of completedBookings) {
        // Check if review notification already exists
        const { data: existingNotif } = await supabase
          .from('notifications')
          .select('id')
          .eq('related_id', booking.booking_id)
          .eq('title', 'Bagaimana Pengalaman Anda?')
          .maybeSingle()

        if (!existingNotif) {
          // Get customer user_id
          const { data: customer } = await supabase
            .from('customer')
            .select('user_id')
            .eq('customer_id', booking.customer_id)
            .maybeSingle()

          if (customer?.user_id) {
            await createNotification({
              user_id: customer.user_id,
              title: 'Bagaimana Pengalaman Anda?',
              description: `Booking ${booking.booking_id} telah selesai. Berikan ulasan untuk ruangan yang Anda gunakan.`,
              type: 'system',
              priority: 'low',
              related_id: booking.booking_id,
              related_type: 'booking'
            })
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Reminder check completed successfully',
      data: {
        checked24h: bookings24h?.length || 0,
        checked1h: bookings1h?.length || 0,
        checkedCompleted: completedBookings?.length || 0
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
