'use client'

import { getLocationOptionLabel, getLocationOptionSubtitle, type Location } from '@/utils/locations'
import './LocationDropdown.css'

export type LocationDropdownProps = {
  locations: Location[]
  filteredLocations: Location[]
  selectedLocation: Location | null
  onSelect: (location: Location) => void
}

export default function LocationDropdown({ locations, filteredLocations, selectedLocation, onSelect }: LocationDropdownProps) {
  return (
    <div className="sf-location-dropdown">
      {filteredLocations.map((loc, idx) => (
        <button
          type="button"
          key={`${loc.city}-${loc.province}-${idx}`}
          className={`sf-location-option${selectedLocation?.id === loc.id ? ' selected' : ''}`}
          onMouseDown={e => e.preventDefault()}
          onClick={() => onSelect(loc)}
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
  )
}
