'use client'

import { useState } from 'react'
import styles from './RejectionReasonOverlay.module.css'

interface RejectionReasonOverlayProps {
    isOpen: boolean
    onClose: () => void
    reportId: string
    onRefresh?: () => void
}

export default function RejectionReasonOverlay({ isOpen, onClose, reportId, onRefresh }: RejectionReasonOverlayProps) {
    const [reason, setReason] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)

    if (!isOpen) return null

    const handleSubmit = async () => {
        if (!reason.trim()) {
            alert('Mohon isi alasan penolakan')
            return
        }

        setIsSubmitting(true)
        try {
            const response = await fetch(`/api/admin/reports/${reportId}/reject`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reason }),
            })

            const result = await response.json()

            if (result.success) {
                onRefresh?.()
                onClose()
            } else {
                alert(result.message || 'Gagal menolak laporan')
            }
        } catch (error) {
            console.error('Error rejecting report:', error)
            alert('Gagal menolak laporan')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.overlayContent} onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className={styles.overlayHeader}>
                    <h2 className={styles.overlayTitle}>Tolak Laporan</h2>
                    <button className={styles.closeButton} onClick={onClose} aria-label="Tutup">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <line x1="18" y1="6" x2="6" y2="18" strokeLinecap="round" />
                            <line x1="6" y1="6" x2="18" y2="18" strokeLinecap="round" />
                        </svg>
                    </button>
                </div>

                {/* Body */}
                <div className={styles.overlayBody}>
                    <div className={styles.formField}>
                        <label className={styles.label}>
                            Alasan Penolakan
                            <span className={styles.required}>Wajib</span>
                        </label>
                        <textarea
                            className={styles.textarea}
                            rows={5}
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="Jelaskan alasan laporan ini ditolak..."
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className={styles.overlayFooter}>
                    <button className={`${styles.actionButton} ${styles.btnSecondary}`} onClick={onClose}>
                        Batal
                    </button>
                    <button
                        className={`${styles.actionButton} ${styles.btnDanger}`}
                        onClick={handleSubmit}
                        disabled={!reason.trim() || isSubmitting}
                    >
                        {isSubmitting ? 'Memproses...' : 'Tolak Laporan'}
                    </button>
                </div>
            </div>
        </div>
    )
}
