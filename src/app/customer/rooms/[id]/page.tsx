'use client'

import { use, useEffect, useState } from 'react'
import BackButton from '@/components/layout/BackButton'
import RoomBookingPanel from '@/components/rooms/RoomBookingPanel'
import RoomImageCarousel from '@/components/rooms/RoomImageCarousel'
import { formatDate, formatTime } from '@/utils/formatDate'
import { formatRupiah } from '@/utils/formatRupiah'
import { getRoomTypeLabel } from '@/utils/room'
import { RoomDetail } from '@/types'
import '@/styles/rooms.css'

export default function CustomerRoomDetailPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const [room, setRoom] = useState<RoomDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  // Hide global navbar for this page
  useEffect(() => {
    // document.body.classList.add('hide-global-navbar')
    return () => {
      // document.body.classList.remove('hide-global-navbar')
    }
  }, [])

  // Fetch room detail
  useEffect(() => {
    async function fetchRoom() {
      try {
        const response = await fetch(`/api/rooms/${id}`)
        const result = await response.json()
        if (result.success) {
          setRoom(result.data)
        } else {
          setError(true)
        }
      } catch {
        setError(true)
      } finally {
        setLoading(false)
      }
    }
    fetchRoom()
  }, [id])

  if (loading) {
    return (
      <div className="customer-room-detail-page">
        <div className="customer-room-detail-shell">
          <div className="rooms-header">
            <BackButton />
            <h1>Detail Ruangan</h1>
          </div>
          <div className="customer-room-detail-skeleton">
            <div className="customer-room-detail-grid">
              <div className="customer-room-detail-main">
                <section className="customer-room-card skeleton-card">
                  <div className="skeleton-gallery" />
                  <div className="skeleton-card-body">
                    <div className="skeleton-row">
                      <div className="skeleton-chip" />
                      <div className="skeleton-price" />
                    </div>
                    <div className="skeleton-title" />
                    <div className="skeleton-address" />
                    <div className="skeleton-meta-row">
                      <div className="skeleton-meta" />
                      <div className="skeleton-meta" />
                    </div>
                  </div>
                </section>
                <section className="customer-room-about skeleton-section">
                  <div className="skeleton-section-title" />
                  <div className="skeleton-section-subtitle" />
                  <div className="skeleton-divider" />
                  <div className="skeleton-text-line" />
                  <div className="skeleton-text-line" />
                  <div className="skeleton-text-line short" />
                </section>
                <section className="customer-room-facilities-section skeleton-section">
                  <div className="skeleton-section-title" />
                  <div className="skeleton-section-subtitle" />
                  <div className="skeleton-divider" />
                  <div className="skeleton-facilities-row">
                    <div className="skeleton-facility" />
                    <div className="skeleton-facility" />
                    <div className="skeleton-facility" />
                  </div>
                </section>
              </div>
              <div className="customer-room-booking-panel skeleton-panel">
                <div className="skeleton-panel-header" />
                <div className="skeleton-panel-body">
                  <div className="skeleton-field" />
                  <div className="skeleton-field" />
                  <div className="skeleton-button" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !room) {
    return (
      <div className="customer-room-detail-page">
        <div className="customer-room-detail-shell">
          <div className="rooms-header">
            <BackButton />
            <h1>Detail Ruangan</h1>
          </div>
          <div className="customer-room-detail-error">Ruangan tidak ditemukan</div>
        </div>
      </div>
    )
  }

  const roomAddress = [room.location, room.region_name, room.province_name].filter(Boolean).join(', ')

  return (
    <div className="customer-room-detail-page">
      <div className="customer-room-detail-shell">
        {/* Header with back button */}
        <div className="rooms-header">
          <BackButton />
          <h1>Detail Ruangan</h1>
        </div>

        <div className="customer-room-detail-grid">
          <div className="customer-room-detail-main">
            <section className="customer-room-card">
              <RoomImageCarousel images={room.images ?? []} alt={room.name} />

              <div className="customer-room-card-body">
                <div className="customer-room-card-top">
                  <span className="customer-room-chip">{getRoomTypeLabel(room.type)}</span>
                  <span className="customer-room-price">{formatRupiah(room.price_per_hour)}<small>/jam</small></span>
                </div>

                <div className="customer-room-card-title-meta">
                  <div className="customer-room-card-title-wrap"> 
                    <h1>{room.name}</h1>
                    <p className="customer-room-address" title={roomAddress}>{roomAddress}</p>
                  </div>

                  <div className="customer-room-card-meta">
                    <span className="customer-room-rating">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 17.3 5.8 21l1.6-7-5.4-4.7 7.1-.6L12 2l2.9 6.7 7.1.6-5.4 4.7 1.6 7z" />
                      </svg>
                      {room.rating && room.rating > 0
                        ? `${room.rating} (${room.review_count} ulasan)`
                        : 'Belum ada rating'}
                    </span>
                    <span>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M16 11c1.7 0 3-1.3 3-3s-1.3-3-3-3-3 1.3-3 3 1.3 3 3 3Zm-8 0c1.7 0 3-1.3 3-3S9.7 5 8 5 5 6.3 5 8s1.3 3 3 3Zm0 2c-2.7 0-5 1.3-5 3v2h10v-2c0-1.7-2.3-3-5-3Zm8 0c-.3 0-.6 0-.9.1 1.2.8 1.9 1.8 1.9 2.9v2h6v-2c0-1.7-2.3-3-5-3Z" />
                      </svg>
                      {room.capacity} orang
                    </span>
                  </div>
                </div>
              </div>
            </section>

            <section className="customer-room-about">
              <h2>Tentang Ruangan</h2>
              <p className="customer-room-about-subtitle">Informasi singkat mengenai ruangan</p>
              <hr className="customer-room-about-divider" />
              <p className="customer-room-about-description">
                {room.description || 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et, quis nostrud exercitation..'}
              </p>

              <div className="customer-room-about-inline">
                <span>Jadwal terdekat</span>
                <strong>
                  {room.next_booking
                    ? `${formatDate(room.next_booking.check_in)} • ${formatTime(room.next_booking.check_in)} - ${formatTime(room.next_booking.check_out)}`
                    : 'Belum ada jadwal booking dalam waktu dekat'}
                </strong>
              </div>
            </section>

            <section className="customer-room-facilities-section">
              <h3>Fasilitas</h3>
              <p className="customer-room-facilities-section-subtitle">Fasilitas yang bisa Anda nikmati di ruangan ini</p>
              <hr className="customer-room-facilities-section-divider" />
              <div className="customer-room-facilities-grid">
                {room.facilities.length > 0 ? (
                  room.facilities.map((facility: string) => (
                    <div key={facility} className="customer-room-facility-item">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      {facility}
                    </div>
                  ))
                ) : (
                  <p className="customer-room-muted">Belum ada data fasilitas tambahan untuk ruangan ini.</p>
                )}
              </div>
            </section>
          </div>

          <RoomBookingPanel room={room} />
        </div>
      </div>
    </div>
  )
}

