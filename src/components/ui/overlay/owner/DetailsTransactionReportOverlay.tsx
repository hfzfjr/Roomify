'use client'

import styles from './DetailsTransactionReportOverlay.module.css'

interface Payment {
    amount: number
    payment_method?: string
    status?: string
    room_price_per_hour?: number
    duration_hours?: number
    service_fee?: number
    ppn_percent?: number
}

interface Transaction {
    id: string
    date: string
    roomName: string
    roomType?: string
    rentalDate?: string
    startTime?: string
    endTime?: string
    renter: string
    payment: Payment
}

interface DetailsTransactionReportOverlayProps {
    isOpen: boolean
    onClose: () => void
    transaction: Transaction | null
}

// DUMMY DATA for preview
const dummyTransaction: Transaction = {
    id: 'TR-KSD234DFGI',
    date: 'Senin, 20 April 2026',
    roomName: 'Ruang Kubangkuul',
    roomType: 'Meeting Room',
    rentalDate: 'Senin, 27 April 2026',
    startTime: '16:00',
    endTime: '18:00',
    renter: 'Bahlilnya Acu',
    payment: {
        amount: 779500,
        payment_method: 'Transfer Virtual Account BCA',
        status: 'completed',
        room_price_per_hour: 350000,
        duration_hours: 2,
        service_fee: 2500,
        ppn_percent: 11,
    }
}

export default function DetailsTransactionReportOverlay({
    isOpen,
    onClose,
    transaction
}: DetailsTransactionReportOverlayProps) {
    if (!isOpen) return null

    const tx = transaction ?? dummyTransaction

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount)
    }

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'success': return 'Lunas'
            case 'failed': return 'Gagal'
            case 'pending': return 'Pending'
            default: return status
        }
    }

    const durationHours = tx.payment?.duration_hours ?? 1
    const pricePerHour = tx.payment?.room_price_per_hour ?? 0
    const subTotal = pricePerHour * durationHours
    const serviceFee = tx.payment?.service_fee ?? 0
    const ppnPercent = tx.payment?.ppn_percent ?? 11
    const ppnAmount = Math.round((subTotal * ppnPercent) / 100)
    const totalAmount = tx.payment?.amount ?? (subTotal + serviceFee + ppnAmount)

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.overlayContent} onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className={styles.overlayHeader}>
                    <h2 className={styles.overlayTitle}>Detail Transaksi</h2>
                    <button className={styles.closeButton} onClick={onClose} aria-label="Tutup">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <line x1="18" y1="6" x2="6" y2="18" strokeLinecap="round" />
                            <line x1="6" y1="6" x2="18" y2="18" strokeLinecap="round" />
                        </svg>
                    </button>
                </div>

                {/* Body */}
                <div className={styles.overlayBody}>
                    {/* Section 1: Info Transaksi & Penyewa */}
                    <div className={styles.section}>
                        <div className={styles.detailRow}>
                            <span className={styles.detailLabel}>ID Transaksi</span>
                            <span className={styles.detailValue}>{`#${tx.id}`}</span>
                        </div>
                        <div className={styles.detailRow}>
                            <span className={styles.detailLabel}>Tanggal Pembayaran</span>
                            <span className={styles.detailValue}>{tx.date}</span>
                        </div>
                        <div className={styles.detailRow}>
                            <span className={styles.detailLabel}>Nama Penyewa</span>
                            <span className={styles.detailValue}>{tx.renter}</span>
                        </div>
                        <div className={styles.detailRow}>
                            <span className={styles.detailLabel}>Ruangan</span>
                            <span className={styles.detailValue}>{tx.roomName}</span>
                        </div>
                        <div className={styles.detailRow}>
                            <span className={styles.detailLabel}>Jenis Ruangan</span>
                            <span className={styles.detailValue}>{tx.roomType ?? '-'}</span>
                        </div>
                        <div className={styles.detailRow}>
                            <span className={styles.detailLabel}>Tanggal Penyewaan</span>
                            <span className={styles.detailValue}>{tx.rentalDate ?? '-'}</span>
                        </div>
                        <div className={styles.detailRow}>
                            <span className={styles.detailLabel}>Waktu (Durasi)</span>
                            <span className={styles.detailValue}>
                                {tx.startTime && tx.endTime
                                    ? `${tx.startTime} - ${tx.endTime} (${durationHours} Jam)`
                                    : '-'}
                            </span>
                        </div>
                        <div className={styles.detailRow}>
                            <span className={styles.detailLabel}>Metode pembayaran</span>
                            <span className={styles.detailValue}>{tx.payment?.payment_method ?? '-'}</span>
                        </div>
                        <div className={styles.detailRow}>
                            <span className={styles.detailLabel}>Status</span>
                            <span className={styles.detailValue}>{getStatusLabel(tx.payment.status || 'pending')}</span>
                        </div>
                    </div>

                    {/* Section 2: Harga Sewa & Sub Total */}
                    <div className={styles.section}>
                        <div className={styles.detailRow}>
                            <span className={styles.detailLabel}>Harga Sewa Ruangan</span>
                            <span className={styles.detailValue}>{formatCurrency(pricePerHour)}</span>
                        </div>
                        <div className={styles.detailRow}>
                            <span className={styles.detailLabel}>Sub Total</span>
                            <span className={styles.detailValue}>{formatCurrency(subTotal)}</span>
                        </div>
                    </div>

                    {/* Section 3: Biaya Layanan & PPN */}
                    <div className={styles.section}>
                        <div className={styles.detailRow}>
                            <span className={styles.detailLabel}>Biaya Layanan</span>
                            <span className={styles.detailValue}>{formatCurrency(serviceFee)}</span>
                        </div>
                        <div className={styles.detailRow}>
                            <span className={styles.detailLabel}>PPN ({ppnPercent}%)</span>
                            <span className={styles.detailValue}>{formatCurrency(ppnAmount)}</span>
                        </div>
                    </div>

                    {/* Section 4: Total */}
                    <div className={`${styles.section} ${styles.sectionLast}`}>
                        <div className={styles.detailRow}>
                            <span className={styles.detailLabel}>Total bayar</span>
                            <span className={`${styles.detailValue} ${styles.totalAmount}`}>
                                {formatCurrency(totalAmount)}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}