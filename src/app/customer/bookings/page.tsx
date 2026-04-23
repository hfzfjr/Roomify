'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Booking, User } from '@/types'
import { formatPaymentCountdown, getRemainingPaymentMs } from '@/utils/booking'
import { formatDate, formatTime } from '@/utils/formatDate'
import { formatRupiah } from '@/utils/formatRupiah'
import { ROOM_IMAGE_PLACEHOLDER } from '@/utils/room'

function getBookingStatusLabel(status: Booking['status']) {
  if (status === 'confirmed') return 'Lunas'
  if (status === 'completed') return 'Selesai'
  if (status === 'cancelled') return 'Dibatalkan'
  return 'Menunggu Pembayaran'
}

export default function CustomerBookings() {
  const router = useRouter()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null)
  const [currentUserId, setCurrentUserId] = useState('')
  const [nowTimestamp, setNowTimestamp] = useState(() => Date.now())

  const refreshBookings = useCallback(async () => {
    if (!currentUserId) {
      return
    }

    const response = await fetch(`/api/bookings?user_id=${encodeURIComponent(currentUserId)}`)
    const result = await response.json()

    if (!response.ok || !result.success) {
      throw new Error(result.message || 'Gagal memuat daftar booking.')
    }

    setBookings(result.data ?? [])
  }, [currentUserId])

  useEffect(() => {
    const storedUser = localStorage.getItem('user')

    if (!storedUser) {
      router.push('/auth/login')
      return
    }

    let isMounted = true

    async function loadBookings() {
      try {
        const user = JSON.parse(storedUser) as User
        setCurrentUserId(user.user_id)
        const response = await fetch(`/api/bookings?user_id=${encodeURIComponent(user.user_id)}`)
        const result = await response.json()

        if (!response.ok || !result.success) {
          throw new Error(result.message || 'Gagal memuat daftar booking.')
        }

        if (isMounted) {
          setBookings(result.data ?? [])
        }
      } catch (bookingError) {
        if (isMounted) {
          setError(bookingError instanceof Error ? bookingError.message : 'Gagal memuat daftar booking.')
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    void loadBookings()

    return () => {
      isMounted = false
    }
  }, [router])

  useEffect(() => {
    const hasPendingBookings = bookings.some(booking => booking.status === 'pending')

    if (!hasPendingBookings) {
      return
    }

    const timer = window.setInterval(() => {
      setNowTimestamp(Date.now())
    }, 1000)

    return () => window.clearInterval(timer)
  }, [bookings])

  useEffect(() => {
    const hasExpiredPendingBooking = bookings.some(
      booking => booking.status === 'pending' && getRemainingPaymentMs(booking.booking_date, nowTimestamp) === 0
    )

    if (!hasExpiredPendingBooking || actionLoadingId) {
      return
    }

    const refreshTimer = window.setTimeout(() => {
      void refreshBookings()
    }, 0)

    return () => window.clearTimeout(refreshTimer)
  }, [actionLoadingId, bookings, nowTimestamp, refreshBookings])

  async function handleBookingAction(bookingId: string, action: 'confirm_payment' | 'cancel') {
    if (!currentUserId) {
      return
    }

    setActionLoadingId(bookingId)
    setError('')

    try {
      const response = await fetch('/api/bookings', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          booking_id: bookingId,
          user_id: currentUserId,
          action
        })
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Aksi booking gagal diproses.')
      }

      await refreshBookings()
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'Aksi booking gagal diproses.')
    } finally {
      setActionLoadingId(null)
    }
  }

  return (
    <div className="customer-bookings-page">
      <section className="customer-bookings-hero">
        <span className="rooms-kicker">My Bookings</span>
        <h1>Semua jadwal booking Anda dalam satu tempat</h1>
        <p>
          Pantau status booking, jadwal check-in, dan total biaya tanpa perlu membuka detail ruangan satu per satu.
        </p>
      </section>

      <section className="customer-bookings-list">
        {loading ? (
          <div className="customer-bookings-grid">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="dashboard-room-card-skeleton" />
            ))}
          </div>
        ) : error ? (
          <p className="rooms-empty">{error}</p>
        ) : bookings.length === 0 ? (
          <p className="rooms-empty">Anda belum memiliki booking.</p>
        ) : (
          <div className="customer-bookings-grid">
            {bookings.map(booking => {
              const image = booking.room?.images?.[0] ?? ROOM_IMAGE_PLACEHOLDER
              const isPendingPayment = booking.status === 'pending'
              const remainingPaymentMs = isPendingPayment ? getRemainingPaymentMs(booking.booking_date, nowTimestamp) : 0
              const isPayingOrCancelling = actionLoadingId === booking.booking_id

              return (
                <article key={booking.booking_id} className="customer-booking-card">
                  <div className="customer-booking-media">
                    <img
                      src={image}
                      alt={booking.room?.name || 'Room image'}
                      onError={event => {
                        (event.target as HTMLImageElement).src = ROOM_IMAGE_PLACEHOLDER
                      }}
                    />
                  </div>

                  <div className="customer-booking-body">
                    <div className="customer-booking-top">
                      <div>
                        <span className="customer-booking-id">{booking.booking_id}</span>
                        <h2>{booking.room?.name || 'Ruangan'}</h2>
                      </div>
                      <div className="customer-booking-status-wrap">
                        <span className={`customer-booking-status ${booking.status}`}>
                          {getBookingStatusLabel(booking.status)}
                        </span>
                        {isPendingPayment && (
                          <span className="customer-booking-countdown">
                            {formatPaymentCountdown(remainingPaymentMs)}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="customer-booking-meta">
                      <div>
                        <span>Tanggal</span>
                        <strong>{formatDate(booking.check_in)}</strong>
                      </div>
                      <div>
                        <span>Waktu</span>
                        <strong>{formatTime(booking.check_in)} - {formatTime(booking.check_out)}</strong>
                      </div>
                      <div>
                        <span>Lokasi</span>
                        <strong>{booking.room?.location || '-'}</strong>
                      </div>
                      <div>
                        <span>Total biaya</span>
                        <strong>{formatRupiah(booking.total_cost)}</strong>
                      </div>
                    </div>

                    {booking.notes && (
                      <p className="customer-booking-notes">{booking.notes}</p>
                    )}

                    <div className="customer-booking-actions">
                      {isPendingPayment && (
                        <button
                          type="button"
                          className="customer-booking-action"
                          disabled={isPayingOrCancelling || remainingPaymentMs <= 0}
                          onClick={() => handleBookingAction(booking.booking_id, 'confirm_payment')}
                        >
                          {isPayingOrCancelling ? 'Memproses...' : 'Bayar sekarang'}
                        </button>
                      )}

                      <button
                        type="button"
                        className="customer-booking-action secondary"
                        onClick={() => router.push(`/customer/rooms/${booking.room.room_id}?booking_id=${booking.booking_id}`)}
                      >
                        Lihat detail ruangan
                      </button>

                      {isPendingPayment && (
                        <button
                          type="button"
                          className="customer-booking-action danger"
                          disabled={isPayingOrCancelling}
                          onClick={() => handleBookingAction(booking.booking_id, 'cancel')}
                        >
                          {isPayingOrCancelling ? 'Memproses...' : 'Cancel booking'}
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
