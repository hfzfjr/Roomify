'use client'

import { useEffect, useRef, useState } from 'react'
import { addMonths, eachDayOfInterval, endOfMonth, endOfWeek, format, getMonth, getYear, isSameDay, isSameMonth, parseISO, setMonth, setYear, startOfMonth, startOfWeek, subMonths } from 'date-fns'
import { useRouter } from 'next/navigation'
import { Room } from '@/types'
import { formatRupiah } from '@/utils/formatRupiah'
import { getLocationOptionLabel, getLocationOptionSubtitle, getLocationQueryValue, getLocationSearchText, type Location } from '@/utils/locations'
import '@/styles/dashboard.css'

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

export default function CustomerDashboard() {
  const router = useRouter()
  const [recommended, setRecommended] = useState<Room[]>([])
  const [available, setAvailable] = useState<Room[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [loadingRec, setLoadingRec] = useState(true)
  const [loadingAvail, setLoadingAvail] = useState(true)
  const [loadingLoc, setLoadingLoc] = useState(true)

  const [filterLocation, setFilterLocation] = useState<Location | null>(null)
  const [locationSearchQuery, setLocationSearchQuery] = useState('')
  const [filteredLocations, setFilteredLocations] = useState<Location[]>([])
  const [showLocationDropdown, setShowLocationDropdown] = useState(false)
  const [filterType, setFilterType] = useState('')
  const [filterDate, setFilterDate] = useState('')
  const [filterCapacity, setFilterCapacity] = useState('')
  const [showTypeDropdown, setShowTypeDropdown] = useState(false)
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [calendarMonth, setCalendarMonth] = useState(() => new Date())
  const [activeDateMenu, setActiveDateMenu] = useState<'month' | 'year' | null>(null)
  const filterLocationRef = useRef<HTMLInputElement | null>(null)
  const filterTypeRef = useRef<HTMLButtonElement | null>(null)
  const typeDropdownRef = useRef<HTMLDivElement | null>(null)
  const filterDateRef = useRef<HTMLButtonElement | null>(null)
  const datePickerRef = useRef<HTMLDivElement | null>(null)
  const filterCapacityRef = useRef<HTMLInputElement | null>(null)
  const normalizedLocationQuery = locationSearchQuery.trim().toLowerCase()
  const selectedLocationLabel = filterLocation ? getLocationOptionLabel(filterLocation).trim().toLowerCase() : ''
  const isLocationSelected = Boolean(
    filterLocation &&
    normalizedLocationQuery.length > 0 &&
    selectedLocationLabel === normalizedLocationQuery
  )
  const isLocationSelectionPending = normalizedLocationQuery.length > 0 && !isLocationSelected
  const visibleAvailable = isLocationSelectionPending ? [] : available
  const hasActiveFilters = Boolean(
    normalizedLocationQuery.length > 0 ||
    filterType ||
    filterDate ||
    filterCapacity.trim().length > 0
  )
  const selectedDate = filterDate ? parseISO(filterDate) : null
  const selectedTypeLabel = ROOM_TYPES.find(roomType => roomType.value === filterType)?.label ?? ROOM_TYPES[0].label
  const calendarDays = eachDayOfInterval({
    start: startOfWeek(startOfMonth(calendarMonth), { weekStartsOn: 0 }),
    end: endOfWeek(endOfMonth(calendarMonth), { weekStartsOn: 0 })
  })
  const yearOptions = Array.from({ length: 11 }, (_, index) => getYear(new Date()) - 5 + index)

  useEffect(() => {
    const stored = localStorage.getItem('user')
    if (!stored) {
      router.push('/auth/login')
      return
    }
    let isMounted = true

    async function loadDashboardData() {
      try {
        const [locationsRes, recommendedRes, availableRes] = await Promise.all([
          fetch('/api/locations'),
          fetch('/api/rooms?limit=4'),
          fetch('/api/rooms')
        ])

        const [locationsJson, recommendedJson, availableJson] = await Promise.all([
          locationsRes.json(),
          recommendedRes.json(),
          availableRes.json()
        ])

        if (!isMounted) {
          return
        }

        if (locationsJson.success) setLocations(locationsJson.data ?? [])
        if (recommendedJson.success) setRecommended(recommendedJson.data ?? [])
        if (availableJson.success) setAvailable(availableJson.data ?? [])
      } catch {
      } finally {
        if (!isMounted) {
          return
        }

        setLoadingLoc(false)
        setLoadingRec(false)
        setLoadingAvail(false)
      }
    }

    void loadDashboardData()

    return () => {
      isMounted = false
    }
  }, [router])

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
    }

    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [showDatePicker, showTypeDropdown])

  async function fetchAvailable(type?: string, capacity?: string, location?: Location) {
    setLoadingAvail(true)
    try {
      const params = new URLSearchParams()
      if (type) params.set('type', type)
      if (capacity) params.set('capacity', capacity)
      if (location?.id != null) params.set('location_id', String(location.id))
      if (location) params.set('location_name', getLocationQueryValue(location))
      if (location?.type) params.set('location_type', location.type)
      if (filterDate) params.set('date', filterDate)

      const res = await fetch(`/api/rooms?${params.toString()}`)
      const json = await res.json()
      if (json.success) setAvailable(json.data ?? [])
    } catch {
    }
    setLoadingAvail(false)
  }

  function handleSearch() {
    if (isLocationSelectionPending) {
      return
    }

    // Build query params for redirect to customer/rooms
    const params = new URLSearchParams()
    
    // Add location param - use location_id if selected, otherwise use text query
    if (filterLocation) {
      if (filterLocation.type === 'province') {
        params.set('province_id', String(filterLocation.id))
      } else {
        params.set('region_id', String(filterLocation.id))
      }
    } else if (locationSearchQuery.trim()) {
      params.set('location', locationSearchQuery.trim())
    }
    
    // Add other filters
    if (filterType) {
      params.set('type', filterType)
    }
    if (filterDate) {
      params.set('date', filterDate)
    }
    if (filterCapacity) {
      params.set('capacity', filterCapacity)
    }
    
    // Redirect to customer/rooms with search params
    const queryString = params.toString()
    const redirectUrl = queryString ? `/customer/rooms?${queryString}` : '/customer/rooms'
    router.push(redirectUrl)
  }

  function handleLocationSearch(query: string) {
    setLocationSearchQuery(query)
    const normalizedQuery = query.trim().toLowerCase()

    if (normalizedQuery.length === 0) {
      setFilteredLocations([])
      setFilterLocation(null)
      setShowLocationDropdown(false)
      return
    }

    if (!filterLocation || selectedLocationLabel !== normalizedQuery) {
      setFilterLocation(null)
    }

    const filtered = locations.filter(loc =>
      getLocationSearchText(loc).includes(normalizedQuery)
    )

    setFilteredLocations(filtered)
    setShowLocationDropdown(true)
  }

  function handleLocationSelect(location: Location) {
    setFilterLocation(location)
    setLocationSearchQuery(getLocationOptionLabel(location))
    setShowLocationDropdown(false)
  }

  function handleDateSelect(date: Date) {
    setFilterDate(format(date, 'yyyy-MM-dd'))
    setCalendarMonth(date)
    setShowDatePicker(false)
    setActiveDateMenu(null)
  }

  function renderRoomCard(room: Room) {
    const image = room.images?.[0]
    const facilities = room.facilities?.join(', ') ?? '-'

    return (
      <div key={room.room_id} className="dashboard-room-card">
        <div className="dashboard-room-thumb">
          <img src={image || ''} alt={room.name} />
        </div>
        <div className="dashboard-room-info">
          <div className="dashboard-room-name dashboard-room-ellipsis" title={room.name}>{room.name}</div>
          <div className="dashboard-meta-row">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M23 21v-2a4 4 0 0 0-3-3.87" />
            </svg>
            <span className="dashboard-room-ellipsis" title={`${room.capacity} orang`}>{room.capacity} orang</span>
          </div>
          <div className="dashboard-meta-row">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="1.5">
              <rect x="2" y="7" width="20" height="14" rx="2" />
              <path d="M8 7V5a2 2 0 014 0v2" />
              <line x1="12" y1="12" x2="12" y2="16" />
              <line x1="10" y1="14" x2="14" y2="14" />
            </svg>
            <span className="dashboard-room-ellipsis" title={facilities}>{facilities}</span>
          </div>
          <div className="dashboard-meta-row">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z" />
              <circle cx="12" cy="11" r="3" />
            </svg>
            <span className="dashboard-room-ellipsis" title={room.location}>{room.location}</span>
          </div>
        </div>
        <div className="dashboard-card-btns">
          <div className="dashboard-btn-pay">{formatRupiah(room.price_per_hour)}/hour</div>
          <button className="dashboard-btn-detail" onClick={() => router.push(`/customer/rooms/${room.room_id}`)}>
            View details
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="dashboard">
      <div className="dashboard-hero">
        <img
          src="/images/mainDashboard.png"
          alt="Dashboard main image"
          className="dashboard-hero-img"
        />
        <div className="dashboard-hero-overlay" />
      </div>

      <div className="dashboard-search-card">
        <div className="dashboard-search-bg" aria-hidden="true">
          <div className="dashboard-sc-circle dashboard-sc-c1" />
          <div className="dashboard-sc-circle dashboard-sc-c2" />
          <div className="dashboard-sc-circle dashboard-sc-c3" />
        </div>

        <div className="dashboard-sc-text">
          <h2>Temukan ruangan yang tepat</h2>
          <p>Booking mudah, cepat, dan terpercaya</p>
        </div>

        <div className="dashboard-search-row">
          <div className={`sf sf-search-location${isLocationSelectionPending ? ' sf-location-invalid' : ''}`}>
            <input
              id="filterLocation"
              ref={filterLocationRef}
              type="text"
              className="sf-location-input"
              placeholder="Lokasi"
              value={locationSearchQuery}
              disabled={loadingLoc}
              onChange={e => handleLocationSearch(e.target.value)}
              onFocus={() => {
                if (locationSearchQuery.trim().length > 0 && filteredLocations.length > 0) {
                  setShowLocationDropdown(true)
                }
              }}
              onBlur={() => setShowLocationDropdown(false)}
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
                    className={`sf-location-option${filterLocation?.id === loc.id ? ' selected' : ''}`}
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
              <span className={`sf-type-value${filterType ? ' has-value' : ''}`}>{selectedTypeLabel}</span>
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
                    className={`sf-type-option${filterType === roomType.value ? ' selected' : ''}`}
                    onClick={() => {
                      setFilterType(roomType.value)
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
              <span className={`sf-date-value${filterDate ? ' has-value' : ''}`}>
                {selectedDate ? format(selectedDate, 'dd/MM/yyyy') : 'dd/mm/yyyy'}
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
              value={filterCapacity}
              onChange={e => setFilterCapacity(e.target.value)}
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
            className="dashboard-btn-cari"
            onClick={handleSearch}
            disabled={isLocationSelectionPending}
          >
            Cari
          </button>
        </div>
      </div>

      <main className="dashboard-main">
        <section className="dashboard-section">
          <div className="dashboard-section-row">
            <span className="dashboard-section-title">Rekomendasi</span>
            <button className="dashboard-see-all" onClick={() => router.push('/customer/rooms')}>
              Lihat selengkapnya
            </button>
          </div>

          <div className="dashboard-cards-container">
            {loadingRec ? (
              <div className="dashboard-cards-grid">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="dashboard-room-card-skeleton" />
                ))}
              </div>
            ) : recommended.length === 0 ? (
              <p className="dashboard-empty">Belum ada ruangan tersedia.</p>
            ) : (
              <div className="dashboard-cards-grid">
                {recommended.map(renderRoomCard)}
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  )
}
