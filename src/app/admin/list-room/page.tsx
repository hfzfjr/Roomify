'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import SidebarAdmin from '@/components/layout/SidebarAdmin'
import DetailListRoomOverlay from '@/components/ui/overlay/admin/DetailListRoomOverlay'
import DeleteRoomOverlay from '@/components/ui/overlay/admin/DeleteRoomOverlay'
import ConfirmChangeStatusOverlay from '@/components/ui/overlay/admin/ConfirmChangeStatusOverlay'
import { useUser } from '@/hooks/useUser'
import styles from './page.module.css'

type Room = {
  id: string
  name: string
  owner: string
  type: string
  capacity: number
  status: 'aktif' | 'nonaktif' | 'suspend'
}

type SortKey = 'id' | 'name' | 'owner' | 'type' | 'capacity' | 'status'
const ROOM_TYPES = ['Meeting Room', 'Studio']

export default function ListRoomPage() {
  const user = useUser()
  const searchParams = useSearchParams()
  const ownerId = searchParams.get('owner_id')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const sidebarRef = useRef<HTMLElement | null>(null)
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null)
  const [isOverlayOpen, setIsOverlayOpen] = useState(false)
  const [isDeleteOverlayOpen, setIsDeleteOverlayOpen] = useState(false)
  const [roomToDelete, setRoomToDelete] = useState<Room | null>(null)
  const [isStatusOverlayOpen, setIsStatusOverlayOpen] = useState(false)
  const [roomToChangeStatus, setRoomToChangeStatus] = useState<Room | null>(null)
  const [sortKey, setSortKey] = useState<SortKey>('id')
  const [showSortDropdown, setShowSortDropdown] = useState(false)
  const [selectedTypes, setSelectedTypes] = useState<string[]>([])
  const [searchOwner, setSearchOwner] = useState('')
  const [rooms, setRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRooms()
  }, [ownerId])

  const fetchRooms = async () => {
    try {
      setLoading(true)
      const url = ownerId ? `/api/admin/rooms?owner_id=${ownerId}` : '/api/admin/rooms'
      const response = await fetch(url)
      const result = await response.json()

      if (result.success) {
        setRooms(result.data)
      } else {
        console.error('Failed to fetch rooms:', result.message)
      }
    } catch (error) {
      console.error('Error fetching rooms:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleType = (type: string) => {
    setSelectedTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    )
  }

  const handleViewDetail = (room: Room) => {
    setSelectedRoom(room)
    setIsOverlayOpen(true)
  }

  const handleCloseOverlay = () => {
    setIsOverlayOpen(false)
    setSelectedRoom(null)
  }

  const handleDeleteFromOverlay = () => {
    if (selectedRoom) {
      setRoomToDelete(selectedRoom)
      setIsDeleteOverlayOpen(true)
      setIsOverlayOpen(false)
    }
  }

  const handleDelete = (room: Room) => {
    setRoomToDelete(room)
    setIsDeleteOverlayOpen(true)
  }

  const handleCloseDeleteOverlay = () => {
    setIsDeleteOverlayOpen(false)
    setRoomToDelete(null)
  }

  const handleConfirmDelete = async () => {
    if (!roomToDelete) return

    try {
      const response = await fetch(`/api/admin/rooms/${roomToDelete.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_deleted: true })
      })

      const result = await response.json()

      if (result.success) {
        setRooms(prev => prev.filter(r => r.id !== roomToDelete.id))
        handleCloseDeleteOverlay()
      } else {
        alert('Gagal menghapus ruangan: ' + result.message)
      }
    } catch (error) {
      console.error('Error deleting room:', error)
      alert('Gagal menghapus ruangan')
    }
  }

  const handleStatusClick = (room: Room) => {
    setRoomToChangeStatus(room)
    setIsStatusOverlayOpen(true)
  }

  const handleCloseStatusOverlay = () => {
    setIsStatusOverlayOpen(false)
    setRoomToChangeStatus(null)
  }

  const handleConfirmStatusChange = async () => {
    if (!roomToChangeStatus) return

    const newStatus = roomToChangeStatus.status === 'suspend' ? 'aktif' : 'suspend'

    try {
      const response = await fetch(`/api/admin/rooms/${roomToChangeStatus.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })

      const result = await response.json()

      if (result.success) {
        setRooms(prev => prev.map(r =>
          r.id === roomToChangeStatus.id ? { ...r, status: newStatus } : r
        ))
        handleCloseStatusOverlay()
      } else {
        alert('Gagal mengubah status ruangan: ' + result.message)
      }
    } catch (error) {
      console.error('Error changing room status:', error)
      alert('Gagal mengubah status ruangan')
    }
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
    return [...rooms]
      .filter(r =>
        (selectedTypes.length === 0 || selectedTypes.includes(r.type)) &&
        (q === '' || r.owner.toLowerCase().includes(q) || r.id.toLowerCase().includes(q) || r.name.toLowerCase().includes(q))
      )
      .sort((a, b) => {
        if (sortKey === 'capacity') return a.capacity - b.capacity
        return String(a[sortKey]).localeCompare(String(b[sortKey]))
      })
  }, [sortKey, selectedTypes, searchOwner, rooms])

  const currentSortLabel = sortOptions.find(o => o.key === sortKey)?.label ?? 'ID Ruangan'

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
          <span className={styles.mobileTopbarTitle}>Daftar Ruangan</span>
        </div>

        <div className={styles.container}>
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
                    placeholder="Cari Ruangan"
                    value={searchOwner}
                    onChange={e => setSearchOwner(e.target.value)}
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
                      <th>ID Ruangan</th>
                      <th>Nama Ruangan</th>
                      <th>Nama Owner</th>
                      <th>Jenis Ruangan</th>
                      <th>Kapasitas</th>
                      <th>Status</th>
                      <th>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={7} style={{ textAlign: 'center', padding: '40px' }}>Loading...</td>
                      </tr>
                    ) : filteredRooms.length === 0 ? (
                      <tr>
                        <td colSpan={7} style={{ textAlign: 'center', padding: '40px' }}>Tidak ada ruangan yang ditemukan</td>
                      </tr>
                    ) : (
                      filteredRooms.map(room => (
                        <tr key={room.id}>
                          <td className={styles.cellId}>{room.id}</td>
                          <td className={styles.cellName}>{room.name}</td>
                          <td className={styles.cellOwner}>{room.owner}</td>
                          <td className={styles.cellType}>{room.type}</td>
                          <td className={styles.cellCapacity}>
                            <span className={styles.capacityCell}>
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{ verticalAlign: 'middle', marginRight: 4 }}>
                                <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
                              </svg>
                              {room.capacity}
                            </span>
                          </td>
                          <td>
                            <span
                              className={`${styles.statusBadge} ${room.status === 'aktif' ? styles.statusActive :
                                room.status === 'suspend' ? styles.statusSuspended :
                                  styles.statusInactive
                                }`}
                              style={{ cursor: 'pointer' }}
                              onClick={() => handleStatusClick(room)}
                            >
                              {room.status}
                            </span>
                          </td>
                          <td>
                            <div className={styles.actionButtons}>
                              <button type="button" className={styles.btnView} onClick={() => handleViewDetail(room)}>
                                Lihat detail
                              </button>
                              <button type="button" className={styles.btnDelete} onClick={() => handleDelete(room)}>
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
      <DetailListRoomOverlay
        room={selectedRoom}
        isOpen={isOverlayOpen}
        onClose={handleCloseOverlay}
        onDelete={handleDeleteFromOverlay}
      />

      {/* Delete Overlay */}
      {roomToDelete && (
        <DeleteRoomOverlay
          roomName={roomToDelete.name}
          onConfirm={handleConfirmDelete}
          onCancel={handleCloseDeleteOverlay}
        />
      )}

      {/* Status Change Overlay */}
      {roomToChangeStatus && (
        <ConfirmChangeStatusOverlay
          roomName={roomToChangeStatus.name}
          roomId={roomToChangeStatus.id}
          currentStatus={roomToChangeStatus.status}
          newStatus={roomToChangeStatus.status === 'suspend' ? 'aktif' : 'suspend'}
          onConfirm={handleConfirmStatusChange}
          onCancel={handleCloseStatusOverlay}
        />
      )}
    </div>
  )
}
