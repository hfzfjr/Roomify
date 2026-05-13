'use client'

import { useEffect, useRef, useState, useMemo, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { addMonths, eachDayOfInterval, endOfMonth, endOfWeek, format, getMonth, getYear, isSameDay, isSameMonth, parseISO, setMonth, setYear, startOfMonth, startOfWeek, subMonths } from 'date-fns'
import { Room } from '@/types'
import { formatRupiah } from '@/utils/formatRupiah'
import { getLocationOptionLabel, getLocationOptionSubtitle, getLocationQueryValue, getLocationSearchText, type Location } from '@/utils/locations'
import BackButton from '@/components/layout/BackButton'
import '@/styles/rooms.css'

const ROOM_TYPES = [
  { label: 'Semua tipe', value: '' },
  { label: 'Meeting Room', value: 'meeting_room' },
  { label: 'Seminar Room', value: 'seminar_room' },
  { label: 'Studio', value: 'studio' },
  { label: 'Training Room', value: 'training_room' },
  { label: 'Coworking Space', value: 'coworking_space' },
  { label: 'Event Hall', value: 'event_hall' }
]

const WEEK_DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
const MONTH_OPTIONS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

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
  
  // Search states (pending - belum diterapkan)
  const [locations, setLocations] = useState<Location[]>([])
  const [loadingLoc, setLoadingLoc] = useState(true)
  const [pendingLocation, setPendingLocation] = useState<Location | null>(null)
  const [pendingLocationQuery, setPendingLocationQuery] = useState(urlLocation || '')
  const [filteredLocations, setFilteredLocations] = useState<Location[]>([])
  const [showLocationDropdown, setShowLocationDropdown] = useState(false)
  const [pendingType, setPendingType] = useState(urlType || '')
  const [pendingDate, setPendingDate] = useState(urlDate || '')
  const [pendingCapacity, setPendingCapacity] = useState(urlCapacity || '')
  const [showTypeDropdown, setShowTypeDropdown] = useState(false)
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [calendarMonth, setCalendarMonth] = useState(() => new Date())
  const [activeDateMenu, setActiveDateMenu] = useState<'month' | 'year' | null>(null)
  
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
  
  // Refs
  const filterLocationRef = useRef<HTMLInputElement | null>(null)
  const filterTypeRef = useRef<HTMLButtonElement | null>(null)
  const typeDropdownRef = useRef<HTMLDivElement | null>(null)
  const filterDateRef = useRef<HTMLButtonElement | null>(null)
  const datePickerRef = useRef<HTMLDivElement | null>(null)
  const filterCapacityRef = useRef<HTMLInputElement | null>(null)
  const sortDropdownRef = useRef<HTMLDivElement | null>(null)
  const sortTriggerRef = useRef<HTMLButtonElement | null>(null)
  
  // Sort dropdown state
  const [showSortDropdown, setShowSortDropdown] = useState(false)
  
  // Show all facilities toggle
  const [showAllFacilities, setShowAllFacilities] = useState(false)
  
  const normalizedLocationQuery = pendingLocationQuery.trim().toLowerCase()
  const selectedLocationLabel = pendingLocation ? getLocationOptionLabel(pendingLocation).trim().toLowerCase() : ''
  const isLocationSelected = Boolean(
    pendingLocation &&
    normalizedLocationQuery.length > 0 &&
    selectedLocationLabel === normalizedLocationQuery
  )
  const isLocationSelectionPending = normalizedLocationQuery.length > 0 && !isLocationSelected
  const selectedDate = pendingDate ? parseISO(pendingDate) : null
  const selectedTypeLabel = ROOM_TYPES.find(roomType => roomType.value === pendingType)?.label ?? ROOM_TYPES[0].label
  const calendarDays = eachDayOfInterval({
    start: startOfWeek(startOfMonth(calendarMonth), { weekStartsOn: 0 }),
    end: endOfWeek(endOfMonth(calendarMonth), { weekStartsOn: 0 })
  })
  const yearOptions = Array.from({ length: 11 }, (_, index) => getYear(new Date()) - 5 + index)

  // Dynamic facility options from available rooms
  const dynamicFacilityOptions = useMemo(() => {
    const allFacilities = new Set<string>()
    rooms.forEach(room => {
      room.facilities?.forEach(f => allFacilities.add(f))
    })
    const facilities = Array.from(allFacilities).sort()
    return [{ label: 'Semua', value: '' }, ...facilities.map(f => ({ label: f, value: f }))]
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
        const [locationsRes, roomsRes] = await Promise.all([
          fetch('/api/locations'),
          fetch('/api/rooms')
        ])

        const [locationsJson, roomsJson] = await Promise.all([
          locationsRes.json(),
          roomsRes.json()
        ])

        if (!isMounted) return

        if (locationsJson.success) setLocations(locationsJson.data ?? [])
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
          setLoadingLoc(false)
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

  // Handle URL location params after locations are loaded (only once on initial load)
  useEffect(() => {
    if (locations.length === 0 || urlParamsApplied) return
    
    // Find location based on URL params
    let matchedLocation: Location | null = null
    
    if (urlProvinceId) {
      matchedLocation = locations.find(loc => 
        loc.type === 'province' && String(loc.id) === urlProvinceId
      ) || null
    } else if (urlRegionId) {
      matchedLocation = locations.find(loc => 
        loc.type === 'region' && String(loc.id) === urlRegionId
      ) || null
    }
    
    if (matchedLocation) {
      setPendingLocation(matchedLocation)
      setPendingLocationQuery(getLocationOptionLabel(matchedLocation))
      setAppliedLocation(matchedLocation)
    } else if (urlLocation) {
      // If text location provided but no match found, set as text query
      setPendingLocationQuery(urlLocation)
      // Set appliedLocation to null explicitly to trigger text-based filtering
      setAppliedLocation(null)
    }
    
    // Mark URL params as applied so this effect doesn't run again
    setUrlParamsApplied(true)
  }, [locations, urlProvinceId, urlRegionId, urlLocation, urlParamsApplied])

  // Click outside handler
  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node

      if (
        showTypeDropdown &&
        typeDropdownRef.current &&
        !typeDropdownRef.current.contains(target) &&
        filterTypeRef.current &&
        !filterTypeRef.current.contains(target)
      ) {
        setShowTypeDropdown(false)
      }

      if (
        showDatePicker &&
        datePickerRef.current &&
        !datePickerRef.current.contains(target) &&
        filterDateRef.current &&
        !filterDateRef.current.contains(target)
      ) {
        setShowDatePicker(false)
        setActiveDateMenu(null)
      }
      
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
  }, [showDatePicker, showTypeDropdown, showSortDropdown])

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
    } else if (appliedLocation === null && pendingLocationQuery && pendingLocationQuery.trim()) {
      // Jika user mengetik tapi tidak memilih dari dropdown, 
      // dan sudah klik Cari (appliedLocation === null secara eksplisit)
      // Filter berdasarkan text query di location, region, dan province
      const query = pendingLocationQuery.toLowerCase()
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
  }, [rooms, appliedType, appliedCapacity, appliedLocation, selectedFacilities, selectedRatings, sortBy, roomRatings])

  function handleLocationSearch(query: string) {
    setPendingLocationQuery(query)
    const normalizedQuery = query.trim().toLowerCase()

    if (normalizedQuery.length === 0) {
      setFilteredLocations([])
      setPendingLocation(null)
      setShowLocationDropdown(false)
      return
    }

    if (!pendingLocation || selectedLocationLabel !== normalizedQuery) {
      setPendingLocation(null)
    }

    const filtered = locations.filter(loc =>
      getLocationSearchText(loc).includes(normalizedQuery)
    )

    setFilteredLocations(filtered)
    setShowLocationDropdown(true)
  }

  function handleLocationSelect(location: Location) {
    setPendingLocation(location)
    setPendingLocationQuery(getLocationOptionLabel(location))
    setShowLocationDropdown(false)
  }

  function handleDateSelect(date: Date) {
    setPendingDate(format(date, 'yyyy-MM-dd'))
    setCalendarMonth(date)
    setShowDatePicker(false)
    setActiveDateMenu(null)
  }

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

  function handleSearch() {
    // Apply pending search states
    setAppliedLocation(pendingLocation)
    setAppliedType(pendingType)
    setAppliedDate(pendingDate)
    setAppliedCapacity(pendingCapacity)
    
    // Jika ada text query tapi tidak ada location yang dipilih, biarkan untuk filter fallback
    if (!pendingLocation && pendingLocationQuery) {
      // Filter akan diterapkan di useEffect dengan fallback logic
    }
  }

  const renderSearchBar = () => (
    <div className="rooms-search-section sticky-search">
      <div className="rooms-search-card">
        <div className="rooms-search-bg" aria-hidden="true">
          <div className="rooms-sc-circle rooms-sc-c1" />
          <div className="rooms-sc-circle rooms-sc-c2" />
          <div className="rooms-sc-circle rooms-sc-c3" />
        </div>

        <div className="rooms-search-row">
          <div className={`sf sf-search-location${isLocationSelectionPending ? ' sf-location-invalid' : ''}`}>
            <input
              id="filterLocation"
              ref={filterLocationRef}
              type="text"
              className="sf-location-input"
              placeholder="Lokasi"
              value={pendingLocationQuery}
              disabled={loadingLoc}
              onChange={e => handleLocationSearch(e.target.value)}
              onFocus={() => {
                if (pendingLocationQuery.trim().length > 0 && filteredLocations.length > 0) {
                  setShowLocationDropdown(true)
                }
              }}
              onBlur={() => setTimeout(() => setShowLocationDropdown(false), 200)}
              aria-invalid={isLocationSelectionPending}
            />
            <svg className="sf-location-icon" width="42" height="42" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M12 21c-3.2-3.2-6-6.49-6-10a6 6 0 1 1 12 0c0 3.51-2.8 6.8-6 10Z"
                stroke="white"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="12" cy="11" r="2.5" stroke="white" strokeWidth="1.8" />
            </svg>
            {showLocationDropdown && (
              <div className="sf-location-dropdown">
                {filteredLocations.map((loc, idx) => (
                  <button
                    type="button"
                    key={`${loc.city}-${loc.province}-${idx}`}
                    className={`sf-location-option${pendingLocation?.id === loc.id ? ' selected' : ''}`}
                    onMouseDown={e => e.preventDefault()}
                    onClick={() => handleLocationSelect(loc)}
                    style={{
                      borderBottom: idx < filteredLocations.length - 1 ? '1px solid rgba(15, 23, 42, 0.08)' : 'none'
                    }}
                  >
                    <span className="sf-location-option-icon" aria-hidden="true">
                      <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                        <path
                          d="M3 21h18M5 21V8.5A1.5 1.5 0 0 1 6.5 7H10v14M10 21V4.5A1.5 1.5 0 0 1 11.5 3h6A1.5 1.5 0 0 1 19 4.5V21"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path d="M8 11h.01M8 15h.01M13 7h.01M13 11h.01M16 7h.01M16 11h.01M13 15h.01M16 15h.01" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
                      </svg>
                    </span>
                    <span className="sf-location-option-copy">
                      <span className="sf-location-option-title">{getLocationOptionLabel(loc)}</span>
                      <span className="sf-location-option-subtitle">{getLocationOptionSubtitle(loc)}</span>
                    </span>
                  </button>
                ))}
                {filteredLocations.length === 0 && (
                  <div className="sf-location-empty">Provinsi atau kota tidak ditemukan</div>
                )}
              </div>
            )}
          </div>
          
          <div className="sf sf-type-field" ref={typeDropdownRef}>
            <button
              id="filterType"
              ref={filterTypeRef}
              type="button"
              className="sf-type-trigger"
              onClick={() => setShowTypeDropdown(prev => !prev)}
            >
              <span className={`sf-type-value${pendingType ? ' has-value' : ''}`}>{selectedTypeLabel}</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.4">
                <path strokeLinecap="round" strokeLinejoin="round" d="m6 9 6 6 6-6" />
              </svg>
            </button>

            {showTypeDropdown && (
              <div className="sf-type-dropdown">
                {ROOM_TYPES.map((roomType, index) => (
                  <button
                    key={roomType.value || 'all'}
                    type="button"
                    className={`sf-type-option${pendingType === roomType.value ? ' selected' : ''}`}
                    onClick={() => {
                      setPendingType(roomType.value)
                      setShowTypeDropdown(false)
                    }}
                    style={{
                      borderBottom: index < ROOM_TYPES.length - 1 ? '1px solid rgba(15, 23, 42, 0.08)' : 'none'
                    }}
                  >
                    {roomType.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="sf sf-date-field" ref={datePickerRef}>
            <button
              id="filterDate"
              ref={filterDateRef}
              type="button"
              className="sf-date-trigger"
              onClick={() => {
                setCalendarMonth(selectedDate ?? new Date())
                setActiveDateMenu(null)
                setShowDatePicker(prev => !prev)
              }}
            >
              <span className={`sf-date-value${pendingDate ? ' has-value' : ''}`}>
                {selectedDate ? format(selectedDate, 'dd/MM/yyyy') : 'Pilih tanggal'}
              </span>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </button>

            {showDatePicker && (
              <div className="sf-date-dropdown">
                <div className="sf-date-toolbar">
                  <button type="button" className="sf-date-nav" onClick={() => setCalendarMonth(prev => subMonths(prev, 1))} aria-label="Previous month">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m15 18-6-6 6-6" />
                    </svg>
                  </button>

                  <div className="sf-date-selects">
                    <div className="sf-date-menu-wrap">
                      <button
                        type="button"
                        className={`sf-date-select-button${activeDateMenu === 'month' ? ' open' : ''}`}
                        onClick={() => setActiveDateMenu(prev => (prev === 'month' ? null : 'month'))}
                      >
                        <span>{MONTH_OPTIONS[getMonth(calendarMonth)]}</span>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m6 9 6 6 6-6" />
                        </svg>
                      </button>

                      {activeDateMenu === 'month' && (
                        <div className="sf-date-menu">
                          {MONTH_OPTIONS.map((monthLabel, index) => (
                            <button
                              key={monthLabel}
                              type="button"
                              className={`sf-date-menu-option${getMonth(calendarMonth) === index ? ' selected' : ''}`}
                              onClick={() => {
                                setCalendarMonth(prev => setMonth(prev, index))
                                setActiveDateMenu(null)
                              }}
                            >
                              {monthLabel}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="sf-date-menu-wrap">
                      <button
                        type="button"
                        className={`sf-date-select-button${activeDateMenu === 'year' ? ' open' : ''}`}
                        onClick={() => setActiveDateMenu(prev => (prev === 'year' ? null : 'year'))}
                      >
                        <span>{getYear(calendarMonth)}</span>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m6 9 6 6 6-6" />
                        </svg>
                      </button>

                      {activeDateMenu === 'year' && (
                        <div className="sf-date-menu sf-date-menu-years">
                          {yearOptions.map(year => (
                            <button
                              key={year}
                              type="button"
                              className={`sf-date-menu-option${getYear(calendarMonth) === year ? ' selected' : ''}`}
                              onClick={() => {
                                setCalendarMonth(prev => setYear(prev, year))
                                setActiveDateMenu(null)
                              }}
                            >
                              {year}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <button type="button" className="sf-date-nav" onClick={() => setCalendarMonth(prev => addMonths(prev, 1))} aria-label="Next month">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m9 18 6-6-6-6" />
                    </svg>
                  </button>
                </div>

                <div className="sf-date-weekdays">
                  {WEEK_DAYS.map(day => (
                    <span key={day}>{day}</span>
                  ))}
                </div>

                <div className="sf-date-grid">
                  {calendarDays.map(day => {
                    const isCurrentMonth = isSameMonth(day, calendarMonth)
                    const isSelectedDay = selectedDate ? isSameDay(day, selectedDate) : false

                    return (
                      <button
                        key={day.toISOString()}
                        type="button"
                        className={`sf-date-cell${isSelectedDay ? ' selected' : ''}${isCurrentMonth ? '' : ' muted'}`}
                        onClick={() => handleDateSelect(day)}
                      >
                        {format(day, 'd')}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          <label className="sf" htmlFor="filterCapacity" onClick={() => filterCapacityRef.current?.focus()}>
            <input
              id="filterCapacity"
              ref={filterCapacityRef}
              type="number"
              min="1"
              value={pendingCapacity}
              onChange={e => setPendingCapacity(e.target.value)}
              placeholder="Kapasitas"
            />
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M23 21v-2a4 4 0 00-3-3.87m-4-12a4 4 0 010 7.75" />
            </svg>
          </label>

          <button
            type="button"
            className="rooms-btn-cari"
            onClick={handleSearch}
            disabled={isLocationSelectionPending}
          >
            Cari
          </button>
        </div>
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
      <div className="rooms-header">
        <BackButton href="/customer/dashboard" />
        <h1>Hasil Pencarian</h1>
      </div>

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
