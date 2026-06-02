'use client'

import { Report } from '@/app/admin/reports/page'
import styles from './DetailReportOverlay.module.css'

interface DetailReportOverlayProps {
  report: Report | null
  isOpen: boolean
  onClose: () => void
  onProcess?: () => void
}

export default function DetailReportOverlay({ report, isOpen, onClose, onProcess }: DetailReportOverlayProps) {
  if (!isOpen || !report) return null

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'Pending': return styles.statusPending
      case 'Perlu tindakan': return styles.statusActionNeeded
      case 'Selesai': return styles.statusSolved
      default: return ''
    }
  }

  const handleProcess = () => {
    onProcess?.()
    onClose()
  }

  const detailRows: { label: string; value: string }[] = [
    { label: 'ID Laporan', value: report.id },
    { label: 'Tanggal Masuk', value: report.date },
    { label: 'Nama Ruangan', value: report.roomName },
    { label: 'Owner', value: report.owner },
    { label: 'Pelapor', value: report.reporter },
    { label: 'Kategori', value: 'Kerusakan fasilitas' },
  ]

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.overlayContent} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.overlayHeader}>
          <h2 className={styles.overlayTitle}>Detail Laporan</h2>
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
              <h3 className={styles.infoCardTitle}>Informasi Laporan</h3>
              <p className={styles.infoCardSubtitle}>Informasi lengkap mengenai laporan</p>
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
                <span className={`${styles.statusBadge} ${getStatusClass(report.status)}`}>
                  {report.status}
                </span>
              </div>
            </div>
          </div>

          {/* Description Section */}
          <div className={styles.descriptionSection}>
            <div className={styles.descriptionHeader}>
              <h3 className={styles.descriptionTitle}>Deskripsi Keluhan</h3>
              <p className={styles.descriptionSubtitle}>Detail masalah yang dilaporkan</p>
            </div>
            <div className={styles.descriptionContent}>
              <p className={styles.description}>
                Fasilitas AC di ruangan tidak berfungsi dengan baik. Suhu ruangan terasa panas meskipun AC sudah dihidupkan selama 30 menit. Mohon untuk segera diperbaiki karena mengganggu kenyamanan pengguna.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={styles.overlayFooter}>
          <button className={`${styles.actionButton} ${styles.btnSecondary}`} onClick={onClose}>
            Tutup
          </button>
          <button className={`${styles.actionButton} ${styles.btnPrimary}`} onClick={handleProcess}>
            Proses Laporan
          </button>
        </div>
      </div>
    </div>
  )
}
