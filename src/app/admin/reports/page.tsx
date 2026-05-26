'use client'

import { useState, useMemo } from 'react'
import BackButton from '@/components/ui/BackButton'
import styles from './page.module.css'

type ReportStatus = 'Pending' | 'Perlu tindakan' | 'Selesai'

interface Report {
  id: string
  date: string
  roomName: string
  owner: string
  reporter: string
  status: ReportStatus
}

const mockReports: Report[] = [
  { id: '#REP-12HD7', date: '19/05/2026', roomName: 'Ruang Kubangkuul', owner: 'Prabowo Subianto', reporter: 'Empruy', status: 'Pending' },
  { id: '#REP-12HD8', date: '19/05/2026', roomName: 'Ruang Kubangkuul', owner: 'Prabowo Subianto', reporter: 'Empruy', status: 'Perlu tindakan' },
  { id: '#REP-12HD9', date: '19/05/2026', roomName: 'Ruang Kubangkuul', owner: 'Prabowo Subianto', reporter: 'Empruy', status: 'Selesai' },
  { id: '#REP-12HD7', date: '19/05/2026', roomName: 'Ruang Kubangkuul', owner: 'Prabowo Subianto', reporter: 'Empruy', status: 'Perlu tindakan' },
]

type SortKey = 'id' | 'date' | 'roomName' | 'owner' | 'reporter' | 'status'

export default function AdminReports() {
  const [searchQuery, setSearchQuery] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('date')
  const [showSortDropdown, setShowSortDropdown] = useState(false)
  const [filterNeedAction, setFilterNeedAction] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState('Kerusakan fasilitas')

  const stats = {
    totalNew: 20,
    waitingAction: 2,
    solved: 192,
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
    return [...mockReports]
      .filter(r =>
        (!filterNeedAction || r.status === 'Perlu tindakan') &&
        (q === '' ||
          r.id.toLowerCase().includes(q) ||
          r.roomName.toLowerCase().includes(q) ||
          r.owner.toLowerCase().includes(q) ||
          r.reporter.toLowerCase().includes(q))
      )
      .sort((a, b) => String(a[sortKey]).localeCompare(String(b[sortKey])))
  }, [searchQuery, sortKey, filterNeedAction])

  const getStatusClass = (status: ReportStatus) => {
    switch (status) {
      case 'Pending': return styles.statusPending
      case 'Perlu tindakan': return styles.statusActionNeeded
      case 'Selesai': return styles.statusSolved
      default: return ''
    }
  }

  return (
    <div className={styles.container}>
      <BackButton href="/admin/dashboard" title="Laporan" />

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
              Perlu Tidakan
            </button>
          </div>

          {/* Kategori */}
          <div className={styles.filterGroup}>
            <span className={styles.filterLabel}>Kategori:</span>
            <button
              type="button"
              className={`${styles.filterPill} ${selectedCategory ? styles.filterPillActive : ''}`}
              onClick={() => setSelectedCategory(selectedCategory ? '' : 'Kerusakan fasilitas')}
            >
              Kerusakan fasilitas
              {selectedCategory && <span className={styles.pillX}>×</span>}
            </button>
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
              <span className={styles.searchIcon}>🔍</span>
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
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filteredReports.map((report, idx) => (
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
                        onClick={() => console.log('detail', report.id)}
                      >
                        Lihat detail
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredReports.length === 0 && (
            <div className={styles.emptyState}>
              <p>Tidak ada laporan yang ditemukan</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
