'use client'

import { useState } from 'react'
import styles from './page.module.css'
import BackButton from '@/components/ui/BackButton'

type Transaction = {
  id: string
  date: string
  roomName: string
  renter: string
  status: 'lunas' | 'batal' | 'pending'
}

export default function OwnerReports() {
  const [searchTerm, setSearchTerm] = useState('')
  const [periodFilter, setPeriodFilter] = useState('30')
  const [roomFilter, setRoomFilter] = useState('all')

  const transactions: Transaction[] = [
    { id: '#TR-KSD234DFGI', date: '19/05/2026', roomName: 'Ruang ABCD', renter: 'Bahlil Gemach', status: 'lunas' },
    { id: '#TR-KSD234DFGJ', date: '18/05/2026', roomName: 'Ruang EFGH', renter: 'John Doe', status: 'batal' },
    { id: '#TR-KSD234DFGK', date: '17/05/2026', roomName: 'Ruang IJKL', renter: 'Jane Smith', status: 'lunas' },
    { id: '#TR-KSD234DFGL', date: '16/05/2026', roomName: 'Ruang MNOP', renter: 'Bob Johnson', status: 'pending' },
    { id: '#TR-KSD234DFGM', date: '15/05/2026', roomName: 'Ruang QRST', renter: 'Alice Williams', status: 'lunas' },
  ]

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'lunas': return styles.statusLunas
      case 'batal': return styles.statusBatal
      case 'pending': return styles.statusPending
      default: return ''
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'lunas': return 'Lunas'
      case 'batal': return 'Batal'
      case 'pending': return 'Pending'
      default: return status
    }
  }

  const filtered = transactions.filter((t) =>
    t.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.roomName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.renter.toLowerCase().includes(searchTerm.toLowerCase())
  )

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
            <p className={styles.cardValue}>Rp 14.500.000,00</p>
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
            <p className={styles.cardValue}>54<br /><span style={{ fontSize: '14px', fontWeight: 600, color: '#64748b' }}>Transaksi</span></p>
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
            <p className={styles.cardValue}>54<br /><span style={{ fontSize: '14px', fontWeight: 600, color: '#64748b' }}>Transaksi</span></p>
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
            <p className={styles.cardValue}>54<br /><span style={{ fontSize: '14px', fontWeight: 600, color: '#64748b' }}>Transaksi</span></p>
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
            <option value="ruang1">Ruang ABCD</option>
            <option value="ruang2">Ruang EFGH</option>
            <option value="ruang3">Ruang IJKL</option>
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
                </tr>
              </thead>
              <tbody>
                {filtered.map((transaction) => (
                  <tr key={transaction.id}>
                    <td className={styles.transactionId}>{transaction.id}</td>
                    <td>{transaction.date}</td>
                    <td>{transaction.roomName}</td>
                    <td>{transaction.renter}</td>
                    <td>
                      <span className={`${styles.status} ${getStatusClass(transaction.status)}`}>
                        {getStatusLabel(transaction.status)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  )
}
