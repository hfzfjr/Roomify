import Link from 'next/link'
import { notFound } from 'next/navigation'
import RoomBookingPanel from '@/components/rooms/RoomBookingPanel'
import { getRoomDetail } from '@/lib/rooms'
import { formatDate, formatTime } from '@/utils/formatDate'
import { formatRupiah } from '@/utils/formatRupiah'
import { getRoomTypeLabel, ROOM_IMAGE_PLACEHOLDER } from '@/utils/room'

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

  const image = room.images?.[0] ?? ROOM_IMAGE_PLACEHOLDER

  return (
    <div className="room-detail-page">
      <div className="room-detail-shell">
        <div className="room-detail-breadcrumb">
          <Link href="/customer/rooms">Daftar ruangan</Link>
          <span>/</span>
          <span>{room.name}</span>
        </div>

        <div className="room-detail-content">
          <div className="room-detail-main">
            <section className="room-detail-media">
              <img src={image} alt={room.name} />
            </section>

            <section className="room-detail-overview">
              <div className="room-detail-badges">
                <span className="room-detail-chip neutral">{getRoomTypeLabel(room.type)}</span>
                <span className={`room-detail-chip ${room.is_available ? 'success' : 'danger'}`}>
                  {room.is_available ? 'Bisa dibooking' : 'Sedang penuh'}
                </span>
              </div>

              <h1>{room.name}</h1>
              <p>{room.description || 'Ruangan ini siap digunakan untuk meeting, presentasi, dan kebutuhan kolaborasi tim Anda.'}</p>

              <div className="room-detail-stats">
                <div className="room-detail-stat">
                  <span>Kapasitas</span>
                  <strong>{room.capacity} orang</strong>
                </div>
                <div className="room-detail-stat">
                  <span>Harga</span>
                  <strong>{formatRupiah(room.price_per_hour)}/jam</strong>
                </div>
                <div className="room-detail-stat">
                  <span>Lokasi</span>
                  <strong>{room.location}</strong>
                </div>
                <div className="room-detail-stat">
                  <span>Area</span>
                  <strong>{[room.region_name, room.province_name].filter(Boolean).join(', ') || 'Bandung'}</strong>
                </div>
              </div>

              <div className="room-detail-inline-note">
                <span>Jadwal mendatang</span>
                <strong>
                  {room.next_booking
                    ? `Booking berikutnya ${formatDate(room.next_booking.check_in)} pukul ${formatTime(room.next_booking.check_in)} - ${formatTime(room.next_booking.check_out)}`
                    : 'Belum ada jadwal aktif dalam waktu dekat.'}
                </strong>
              </div>
            </section>

            <section className="room-detail-section">
              <div className="room-detail-section-head">
                <span className="room-detail-section-kicker">Facilities</span>
                <h2>Fasilitas yang tersedia</h2>
                <p className="room-detail-section-copy">
                  Fasilitas berikut tersedia di ruangan ini dan bisa membantu Anda menilai kecocokan room sebelum booking.
                </p>
              </div>
              <div className="room-detail-facilities">
                {room.facilities.length > 0 ? (
                  room.facilities.map(facility => (
                    <span key={facility} className="room-detail-facility">
                      {facility}
                    </span>
                  ))
                ) : (
                  <p className="room-detail-muted">Belum ada data fasilitas tambahan untuk ruangan ini.</p>
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
