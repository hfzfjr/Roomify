'use client'

import { useEffect } from 'react'
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

  const penanggungJawabRows: { label: string; value: string }[] = [
    { label: 'Nama Lengkap', value: owner.ownerName },
    { label: 'Alamat Email', value: owner.email },
    { label: 'Nomor Telepon', value: owner.phone },
    { label: 'Bergabung Sejak', value: owner.joinedDate },
  ]

  const assetRows: { label: string; value: string }[] = [
    { label: 'Total Ruangan Terdaftar', value: `${owner.totalRooms} ruangan` },
    { label: 'Total Laporan Customer', value: `${owner.totalReports} laporan` },
  ]

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
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18" strokeLinecap="round" />
              <line x1="6" y1="6" x2="18" y2="18" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className={styles.overlayBody}>
          {/* Business Card */}
          <div className={styles.businessCard}>
            <div className={styles.businessInfo}>
              <h3 className={styles.businessName}>{owner.businessName}</h3>
              <p className={styles.businessId}>ID Owner: #{owner.id}</p>
            </div>
            <div className={styles.statusWrap}>
              <span className={styles.statusLabel}>Status Owner:</span>
              <span className={`${styles.statusBadge} ${getStatusClass(owner.status)}`}>
                {owner.status}
              </span>
            </div>
          </div>

          {/* Penanggung Jawab Card */}
          <div className={styles.infoCard}>
            <div className={styles.infoCardHeader}>
              <h3 className={styles.infoCardTitle}>Informasi Penanggung Jawab</h3>
              <p className={styles.infoCardSubtitle}>Informasi singkat mengenai penanggung jawab bisnis</p>
            </div>
            <div className={styles.detailList}>
              {penanggungJawabRows.map((row) => (
                <div key={row.label} className={styles.detailRow}>
                  <span className={styles.detailLabel}>{row.label}</span>
                  <span className={styles.detailValue}>: {row.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Ringkasan Asset Card */}
          <div className={styles.infoCard}>
            <div className={styles.infoCardHeader}>
              <h3 className={styles.infoCardTitle}>Ringkasan Asset</h3>
              <p className={styles.infoCardSubtitle}>Informasi singkat mengenai kepemilikan owner terhadap ruangan</p>
            </div>
            <div className={styles.detailList}>
              {assetRows.map((row) => (
                <div key={row.label} className={styles.detailRow}>
                  <span className={styles.detailLabel}>{row.label}</span>
                  <span className={styles.detailValue}>: {row.value}</span>
                </div>
              ))}
              <button
                type="button"
                className={`${styles.actionButton} ${styles.viewRoomsButton}`}
                onClick={onViewRooms}
              >
                Lihat daftar ruangan
              </button>
            </div>
          </div>

          {/* Footer Action */}
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
    </div>
  )
}
