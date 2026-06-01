'use client'

import { useEffect, useRef, useState, useMemo, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Room } from '@/types'
import { formatRupiah } from '@/utils/formatRupiah'
import { formatFacilityName } from '@/utils/text-helper'
import { getLocationOptionLabel, getLocationOptionSubtitle, getLocationQueryValue, getLocationSearchText, type Location } from '@/utils/locations'
import BackButton from '@/components/ui/BackButton'
import RoomSearchFilters from '@/components/rooms/RoomSearchFilters'
import '@/styles/rooms.css'


const RATING_OPTIONS = [
  { label: '5', value: 5 },
  { label: '4', value: 4 },
  { label: '3', value: 3 }
]

function CustomerRooms() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // Hide global navbar for this page (same approach as payments page)
  useEffect(() => {
    // document.body.classList.add('hide-global-navbar')
    return () => {
      // document.body.classList.remove('hide-global-navbar')
    }
  }, [])
  
  // Read URL query params for initial filter state
  const urlProvinceId = searchParams.get('province_id')
  const urlRegionId = searchParams.get('region_id')
  const urlLocation = searchParams.get('location')
  const urlType = searchParams.get('type')
  const urlDate = searchParams.get('date')
  const urlCapacity = searchParams.get('capacity')
  
  const [rooms, setRooms] = useState<Room[]>([])
  const [filteredRooms, setFilteredRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  
  
  // Applied search states (sudah diterapkan setelah klik cari)
  // Initialize with URL params if provided (mark as already applied)
  const [appliedLocation, setAppliedLocation] = useState<Location | null>(null)
  const [appliedType, setAppliedType] = useState(urlType || '')
  const [appliedDate, setAppliedDate] = useState(urlDate || '')
  const [appliedCapacity, setAppliedCapacity] = useState(urlCapacity || '')
  
  // Filter states
  const [selectedFacilities, setSelectedFacilities] = useState<string[]>([''])
  const [selectedRatings, setSelectedRatings] = useState<number[]>([])
  const [sortBy, setSortBy] = useState<'price_asc' | 'price_desc' | 'rating'>('price_asc')
  
  // Room ratings data from database
  const [roomRatings, setRoomRatings] = useState<Record<string, { rating: number; reviewCount: number }>>({})
  
  // Flag to track if URL params have been applied (only apply once on load)
  const [urlParamsApplied, setUrlParamsApplied] = useState(false)
  
  // Store location text for text-based filtering
  const [appliedLocationText, setAppliedLocationText] = useState(urlLocation || '')
  
  const sortDropdownRef = useRef<HTMLDivElement | null>(null)
  const sortTriggerRef = useRef<HTMLButtonElement | null>(null)
  
  // Sort dropdown state
  const [showSortDropdown, setShowSortDropdown] = useState(false)
  
  // Show all facilities toggle
  const [showAllFacilities, setShowAllFacilities] = useState(false)
  

  // Dynamic facility options from available rooms
  const dynamicFacilityOptions = useMemo(() => {
    const allFacilities = new Set<string>()
    rooms.forEach(room => {
      room.facilities?.forEach(f => allFacilities.add(f))
    })
    const facilities = Array.from(allFacilities).sort()
    return [{ label: 'Semua', value: '' }, ...facilities.map(f => ({ label: formatFacilityName(f), value: f }))]
  }, [rooms])

  // Load initial data
  useEffect(() => {
    const stored = localStorage.getItem('user')
    if (!stored) {
      router.push('/auth/login')
      return
    }
    let isMounted = true

    async function loadData() {
      try {
        const roomsRes = await fetch('/api/rooms')
        const roomsJson = await roomsRes.json()

        if (!isMounted) return

        if (roomsJson.success) {
          const roomsData = roomsJson.data ?? []
          setRooms(roomsData)
          setFilteredRooms(roomsData)
          
          // Fetch ratings for each room
          await fetchRoomRatings(roomsData)
        }
      } catch {
        if (isMounted) {
          setError('Gagal memuat data.')
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    async function fetchRoomRatings(roomsData: Room[]) {
      try {
        const ratings: Record<string, { rating: number; reviewCount: number }> = {}
        
        await Promise.all(
          roomsData.map(async (room) => {
            try {
              const res = await fetch(`/api/reviews?room_id=${room.room_id}`)
              const data = await res.json()
              if (data.success && data.data?.length > 0) {
                const reviews = data.data
                const avgRating = reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviews.length
                ratings[room.room_id] = {
                  rating: Math.round(avgRating * 10) / 10,
                  reviewCount: reviews.length
                }
              } else {
                ratings[room.room_id] = { rating: 0, reviewCount: 0 }
              }
            } catch {
              ratings[room.room_id] = { rating: 0, reviewCount: 0 }
            }
          })
        )
        
        if (isMounted) {
          setRoomRatings(ratings)
        }
      } catch {
        // Silent fail
      }
    }

    void loadData()

    return () => {
      isMounted = false
    }
  }, [router])


  // Click outside handler for sort dropdown
  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node
      
      if (
        showSortDropdown &&
        sortDropdownRef.current &&
        !sortDropdownRef.current.contains(target) &&
        sortTriggerRef.current &&
        !sortTriggerRef.current.contains(target)
      ) {
        setShowSortDropdown(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [showSortDropdown])

  // Apply filters and sorting (hanya sidebar filters dan sort)
  useEffect(() => {
    let result = [...rooms]

    // Filter by applied search criteria (hanya setelah klik Cari)
    if (appliedType) {
      result = result.filter(room => room.type === appliedType)
    }
    
    if (appliedCapacity) {
      const capacityNum = parseInt(appliedCapacity)
      result = result.filter(room => room.capacity >= capacityNum)
    }

    // Location filter - hanya diterapkan setelah klik Cari
    // Mencari di location, region, dan province
    if (appliedLocation) {
      const locationQuery = getLocationQueryValue(appliedLocation).toLowerCase()
      result = result.filter(room => {
        const locationMatch = room.location.toLowerCase().includes(locationQuery)
        const regionMatch = room.region?.toLowerCase().includes(locationQuery) || false
        const provinceMatch = room.province?.toLowerCase().includes(locationQuery) || false
        return locationMatch || regionMatch || provinceMatch
      })
    } else if (appliedLocation === null && appliedLocationText && appliedLocationText.trim()) {
      // Jika user mengetik tapi tidak memilih dari dropdown, 
      // dan sudah klik Cari (appliedLocation === null secara eksplisit)
      // Filter berdasarkan text query di location, region, dan province
      const query = appliedLocationText.toLowerCase()
      result = result.filter(room => {
        const locationMatch = room.location.toLowerCase().includes(query)
        const regionMatch = room.region?.toLowerCase().includes(query) || false
        const provinceMatch = room.province?.toLowerCase().includes(query) || false
        return locationMatch || regionMatch || provinceMatch
      })
    }
    // Jika appliedLocation === undefined (belum pernah klik Cari), 
    // jangan filter berdasarkan lokasi

    // Filter by facilities
    if (selectedFacilities.length > 0 && !selectedFacilities.includes('')) {
      result = result.filter(room => 
        selectedFacilities.every(facility => 
          room.facilities?.some(f => f.toLowerCase() === facility.toLowerCase())
        )
      )
    }

    // Filter by rating
    if (selectedRatings.length > 0) {
      result = result.filter(room => {
        const roomRating = roomRatings[room.room_id]?.rating || 0
        // Filter room dengan rating >= minimum selected rating
        const minSelectedRating = Math.min(...selectedRatings)
        return roomRating >= minSelectedRating
      })
    }

    // Sort
    switch (sortBy) {
      case 'price_asc':
        result.sort((a, b) => a.price_per_hour - b.price_per_hour)
        break
      case 'price_desc':
        result.sort((a, b) => b.price_per_hour - a.price_per_hour)
        break
      case 'rating':
        result.sort((a, b) => {
          const ratingA = roomRatings[a.room_id]?.rating || 0
          const ratingB = roomRatings[b.room_id]?.rating || 0
          return ratingB - ratingA
        })
        break
    }

    setFilteredRooms(result)
  }, [rooms, appliedType, appliedCapacity, appliedLocation, appliedLocationText, selectedFacilities, selectedRatings, sortBy, roomRatings])


  function handleFacilityToggle(value: string) {
    if (value === '') {
      setSelectedFacilities([''])
      return
    }
    
    setSelectedFacilities(prev => {
      const newSelection = prev.includes(value)
        ? prev.filter(f => f !== value)
        : [...prev.filter(f => f !== ''), value]
      
      return newSelection.length === 0 ? [''] : newSelection
    })
  }

  function handleRatingToggle(value: number) {
    setSelectedRatings(prev => 
      prev.includes(value) 
        ? prev.filter(r => r !== value)
        : [...prev, value]
    )
  }

  function handleSearch(filters: { location?: Location | null; locationText: string; type: string; date: string; capacity: string }) {
    // Apply search states from RoomSearchFilters component
    setAppliedLocation(filters.location ?? null)
    setAppliedLocationText(filters.locationText)
    setAppliedType(filters.type)
    setAppliedDate(filters.date)
    setAppliedCapacity(filters.capacity)
  }

  const renderSearchBar = () => (
    <div className="rooms-search-section sticky-search">
      <div className="rooms-search-card">
        <div className="rooms-search-bg" aria-hidden="true">
          <div className="rooms-sc-circle rooms-sc-c1" />
          <div className="rooms-sc-circle rooms-sc-c2" />
          <div className="rooms-sc-circle rooms-sc-c3" />
        </div>
        <RoomSearchFilters
          initialLocationQuery={urlLocation || ''}
          initialType={appliedType}
          initialDate={appliedDate}
          initialCapacity={appliedCapacity}
          searchButtonLabel="Cari"
          onSearch={handleSearch}
        />
      </div>
    </div>
  )

  const renderSidebar = () => {
    // Skeleton loading state - show 5 placeholder items
    if (loading) {
      return (
        <aside className="rooms-sidebar">
          <div className="rooms-filter-section">
            <h4>Fasilitas</h4>
            <div className="rooms-filter-list">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="rooms-filter-item rooms-filter-skeleton">
                  <span className="rooms-filter-checkbox skeleton-checkbox" />
                  <span className="rooms-filter-label skeleton-text" />
                </div>
              ))}
            </div>
          </div>

          <div className="rooms-filter-section">
            <h4>Rating</h4>
            <div className="rooms-filter-list">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="rooms-filter-item rooms-filter-skeleton">
                  <span className="rooms-filter-checkbox skeleton-checkbox" />
                  <span className="rooms-filter-label skeleton-text" />
                </div>
              ))}
            </div>
          </div>
        </aside>
      )
    }

    const facilityOptions = dynamicFacilityOptions.length > 1 ? dynamicFacilityOptions : [
      { label: 'Semua', value: '' },
      { label: 'Wi-Fi', value: 'Wi-Fi' },
      { label: 'Proyektor', value: 'Proyektor' },
      { label: 'Soundsystem', value: 'Soundsystem' },
      { label: 'Komputer', value: 'Komputer' },
      { label: 'Whiteboard', value: 'Whiteboard' },
      { label: 'HDMI Cable', value: 'HDMI Cable' }
    ]
    
    // Show max 7 facilities initially (including "Semua")
    const INITIAL_FACILITY_COUNT = 7
    const hasMoreFacilities = facilityOptions.length > INITIAL_FACILITY_COUNT
    const displayedFacilities = showAllFacilities ? facilityOptions : facilityOptions.slice(0, INITIAL_FACILITY_COUNT)
    
    return (
      <aside className="rooms-sidebar">
        <div className="rooms-filter-section">
          <h4>Fasilitas</h4>
          <div className="rooms-filter-list">
            {displayedFacilities.map(facility => (
              <label key={facility.value} className="rooms-filter-item">
                <input
                  type="checkbox"
                  checked={selectedFacilities.includes(facility.value)}
                  onChange={() => handleFacilityToggle(facility.value)}
                />
                <span className="rooms-filter-checkbox">
                  {selectedFacilities.includes(facility.value) && (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 12l5 5L20 7" />
                    </svg>
                  )}
                </span>
                <span className="rooms-filter-label">{facility.label}</span>
              </label>
            ))}
          </div>
          {hasMoreFacilities && (
            <button 
              className="rooms-filter-toggle-btn"
              onClick={() => setShowAllFacilities(!showAllFacilities)}
            >
              {showAllFacilities ? 'Tutup' : 'Lihat selengkapnya'}
            </button>
          )}
        </div>

        <div className="rooms-filter-section">
          <h4>Rating</h4>
          <div className="rooms-filter-list">
            {RATING_OPTIONS.map(rating => (
              <label key={rating.value} className="rooms-filter-item">
                <input
                  type="checkbox"
                  checked={selectedRatings.includes(rating.value)}
                  onChange={() => handleRatingToggle(rating.value)}
                />
                <span className="rooms-filter-checkbox">
                  {selectedRatings.includes(rating.value) && (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 12l5 5L20 7" />
                    </svg>
                  )}
                </span>
                <span className="rooms-filter-label">
                  {rating.value}★
                </span>
              </label>
            ))}
          </div>
        </div>
      </aside>
    )
  }

  const renderRoomCard = (room: Room) => {
    const image = room.images?.[0] || '/images/gambarRuangan.png'
    const facilities = room.facilities?.slice(0, 3).join(', ') ?? '-'
    const displayType = room.type ? room.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Meeting Room'
    
    // Get rating data from database
    const ratingData = roomRatings[room.room_id]
    const rating = ratingData?.rating || 0
    const reviewCount = ratingData?.reviewCount || 0
    const ratingDisplay = rating > 0 ? `${rating} (${reviewCount} Ulasan)` : 'Belum ada ulasan'

    return (
      <div key={room.room_id} className="rooms-list-card">
        <div className="rooms-list-card-image">
          <img src={image} alt={room.name} onError={(e) => { (e.target as HTMLImageElement).src = '/images/gambarRuangan.png' }}/>
        </div>
        <div className="rooms-list-card-content">
          <div className="rooms-list-card-main">
            <h3 className="rooms-list-card-title">{room.name}</h3>
            <div className="rooms-list-card-meta">
              <span className="rooms-list-card-meta-item">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M23 21v-2a4 4 0 0 0-3-3.87" />
                </svg>
                {room.capacity} orang
              </span>
              <span className="rooms-list-card-meta-item">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z" />
                  <circle cx="12" cy="11" r="3" />
                </svg>
                {room.location}, {room.region}, {room.province}
              </span>
              <span className="rooms-list-card-meta-item">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="7" width="20" height="14" rx="2" />
                  <path d="M8 7V5a2 2 0 014 0v2" />
                  <line x1="12" y1="12" x2="12" y2="16" />
                  <line x1="10" y1="14" x2="14" y2="14" />
                </svg>
                {facilities}
              </span>
            </div>
            <div className="rooms-list-card-rating">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
              <span>{ratingDisplay}</span>
            </div>
          </div>
          <div className="rooms-list-card-actions">
            <div className="rooms-list-card-price">
              {formatRupiah(room.price_per_hour)}<small>/jam</small>
            </div>
            <span className="rooms-list-card-type">{displayType}</span>
            <button
              className="rooms-list-card-btn"
              onClick={() => router.push(`/customer/rooms/${room.room_id}`)}
            >
              Lihat detail
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="rooms-page-v2">
      {/* Header with back button - acts as main navigation */}
      <BackButton href="/customer/dashboard" title="Hasil Pencarian" />

      {/* Search Bar */}
      {renderSearchBar()}

      {/* Main Content */}
      <div className="rooms-content">
        <div className="rooms-sidebar-wrapper">
          {renderSidebar()}
        </div>
        
        <main className="rooms-main">
          <div className="rooms-sort-bar sticky-sort">
            <span>Urutkan Berdasarkan:</span>
            <div className="rooms-sort-dropdown" ref={sortDropdownRef}>
              <button 
                className="rooms-sort-trigger" 
                ref={sortTriggerRef}
                onClick={() => setShowSortDropdown(prev => !prev)}
              >
                {sortBy === 'price_asc' && 'Harga terendah'}
                {sortBy === 'price_desc' && 'Harga tertinggi'}
                {sortBy === 'rating' && 'Rating tertinggi'}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m6 9 6 6 6-6" />
                </svg>
              </button>
              {showSortDropdown && (
                <div className="rooms-sort-menu">
                  <button className={sortBy === 'price_asc' ? 'active' : ''} onClick={() => { setSortBy('price_asc'); setShowSortDropdown(false); }}>Harga terendah</button>
                  <button className={sortBy === 'price_desc' ? 'active' : ''} onClick={() => { setSortBy('price_desc'); setShowSortDropdown(false); }}>Harga tertinggi</button>
                  <button className={sortBy === 'rating' ? 'active' : ''} onClick={() => { setSortBy('rating'); setShowSortDropdown(false); }}>Rating tertinggi</button>
                </div>
              )}
            </div>
          </div>

          {loading ? (
            <div className="rooms-list">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="rooms-list-card-skeleton" />
              ))}
            </div>
          ) : error ? (
            <p className="rooms-empty">{error}</p>
          ) : filteredRooms.length === 0 ? (
            <p className="rooms-empty">Tidak ada ruangan yang sesuai dengan filter.</p>
          ) : (
            <div className="rooms-list">
              {filteredRooms.map(renderRoomCard)}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

// Wrap the component in Suspense to handle useSearchParams
export default function CustomerRoomsWrapper() {
  return (
    <Suspense fallback={
      <div className="rooms-page-v2">
        <div className="rooms-header">
          <h1>Hasil Pencarian</h1>
        </div>
        <div className="rooms-content">
          <div className="rooms-list">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="rooms-list-card-skeleton" />
            ))}
          </div>
        </div>
      </div>
    }>
      <CustomerRooms />
    </Suspense>
  )
}
