'use client'

import { useEffect, useRef } from 'react'
import { format } from 'date-fns'
import { id as localeId } from 'date-fns/locale'
import './RoomBookingScheduleOverlay.css'

interface ScheduleSlot {
  label: string
  isBooked: boolean
}

interface RoomBookingScheduleOverlayProps {
  isOpen: boolean
  roomName: string
  selectedDate: Date | null
  scheduleSlots: ScheduleSlot[]
  anchorRef: React.RefObject<HTMLButtonElement | null>
  onClose: () => void
}

export default function RoomBookingScheduleOverlay({
  isOpen,
  roomName,
  selectedDate,
  scheduleSlots,
  anchorRef,
  onClose
}: RoomBookingScheduleOverlayProps) {
  const popoverRef = useRef<HTMLDivElement | null>(null)

  // Close when clicking outside
  useEffect(() => {
    if (!isOpen) return

    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node
      if (
        popoverRef.current &&
        !popoverRef.current.contains(target) &&
        anchorRef.current &&
        !anchorRef.current.contains(target)
      ) {
        onClose()
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [isOpen, anchorRef, onClose])

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  // Position popover to the left of the anchor button
  const anchorEl = anchorRef.current
  const anchorRect = anchorEl?.getBoundingClientRect()

  const popoverWidth = 385
  const gap = 10

  const popoverStyle: React.CSSProperties = anchorRect
    ? {
        top: Math.max(8, anchorRect.top - 50),
        left: Math.max(8, anchorRect.left - popoverWidth - gap),
      }
    : { top: 100, right: 100 }

  return (
    <div
      ref={popoverRef}
      className="customer-room-schedule-popover"
      role="dialog"
      aria-modal="true"
      aria-label="Jadwal Ruangan"
      style={popoverStyle}
    >
      <div className="customer-room-schedule-head">
        <div>
          <h3>Jadwal Ruangan</h3>
          <p>
            {roomName}
            {selectedDate && (
              <span>&nbsp;&bull;&nbsp;{format(selectedDate, 'd MMMM yyyy', { locale: localeId })}</span>
            )}
          </p>
        </div>
        <button
          type="button"
          className="customer-room-schedule-close"
          onClick={onClose}
          aria-label="Tutup jadwal"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      <div className="customer-room-schedule-list">
        {scheduleSlots.length === 0 ? (
          <p className="customer-room-schedule-empty">
            Pilih tanggal terlebih dahulu untuk melihat jadwal
          </p>
        ) : (
          scheduleSlots.map(slot => (
            <div key={slot.label} className="customer-room-schedule-row">
              <span>{slot.label}</span>
              <strong className={slot.isBooked ? 'booked' : 'available'}>
                {slot.isBooked ? 'Sudah dibook' : 'Tersedia'}
              </strong>
            </div>
          ))
        )}
      </div>
    </div>
  )
}