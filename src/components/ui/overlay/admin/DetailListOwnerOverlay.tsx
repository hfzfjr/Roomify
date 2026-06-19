'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import styles from './DetailListOwnerOverlay.module.css'

interface OwnerDetail {
  id: string
  businessName: string
  status: 'Aktif' | 'Tidak aktif' | 'Pending'
  ownerName: string
  email: string
  phone: string
  joinedDate: string
  totalRooms: number
  totalReports: number
}

interface DetailListOwnerOverlayProps {
  isOpen: boolean
  onClose: () => void
  owner: OwnerDetail | null
  onDelete: () => void
  onViewRooms: () => void
}

export default function DetailListOwnerOverlay({
  isOpen,
  onClose,
  owner,
  onDelete,
  onViewRooms,
}: DetailListOwnerOverlayProps) {
  const router = useRouter()

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isOpen || !owner) return null

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'Aktif':
        return styles.statusActive
      case 'Tidak aktif':
        return styles.statusInactive
      case 'Pending':
        return styles.statusPending
      default:
        return ''
    }
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.overlayContent} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.overlayHeader}>
          <h2 className={styles.overlayTitle}>Detail Owner</h2>
          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Tutup"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" strokeLinecap="round" />
              <line x1="6" y1="6" x2="18" y2="18" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className={styles.overlayBody}>

          {/* Card 1: Bisnis Info */}
          <div className={styles.card}>
            <div className={styles.businessCardContent}>
              <div className={styles.businessInfo}>
                <h3 className={styles.cardTitle}>{owner.businessName}</h3>
                <p className={styles.cardSubtitle}>ID Owner: {owner.id}</p>
              </div>
              <div className={styles.statusContainer}>
                <span className={styles.statusLabel}>Status Owner:</span>
                <span className={`${styles.statusBadge} ${getStatusClass(owner.status)}`}>
                  {owner.status}
                </span>
              </div>
            </div>
          </div>

          {/* Card 2: Informasi Penanggung Jawab */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>Informasi Penanggung Jawab</h3>
              <p className={styles.cardSubtitle}>Informasi singkat mengenai penanggung jawab bisnis</p>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Nama Lengkap</span>
                <span className={styles.detailSeparator}>:</span>
                <span className={styles.detailValue}>{owner.ownerName}</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Alamat Email</span>
                <span className={styles.detailSeparator}>:</span>
                <span className={styles.detailValue}>{owner.email}</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Nomor Telepon</span>
                <span className={styles.detailSeparator}>:</span>
                <span className={styles.detailValue}>{owner.phone}</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Bergabung Sejak</span>
                <span className={styles.detailSeparator}>:</span>
                <span className={styles.detailValue}>{owner.joinedDate}</span>
              </div>
            </div>
          </div>

          {/* Card 3: Ringkasan Asset */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>Ringkasan Asset</h3>
              <p className={styles.cardSubtitle}>Informasi singkat mengenai kepemilikan owner terhadap ruangan</p>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Total Ruangan Terdaftar</span>
                <span className={styles.detailSeparator}>:</span>
                <span className={styles.detailValue}>{owner.totalRooms} ruangan</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Total Laporan Customer</span>
                <span className={styles.detailSeparator}>:</span>
                <span className={styles.detailValue}>{owner.totalReports} laporan</span>
              </div>
              <button
                type="button"
                className={`${styles.actionButton} ${styles.viewRoomsButton}`}
                onClick={() => {
                  onClose()
                  router.push(`/admin/list-room?owner_id=${owner.id}`)
                }}
              >
                Lihat daftar ruangan
              </button>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className={styles.overlayFooter}>
          <button
            type="button"
            className={`${styles.actionButton} ${styles.deleteButton}`}
            onClick={onDelete}
          >
            Hapus Owner
          </button>
        </div>
      </div>
    </div>
  )
}