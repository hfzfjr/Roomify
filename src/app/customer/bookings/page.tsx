'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import { Booking, User } from '@/types'
import { formatPaymentCountdown, getRemainingPaymentMs } from '@/utils/booking'
import { formatDate, formatTime, formatDateLong } from '@/utils/formatDate'
import { formatRupiah } from '@/utils/formatRupiah'
import { ROOM_IMAGE_PLACEHOLDER } from '@/utils/room'
import '@/styles/dashboard.css'

type FilterStatus = 'all' | 'confirmed' | 'pending' | 'cancelled'

function getBookingStatusLabel(status: Booking['status']) {
  if (status === 'confirmed' || status === 'completed') return 'Lunas'
  if (status === 'cancelled') return 'Dibatalkan'
  return 'Belum bayar'
}

function getStatusBadgeClass(status: Booking['status']) {
  if (status === 'confirmed' || status === 'completed') return 'lunas'
  if (status === 'cancelled') return 'dibatalkan'
  return 'belum-lunas'
}

export default function CustomerBookings() {
  const router = useRouter()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null)
  const [currentUserId, setCurrentUserId] = useState('')
  const [user, setUser] = useState<User | null>(null)
  const [nowTimestamp, setNowTimestamp] = useState(() => Date.now())
  const [filter, setFilter] = useState<FilterStatus>('all')
  const [searchQuery, setSearchQuery] = useState('')

  const refreshBookings = useCallback(async () => {
    if (!currentUserId) return
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
    const parsedUser = JSON.parse(storedUser) as User
    setUser(parsedUser)

    let isMounted = true
    async function loadBookings() {
      try {
        setCurrentUserId(parsedUser.user_id)
        const response = await fetch(`/api/bookings?user_id=${encodeURIComponent(parsedUser.user_id)}`)
        const result = await response.json()
        if (!response.ok || !result.success) {
          throw new Error(result.message || 'Gagal memuat daftar booking.')
        }
        if (isMounted) setBookings(result.data ?? [])
      } catch (bookingError) {
        if (isMounted) {
          setError(bookingError instanceof Error ? bookingError.message : 'Gagal memuat daftar booking.')
        }
      } finally {
        if (isMounted) setLoading(false)
      }
    }
    void loadBookings()
    return () => { isMounted = false }
  }, [router])

  useEffect(() => {
    const hasPendingBookings = bookings.some(b => b.status === 'pending')
    if (!hasPendingBookings) return
    const timer = window.setInterval(() => setNowTimestamp(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [bookings])

  useEffect(() => {
    const hasExpiredPendingBooking = bookings.some(
      booking => booking.status === 'pending' && getRemainingPaymentMs(booking.booking_date, nowTimestamp) === 0
    )
    if (!hasExpiredPendingBooking || actionLoadingId) return
    const refreshTimer = window.setTimeout(() => void refreshBookings(), 0)
    return () => window.clearTimeout(refreshTimer)
  }, [actionLoadingId, bookings, nowTimestamp, refreshBookings])

  const statusCounts = useMemo(() => ({
    all: bookings.length,
    confirmed: bookings.filter(b => b.status === 'confirmed' || b.status === 'completed').length,
    pending: bookings.filter(b => b.status === 'pending').length,
    cancelled: bookings.filter(b => b.status === 'cancelled').length
  }), [bookings])

  const filteredBookings = useMemo(() => {
    let filtered = bookings
    if (filter !== 'all') {
      if (filter === 'confirmed') {
        filtered = bookings.filter(b => b.status === 'confirmed' || b.status === 'completed')
      } else {
        filtered = bookings.filter(b => b.status === filter)
      }
    }
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(b =>
        b.room?.name?.toLowerCase().includes(query) ||
        b.room?.location?.toLowerCase().includes(query) ||
        b.booking_id?.toLowerCase().includes(query)
      )
    }
    return filtered
  }, [bookings, filter, searchQuery])

  async function handleBookingAction(bookingId: string, action: 'cancel') {
    if (!currentUserId) return
    setActionLoadingId(bookingId)
    setError('')
    try {
      const response = await fetch('/api/bookings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ booking_id: bookingId, user_id: currentUserId, action })
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

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  return (
    <>
      <Navbar />
      <div className="customer-bookings-container" style={{ paddingTop: '80px' }}>
      <div className="customer-bookings-layout">
        {/* Sidebar */}
        <aside className="customer-bookings-sidebar">
          <div className="customer-bookings-profile">
            <div className="customer-bookings-avatar">
              {user?.name ? getInitials(user.name) : 'U'}
            </div>
            <h3 className="customer-bookings-name">{user?.name || 'User'}</h3>
            <p className="customer-bookings-email">{user?.email || ''}</p>
          </div>

          <div className="customer-bookings-filter">
            <h4>Filter status</h4>
            <nav className="customer-bookings-filter-list">
              <button
                className={`customer-bookings-filter-item ${filter === 'all' ? 'active' : ''}`}
                onClick={() => setFilter('all')}
                data-status="all"
              >
                <span>Semua</span>
                <span className="customer-bookings-filter-count">{statusCounts.all}</span>
              </button>
              <button
                className={`customer-bookings-filter-item ${filter === 'confirmed' ? 'active' : ''}`}
                onClick={() => setFilter('confirmed')}
                data-status="confirmed"
              >
                <span>Lunas</span>
                <span className="customer-bookings-filter-count">{statusCounts.confirmed}</span>
              </button>
              <button
                className={`customer-bookings-filter-item ${filter === 'pending' ? 'active' : ''}`}
                onClick={() => setFilter('pending')}
                data-status="pending"
              >
                <span>Belum bayar</span>
                <span className="customer-bookings-filter-count">{statusCounts.pending}</span>
              </button>
              <button
                className={`customer-bookings-filter-item ${filter === 'cancelled' ? 'active' : ''}`}
                onClick={() => setFilter('cancelled')}
                data-status="cancelled"
              >
                <span>Dibatalkan</span>
                <span className="customer-bookings-filter-count">{statusCounts.cancelled}</span>
              </button>
            </nav>
          </div>
        </aside>

        {/* Main Content */}
        <main className="customer-bookings-main">
          <div className="customer-bookings-header">
            <div>
              <h1 className="customer-bookings-title">Riwayat booking</h1>
              <p className="customer-bookings-subtitle">Ruangan-ruangan yang pernah dibooking</p>
            </div>
            <div className="customer-bookings-search">
              <input
                type="text"
                placeholder="Cari ruangan"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
            </div>
          </div>

          {loading ? (
            <div className="customer-bookings-list">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="customer-booking-card-skeleton" />
              ))}
            </div>
          ) : error ? (
            <p className="customer-bookings-empty">{error}</p>
          ) : filteredBookings.length === 0 ? (
            <p className="customer-bookings-empty">
              {searchQuery ? 'Tidak ada booking yang sesuai dengan pencarian.' : 'Anda belum memiliki booking.'}
            </p>
          ) : (
            <div className="customer-bookings-list">
              {filteredBookings.map(booking => {
                const image = booking.room?.images?.[0] ?? ROOM_IMAGE_PLACEHOLDER
                const isPendingPayment = booking.status === 'pending'
                const remainingPaymentMs = isPendingPayment ? getRemainingPaymentMs(booking.booking_date, nowTimestamp) : 0
                const isPayingOrCancelling = actionLoadingId === booking.booking_id
                const fullAddress = [booking.room?.location, booking.room?.region_name, booking.room?.province_name]
                  .filter(Boolean)
                  .join(', ')

                return (
                  <article key={booking.booking_id} className="customer-booking-card-v2">
                    <div className="customer-booking-card-v2-content">
                      <div className="customer-booking-card-v2-image">
                        <img
                          src={image}
                          alt={booking.room?.name || 'Room image'}
                          onError={event => {
                            (event.target as HTMLImageElement).src = ROOM_IMAGE_PLACEHOLDER
                          }}
                        />
                      </div>
                      <div className="customer-booking-card-v2-header">
                        <div className="customer-booking-card-v2-info">
                          <h3 className="customer-booking-card-v2-room">{booking.room?.name || 'Ruangan'}</h3>
                          <div className="customer-booking-card-v2-meta-vertical">
                            <div className="customer-booking-card-v2-meta-row">
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M16 11c1.7 0 3-1.3 3-3s-1.3-3-3-3-3 1.3-3 3 1.3 3 3 3Zm-8 0c1.7 0 3-1.3 3-3S9.7 5 8 5 5 6.3 5 8s1.3 3 3 3Zm0 2c-2.7 0-5 1.3-5 3v2h10v-2c0-1.7-2.3-3-5-3Zm8 0c-.3 0-.6 0-.9.1 1.2.8 1.9 1.8 1.9 2.9v2h6v-2c0-1.7-2.3-3-5-3Z" />
                              </svg>
                              <span>{booking.room?.capacity || '-'} orang</span>
                            </div>
                            <div className="customer-booking-card-v2-meta-row">
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7Zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5Z" />
                              </svg>
                              <span>{fullAddress || booking.room?.location || '-'}</span>
                            </div>
                            <div className="customer-booking-card-v2-meta-row">
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2Zm0 16H5V9h14v11ZM9 11H7v2h2v-2Zm4 0h-2v2h2v-2Zm4 0h-2v2h2v-2Zm-8 4H7v2h2v-2Zm4 0h-2v2h2v-2Zm4 0h-2v2h2v-2Z" />
                              </svg>
                              <span>{formatDateLong(booking.check_in)}</span>
                            </div>
                            <div className="customer-booking-card-v2-meta-row">
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2ZM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8Zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67Z" />
                              </svg>
                              <span>{formatTime(booking.check_in)} - {formatTime(booking.check_out)}</span>
                            </div>
                          </div>
                        </div>
                        <div className="customer-booking-card-v2-price-status">
                          <span className="customer-booking-card-v2-price">{formatRupiah(booking.total_cost)}</span>
                          <span className={`customer-booking-card-v2-status ${getStatusBadgeClass(booking.status)}`}>
                            {getBookingStatusLabel(booking.status)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="customer-booking-card-v2-footer">
                      <span className="customer-booking-card-v2-transaction">
                        Nomor Transaksi: <strong>{booking.booking_id}</strong>
                      </span>
                      <div className="customer-booking-card-v2-actions">
                        {isPendingPayment ? (
                          <button
                            type="button"
                            className="customer-booking-v2-btn primary"
                            disabled={remainingPaymentMs <= 0}
                            onClick={() => router.push(`/customer/payments/${booking.booking_id}`)}
                          >
                            Bayar sekarang
                          </button>
                        ) : (booking.status === 'confirmed' || booking.status === 'completed') ? (
                          <button
                            type="button"
                            className="customer-booking-v2-btn secondary"
                            onClick={() => alert('Fitur unduh struk belum tersedia')}
                          >
                            Unduh struk
                          </button>
                        ) : null}
                        <button
                          type="button"
                          className="customer-booking-v2-btn secondary"
                          onClick={() => router.push(`/customer/rooms/${booking.room.room_id}?booking_id=${booking.booking_id}`)}
                        >
                          Lihat detail
                        </button>
                        {isPendingPayment && (
                          <button
                            type="button"
                            className="customer-booking-v2-btn danger"
                            disabled={isPayingOrCancelling}
                            onClick={() => handleBookingAction(booking.booking_id, 'cancel')}
                          >
                            {isPayingOrCancelling ? 'Memproses...' : 'Batalkan'}
                          </button>
                        )}
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </main>
      </div>
    </div>
    </>
  )
}
