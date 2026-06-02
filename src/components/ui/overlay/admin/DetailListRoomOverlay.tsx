'use client'

import styles from './DetailListRoomOverlay.module.css'

interface Room {
  id: string
  name: string
  owner: string
  type: string
  capacity: number
  status: 'Aktif' | 'Tidak aktif'
}

interface DetailListRoomOverlayProps {
  room: Room | null
  isOpen: boolean
  onClose: () => void
  onEdit?: () => void
}

export default function DetailListRoomOverlay({ room, isOpen, onClose, onEdit }: DetailListRoomOverlayProps) {
  if (!isOpen || !room) return null

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'Aktif': return styles.statusActive
      case 'Tidak aktif': return styles.statusInactive
      default: return ''
    }
  }

  const handleEdit = () => {
    onEdit?.()
    onClose()
  }

  const detailRows: { label: string; value: string }[] = [
    { label: 'ID Ruangan', value: room.id },
    { label: 'Nama Ruangan', value: room.name },
    { label: 'Owner', value: room.owner },
    { label: 'Jenis Ruangan', value: room.type },
    { label: 'Kapasitas', value: `${room.capacity} orang` },
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
          {/* Info Card */}
          <div className={styles.infoCard}>
            <div className={styles.infoCardHeader}>
              <h3 className={styles.infoCardTitle}>Informasi Ruangan</h3>
              <p className={styles.infoCardSubtitle}>Informasi lengkap mengenai ruangan</p>
            </div>
            <div className={styles.detailList}>
              {detailRows.map((row) => (
                <div key={row.label} className={styles.detailRow}>
                  <span className={styles.detailLabel}>{row.label}</span>
                  <span className={styles.detailSeparator}>:</span>
                  <span className={styles.detailValue}>{row.value}</span>
                </div>
              ))}
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Status</span>
                <span className={styles.detailSeparator}>:</span>
                <span className={`${styles.statusBadge} ${getStatusClass(room.status)}`}>
                  {room.status}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={styles.overlayFooter}>
          <button className={`${styles.actionButton} ${styles.btnSecondary}`} onClick={onClose}>
            Tutup
          </button>
          <button className={`${styles.actionButton} ${styles.btnPrimary}`} onClick={handleEdit}>
            Edit Ruangan
          </button>
        </div>
      </div>
    </div>
  )
}
