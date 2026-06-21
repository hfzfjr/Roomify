'use client'

import { useState } from 'react'
import { Report } from '@/app/admin/reports/page'
import ImageViewerOverlay from '@/components/ui/overlay/ImageViewerOverlay'
import styles from './DetailReportOverlay.module.css'

interface DetailReportOverlayProps {
  report: Report | null
  isOpen: boolean
  onClose: () => void
  onProcess?: () => void
  onReject?: (reportId: string) => void
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
  resolutionImage?: string[]
  resolutionDescription?: string
  resolutionSubmittedAt?: string
  rejectionReason?: string
}

export default function DetailReportOverlay({
  report,
  isOpen,
  onClose,
  onReject,
  onWarn,
  onSuspend,
}: DetailReportOverlayProps) {
  const [viewerImage, setViewerImage] = useState<string | null>(null)
  if (!isOpen || !report) return null

  const r = report as ExtendedReport

  // Format category to display with capital letters and spaces
  const formatCategory = (category: string) => {
    if (!category) return '-'
    return category
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'Pending': return styles.statusPending
      case 'Perlu tindakan': return styles.statusActionNeeded
      case 'Selesai': return styles.statusSolved
      case 'Ditolak': return styles.statusRejected
      default: return ''
    }
  }

  const handleReject = () => { onReject?.(r.id); onClose() }
  const handleWarn = () => { onWarn?.(); onClose() }
  const handleSuspend = () => { onSuspend?.(); onClose() }

  const canReject = r.status === 'Perlu tindakan'
  const canWarn = r.status === 'Perlu tindakan'
  const canSuspend = r.status === 'Perlu tindakan' || r.status === 'Proses'

  return (
    <>
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
                  <span className={styles.detailValue}>{formatCategory(r.category || '')}</span>
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
                        onClick={() => setViewerImage(src)}
                        style={{ cursor: 'pointer' }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Alasan Penolakan */}
            {r.status === 'Ditolak' && r.rejectionReason && (
              <div className={styles.infoCard}>
                <div className={styles.infoCardHeader}>
                  <h3 className={styles.infoCardTitle}>Alasan Penolakan</h3>
                  <p className={styles.infoCardSubtitle}>Alasan laporan ini ditolak</p>
                </div>
                <div className={styles.detailList}>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Alasan</span>
                    <span className={styles.detailSeparator}>:</span>
                    <span className={styles.detailValue}>{r.rejectionReason}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Bukti Perbaikan dari Owner */}
            {r.resolutionImage && r.resolutionImage.length > 0 && (
              <div className={styles.infoCard}>
                <div className={styles.infoCardHeader}>
                  <h3 className={styles.infoCardTitle}>Bukti Perbaikan dari Owner</h3>
                  <p className={styles.infoCardSubtitle}>Dokumentasi perbaikan yang telah dilakukan</p>
                </div>
                <div className={styles.detailList}>
                  <p className={styles.attachmentsLabel}>Foto Perbaikan</p>
                  <div className={styles.attachmentsGrid}>
                    {r.resolutionImage.map((src: string, i: number) => (
                      <img
                        key={i}
                        src={src}
                        alt={`Foto perbaikan ${i + 1}`}
                        className={styles.attachmentThumb}
                        onClick={() => setViewerImage(src)}
                        style={{ cursor: 'pointer' }}
                      />
                    ))}
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Deskripsi Perbaikan</span>
                    <span className={styles.detailSeparator}>:</span>
                    <span className={styles.detailValue}>{r.resolutionDescription || '-'}</span>
                  </div>
                  {r.resolutionSubmittedAt && (
                    <div className={styles.detailRow}>
                      <span className={styles.detailLabel}>Tanggal Dikirim</span>
                      <span className={styles.detailSeparator}>:</span>
                      <span className={styles.detailValue}>
                        {new Date(r.resolutionSubmittedAt).toLocaleDateString('id-ID', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric'
                        }).replace(/\//g, '/')}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className={styles.overlayFooter}>
            <button
              className={`${styles.actionButton} ${styles.btnSecondary}`}
              onClick={handleReject}
              disabled={!canReject}
            >
              Tolak Laporan
            </button>
            <button
              className={`${styles.actionButton} ${styles.btnWarning}`}
              onClick={handleWarn}
              disabled={!canWarn}
            >
              Kirim Teguran ke Owner
            </button>
            <button
              className={`${styles.actionButton} ${styles.btnDanger}`}
              onClick={handleSuspend}
              disabled={!canSuspend}
            >
              Suspend Ruangan
            </button>
          </div>

        </div>
      </div>

      <ImageViewerOverlay
        isOpen={viewerImage !== null}
        onClose={() => setViewerImage(null)}
        imageUrl={viewerImage || ''}
      />
    </>
  )
}