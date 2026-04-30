'use client'

import { useEffect, useState } from 'react'
import RoomCard from '@/components/rooms/RoomCard'
import { Room } from '@/types'
import '@/styles/rooms.css'

export default function CustomerRooms() {
  const [rooms, setRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let isMounted = true

    async function loadRooms() {
      try {
        const response = await fetch('/api/rooms')
        const result = await response.json()

        if (!response.ok || !result.success) {
          throw new Error(result.message || 'Gagal memuat daftar ruangan.')
        }

        if (isMounted) {
          setRooms(result.data ?? [])
        }
      } catch (roomError) {
        if (isMounted) {
          setError(roomError instanceof Error ? roomError.message : 'Gagal memuat daftar ruangan.')
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    void loadRooms()

    return () => {
      isMounted = false
    }
  }, [])

  const availableCount = rooms.filter(room => room.is_available).length
  const uniqueLocations = new Set(rooms.map(room => room.location)).size

  return (
    <div className="rooms-page">
      <section className="rooms-hero">
        <div className="rooms-hero-copy">
          <span className="rooms-kicker">Customer Rooms</span>
          <h1>Pilih ruangan yang paling pas untuk agenda Anda</h1>
          <p>
            Seluruh data ruangan di bawah ini ditarik langsung dari database, termasuk harga, kapasitas,
            fasilitas, dan foto room dari kolom `image_url`.
          </p>
        </div>

        <div className="rooms-hero-stats">
          <div>
            <strong>{availableCount}</strong>
            <span>ruangan tersedia</span>
          </div>
          <div>
            <strong>{uniqueLocations}</strong>
            <span>lokasi aktif</span>
          </div>
          <div>
            <strong>{rooms.length}</strong>
            <span>total katalog</span>
          </div>
        </div>
      </section>

      <section className="rooms-grid-shell">
        {loading ? (
          <div className="rooms-grid">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="dashboard-room-card-skeleton" />
            ))}
          </div>
        ) : error ? (
          <p className="rooms-empty">{error}</p>
        ) : rooms.length === 0 ? (
          <p className="rooms-empty">Belum ada ruangan yang tersedia saat ini.</p>
        ) : (
          <div className="rooms-grid">
            {rooms.map(room => (
              <RoomCard key={room.room_id} room={room} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
