'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import SidebarAdmin from '@/components/layout/SidebarAdmin'
import DetailListOwnerOverlay from '@/components/ui/overlay/admin/DetailListOwnerOverlay'
import DeleteOwnerOverlay from '@/components/ui/overlay/admin/DeleteOwnerOverlay'
import { useUser } from '@/hooks/useUser'
import styles from './page.module.css'

interface Owner {
  id: string
  businessName: string
  ownerName: string
  status: 'Aktif' | 'Tidak aktif'
  email: string
  phone: string
  joinedDate: string
  totalRooms: number
  totalReports: number
}

type SortKey = 'id' | 'businessName' | 'ownerName' | 'status'

export default function ListOwnerPage() {
  const user = useUser()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const sidebarRef = useRef<HTMLElement | null>(null)
  const [owners, setOwners] = useState<Owner[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('id')
  const [isOverlayOpen, setIsOverlayOpen] = useState(false)
  const [selectedOwner, setSelectedOwner] = useState<Owner | null>(null)
  const [isDeleteOverlayOpen, setIsDeleteOverlayOpen] = useState(false)
  const [ownerToDelete, setOwnerToDelete] = useState<Owner | null>(null)

  useEffect(() => {
    fetchOwners()
  }, [])

  const fetchOwners = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/owners')
      const result = await response.json()

      if (result.success) {
        setOwners(result.data)
      } else {
        console.error('Failed to fetch owners:', result.message)
      }
    } catch (error) {
      console.error('Error fetching owners:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = (owner: Owner) => {
    setOwnerToDelete(owner)
    setIsDeleteOverlayOpen(true)
  }

  const handleCloseDeleteOverlay = () => {
    setIsDeleteOverlayOpen(false)
    setOwnerToDelete(null)
  }

  const handleConfirmDelete = async () => {
    if (!ownerToDelete) return

    try {
      const response = await fetch(`/api/admin/owners/${ownerToDelete.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_deleted: true })
      })

      const result = await response.json()

      if (result.success) {
        setOwners(prev => prev.filter(o => o.id !== ownerToDelete.id))
        handleCloseDeleteOverlay()
        setIsOverlayOpen(false)
      } else {
        alert('Gagal menghapus owner: ' + result.message)
      }
    } catch (error) {
      console.error('Error deleting owner:', error)
      alert('Gagal menghapus owner')
    }
  }

  const handleViewDetail = (id: string) => {
    const owner = owners.find(o => o.id === id)
    if (owner) {
      setSelectedOwner(owner)
      setIsOverlayOpen(true)
    }
  }

  const handleOverlayDelete = () => {
    if (selectedOwner) {
      handleDelete(selectedOwner)
    }
  }

  const handleViewRooms = () => {
    console.log('View rooms for owner:', selectedOwner?.id)
    // TODO: Navigate to room list page for this owner
  }

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'Aktif':
        return styles.statusActive
      case 'Tidak aktif':
        return styles.statusInactive
      default:
        return ''
    }
  }

  const filteredAndSorted = useMemo(() => {
    const q = searchQuery.toLowerCase()
    const filtered = owners.filter(o =>
      o.status === 'Aktif' &&
      (o.id.toLowerCase().includes(q) ||
        o.businessName.toLowerCase().includes(q) ||
        o.ownerName.toLowerCase().includes(q) ||
        o.status.toLowerCase().includes(q))
    )
    return [...filtered].sort((a, b) =>
      a[sortKey].localeCompare(b[sortKey])
    )
  }, [owners, searchQuery, sortKey])

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
          <span className={styles.mobileTopbarTitle}>Daftar Owner</span>
        </div>

        <div className={styles.container}>
          <div className={styles.content}>

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
                    placeholder="Cari Owner"
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
                      <th>ID Owner</th>
                      <th>Nama Bisnis</th>
                      <th>Nama Owner</th>
                      <th>Status</th>
                      <th>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={5} style={{ textAlign: 'center', padding: '40px' }}>Loading...</td>
                      </tr>
                    ) : filteredAndSorted.length === 0 ? (
                      <tr>
                        <td colSpan={5} style={{ textAlign: 'center', padding: '40px' }}>Tidak ada data pemilik yang ditemukan</td>
                      </tr>
                    ) : (
                      filteredAndSorted.map((owner) => (
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
                                onClick={() => handleDelete(owner)}
                              >
                                Hapus
                              </button>
                            </div>
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

      {/* Detail Overlay */}
      <DetailListOwnerOverlay
        isOpen={isOverlayOpen}
        onClose={() => setIsOverlayOpen(false)}
        owner={selectedOwner}
        onDelete={handleOverlayDelete}
        onViewRooms={handleViewRooms}
      />

      {/* Delete Overlay */}
      {ownerToDelete && (
        <DeleteOwnerOverlay
          ownerName={ownerToDelete.businessName}
          onConfirm={handleConfirmDelete}
          onCancel={handleCloseDeleteOverlay}
        />
      )}
    </div>
  )
}
