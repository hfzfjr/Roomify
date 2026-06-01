'use client'

import './TypeDropdown.css'

export type RoomType = {
  label: string
  value: string
}

export type TypeDropdownProps = {
  roomTypes: RoomType[]
  selectedType: string
  onSelect: (type: string) => void
}

export default function TypeDropdown({ roomTypes, selectedType, onSelect }: TypeDropdownProps) {
  return (
    <div className="sf-type-dropdown">
      {roomTypes.map((roomType, index) => (
        <button
          key={roomType.value || 'all'}
          type="button"
          className={`sf-type-option${selectedType === roomType.value ? ' selected' : ''}`}
          onClick={() => onSelect(roomType.value)}
          style={{
            borderBottom: index < roomTypes.length - 1 ? '1px solid rgba(15, 23, 42, 0.08)' : 'none'
          }}
        >
          {roomType.label}
        </button>
      ))}
    </div>
  )
}
