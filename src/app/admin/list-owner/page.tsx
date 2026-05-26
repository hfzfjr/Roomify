'use client'

import { useState, useMemo } from 'react'
import BackButton from '@/components/ui/BackButton'
import styles from './page.module.css'

interface Owner {
  id: string
  businessName: string
  ownerName: string
  status: 'Aktif' | 'Tidak aktif' | 'Pending'
}

type SortKey = 'id' | 'businessName' | 'ownerName' | 'status'

export default function ListOwnerPage() {
  const [owners, setOwners] = useState<Owner[]>([
    { id: '#OW-KSD234DFGI', businessName: 'Bisnis Orang Kaya', ownerName: 'Prabowo Subianto', status: 'Aktif' },
    { id: '#OW-KSD234DFGJ', businessName: 'Hotel Grand Bandung', ownerName: 'Siti Rahayu', status: 'Tidak aktif' },
    { id: '#OW-KSD234DFGK', businessName: 'Villa Indah Sejahtera', ownerName: 'Budi Santoso', status: 'Aktif' },
    { id: '#OW-KSD234DFGL', businessName: 'Apartemen City View', ownerName: 'Ahmad Wijaya', status: 'Tidak aktif' },
    { id: '#OW-KSD234DFGM', businessName: 'Guest House Merdeka', ownerName: 'Dewi Lestari', status: 'Aktif' },
    { id: '#OW-KSD234DFGN', businessName: 'Kost Premium Dago', ownerName: 'Rina Marlina', status: 'Tidak aktif' },
    { id: '#OW-KSD234DFGO', businessName: 'Penginapan Surya', ownerName: 'Joko Susilo', status: 'Aktif' },
  ])

  const [searchQuery, setSearchQuery] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('id')

  const handleDelete = (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus pemilik ini?')) {
      setOwners(owners.filter(owner => owner.id !== id))
    }
  }

  const handleViewDetail = (id: string) => {
    console.log('View detail for:', id)
  }

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'Aktif':
        return styles.statusActive
      case 'Tidak aktif':
        return styles.statusInactive
      case 'Pending':
        return styles.statusPending
      default:
        return ''
    }
  }

  const filteredAndSorted = useMemo(() => {
    const q = searchQuery.toLowerCase()
    const filtered = owners.filter(o =>
      o.id.toLowerCase().includes(q) ||
      o.businessName.toLowerCase().includes(q) ||
      o.ownerName.toLowerCase().includes(q) ||
      o.status.toLowerCase().includes(q)
    )
    return [...filtered].sort((a, b) =>
      a[sortKey].localeCompare(b[sortKey])
    )
  }, [owners, searchQuery, sortKey])

  return (
    <>
      <BackButton href="/admin/dashboard" title="Daftar Owner" />
      <div className={styles.container}>
        <div className={styles.mainContent}>

          {/* Header Card */}
          <div className={styles.headerCard}>
            <h2>Manajemen Owner</h2>
            <p>Daftar seluruh pemilik ruangan yang terdaftar di dalam sistem aplikasi</p>
          </div>

          {/* Sort Row */}
          <div className={styles.sortRow}>
            <span className={styles.sortLabel}>Urutkan Berdasarkan:</span>
            <div className={styles.sortSelectWrapper}>
              <span className={styles.sortArrow}>↑</span>
              <select
                className={styles.sortSelect}
                value={sortKey}
                onChange={(e) => setSortKey(e.target.value as SortKey)}
              >
                <option value="id">ID Owner</option>
                <option value="businessName">Nama Bisnis</option>
                <option value="ownerName">Nama Owner</option>
                <option value="status">Status</option>
              </select>
            </div>
          </div>

          {/* Table Card */}
          <div className={styles.tableCard}>
            <div className={styles.tableCardHeader}>
              <h3>Daftar Owner</h3>
              <div className={styles.searchWrapper}>
                <input
                  type="text"
                  className={styles.searchInput}
                  placeholder="Cari owner"
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
                    <th>ID Owner</th>
                    <th>Nama Bisnis</th>
                    <th>Nama Owner</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAndSorted.map((owner) => (
                    <tr key={owner.id}>
                      <td className={styles.ownerId}>{owner.id}</td>
                      <td className={styles.ownerBusiness}>{owner.businessName}</td>
                      <td className={styles.ownerName}>{owner.ownerName}</td>
                      <td>
                        <span className={`${styles.statusBadge} ${getStatusClass(owner.status)}`}>
                          {owner.status}
                        </span>
                      </td>
                      <td>
                        <div className={styles.actionButtons}>
                          <button
                            type="button"
                            className={styles.btnView}
                            onClick={() => handleViewDetail(owner.id)}
                          >
                            Lihat detail
                          </button>
                          <button
                            type="button"
                            className={styles.btnDelete}
                            onClick={() => handleDelete(owner.id)}
                          >
                            Hapus
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredAndSorted.length === 0 && (
              <div className={styles.emptyState}>
                <p>Tidak ada data pemilik yang ditemukan</p>
              </div>
            )}
          </div>

        </div>
      </div>
    </>
  )
}
