'use client'

import { useState, useEffect } from 'react'
import styles from './page.module.css'
import BackButton from '@/components/ui/BackButton'
import DetailsTransactionReportOverlay from '@/components/ui/overlay/owner/DetailsTransactionReportOverlay'

type Transaction = {
  id: string
  date: string
  roomName: string
  roomType?: string
  rentalDate?: string
  startTime?: string
  endTime?: string
  renter: string
  payment: {
    amount: number
    booking_total_cost?: number
    payment_method?: string
    status?: string
    room_price_per_hour?: number
    duration_hours?: number
    service_fee?: number
    ppn_percent?: number
  }
}

type Room = {
  room_id: string
  name: string
}

type ReportsData = {
  transactions: Transaction[]
  stats: {
    totalRevenue: number
    successfulTransactions: number
    failedTransactions: number
    pendingTransactions: number
  }
  rooms: Room[]
}

export default function OwnerReports() {
  const [searchTerm, setSearchTerm] = useState('')
  const [periodFilter, setPeriodFilter] = useState('30')
  const [roomFilter, setRoomFilter] = useState('all')
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [stats, setStats] = useState({
    totalRevenue: 0,
    successfulTransactions: 0,
    failedTransactions: 0,
    pendingTransactions: 0
  })
  const [rooms, setRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isOverlayOpen, setIsOverlayOpen] = useState(false)
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)

  const fetchReportsData = async () => {
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

      const params = new URLSearchParams({
        type: 'reports',
        user_id: userId,
        period: periodFilter,
        room_id: roomFilter,
      })

      if (searchTerm) {
        params.append('search', searchTerm)
      }

      const response = await fetch(`/api/reports?${params.toString()}`)
      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Failed to fetch reports data')
      }

      setTransactions(result.data.transactions || [])
      setStats(result.data.stats || {
        totalRevenue: 0,
        successfulTransactions: 0,
        failedTransactions: 0,
        pendingTransactions: 0
      })
      setRooms(result.data.rooms || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      console.error('Error fetching reports data:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const fetchData = () => {
      fetchReportsData()
    }

    // If searchTerm changed, use debounce
    if (searchTerm !== '') {
      const debounceTimer = setTimeout(fetchData, 500)
      return () => clearTimeout(debounceTimer)
    }

    // If periodFilter or roomFilter changed, fetch immediately
    fetchData()
  }, [periodFilter, roomFilter, searchTerm])

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'success': return styles.statusLunas
      case 'failed': return styles.statusBatal
      case 'pending': return styles.statusPending
      default: return ''
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'success': return 'Lunas'
      case 'failed': return 'Gagal'
      case 'pending': return 'Pending'
      default: return status
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const TrendUp = ({ highlight }: { highlight?: boolean }) => (
    <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  )

  return (
    <div className={styles.container}>
      <BackButton href="/owner/dashboard" title="Laporan Transaksi" />

      <div className={styles.mainContent}>
        {loading && (
          <>
            {/* Hero Card Skeleton */}
            <div className={styles.skeletonHeroCard}>
              <div className={styles.skeletonText} />
              <div className={styles.skeletonLine} />
            </div>

            {/* Summary Cards Skeleton */}
            <div className={styles.summaryCards}>
              {[...Array(4)].map((_, index) => (
                <div key={index} className={styles.skeletonCard}>
                  <div className={styles.skeletonLineShort} />
                  <div className={styles.skeletonValue} />
                  <div className={styles.skeletonLineShort} />
                </div>
              ))}
            </div>

            {/* Filter Bar Skeleton */}
            <div className={styles.filterBar}>
              <div className={styles.skeletonLineShort} />
              <div className={styles.skeletonLineShort} />
              <div className={styles.filterSep} />
              <div className={styles.skeletonLineShort} />
              <div className={styles.skeletonLineShort} />
            </div>

            {/* Transaction Table Skeleton */}
            <div className={styles.skeletonTableCard}>
              <div className={styles.tableTopRow}>
                <div className={styles.skeletonLine} />
                <div className={styles.skeletonLineShort} />
              </div>
              <div className={styles.tableContainer}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th><div className={styles.skeletonLineShort} /></th>
                      <th><div className={styles.skeletonLineShort} /></th>
                      <th><div className={styles.skeletonLineShort} /></th>
                      <th><div className={styles.skeletonLineShort} /></th>
                      <th><div className={styles.skeletonLineShort} /></th>
                      <th><div className={styles.skeletonLineShort} /></th>
                      <th><div className={styles.skeletonLineShort} /></th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...Array(5)].map((_, index) => (
                      <tr key={index}>
                        <td><div className={styles.skeletonLineShort} /></td>
                        <td><div className={styles.skeletonLineShort} /></td>
                        <td><div className={styles.skeletonLineShort} /></td>
                        <td><div className={styles.skeletonLineShort} /></td>
                        <td><div className={styles.skeletonLineShort} /></td>
                        <td><div className={styles.skeletonLineShort} /></td>
                        <td><div className={styles.skeletonLineShort} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {error && (
          <div style={{ textAlign: 'center', padding: '40px', color: 'red' }}>
            <p>{error}</p>
            <button onClick={fetchReportsData} style={{ marginTop: '10px', padding: '8px 16px', cursor: 'pointer' }}>
              Coba Lagi
            </button>
          </div>
        )}

        {!loading && !error && (
          <div>
            {/* ── HERO CARD ── */}
            <div className={styles.heroCard}>
              <h2 className={styles.heroTitle}>Ringkasan Pendapatan Keseluruhan</h2>
              <p className={styles.heroSubtitle}>Pantau keseluruhan pendapatan dan rincian status setiap transaksi penyewaan ruangan Anda di sini</p>
            </div>

            {/* ── STAT CARDS ── */}
            <div className={styles.summaryCards}>

              {/* Total Pendapatan — highlight */}
              <div className={`${styles.summaryCard} ${styles.highlightCard}`}>
                <p className={styles.cardLabel}>Total Pendapatan:</p>
                <p className={styles.cardValue}>{formatCurrency(stats.totalRevenue)}</p>
                <div className={styles.cardTrend}>
                  <span className={styles.trendIcon}>
                    <TrendUp highlight />
                  </span>
                  15% &nbsp;Kenaikan dari bulan sebelumnya
                </div>
              </div>

              {/* Transaksi Berhasil */}
              <div className={styles.summaryCard}>
                <p className={styles.cardLabel}>Transaksi Berhasil:</p>
                <p className={styles.cardValue}>{stats.successfulTransactions}<br /><span style={{ fontSize: '14px', fontWeight: 600, color: '#64748b' }}>Transaksi</span></p>
                <div className={styles.cardTrendNormal}>
                  <span className={styles.trendIconNormal}>
                    <TrendUp />
                  </span>
                  15% &nbsp;Kenaikan dari bulan sebelumnya
                </div>
              </div>

              {/* Transaksi Gagal */}
              <div className={styles.summaryCard}>
                <p className={styles.cardLabel}>Transaksi Gagal:</p>
                <p className={styles.cardValue}>{stats.failedTransactions}<br /><span style={{ fontSize: '14px', fontWeight: 600, color: '#64748b' }}>Transaksi</span></p>
                <div className={styles.cardTrendNormal}>
                  <span className={styles.trendIconNormal}>
                    <TrendUp />
                  </span>
                  15% &nbsp;Kenaikan dari bulan sebelumnya
                </div>
              </div>

              {/* Proses Pembayaran */}
              <div className={styles.summaryCard}>
                <p className={styles.cardLabel}>Proses Pembayaran:</p>
                <p className={styles.cardValue}>{stats.pendingTransactions}<br /><span style={{ fontSize: '14px', fontWeight: 600, color: '#64748b' }}>Transaksi</span></p>
                <div className={styles.cardTrendNormal}>
                  <span className={styles.trendIconNormal}>
                    <TrendUp />
                  </span>
                  15% &nbsp;Kenaikan dari bulan sebelumnya
                </div>
              </div>
            </div>

            {/* ── FILTER BAR ── */}
            <div className={styles.filterBar}>
              <span className={styles.filterLabel}>Filter Periode:</span>
              <select
                className={styles.filterPill}
                value={periodFilter}
                onChange={(e) => setPeriodFilter(e.target.value)}
              >
                <option value="7">7 hari</option>
                <option value="30">30 hari</option>
                <option value="90">90 hari</option>
                <option value="365">1 tahun</option>
              </select>

              <div className={styles.filterSep} />

              <span className={styles.filterLabel}>Ruangan:</span>
              <select
                className={styles.filterPill}
                value={roomFilter}
                onChange={(e) => setRoomFilter(e.target.value)}
              >
                <option value="all">Semua</option>
                {rooms.map((room) => (
                  <option key={room.room_id} value={room.room_id}>
                    {room.name}
                  </option>
                ))}
              </select>
            </div>

            {/* ── TRANSACTION TABLE ── */}
            <div className={styles.transactionListSection}>
              <div className={styles.tableTopRow}>
                <h2 className={styles.sectionTitle}>Daftar Transaksi</h2>
                <div className={styles.searchBar}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Cari transaksi"
                    className={styles.searchInput}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              <div className={styles.tableContainer}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>ID Transaksi</th>
                      <th>Tanggal</th>
                      <th>Nama Ruangan</th>
                      <th>Penyewa</th>
                      <th>Status</th>
                      <th>Total Bayar</th>
                      <th>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((transaction: Transaction) => (
                      <tr key={transaction.id}>
                        <td className={styles.transactionId}>{transaction.id}</td>
                        <td>{transaction.date}</td>
                        <td>{transaction.roomName}</td>
                        <td>{transaction.renter}</td>
                        <td>
                          <span className={`${styles.status} ${getStatusClass(transaction.payment.status || 'pending')}`}>
                            {getStatusLabel(transaction.payment.status || 'pending')}
                          </span>
                        </td>
                        <td>{formatCurrency(transaction.payment.amount)}</td>
                        <td>
                          <button
                            type="button"
                            className={styles.btnView}
                            onClick={() => {
                              setSelectedTransaction(transaction)
                              setIsOverlayOpen(true)
                            }}
                          >
                            Lihat detail
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Detail Transaction Overlay */}
      <DetailsTransactionReportOverlay
        isOpen={isOverlayOpen}
        onClose={() => {
          setIsOverlayOpen(false)
          setSelectedTransaction(null)
        }}
        transaction={selectedTransaction}
      />
    </div>
  )
}
