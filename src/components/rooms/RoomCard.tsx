'use client'

import { useRouter } from 'next/navigation'
import { Room } from '@/types'
import { formatRupiah } from '@/utils/formatRupiah'

interface Props {
  room: Room
}

const PLACEHOLDER = '/images/gambarRuangan.png'

export default function RoomCard({ room }: Props) {
  const router = useRouter()
  const image = room.images?.[0] ?? PLACEHOLDER
  const facilitiesPreview = room.facilities?.slice(0, 3).join(', ') ?? '-'

  return (
    <div className="room-card">
      <div className="room-card-img">
        <img src={image} alt={room.name} onError={(e) => { (e.target as HTMLImageElement).src = PLACEHOLDER }}/>
      </div>
      <div className="room-card-body">
        <h4 className="room-card-name">{room.name}</h4>
        <div className="room-card-meta">
          <span>
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path strokeLinecap="round" strokeLinejoin="round" d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
            {room.capacity} orang
          </span>
        </div>
        <div className="room-card-facilities">{facilitiesPreview}</div>
        <div className="room-card-location">
          <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 0 1-2.827 0l-4.244-4.243a8 8 0 1 1 11.314 0z"/>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 1 1-6 0 3 3 0 0 1 6 0z"/>
          </svg>
          {room.location}
        </div>
        <div className="room-card-footer">
          <span className="room-card-price">
            {formatRupiah(room.price_per_hour)}<small>/jam</small>
          </span>
          <button
            className="room-card-btn"
            onClick={() => router.push(`/customer/rooms/${room.room_id}`)}
          >
            View details
          </button>
        </div>
      </div>
    </div>
  )
}
