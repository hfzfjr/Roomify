'use client'

import { useState, useMemo } from 'react'
import BackButton from '@/components/ui/BackButton'
import styles from './page.module.css'

type Room = {
  id: string
  name: string
  owner: string
  type: string
  capacity: number
  status: 'Aktif' | 'Tidak aktif'
}

const mockRooms: Room[] = [
  { id: '#RM-12DFGI', name: 'Ruang Kubangkuul', owner: 'Prabowo Subianto', type: 'Meeting Room', capacity: 5, status: 'Aktif' },
  { id: '#RM-12DFGJ', name: 'Ruang Kubangkuul', owner: 'Prabowo Subianto', type: 'Meeting Room', capacity: 5, status: 'Tidak aktif' },
  { id: '#RM-12DFGK', name: 'Ruang Kubangkuul', owner: 'Prabowo Subianto', type: 'Meeting Room', capacity: 5, status: 'Aktif' },
  { id: '#RM-12DFGL', name: 'Ruang Kubangkuul', owner: 'Prabowo Subianto', type: 'Studio', capacity: 5, status: 'Aktif' },
  { id: '#RM-12DFGM', name: 'Ruang Kubangkuul', owner: 'Prabowo Subianto', type: 'Studio', capacity: 5, status: 'Tidak aktif' },
  { id: '#RM-12DFGN', name: 'Ruang Kubangkuul', owner: 'Prabowo Subianto', type: 'Meeting Room', capacity: 5, status: 'Aktif' },
  { id: '#RM-12DFGO', name: 'Ruang Kubangkuul', owner: 'Prabowo Subianto', type: 'Studio', capacity: 5, status: 'Aktif' },
]

type SortKey = 'id' | 'name' | 'owner' | 'type' | 'capacity' | 'status'
const ROOM_TYPES = ['Meeting Room', 'Studio']

export default function ListRoomPage() {
  const [sortKey, setSortKey] = useState<SortKey>('id')
  const [showSortDropdown, setShowSortDropdown] = useState(false)
  const [selectedTypes, setSelectedTypes] = useState<string[]>(['Meeting Room', 'Studio'])
  const [searchOwner, setSearchOwner] = useState('')

  const toggleType = (type: string) => {
    setSelectedTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    )
  }

  const sortOptions: { key: SortKey; label: string }[] = [
    { key: 'id', label: 'ID Ruangan' },
    { key: 'name', label: 'Nama Ruangan' },
    { key: 'owner', label: 'Nama Owner' },
    { key: 'type', label: 'Jenis Ruangan' },
    { key: 'capacity', label: 'Kapasitas' },
    { key: 'status', label: 'Status' },
  ]

  const filteredRooms = useMemo(() => {
    const q = searchOwner.toLowerCase()
    return [...mockRooms]
      .filter(r =>
        (selectedTypes.length === 0 || selectedTypes.includes(r.type)) &&
        (q === '' || r.owner.toLowerCase().includes(q) || r.id.toLowerCase().includes(q) || r.name.toLowerCase().includes(q))
      )
      .sort((a, b) => {
        if (sortKey === 'capacity') return a.capacity - b.capacity
        return String(a[sortKey]).localeCompare(String(b[sortKey]))
      })
  }, [sortKey, selectedTypes, searchOwner])

  const currentSortLabel = sortOptions.find(o => o.key === sortKey)?.label ?? 'ID Ruangan'

  return (
    <div className={styles.container}>
      <BackButton href="/admin/dashboard" title="Daftar Ruangan" />

      <div className={styles.content}>
        {/* Header Card */}
        <div className={styles.headerCard}>
          <h2>Manajemen Ruangan</h2>
          <p>Daftar seluruh ruangan yang terdaftar di dalam sistem aplikasi</p>
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

          {/* Type Filter Pills */}
          <div className={styles.filterGroup}>
            <span className={styles.filterLabel}>Ruangan:</span>
            <div className={styles.typePills}>
              {ROOM_TYPES.map(type => (
                <button
                  key={type}
                  type="button"
                  className={`${styles.typePill} ${selectedTypes.includes(type) ? styles.typePillActive : ''}`}
                  onClick={() => toggleType(type)}
                >
                  {type}
                  {selectedTypes.includes(type) && <span className={styles.pillX}>×</span>}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Table Card */}
        <div className={styles.tableCard}>
          <div className={styles.tableCardHeader}>
            <h3>Daftar Ruangan</h3>
            <div className={styles.searchWrapper}>
              <input
                type="text"
                className={styles.searchInput}
                placeholder="Cari owner"
                value={searchOwner}
                onChange={e => setSearchOwner(e.target.value)}
              />
              <span className={styles.searchIcon}>🔍</span>
            </div>
          </div>

          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>ID Ruangan</th>
                  <th>Nama Ruangan</th>
                  <th>Nama Owner</th>
                  <th>Jenis Ruangan</th>
                  <th>Kapasitas</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filteredRooms.map(room => (
                  <tr key={room.id}>
                    <td className={styles.cellId}>{room.id}</td>
                    <td className={styles.cellName}>{room.name}</td>
                    <td className={styles.cellOwner}>{room.owner}</td>
                    <td className={styles.cellType}>{room.type}</td>
                    <td className={styles.cellCapacity}>
                      <span className={styles.capacityCell}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{verticalAlign:'middle', marginRight:4}}>
                          <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
                        </svg>
                        {room.capacity}
                      </span>
                    </td>
                    <td>
                      <span className={`${styles.statusBadge} ${room.status === 'Aktif' ? styles.statusActive : styles.statusInactive}`}>
                        {room.status}
                      </span>
                    </td>
                    <td>
                      <div className={styles.actionButtons}>
                        <button type="button" className={styles.btnView} onClick={() => console.log('detail', room.id)}>
                          Lihat detail
                        </button>
                        <button type="button" className={styles.btnDelete} onClick={() => console.log('delete', room.id)}>
                          Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredRooms.length === 0 && (
            <div className={styles.emptyState}>
              <p>Tidak ada ruangan yang ditemukan</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
