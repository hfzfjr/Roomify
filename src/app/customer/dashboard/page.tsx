'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Room, User } from '@/types'
import { formatRupiah } from '@/utils/formatRupiah'

const ROOM_TYPES = ['Semua tipe', 'Meeting Room', 'Conference Room', 'Co-working', 'Studio']
const PLACEHOLDER = '/images/gambarRuangan.png'

export default function CustomerDashboard() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [recommended, setRecommended] = useState<Room[]>([])
  const [available, setAvailable] = useState<Room[]>([])
  const [loadingRec, setLoadingRec] = useState(true)
  const [loadingAvail, setLoadingAvail] = useState(true)

  const [filterType, setFilterType] = useState('Semua tipe')
  const [filterDate, setFilterDate] = useState('')
  const [filterCapacity, setFilterCapacity] = useState('')
  const filterTypeRef = useRef<HTMLSelectElement | null>(null)
  const filterDateRef = useRef<HTMLInputElement | null>(null)
  const filterCapacityRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    const stored = localStorage.getItem('user')
    if (!stored) {
      router.push('/auth/login')
      return
    }
    setUser(JSON.parse(stored))
    fetchRecommended()
    fetchAvailable()
  }, [])

  async function fetchRecommended() {
    setLoadingRec(true)
    try {
      const res = await fetch('/api/rooms?limit=4')
      const json = await res.json()
      if (json.success) setRecommended(json.data ?? [])
    } catch {
    }
    setLoadingRec(false)
  }

  async function fetchAvailable(type?: string, capacity?: string) {
    setLoadingAvail(true)
    try {
      const params = new URLSearchParams()
      if (type && type !== 'Semua tipe') params.set('type', type)
      if (capacity) params.set('capacity', capacity)
      if (filterDate) params.set('date', filterDate)

      const res = await fetch(`/api/rooms?${params.toString()}`)
      const json = await res.json()
      if (json.success) setAvailable(json.data ?? [])
    } catch {
    }
    setLoadingAvail(false)
  }

  function handleSearch() {
    fetchAvailable(filterType, filterCapacity)
  }

  function renderRoomCard(room: Room) {
    const image = room.images?.[0] ?? PLACEHOLDER
    const facilities = room.facilities?.join(', ') ?? '-'

    return (
      <div key={room.room_id} className="dashboard-room-card">
        <div className="dashboard-room-thumb">
          <img src={image} alt={room.name} onError={e => { (e.target as HTMLImageElement).src = PLACEHOLDER }} />
        </div>
        <div className="dashboard-room-info">
          <div className="dashboard-room-name">{room.name}</div>
          <div className="dashboard-meta-row">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M23 21v-2a4 4 0 0 0-3-3.87" />
            </svg>
            <span>{room.capacity} orang</span>
          </div>
          <div className="dashboard-meta-row">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="1.5">
              <rect x="2" y="7" width="20" height="14" rx="2" />
              <path d="M8 7V5a2 2 0 014 0v2" />
              <line x1="12" y1="12" x2="12" y2="16" />
              <line x1="10" y1="14" x2="14" y2="14" />
            </svg>
            <span>{facilities}</span>
          </div>
          <div className="dashboard-meta-row">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z" />
              <circle cx="12" cy="11" r="3" />
            </svg>
            <span>{room.location}</span>
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
    <div className="dashboard">
      <div className="dashboard-hero">
        <img
          src="/images/mainDashboard.png"
          alt="Dashboard main image"
          className="dashboard-hero-img"
        />
        <div className="dashboard-hero-overlay" />
      </div>

      <div className="dashboard-search-card">
        <div className="dashboard-sc-circle dashboard-sc-c1" />
        <div className="dashboard-sc-circle dashboard-sc-c2" />
        <div className="dashboard-sc-circle dashboard-sc-c3" />

        <div className="dashboard-sc-text">
          <h2>Temukan ruangan yang tepat</h2>
          <p>Booking mudah, cepat, dan terpercaya</p>
        </div>

        <div className="dashboard-search-row">
          <label className="sf" htmlFor="filterType" onClick={() => filterTypeRef.current?.focus()}>
            <select
              id="filterType"
              ref={filterTypeRef}
              value={filterType}
              onChange={e => setFilterType(e.target.value)}
            >
              {ROOM_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <svg width="18" height="36" viewBox="0 0 18 36" fill="none">
              <path d="M4 15l5 5 5-5" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </label>
          
          <label className="sf" htmlFor="filterType" onClick={() => filterTypeRef.current?.focus()}>
            <select
              id="filterType"
              ref={filterTypeRef}
              value={filterType}
              onChange={e => setFilterType(e.target.value)}
            >
              {ROOM_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <svg width="18" height="36" viewBox="0 0 18 36" fill="none">
              <path d="M4 15l5 5 5-5" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </label>

          <label className="sf" htmlFor="filterDate" onClick={() => filterDateRef.current?.focus()}>
            <input
              id="filterDate"
              ref={filterDateRef}
              type="date"
              value={filterDate}
              onChange={e => setFilterDate(e.target.value)}
              onClick={() => {
                const input = filterDateRef.current as HTMLInputElement & { showPicker?: () => void }
                if (typeof input?.showPicker === 'function') {
                  input.showPicker()
                }
              }}
              onFocus={() => {
                const input = filterDateRef.current as HTMLInputElement & { showPicker?: () => void }
                if (typeof input?.showPicker === 'function') {
                  input.showPicker()
                }
              }}
            />
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </label>

          <label className="sf" htmlFor="filterCapacity" onClick={() => filterCapacityRef.current?.focus()}>
            <input
              id="filterCapacity"
              ref={filterCapacityRef}
              type="number"
              min="1"
              value={filterCapacity}
              onChange={e => setFilterCapacity(e.target.value)}
              placeholder="Kapasitas"
            />
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M23 21v-2a4 4 0 00-3-3.87m-4-12a4 4 0 010 7.75" />
            </svg>
          </label>

          <button type="button" className="dashboard-btn-cari" onClick={handleSearch}>
            Cari
          </button>
        </div>
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

        <section className="dashboard-section">
          <div className="dashboard-section-row">
            <span className="dashboard-section-title">Ruangan tersedia hari ini</span>
            <button className="dashboard-see-all" onClick={() => router.push('/customer/rooms')}>
              Lihat selengkapnya
            </button>
          </div>

          <div className="dashboard-cards-container">
            {loadingAvail ? (
              <div className="dashboard-cards-grid">
                {Array.from({ length: 8 }).map((_, index) => (
                  <div key={index} className="dashboard-room-card-skeleton" />
                ))}
              </div>
            ) : available.length === 0 ? (
              <p className="dashboard-empty">Tidak ada ruangan yang sesuai filter.</p>
            ) : (
              <div className="dashboard-cards-grid">
                {available.map(renderRoomCard)}
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  )
}
