import RoomBookingPanel from '@/components/rooms/RoomBookingPanel'
import RoomImageCarousel from '@/components/rooms/RoomImageCarousel'
import { notFound } from 'next/navigation'
import { getRoomDetail } from '@/lib/rooms'
import { formatDate, formatTime } from '@/utils/formatDate'
import { formatRupiah } from '@/utils/formatRupiah'
import { getRoomTypeLabel } from '@/utils/room'
import '@/styles/rooms.css'

export default async function CustomerRoomDetailPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const room = await getRoomDetail(id)

  if (!room) {
    notFound()
  }

  const roomAddress = [room.location, room.region_name, room.province_name].filter(Boolean).join(', ')

  return (
    <div className="customer-room-detail-page">
      <div className="customer-room-detail-shell">
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
                    <p>{roomAddress || 'Bandung, Jawa Barat'}</p>
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
              <p>
                {room.description || 'Ruangan ini siap digunakan untuk meeting, presentasi, dan kebutuhan kolaborasi tim Anda.'}
              </p>

              <div className="customer-room-about-inline">
                <span>Jadwal terdekat</span>
                <strong>
                  {room.next_booking
                    ? `${formatDate(room.next_booking.check_in)} • ${formatTime(room.next_booking.check_in)} - ${formatTime(room.next_booking.check_out)}`
                    : 'Belum ada jadwal booking dalam waktu dekat'}
                </strong>
              </div>

              <div className="customer-room-facilities">
                {room.facilities.length > 0 ? (
                  room.facilities.map(facility => (
                    <span key={facility}>{facility}</span>
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

