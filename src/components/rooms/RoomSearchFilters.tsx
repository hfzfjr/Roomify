'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { addMonths, format, parseISO, setMonth, setYear, subMonths } from 'date-fns'
import { getLocationOptionLabel, getLocationOptionSubtitle, getLocationQueryValue, getLocationSearchText, type Location } from '@/utils/locations'
import LocationDropdown from '@/components/ui/search/LocationDropdown'
import TypeDropdown, { type RoomType } from '@/components/ui/search/TypeDropdown'
import DateDropdown from '@/components/ui/search/DateDropdown'
import './RoomSearchFilters.css'

const ROOM_TYPES: RoomType[] = [
  { label: 'Semua tipe', value: '' },
  { label: 'Meeting Room', value: 'meeting_room' },
  { label: 'Seminar Room', value: 'seminar_room' },
  { label: 'Studio', value: 'studio' },
  { label: 'Training Room', value: 'training_room' },
  { label: 'Coworking Space', value: 'coworking_space' },
  { label: 'Event Hall', value: 'event_hall' }
]

export type RoomSearchFiltersProps = {
  initialLocationQuery?: string
  initialLocation?: Location | null
  initialType?: string
  initialDate?: string
  initialCapacity?: string
  searchButtonLabel?: string
  onSearch: (filters: { location?: Location | null; locationText: string; type: string; date: string; capacity: string }) => void
}

export default function RoomSearchFilters({
  initialLocationQuery = '',
  initialLocation = null,
  initialType = '',
  initialDate = '',
  initialCapacity = '',
  searchButtonLabel = 'Cari',
  onSearch
}: RoomSearchFiltersProps) {
  const [locations, setLocations] = useState<Location[]>([])
  const [loadingLoc, setLoadingLoc] = useState(true)
  const [filterLocation, setFilterLocation] = useState<Location | null>(initialLocation)
  const [locationSearchQuery, setLocationSearchQuery] = useState(
    initialLocation ? getLocationOptionLabel(initialLocation) : initialLocationQuery
  )
  const [filteredLocations, setFilteredLocations] = useState<Location[]>([])
  const [showLocationDropdown, setShowLocationDropdown] = useState(false)
  const [filterType, setFilterType] = useState(initialType)
  const [filterDate, setFilterDate] = useState(initialDate)
  const [filterCapacity, setFilterCapacity] = useState(initialCapacity)
  const [showTypeDropdown, setShowTypeDropdown] = useState(false)
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [calendarMonth, setCalendarMonth] = useState(() => {
    if (initialDate) {
      const parsed = parseISO(initialDate)
      return isNaN(parsed.getTime()) ? new Date() : parsed
    }
    return new Date()
  })
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
  const selectedDate = filterDate ? parseISO(filterDate) : null
  const selectedTypeLabel = ROOM_TYPES.find(roomType => roomType.value === filterType)?.label ?? ROOM_TYPES[0].label


  useEffect(() => {
    let isMounted = true

    const loadLocations = async () => {
      try {
        const response = await fetch('/api/locations')
        const json = await response.json()
        if (!isMounted) return
        if (json.success) {
          setLocations(json.data ?? [])
        }
      } catch {
      } finally {
        if (isMounted) {
          setLoadingLoc(false)
        }
      }
    }

    void loadLocations()

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    if (!locationSearchQuery.trim()) {
      setFilteredLocations([])
      return
    }

    const normalizedQuery = locationSearchQuery.trim().toLowerCase()
    const filtered = locations.filter(loc => getLocationSearchText(loc).includes(normalizedQuery))
    setFilteredLocations(filtered)
  }, [locationSearchQuery, locations])

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
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

  const handleLocationSearch = (query: string) => {
    setLocationSearchQuery(query)
    if (!query.trim()) {
      setFilterLocation(null)
      setShowLocationDropdown(false)
      return
    }

    if (!filterLocation || selectedLocationLabel !== query.trim().toLowerCase()) {
      setFilterLocation(null)
    }

    setShowLocationDropdown(true)
  }

  const handleLocationSelect = (location: Location) => {
    setFilterLocation(location)
    setLocationSearchQuery(getLocationOptionLabel(location))
    setShowLocationDropdown(false)
  }

  const handleDateSelect = (date: Date) => {
    setFilterDate(format(date, 'yyyy-MM-dd'))
    setCalendarMonth(date)
    setShowDatePicker(false)
    setActiveDateMenu(null)
  }

  const handleSearch = () => {
    if (isLocationSelectionPending) {
      return
    }

    onSearch({
      location: filterLocation ?? undefined,
      locationText: locationSearchQuery.trim(),
      type: filterType,
      date: filterDate,
      capacity: filterCapacity
    })
  }

  return (
    <div className="dashboard-search-row">
      <div className={`sf${isLocationSelectionPending ? ' sf-location-invalid' : ''}`}>
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
          <LocationDropdown
            locations={locations}
            filteredLocations={filteredLocations}
            selectedLocation={filterLocation}
            onSelect={handleLocationSelect}
          />
        )}
      </div>

      <div className="sf" ref={typeDropdownRef}>
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
          <TypeDropdown
            roomTypes={ROOM_TYPES}
            selectedType={filterType}
            onSelect={(type) => {
              setFilterType(type)
              setShowTypeDropdown(false)
            }}
          />
        )}
      </div>

      <div className="sf" ref={datePickerRef}>
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
          <DateDropdown
            selectedDate={selectedDate}
            calendarMonth={calendarMonth}
            onDateSelect={handleDateSelect}
            onMonthChange={(month) => setCalendarMonth(prev => setMonth(prev, month))}
            onYearChange={(year) => setCalendarMonth(prev => setYear(prev, year))}
            onPreviousMonth={() => setCalendarMonth(prev => subMonths(prev, 1))}
            onNextMonth={() => setCalendarMonth(prev => addMonths(prev, 1))}
            onActiveDateMenuChange={setActiveDateMenu}
            activeDateMenu={activeDateMenu}
          />
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
        className="sf-search-btn"
        onClick={handleSearch}
        disabled={isLocationSelectionPending}
      >
        {searchButtonLabel}
      </button>
    </div>
  )
}
