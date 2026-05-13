'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Room } from '@/types'
import { formatRupiah } from '@/utils/formatRupiah'
import { type Location } from '@/utils/locations'
import Navbar from '@/components/layout/Navbar'
import RoomSearchFilters from '@/components/rooms/RoomSearchFilters'
import '@/styles/dashboard.css'

const ROOM_TYPES = [
  { label: 'Semua tipe', value: '' },
  { label: 'Meeting Room', value: 'meeting_room' },
  { label: 'Seminar Room', value: 'seminar_room' },
  { label: 'Studio', value: 'studio' },
  { label: 'Training Room', value: 'training_room' },
  { label: 'Coworking Space', value: 'coworking_space' },
  { label: 'Event Hall', value: 'event_hall' }
]
const WEEK_DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
const MONTH_OPTIONS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export default function CustomerDashboard() {
  const router = useRouter()
  const [recommended, setRecommended] = useState<Room[]>([])
  const [available, setAvailable] = useState<Room[]>([])
  const [loadingRec, setLoadingRec] = useState(true)
  const [loadingAvail, setLoadingAvail] = useState(true)

  const handleSearch = (filters: { location?: Location | null; locationText: string; type: string; date: string; capacity: string }) => {
    const params = new URLSearchParams()

    if (filters.location) {
      if (filters.location.type === 'province') {
        params.set('province_id', String(filters.location.id))
      } else {
        params.set('region_id', String(filters.location.id))
      }
    } else if (filters.locationText.trim()) {
      params.set('location', filters.locationText.trim())
    }

    if (filters.type) {
      params.set('type', filters.type)
    }
    if (filters.date) {
      params.set('date', filters.date)
    }
    if (filters.capacity) {
      params.set('capacity', filters.capacity)
    }

    const queryString = params.toString()
    const redirectUrl = queryString ? `/customer/rooms?${queryString}` : '/customer/rooms'
    router.push(redirectUrl)
  }

  useEffect(() => {
    const stored = localStorage.getItem('user')
    if (!stored) {
      router.push('/auth/login')
      return
    }
    let isMounted = true

    async function loadDashboardData() {
      try {
        const [recommendedRes, availableRes] = await Promise.all([
          fetch('/api/rooms?limit=4'),
          fetch('/api/rooms')
        ])

        const [recommendedJson, availableJson] = await Promise.all([
          recommendedRes.json(),
          availableRes.json()
        ])

        if (!isMounted) {
          return
        }

        if (recommendedJson.success) setRecommended(recommendedJson.data ?? [])
        if (availableJson.success) setAvailable(availableJson.data ?? [])
      } catch {
      } finally {
        if (!isMounted) {
          return
        }

        setLoadingRec(false)
        setLoadingAvail(false)
      }
    }

    void loadDashboardData()

    return () => {
      isMounted = false
    }
  }, [router])

  function renderRoomCard(room: Room) {
    const image = room.images?.[0]
    const facilities = room.facilities?.join(', ') ?? '-'

    return (
      <div key={room.room_id} className="dashboard-room-card">
        <div className="dashboard-room-thumb">
          <img src={image || ''} alt={room.name} />
        </div>
        <div className="dashboard-room-info">
          <div className="dashboard-room-name dashboard-room-ellipsis" title={room.name}>{room.name}</div>
          <div className="dashboard-meta-row">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M23 21v-2a4 4 0 0 0-3-3.87" />
            </svg>
            <span className="dashboard-room-ellipsis" title={`${room.capacity} orang`}>{room.capacity} orang</span>
          </div>
          <div className="dashboard-meta-row">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="1.5">
              <rect x="2" y="7" width="20" height="14" rx="2" />
              <path d="M8 7V5a2 2 0 014 0v2" />
              <line x1="12" y1="12" x2="12" y2="16" />
              <line x1="10" y1="14" x2="14" y2="14" />
            </svg>
            <span className="dashboard-room-ellipsis" title={facilities}>{facilities}</span>
          </div>
          <div className="dashboard-meta-row">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z" />
              <circle cx="12" cy="11" r="3" />
            </svg>
            <span className="dashboard-room-ellipsis" title={room.location}>{room.location}</span>
          </div>
        </div>
        <div className="dashboard-card-btns">
          <div className="dashboard-btn-pay">{formatRupiah(room.price_per_hour)}/hour</div>
          <button className="dashboard-btn-detail" onClick={() => router.push(`/customer/rooms/${room.room_id}`)}>
            View details
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
      <Navbar />
      <div className="dashboard" style={{ paddingTop: '80px' }}>
        <div className="dashboard-hero">
        <img
          src="/images/mainDashboard.png"
          alt="Dashboard main image"
          className="dashboard-hero-img"
        />
        <div className="dashboard-hero-overlay" />
      </div>

      <div className="dashboard-search-card">
        <div className="dashboard-search-bg" aria-hidden="true">
          <div className="dashboard-sc-circle dashboard-sc-c1" />
          <div className="dashboard-sc-circle dashboard-sc-c2" />
          <div className="dashboard-sc-circle dashboard-sc-c3" />
        </div>

        <div className="dashboard-sc-text">
          <h2>Temukan ruangan yang tepat</h2>
          <p>Booking mudah, cepat, dan terpercaya</p>
        </div>

        <RoomSearchFilters onSearch={handleSearch} />
      </div>

      <main className="dashboard-main">
        <section className="dashboard-section">
          <div className="dashboard-section-row">
            <span className="dashboard-section-title">Rekomendasi</span>
            <button className="dashboard-see-all" onClick={() => router.push('/customer/rooms')}>
              Lihat selengkapnya
            </button>
          </div>

          <div className="dashboard-cards-container">
            {loadingRec ? (
              <div className="dashboard-cards-grid">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="dashboard-room-card-skeleton" />
                ))}
              </div>
            ) : recommended.length === 0 ? (
              <p className="dashboard-empty">Belum ada ruangan tersedia.</p>
            ) : (
              <div className="dashboard-cards-grid">
                {recommended.map(renderRoomCard)}
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  </>
  )
}
