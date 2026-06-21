'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import BackButton from '@/components/ui/BackButton'
import DetailRoomIssuesOverlay from '@/components/ui/overlay/owner/DetailRoomIssuesOverlay'
import styles from './page.module.css'

type ReportStatus = 'Perlu tindakan' | 'Proses' | 'Selesai' | 'Ditolak'

interface Report {
    id: string
    date: string
    roomName: string
    reporter: string
    status: ReportStatus
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
}

type SortKey = 'date' | 'id' | 'reporter' | 'roomName' | 'status'

export default function OwnerRoomIssues() {
    const router = useRouter()
    const [searchQuery, setSearchQuery] = useState('')
    const [sortKey, setSortKey] = useState<SortKey>('date')
    const [showSortDropdown, setShowSortDropdown] = useState(false)
    const [isDetailOverlayOpen, setIsDetailOverlayOpen] = useState(false)
    const [selectedReport, setSelectedReport] = useState<Report | null>(null)
    const [reports, setReports] = useState<Report[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        fetchReports()
    }, [])

    const fetchReports = async () => {
        try {
            setLoading(true)
            setError(null)

            const userStr = localStorage.getItem('user')
            if (!userStr) {
                setError('User not found')
                return
            }

            const user = JSON.parse(userStr)
            const userId = user.user_id

            const response = await fetch(`/api/owner/reports?user_id=${userId}`)
            const result = await response.json()

            if (result.success) {
                setReports(result.data.reports || [])
            } else {
                setError(result.message || 'Failed to fetch reports')
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred')
            console.error('Error fetching reports:', err)
        } finally {
            setLoading(false)
        }
    }

    const sortOptions: { key: SortKey; label: string }[] = [
        { key: 'date', label: 'Terbaru' },
        { key: 'id', label: 'ID Laporan' },
        { key: 'reporter', label: 'Nama Pelapor' },
        { key: 'roomName', label: 'Nama Ruangan' },
        { key: 'status', label: 'Status' },
    ]

    const currentSortLabel = sortOptions.find(o => o.key === sortKey)?.label ?? 'Terbaru'

    const filteredReports = useMemo(() => {
        const q = searchQuery.toLowerCase()
        return [...reports]
            .filter(r =>
                q === '' ||
                r.id.toLowerCase().includes(q) ||
                r.roomName.toLowerCase().includes(q) ||
                r.reporter.toLowerCase().includes(q)
            )
            .sort((a, b) => {
                if (sortKey === 'date') {
                    return new Date(b.date).getTime() - new Date(a.date).getTime()
                }
                return String(a[sortKey]).localeCompare(String(b[sortKey]))
            })
    }, [searchQuery, sortKey, reports])

    const getStatusClass = (status: ReportStatus) => {
        switch (status) {
            case 'Perlu tindakan': return styles.statusActionNeeded
            case 'Proses': return styles.statusInProgress
            case 'Selesai': return styles.statusSolved
            case 'Ditolak': return styles.statusRejected
            default: return ''
        }
    }

    return (
        <div className={styles.container}>
            <BackButton href="/owner/dashboard" title="Kendala Ruangan" />

            <div className={styles.mainContent}>
                {loading && (
                    <div>
                        {/* Header Card Skeleton */}
                        <div className={styles.skeletonCard}>
                            <div className={styles.skeletonText} />
                            <div className={styles.skeletonLineShort} />
                        </div>

                        {/* Sort Row Skeleton */}
                        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
                            <div className={styles.skeletonLineShort} />
                            <div className={styles.skeletonLineShort} />
                        </div>

                        {/* Table Card Skeleton */}
                        <div className={styles.skeletonTableCard}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                                <div className={styles.skeletonText} />
                                <div className={styles.skeletonLineShort} />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                {[...Array(5)].map((_, i) => (
                                    <div key={i} style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                                        <div className={styles.skeletonLineShort} />
                                        <div className={styles.skeletonLine} />
                                        <div className={styles.skeletonLine} />
                                        <div className={styles.skeletonLineShort} />
                                        <div className={styles.skeletonLineShort} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {error && (
                    <div className={styles.errorContainer}>
                        <p>{error}</p>
                        <button onClick={fetchReports} className={styles.retryButton}>
                            Coba Lagi
                        </button>
                    </div>
                )}

                {!loading && !error && (
                    <div>
                        {/* Header Card */}
                        <div className={styles.headerCard}>
                            <h2>Daftar Kendala Ruangan</h2>
                            <p>Daftar kendala ruangan Anda dari pengguna</p>
                        </div>

                        {/* Sort Dropdown */}
                        <div className={styles.sortRow}>
                            <span className={styles.sortLabel}>Urutkan Berdasarkan:</span>
                            <div className={styles.dropdownWrapper}>
                                <button
                                    type="button"
                                    className={styles.sortButton}
                                    onClick={() => setShowSortDropdown(prev => !prev)}
                                >
                                    {currentSortLabel}
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                        <polyline points="6 9 12 15 18 9" />
                                    </svg>
                                </button>
                                {showSortDropdown && (
                                    <div className={styles.dropdownMenu}>
                                        {sortOptions.map(opt => (
                                            <button
                                                key={opt.key}
                                                type="button"
                                                className={`${styles.dropdownItem} ${sortKey === opt.key ? styles.dropdownItemActive : ''}`}
                                                onClick={() => { setSortKey(opt.key); setShowSortDropdown(false) }}
                                            >
                                                {opt.label}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Table Card */}
                        <div className={styles.tableCard}>
                            <div className={styles.tableCardHeader}>
                                <h3>Daftar Keluhan</h3>
                                <div className={styles.searchWrapper}>
                                    <input
                                        type="text"
                                        className={styles.searchInput}
                                        placeholder="Cari laporan"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                    <svg className={styles.searchIcon} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                                        <circle cx="11" cy="11" r="8" />
                                        <path d="m21 21-4.35-4.35" />
                                    </svg>
                                </div>
                            </div>

                            <div className={styles.tableWrapper}>
                                <table className={styles.table}>
                                    <thead>
                                        <tr>
                                            <th>ID Laporan</th>
                                            <th>Nama Pelapor</th>
                                            <th>Nama Ruangan</th>
                                            <th>Status Laporan</th>
                                            <th>Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredReports.length === 0 ? (
                                            <tr>
                                                <td colSpan={5} style={{ textAlign: 'center', padding: '40px' }}>
                                                    Tidak ada laporan yang ditemukan
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredReports.map((report) => (
                                                <tr key={report.id}>
                                                    <td className={styles.cellId}>{report.id}</td>
                                                    <td>{report.reporter}</td>
                                                    <td>{report.roomName}</td>
                                                    <td>
                                                        <span className={`${styles.statusBadge} ${getStatusClass(report.status)}`}>
                                                            {report.status}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <button
                                                            type="button"
                                                            className={styles.btnView}
                                                            onClick={() => {
                                                                setSelectedReport(report)
                                                                setIsDetailOverlayOpen(true)
                                                            }}
                                                        >
                                                            Lihat detail
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Detail Room Issues Overlay */}
            <DetailRoomIssuesOverlay
                report={selectedReport}
                isOpen={isDetailOverlayOpen}
                onClose={() => {
                    setIsDetailOverlayOpen(false)
                    setSelectedReport(null)
                }}
                onRefresh={fetchReports}
            />
        </div>
    )
}

