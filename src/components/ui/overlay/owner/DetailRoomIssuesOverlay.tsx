'use client'

import { useState, useEffect } from 'react'
import ImageViewerOverlay from '@/components/ui/overlay/ImageViewerOverlay'
import styles from './DetailRoomIssuesOverlay.module.css'

interface Report {
    id: string
    date: string
    roomName: string
    reporter: string
    status: string
    category?: string
    roomId?: string
    roomType?: string
    reporterEmail?: string
    transactionId?: string
    description?: string
    attachments?: string[]
    resolutionImage?: string[]
    resolutionDescription?: string
    resolutionSubmittedAt?: string
    rejectionReason?: string
}

interface DetailRoomIssuesOverlayProps {
    report: Report | null
    isOpen: boolean
    onClose: () => void
    onRefresh?: () => void
}

export default function DetailRoomIssuesOverlay({ report, isOpen, onClose, onRefresh }: DetailRoomIssuesOverlayProps) {
    const [repairImages, setRepairImages] = useState<File[]>([])
    const [repairImageUrls, setRepairImageUrls] = useState<string[]>([])
    const [repairDescription, setRepairDescription] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isHandling, setIsHandling] = useState(false)
    const [viewerImage, setViewerImage] = useState<string | null>(null)

    // Format category to display with capital letters and spaces
    const formatCategory = (category: string) => {
        if (!category) return '-'
        return category
            .split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ')
    }

    // Reset state when overlay closes or report changes
    useEffect(() => {
        if (!isOpen) {
            setRepairImages([])
            setRepairImageUrls([])
            setRepairDescription('')
        }
    }, [isOpen])

    if (!isOpen || !report) return null

    const getStatusClass = (status: string) => {
        switch (status) {
            case 'Perlu tindakan': return styles.statusActionNeeded
            case 'Proses': return styles.statusInProgress
            case 'Selesai': return styles.statusSolved
            case 'Ditolak': return styles.statusRejected
            default: return ''
        }
    }

    const canHandle = report.status === 'Perlu tindakan'
    const canResolve = (report.status === 'Perlu tindakan' || report.status === 'Proses') &&
        repairImages.length > 0 &&
        repairDescription.trim().length > 0

    const handleHandle = async () => {
        if (!canHandle) return

        setIsHandling(true)
        try {
            const response = await fetch(`/api/owner/reports/${report.id}/handle`, {
                method: 'PATCH',
            })

            const result = await response.json()

            if (result.success) {
                onRefresh?.()
                onClose()
            } else {
                alert(result.message || 'Gagal menangani laporan')
            }
        } catch (error) {
            console.error('Error handling report:', error)
            alert('Gagal menangani laporan')
        } finally {
            setIsHandling(false)
        }
    }

    const handleResolve = async () => {
        if (!canResolve) return

        setIsSubmitting(true)
        try {
            const formData = new FormData()
            formData.append('description', repairDescription)
            repairImages.forEach((file) => {
                formData.append('images', file)
            })

            const response = await fetch(`/api/owner/reports/${report.id}/resolve`, {
                method: 'PATCH',
                body: formData,
            })

            const result = await response.json()

            if (result.success) {
                onRefresh?.()
                onClose()
            } else {
                alert(result.message || 'Gagal mengajukan perbaikan')
            }
        } catch (error) {
            console.error('Error resolving report:', error)
            alert('Gagal mengajukan perbaikan')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <>
            <div className={styles.overlay} onClick={onClose}>
                <div className={styles.overlayContent} onClick={(e) => e.stopPropagation()}>
                    {/* Header */}
                    <div className={styles.overlayHeader}>
                        <h2 className={styles.overlayTitle}>Detail Kendala Ruangan</h2>
                        <button className={styles.closeButton} onClick={onClose} aria-label="Tutup">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <line x1="18" y1="6" x2="6" y2="18" strokeLinecap="round" />
                                <line x1="6" y1="6" x2="18" y2="18" strokeLinecap="round" />
                            </svg>
                        </button>
                    </div>

                    {/* Body */}
                    <div className={styles.overlayBody}>
                        {/* Banner */}
                        <div className={styles.bannerCard}>
                            <div className={styles.bannerLeft}>
                                <p className={styles.bannerId}>ID Laporan: {report.id}</p>
                                <p className={styles.bannerDate}>Tanggal Pelaporan: {report.date}</p>
                            </div>
                            <div className={styles.bannerRight}>
                                <span className={styles.bannerStatusLabel}>Status Laporan:</span>
                                <span className={`${styles.statusBadge} ${getStatusClass(report.status)}`}>
                                    {report.status}
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
                                    <span className={styles.detailValue}>{report.reporter}</span>
                                </div>
                                <div className={styles.detailRow}>
                                    <span className={styles.detailLabel}>ID Transaksi</span>
                                    <span className={styles.detailSeparator}>:</span>
                                    <span className={styles.detailValue}>{report.transactionId ?? '-'}</span>
                                </div>
                                <div className={styles.detailRow}>
                                    <span className={styles.detailLabel}>Alamat Email Pelapor</span>
                                    <span className={styles.detailSeparator}>:</span>
                                    <span className={styles.detailValue}>{report.reporterEmail ?? '-'}</span>
                                </div>
                            </div>
                        </div>

                        {/* Data Ruangan */}
                        <div className={styles.infoCard}>
                            <div className={styles.infoCardHeader}>
                                <h3 className={styles.infoCardTitle}>Data Ruangan</h3>
                                <p className={styles.infoCardSubtitle}>Informasi mengenai ruangan yang dilaporkan</p>
                            </div>
                            <div className={styles.detailList}>
                                <div className={styles.detailRow}>
                                    <span className={styles.detailLabel}>Nama Ruangan</span>
                                    <span className={styles.detailSeparator}>:</span>
                                    <span className={styles.detailValue}>{report.roomName}</span>
                                </div>
                                <div className={styles.detailRow}>
                                    <span className={styles.detailLabel}>ID Ruangan</span>
                                    <span className={styles.detailSeparator}>:</span>
                                    <span className={styles.detailValue}>{report.roomId ?? '-'}</span>
                                </div>
                                <div className={styles.detailRow}>
                                    <span className={styles.detailLabel}>Jenis Ruangan</span>
                                    <span className={styles.detailSeparator}>:</span>
                                    <span className={styles.detailValue}>{report.roomType ?? '-'}</span>
                                </div>
                            </div>
                        </div>

                        {/* Keluhan dan Bukti */}
                        <div className={styles.infoCard}>
                            <div className={styles.infoCardHeader}>
                                <h3 className={styles.infoCardTitle}>Keluhan dan Bukti</h3>
                                <p className={styles.infoCardSubtitle}>Detail keluhan dan bukti dari pelapor</p>
                            </div>
                            <div className={styles.detailList}>
                                <div className={styles.detailRow}>
                                    <span className={styles.detailLabel}>Kategori</span>
                                    <span className={styles.detailSeparator}>:</span>
                                    <span className={styles.detailValue}>{formatCategory(report.category || '')}</span>
                                </div>
                                <div className={styles.detailRow}>
                                    <span className={styles.detailLabel}>Detail Keluhan</span>
                                    <span className={styles.detailSeparator}>:</span>
                                    <span className={styles.detailValue}>{report.description ?? '-'}</span>
                                </div>
                            </div>

                            {report.attachments && report.attachments.length > 0 && (
                                <div className={styles.attachmentsSection}>
                                    <p className={styles.attachmentsLabel}>Lampiran</p>
                                    <div className={styles.attachmentsGrid}>
                                        {report.attachments.map((src, i) => (
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
                        {report.status === 'Ditolak' && report.rejectionReason && (
                            <div className={styles.infoCard}>
                                <div className={styles.infoCardHeader}>
                                    <h3 className={styles.infoCardTitle}>Alasan Penolakan</h3>
                                    <p className={styles.infoCardSubtitle}>Alasan laporan ini ditolak oleh admin</p>
                                </div>
                                <div className={styles.detailList}>
                                    <div className={styles.detailRow}>
                                        <span className={styles.detailLabel}>Alasan</span>
                                        <span className={styles.detailSeparator}>:</span>
                                        <span className={styles.detailValue}>{report.rejectionReason}</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Bukti Perbaikan (Form) */}
                        {report.status !== 'Selesai' && report.status !== 'Ditolak' && (
                            <div className={styles.infoCard}>
                                <div className={styles.infoCardHeader}>
                                    <h3 className={styles.infoCardTitle}>Bukti Perbaikan</h3>
                                    <p className={styles.infoCardSubtitle}>Upload foto dan deskripsi perbaikan yang telah dilakukan</p>
                                </div>

                                <div className={styles.formField}>
                                    <label className={styles.label}>
                                        Foto Perbaikan
                                        <span className={styles.required}>Wajib</span>
                                    </label>
                                    <div className={styles.uploadArea}>
                                        <input
                                            type="file"
                                            id="repairImages"
                                            multiple
                                            accept="image/jpeg,image/png"
                                            className={styles.fileInput}
                                            onChange={(e) => {
                                                const files = Array.from(e.target.files || [])
                                                const newUrls = files.map(file => URL.createObjectURL(file))
                                                setRepairImages([...repairImages, ...files])
                                                setRepairImageUrls([...repairImageUrls, ...newUrls])
                                            }}
                                        />
                                        <label htmlFor="repairImages" className={styles.uploadLabel}>
                                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                                <polyline points="17 8 12 3 7 8" />
                                                <line x1="12" y1="3" x2="12" y2="15" />
                                            </svg>
                                            <span>Klik untuk upload foto</span>
                                            <span className={styles.uploadHint}>Format: JPG/PNG, Maks: 5MB per foto</span>
                                        </label>
                                    </div>

                                    {repairImageUrls.length > 0 && (
                                        <>
                                            <p className={styles.uploadNotice}>
                                                Foto pertama akan dijadikan foto utama. Seret untuk mengubah urutan.
                                            </p>
                                            <div className={styles.previewGrid}>
                                                {repairImageUrls.map((src, i) => (
                                                    <div key={i} className={styles.previewItem}>
                                                        <img src={src} alt={`Preview ${i + 1}`} className={styles.previewThumb} />
                                                        <button
                                                            type="button"
                                                            className={styles.previewDelete}
                                                            onClick={() => {
                                                                setRepairImages(repairImages.filter((_, idx) => idx !== i))
                                                                setRepairImageUrls(repairImageUrls.filter((_, idx) => idx !== i))
                                                            }}
                                                        >
                                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                <line x1="18" y1="6" x2="6" y2="18" />
                                                                <line x1="6" y1="6" x2="18" y2="18" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </>
                                    )}
                                </div>

                                <div className={styles.formField}>
                                    <label className={styles.label}>
                                        Deskripsi Perbaikan
                                        <span className={styles.required}>Wajib</span>
                                    </label>
                                    <textarea
                                        className={styles.textarea}
                                        rows={5}
                                        value={repairDescription}
                                        onChange={(e) => setRepairDescription(e.target.value)}
                                        placeholder="Tuliskan deskripsi perbaikan"
                                        disabled={report.status === 'Selesai' || report.status === 'Ditolak'}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Bukti Perbaikan (Display) */}
                        {report.status === 'Selesai' && report.resolutionImage && report.resolutionImage.length > 0 && (
                            <div className={styles.infoCard}>
                                <div className={styles.infoCardHeader}>
                                    <h3 className={styles.infoCardTitle}>Bukti Perbaikan</h3>
                                    <p className={styles.infoCardSubtitle}>Dokumentasi perbaikan yang telah dilakukan</p>
                                </div>
                                <div className={styles.detailList}>
                                    <p className={styles.attachmentsLabel}>Foto Perbaikan</p>
                                    <div className={styles.attachmentsGrid}>
                                        {report.resolutionImage.map((src: string, i: number) => (
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
                                        <span className={styles.detailValue}>{report.resolutionDescription || '-'}</span>
                                    </div>
                                    {report.resolutionSubmittedAt && (
                                        <div className={styles.detailRow}>
                                            <span className={styles.detailLabel}>Tanggal Dikirim</span>
                                            <span className={styles.detailSeparator}>:</span>
                                            <span className={styles.detailValue}>
                                                {new Date(report.resolutionSubmittedAt).toLocaleDateString('id-ID', {
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
                            onClick={handleHandle}
                            disabled={!canHandle || isHandling}
                        >
                            {isHandling ? 'Memproses...' : 'Tangani Laporan'}
                        </button>
                        <button
                            className={`${styles.actionButton} ${styles.btnPrimary}`}
                            onClick={handleResolve}
                            disabled={!canResolve || isSubmitting}
                        >
                            {isSubmitting ? 'Mengirim...' : 'Ajukan Perbaikan'}
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
