'use client'

import { useState } from 'react'
import styles from './page.module.css'

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
    {
      id: '#TR-KSD234DFGI',
      date: '19/05/2026',
      roomName: 'Ruang ABCD',
      renter: 'Bahlil Gemach',
      status: 'lunas'
    },
    {
      id: '#TR-KSD234DFGJ',
      date: '18/05/2026',
      roomName: 'Ruang EFGH',
      renter: 'John Doe',
      status: 'batal'
    },
    {
      id: '#TR-KSD234DFGK',
      date: '17/05/2026',
      roomName: 'Ruang IJKL',
      renter: 'Jane Smith',
      status: 'lunas'
    },
    {
      id: '#TR-KSD234DFGL',
      date: '16/05/2026',
      roomName: 'Ruang MNOP',
      renter: 'Bob Johnson',
      status: 'pending'
    },
    {
      id: '#TR-KSD234DFGM',
      date: '15/05/2026',
      roomName: 'Ruang QRST',
      renter: 'Alice Williams',
      status: 'lunas'
    }
  ]

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'lunas':
        return styles.statusLunas
      case 'batal':
        return styles.statusBatal
      case 'pending':
        return styles.statusPending
      default:
        return ''
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'lunas':
        return 'Lunas'
      case 'batal':
        return 'Batal'
      case 'pending':
        return 'Pending'
      default:
        return status
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button className={styles.backButton}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>
        <h1>Laporan Transaksi</h1>
      </div>

      <div className={styles.summarySection}>
        <h2 className={styles.summaryTitle}>Ringkasan Pendapatan Keseluruhan</h2>
        <p className={styles.summarySubtitle}>Pantau performa bisnis Anda dengan analisis pendapatan yang komprehensif</p>
        
        <div className={styles.summaryCards}>
          <div className={`${styles.summaryCard} ${styles.highlightCard}`}>
            <div className={styles.cardHeader}>
              <span className={styles.cardLabel}>Total Pendapatan</span>
              <div className={styles.cardIcon}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              </div>
            </div>
            <p className={styles.cardValue}>Rp 14.500.000,00</p>
            <div className={styles.cardTrend}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                <polyline points="17 6 23 6 23 12" />
              </svg>
              <span className={styles.trendPositive}>+15%</span>
              <span className={styles.trendLabel}>dari bulan lalu</span>
            </div>
          </div>

          <div className={styles.summaryCard}>
            <div className={styles.cardHeader}>
              <span className={styles.cardLabel}>Transaksi Berhasil</span>
              <div className={styles.cardIcon}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
            </div>
            <p className={styles.cardValue}>54 Transaksi</p>
            <div className={styles.cardTrend}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                <polyline points="17 6 23 6 23 12" />
              </svg>
              <span className={styles.trendPositive}>+15%</span>
              <span className={styles.trendLabel}>dari bulan lalu</span>
            </div>
          </div>

          <div className={styles.summaryCard}>
            <div className={styles.cardHeader}>
              <span className={styles.cardLabel}>Transaksi Gagal</span>
              <div className={styles.cardIcon}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                </svg>
              </div>
            </div>
            <p className={styles.cardValue}>54 Transaksi</p>
            <div className={styles.cardTrend}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                <polyline points="17 6 23 6 23 12" />
              </svg>
              <span className={styles.trendPositive}>+15%</span>
              <span className={styles.trendLabel}>dari bulan lalu</span>
            </div>
          </div>

          <div className={styles.summaryCard}>
            <div className={styles.cardHeader}>
              <span className={styles.cardLabel}>Proses Pembayaran</span>
              <div className={styles.cardIcon}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
            </div>
            <p className={styles.cardValue}>54 Transaksi</p>
            <div className={styles.cardTrend}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                <polyline points="17 6 23 6 23 12" />
              </svg>
              <span className={styles.trendPositive}>+15%</span>
              <span className={styles.trendLabel}>dari bulan lalu</span>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.filterSection}>
        <div className={styles.filterGroup}>
          <label htmlFor="periodFilter">Filter Periode</label>
          <select
            id="periodFilter"
            className={styles.select}
            value={periodFilter}
            onChange={(e) => setPeriodFilter(e.target.value)}
          >
            <option value="7">7 hari</option>
            <option value="30">30 hari</option>
            <option value="90">90 hari</option>
            <option value="365">1 tahun</option>
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label htmlFor="roomFilter">Ruangan</label>
          <select
            id="roomFilter"
            className={styles.select}
            value={roomFilter}
            onChange={(e) => setRoomFilter(e.target.value)}
          >
            <option value="all">Semua</option>
            <option value="ruang1">Ruang ABCD</option>
            <option value="ruang2">Ruang EFGH</option>
            <option value="ruang3">Ruang IJKL</option>
          </select>
        </div>
      </div>

      <div className={styles.transactionListSection}>
        <h2 className={styles.sectionTitle}>Daftar Transaksi</h2>
        
        <div className={styles.searchBar}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
              {transactions.map((transaction) => (
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
  )
}