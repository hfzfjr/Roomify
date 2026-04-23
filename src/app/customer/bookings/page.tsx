'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Booking, User } from '@/types'
import { formatDate, formatTime } from '@/utils/formatDate'
import { formatRupiah } from '@/utils/formatRupiah'
import { ROOM_IMAGE_PLACEHOLDER } from '@/utils/room'

function getBookingStatusLabel(status: Booking['status']) {
  if (status === 'confirmed') return 'Terkonfirmasi'
  if (status === 'completed') return 'Selesai'
  if (status === 'cancelled') return 'Dibatalkan'
  return 'Menunggu'
}

export default function CustomerBookings() {
  const router = useRouter()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

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
                      <span className={`customer-booking-status ${booking.status}`}>
                        {getBookingStatusLabel(booking.status)}
                      </span>
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

                    <button
                      type="button"
                      className="customer-booking-action"
                      onClick={() => router.push(`/customer/rooms/${booking.room.room_id}?booking_id=${booking.booking_id}`)}
                    >
                      Lihat detail ruangan
                    </button>
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
