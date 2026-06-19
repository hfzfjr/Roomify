'use client'

import styles from './DetailListRoomOverlay.module.css'
import { formatFacilityName } from '@/utils/text-helper'
import AC from '@/components/icons/facility/AC'
import CameraDSLR from '@/components/icons/facility/CameraDSLR'
import Computer from '@/components/icons/facility/Computer'
import GreenScreen from '@/components/icons/facility/GreenScreen'
import HDMICable from '@/components/icons/facility/HDMICable'
import Lightning from '@/components/icons/facility/Lightning'
import Locker from '@/components/icons/facility/Locker'
import Microphone from '@/components/icons/facility/Microphone'
import MixerAudio from '@/components/icons/facility/MixerAudio'
import Monitor from '@/components/icons/facility/Monitor'
import Podium from '@/components/icons/facility/Podium'
import Printer from '@/components/icons/facility/Printer'
import Proyektor from '@/components/icons/facility/Proyektor'
import SoundProofing from '@/components/icons/facility/SoundProofing'
import SoundSystem from '@/components/icons/facility/SoundSystem'
import VideoConference from '@/components/icons/facility/VideoConference'
import Whiteboard from '@/components/icons/facility/Whiteboard'
import Wifi from '@/components/icons/facility/Wifi'

interface Room {
  id: string
  name: string
  owner: string
  type: string
  capacity: number
  status: 'Aktif' | 'Tidak aktif'
  images?: string[]
  pricePerHour?: number
  businessName?: string
  ownerName?: string
  description?: string
  facilities?: string[]
}

interface DetailListRoomOverlayProps {
  room: Room | null
  isOpen: boolean
  onClose: () => void
  onDelete?: () => void
}

const FACILITY_ICONS: Record<string, React.ReactNode> = {
  'ac': <AC />,
  'camera_dslr': <CameraDSLR />,
  'computer': <Computer />,
  'green_screen': <GreenScreen />,
  'hdmi_cable': <HDMICable />,
  'lightning': <Lightning />,
  'locker': <Locker />,
  'microphone': <Microphone />,
  'mixer_audio': <MixerAudio />,
  'monitor': <Monitor />,
  'podium': <Podium />,
  'printer': <Printer />,
  'projector': <Proyektor />,
  'soundproofing': <SoundProofing />,
  'sound_system': <SoundSystem />,
  'video_conference': <VideoConference />,
  'whiteboard': <Whiteboard />,
  'wifi': <Wifi />,
}

export default function DetailListRoomOverlay({ room, isOpen, onClose, onDelete }: DetailListRoomOverlayProps) {
  if (!isOpen || !room) return null

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'Aktif': return styles.statusActive
      case 'Tidak aktif': return styles.statusInactive
      default: return ''
    }
  }

  const handleDelete = () => {
    onDelete?.()
  }

  const images = room.images || []

  const facilities = room.facilities || []

  const formatPrice = (price?: number) => {
    if (price === undefined) return '-'
    return `Rp ${price.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} / jam`
  }

  const mainRows: { label: string; value: string }[] = [
    { label: 'ID Ruangan', value: room.id },
    { label: 'Nama Ruangan', value: room.name },
    { label: 'Jenis Ruangan', value: room.type },
    { label: 'Harga Sewa', value: formatPrice(room.pricePerHour) },
    { label: 'Kapasitas', value: `${room.capacity} orang` },
    { label: 'Nama Bisnis', value: room.businessName || '-' },
    { label: 'Nama Pemilik', value: room.ownerName || '-' },
  ]

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.overlayContent} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.overlayHeader}>
          <h2 className={styles.overlayTitle}>Detail Ruangan</h2>
          <button className={styles.closeButton} onClick={onClose} aria-label="Tutup">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" strokeLinecap="round" />
              <line x1="6" y1="6" x2="18" y2="18" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className={styles.overlayBody}>
          {/* Image Carousel Card */}
          {images.length > 0 && (
            <div className={styles.carouselCard}>
              <div className={styles.carousel}>
                <img src={images[0]} alt={room.name} className={styles.carouselImage} />
                <button
                  type="button"
                  className={`${styles.carouselArrow} ${styles.carouselArrowLeft}`}
                  aria-label="Sebelumnya"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="15 18 9 12 15 6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                <button
                  type="button"
                  className={`${styles.carouselArrow} ${styles.carouselArrowRight}`}
                  aria-label="Berikutnya"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="9 18 15 12 9 6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                <div className={styles.carouselDots}>
                  {Array.from({ length: images.length }).map((_, idx) => (
                    <span
                      key={idx}
                      className={`${styles.carouselDot} ${idx === 0 ? styles.carouselDotActive : ''}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Main Info Card */}
          <div className={styles.infoCard}>
            <div className={styles.infoCardHeader}>
              <div className={styles.infoCardHeaderText}>
                <h3 className={styles.infoCardTitle}>Informasi Utama</h3>
                <p className={styles.infoCardSubtitle}>Informasi singkat mengenai ruangan</p>
              </div>
              <div className={styles.statusGroup}>
                <span className={styles.statusLabel}>Status Ruangan:</span>
                <span className={`${styles.statusBadge} ${getStatusClass(room.status)}`}>
                  {room.status}
                </span>
              </div>
            </div>
            <div className={styles.detailList}>
              {mainRows.map((row) => (
                <div key={row.label} className={styles.detailRow}>
                  <span className={styles.detailLabel}>{row.label}</span>
                  <span className={styles.detailSeparator}>:</span>
                  <span className={styles.detailValue}>{row.value}</span>
                </div>
              ))}
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Deskripsi Ruangan</span>
                <span className={styles.detailSeparator}>:</span>
                <span className={styles.detailValue}>
                  {room.description || '-'}
                </span>
              </div>
            </div>
          </div>

          {/* Facilities Card */}
          <div className={styles.infoCard}>
            <div className={styles.infoCardHeader}>
              <div className={styles.infoCardHeaderText}>
                <h3 className={styles.infoCardTitle}>Fasilitas</h3>
                <p className={styles.infoCardSubtitle}>Fasilitas yang bisa Anda nikmati di ruangan ini</p>
              </div>
            </div>
            <div className={styles.facilitiesList}>
              {facilities.map((facility) => (
                <span key={facility} className={styles.facilityBadge}>
                  {FACILITY_ICONS[facility] || null}
                  {formatFacilityName(facility)}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={styles.overlayFooter}>
          <button className={`${styles.actionButton} ${styles.btnSecondary}`} onClick={handleDelete}>
            Hapus Ruangan
          </button>
        </div>
      </div>
    </div>
  )
}