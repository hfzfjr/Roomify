'use client'

import { Report } from '@/app/admin/reports/page'
import styles from './DetailReportOverlay.module.css'

interface DetailReportOverlayProps {
  report: Report | null
  isOpen: boolean
  onClose: () => void
  onProcess?: () => void
  onReject?: () => void
  onWarn?: () => void
  onSuspend?: () => void
}

// Extend Report interface locally for new fields
interface ExtendedReport extends Report {
  transactionId?: string
  reporterEmail?: string
  roomId?: string
  roomType?: string
  businessName?: string
  category?: string
  description?: string
  attachments?: string[]
}

export default function DetailReportOverlay({
  report,
  isOpen,
  onClose,
  onReject,
  onWarn,
  onSuspend,
}: DetailReportOverlayProps) {
  if (!isOpen || !report) return null

  const r = report as ExtendedReport

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'Pending': return styles.statusPending
      case 'Perlu tindakan': return styles.statusActionNeeded
      case 'Selesai': return styles.statusSolved
      default: return ''
    }
  }

  const handleReject = () => { onReject?.(); onClose() }
  const handleWarn = () => { onWarn?.(); onClose() }
  const handleSuspend = () => { onSuspend?.(); onClose() }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.overlayContent} onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className={styles.overlayHeader}>
          <h2 className={styles.overlayTitle}>Detail Laporan</h2>
          <button className={styles.closeButton} onClick={onClose} aria-label="Tutup">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18" strokeLinecap="round" />
              <line x1="6" y1="6" x2="18" y2="18" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className={styles.overlayBody}>

          {/* Report ID + Status Banner */}
          <div className={styles.bannerCard}>
            <div className={styles.bannerLeft}>
              <p className={styles.bannerId}>ID Laporan: {r.id}</p>
              <p className={styles.bannerDate}>Tanggal Pelaporan : {r.date}</p>
            </div>
            <div className={styles.bannerRight}>
              <span className={styles.bannerStatusLabel}>Status Laporan:</span>
              <span className={`${styles.statusBadge} ${getStatusClass(r.status)}`}>
                {r.status}
              </span>
            </div>
          </div>

          {/* Data Pelapor */}
          <div className={styles.infoCard}>
            <div className={styles.infoCardHeader}>
              <h3 className={styles.infoCardTitle}>Data Pelapor</h3>
              <p className={styles.infoCardSubtitle}>Informasi mengenai identitas pelapor</p>
            </div>
            <div className={styles.detailList}>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Nama Pelapor</span>
                <span className={styles.detailSeparator}>:</span>
                <span className={styles.detailValue}>{r.reporter}</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>ID Transaksi</span>
                <span className={styles.detailSeparator}>:</span>
                <span className={styles.detailValue}>{r.transactionId ?? '-'}</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Alamat Email Pelapor</span>
                <span className={styles.detailSeparator}>:</span>
                <span className={styles.detailValue}>{r.reporterEmail ?? '-'}</span>
              </div>
            </div>
          </div>

          {/* Data Ruangan dan Owner */}
          <div className={styles.infoCard}>
            <div className={styles.infoCardHeader}>
              <h3 className={styles.infoCardTitle}>Data Ruangan dan Owner</h3>
              <p className={styles.infoCardSubtitle}>Informasi mengenai identitas bisnis dan owner</p>
            </div>
            <div className={styles.detailList}>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Nama Ruangan</span>
                <span className={styles.detailSeparator}>:</span>
                <span className={styles.detailValue}>{r.roomName}</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>ID Ruangan</span>
                <span className={styles.detailSeparator}>:</span>
                <span className={styles.detailValue}>{r.roomId ?? '-'}</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Jenis Ruangan</span>
                <span className={styles.detailSeparator}>:</span>
                <span className={styles.detailValue}>{r.roomType ?? '-'}</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Nama Bisnis (Pemilik)</span>
                <span className={styles.detailSeparator}>:</span>
                <span className={styles.detailValue}>{r.businessName ?? `${r.owner}`}</span>
              </div>
            </div>
          </div>

          {/* Keluhan dan Bukti */}
          <div className={styles.infoCard}>
            <div className={styles.infoCardHeader}>
              <h3 className={styles.infoCardTitle}>Keluhan dan Bukti</h3>
              <p className={styles.infoCardSubtitle}>Informasi mengenai identitas pelapor</p>
            </div>
            <div className={styles.detailList}>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Kategori</span>
                <span className={styles.detailSeparator}>:</span>
                <span className={styles.detailValue}>{r.category ?? 'Kerusakan fasilitas'}</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Detail Keluhan</span>
                <span className={styles.detailSeparator}>:</span>
                <span className={styles.detailValue}>
                  {r.description ?? 'Fasilitas AC di ruangan tidak berfungsi dengan baik. Suhu ruangan terasa panas meskipun AC sudah dihidupkan selama 30 menit.'}
                </span>
              </div>
            </div>

            {/* Attachments */}
            {r.attachments && r.attachments.length > 0 && (
              <div className={styles.attachmentsSection}>
                <p className={styles.attachmentsLabel}>Lampiran</p>
                <div className={styles.attachmentsGrid}>
                  {r.attachments.map((src, i) => (
                    <img
                      key={i}
                      src={src}
                      alt={`Lampiran ${i + 1}`}
                      className={styles.attachmentThumb}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className={styles.overlayFooter}>
          <button className={`${styles.actionButton} ${styles.btnSecondary}`} onClick={handleReject}>
            Tolak Laporan
          </button>
          <button className={`${styles.actionButton} ${styles.btnWarning}`} onClick={handleWarn}>
            Kirim Teguran ke Owner
          </button>
          <button className={`${styles.actionButton} ${styles.btnDanger}`} onClick={handleSuspend}>
            Suspend Ruangan
          </button>
        </div>

      </div>
    </div>
  )
}