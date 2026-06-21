'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import SidebarAdmin from '@/components/layout/SidebarAdmin'
import DetailReportOverlay from '@/components/ui/overlay/admin/DetailReportOverlay'
import RejectionReasonOverlay from '@/components/ui/overlay/admin/RejectionReasonOverlay'
import { useUser } from '@/hooks/useUser'
import styles from './page.module.css'

type ReportStatus = 'Perlu tindakan' | 'Proses' | 'Selesai' | 'Ditolak'

export interface Report {
  id: string
  date: string
  roomName: string
  owner: string
  reporter: string
  status: ReportStatus
  description?: string
  category?: string
  attachments?: string[]
  resolutionImage?: string[]
  resolutionDescription?: string
  resolutionSubmittedAt?: string
  rejectionReason?: string
}

type SortKey = 'id' | 'date' | 'roomName' | 'owner' | 'reporter' | 'status'

export default function AdminReports() {
  const user = useUser()
  const [searchQuery, setSearchQuery] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('date')
  const [showSortDropdown, setShowSortDropdown] = useState(false)
  const [filterNeedAction, setFilterNeedAction] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isDetailOverlayOpen, setIsDetailOverlayOpen] = useState(false)
  const [isRejectionOverlayOpen, setIsRejectionOverlayOpen] = useState(false)
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)
  const [selectedReportId, setSelectedReportId] = useState<string>('')
  const sidebarRef = useRef<HTMLElement | null>(null)
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalNew: 0,
    waitingAction: 0,
    solved: 0,
  })

  useEffect(() => {
    fetchReports()
  }, [])

  const fetchReports = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/reports')
      const result = await response.json()

      if (result.success) {
        setReports(result.data.reports)
        setStats(result.data.stats)
      } else {
        console.error('Failed to fetch reports:', result.message)
      }
    } catch (error) {
      console.error('Error fetching reports:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleWarn = async () => {
    if (!selectedReport) return

    try {
      const response = await fetch(`/api/admin/reports/${selectedReport.id}/warn`, {
        method: 'PATCH',
      })

      const result = await response.json()

      if (result.success) {
        fetchReports()
        setIsDetailOverlayOpen(false)
        setSelectedReport(null)
      } else {
        alert(result.message || 'Gagal mengirim teguran')
      }
    } catch (error) {
      console.error('Error warning owner:', error)
      alert('Gagal mengirim teguran')
    }
  }

  const handleSuspend = async () => {
    if (!selectedReport) return

    try {
      const response = await fetch(`/api/admin/reports/${selectedReport.id}/suspend`, {
        method: 'PATCH',
      })

      const result = await response.json()

      if (result.success) {
        fetchReports()
        setIsDetailOverlayOpen(false)
        setSelectedReport(null)
      } else {
        alert(result.message || 'Gagal menangguhkan ruangan')
      }
    } catch (error) {
      console.error('Error suspending room:', error)
      alert('Gagal menangguhkan ruangan')
    }
  }

  const sortOptions: { key: SortKey; label: string }[] = [
    { key: 'date', label: 'Terbaru' },
    { key: 'id', label: 'ID Laporan' },
    { key: 'roomName', label: 'Nama Ruangan' },
    { key: 'owner', label: 'Owner' },
    { key: 'reporter', label: 'Pelapor' },
    { key: 'status', label: 'Status' },
  ]

  const currentSortLabel = sortOptions.find(o => o.key === sortKey)?.label ?? 'Terbaru'

  const filteredReports = useMemo(() => {
    const q = searchQuery.toLowerCase()
    return [...reports]
      .filter(r =>
        (!filterNeedAction || r.status === 'Perlu tindakan') &&
        (selectedCategory === '' || r.category === selectedCategory) &&
        (q === '' ||
          r.id.toLowerCase().includes(q) ||
          r.roomName.toLowerCase().includes(q) ||
          r.owner.toLowerCase().includes(q) ||
          r.reporter.toLowerCase().includes(q))
      )
      .sort((a, b) => {
        if (sortKey === 'date') {
          return new Date(b.date).getTime() - new Date(a.date).getTime()
        }
        return String(a[sortKey]).localeCompare(String(b[sortKey]))
      })
  }, [searchQuery, sortKey, filterNeedAction, selectedCategory, reports])

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
    <div className={styles.pageLayout}>
      {/* Sidebar */}
      <SidebarAdmin
        user={user}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        sidebarRef={sidebarRef}
      />

      {/* Sidebar overlay for mobile */}
      {sidebarOpen && (
        <div className={styles.sidebarOverlay} onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main area */}
      <div className={styles.mainArea}>
        {/* Mobile topbar */}
        <div className={styles.mobileTopbar}>
          <button
            type="button"
            className={styles.hamburger}
            onClick={() => setSidebarOpen(true)}
            aria-label="Buka menu"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <line x1="3" y1="6" x2="21" y2="6" strokeLinecap="round" />
              <line x1="3" y1="12" x2="21" y2="12" strokeLinecap="round" />
              <line x1="3" y1="18" x2="21" y2="18" strokeLinecap="round" />
            </svg>
          </button>
          <span className={styles.mobileTopbarTitle}>Laporan Kendala</span>
        </div>

        <div className={styles.container}>
          <div className={styles.content}>
            {/* Header Card */}
            <div className={styles.headerCard}>
              <h2>Daftar Laporan Kendala Ruangan</h2>
              <p>Daftar keluhan pelanggan terhadap fasilitas atau layanan mitra</p>
            </div>

            {/* Stats Grid */}
            <div className={styles.statsGrid}>
              <div className={styles.statCard}>
                <div className={styles.statTitle}>Total Laporan Baru:</div>
                <div className={styles.statNumber}>{stats.totalNew}</div>
                <div className={styles.statLabel}>Laporan</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statTitle}>Menunggu Tindakan:</div>
                <div className={styles.statNumber}>{stats.waitingAction}</div>
                <div className={styles.statLabel}>Laporan</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statTitle}>Diselesaikan:</div>
                <div className={styles.statNumber}>{stats.solved}</div>
                <div className={styles.statLabel}>Laporan</div>
              </div>
            </div>

            {/* Filter Row */}
            <div className={styles.filterRow}>
              {/* Sort Dropdown */}
              <div className={styles.filterGroup}>
                <span className={styles.filterLabel}>Urutkan Berdasarkan:</span>
                <div className={styles.dropdownWrapper}>
                  <button
                    type="button"
                    className={styles.sortButton}
                    onClick={() => setShowSortDropdown(prev => !prev)}
                  >
                    <span className={styles.sortArrow}>↑</span>
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

              {/* Filter Status */}
              <div className={styles.filterGroup}>
                <span className={styles.filterLabel}>Filter Status:</span>
                <button
                  type="button"
                  className={`${styles.filterPill} ${filterNeedAction ? styles.filterPillActive : ''}`}
                  onClick={() => setFilterNeedAction(prev => !prev)}
                >
                  Perlu Tindakan
                </button>
              </div>

              {/* Kategori */}
              <div className={styles.filterGroup}>
                <span className={styles.filterLabel}>Kategori:</span>
                <select
                  className={styles.filterPill}
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  <option value="">Semua</option>
                  <option value="kerusakan_fasilitas">Kerusakan Fasilitas</option>
                  <option value="tidak_sesuai_deskripsi">Tidak Sesuai Deskripsi</option>
                  <option value="keamanan">Keamanan</option>
                  <option value="ac_ventilasi">AC/Ventilasi</option>
                  <option value="fasilitas">Fasilitas</option>
                  <option value="kebisingan">Kebisingan</option>
                  <option value="internet">Internet</option>
                  <option value="kebersihan">Kebersihan</option>
                  <option value="pelayanan">Pelayanan</option>
                  <option value="lainnya">Lainnya</option>
                </select>
              </div>
            </div>

            {/* Table Card */}
            <div className={styles.tableCard}>
              <div className={styles.tableCardHeader}>
                <h3>Daftar Laporan</h3>
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
                      <th>Tanggal Masuk</th>
                      <th>Nama Ruangan</th>
                      <th>Owner</th>
                      <th>Pelapor</th>
                      <th>Status</th>
                      <th>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={7} style={{ textAlign: 'center', padding: '40px' }}>Loading...</td>
                      </tr>
                    ) : filteredReports.length === 0 ? (
                      <tr>
                        <td colSpan={7} style={{ textAlign: 'center', padding: '40px' }}>Tidak ada laporan yang ditemukan</td>
                      </tr>
                    ) : (
                      filteredReports.map((report, idx) => (
                        <tr key={`${report.id}-${idx}`}>
                          <td className={styles.cellId}>{report.id}</td>
                          <td className={styles.cellDate}>{report.date}</td>
                          <td className={styles.cellRoom}>{report.roomName}</td>
                          <td className={styles.cellOwner}>{report.owner}</td>
                          <td className={styles.cellReporter}>{report.reporter}</td>
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
        </div>
      </div>

      {/* Detail Report Overlay */}
      <DetailReportOverlay
        report={selectedReport}
        isOpen={isDetailOverlayOpen}
        onClose={() => {
          setIsDetailOverlayOpen(false)
          setSelectedReport(null)
        }}
        onReject={(reportId) => {
          setSelectedReportId(reportId)
          setIsRejectionOverlayOpen(true)
        }}
        onWarn={handleWarn}
        onSuspend={handleSuspend}
      />

      {/* Rejection Reason Overlay */}
      <RejectionReasonOverlay
        isOpen={isRejectionOverlayOpen}
        onClose={() => setIsRejectionOverlayOpen(false)}
        reportId={selectedReportId}
        onRefresh={fetchReports}
      />
    </div>
  )
}
