'use client'

import { useEffect, useRef, useState } from 'react'
import { addMonths, eachDayOfInterval, endOfMonth, endOfWeek, format, getMonth, getYear, isSameDay, isSameMonth, parseISO, setMonth, setYear, startOfMonth, startOfWeek, subMonths } from 'date-fns'
import { useRouter } from 'next/navigation'
import { RoomDetail, User } from '@/types'
import { formatRupiah } from '@/utils/formatRupiah'

interface Props {
  room: RoomDetail
}

const WEEK_DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
const MONTH_OPTIONS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const DEFAULT_BOOKING_DURATION_MINUTES = 120
const BOOKING_TIME_STEP_MINUTES = 30
const MAX_START_TIME = '23:00'
const MAX_END_TIME = '23:30'

function getTodayValue() {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function getStartOfToday() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return today
}

function formatDateValue(date: Date) {
  return format(date, 'yyyy-MM-dd')
}

function formatTimeValue(date: Date) {
  return format(date, 'HH:mm')
}

function addMinutes(date: Date, minutes: number) {
  return new Date(date.getTime() + minutes * 60 * 1000)
}

function roundUpToBookingSlot(baseDate: Date = new Date()) {
  const rounded = new Date(baseDate)
  rounded.setSeconds(0, 0)

  const minutes = rounded.getMinutes()

  if (minutes === 0 || minutes === 30) {
    return rounded
  }

  if (minutes < 30) {
    rounded.setMinutes(30, 0, 0)
    return rounded
  }

  rounded.setHours(rounded.getHours() + 1, 0, 0, 0)
  return rounded
}

function isSameCalendarDay(left: Date, right: Date) {
  return left.getFullYear() === right.getFullYear()
    && left.getMonth() === right.getMonth()
    && left.getDate() === right.getDate()
}

function getInitialBookingValues(baseDate: Date = new Date()) {
  let startDateTime = roundUpToBookingSlot(baseDate)
  let endDateTime = addMinutes(startDateTime, DEFAULT_BOOKING_DURATION_MINUTES)

  if (!isSameCalendarDay(startDateTime, endDateTime)) {
    startDateTime = roundUpToBookingSlot(new Date(startDateTime.getFullYear(), startDateTime.getMonth(), startDateTime.getDate() + 1, 0, 0, 0, 0))
    endDateTime = addMinutes(startDateTime, DEFAULT_BOOKING_DURATION_MINUTES)
  }

  return {
    bookingDate: formatDateValue(startDateTime),
    startTime: formatTimeValue(startDateTime),
    endTime: formatTimeValue(endDateTime),
    calendarMonth: startDateTime
  }
}

function getMinimumEndTime(startTimeValue: string) {
  const [hours, minutes] = startTimeValue.split(':').map(Number)

  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
    return '00:30'
  }

  const baseDate = new Date(2000, 0, 1, hours, minutes, 0, 0)
  const minimumEndDate = addMinutes(baseDate, BOOKING_TIME_STEP_MINUTES)
  return formatTimeValue(minimumEndDate)
}

function normalizeTimeInput(value: string) {
  const [hours, minutes] = value.split(':').map(Number)

  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
    return value
  }

  const normalizedDate = roundUpToBookingSlot(new Date(2000, 0, 1, hours, minutes, 0, 0))
  return formatTimeValue(normalizedDate)
}

export default function RoomBookingPanel({ room }: Props) {
  const router = useRouter()
  const initialBookingValues = getInitialBookingValues()
  const [bookingDate, setBookingDate] = useState(() => initialBookingValues.bookingDate)
  const [startTime, setStartTime] = useState(() => initialBookingValues.startTime)
  const [endTime, setEndTime] = useState(() => initialBookingValues.endTime)
  const [facilityRequest, setFacilityRequest] = useState('')
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [calendarMonth, setCalendarMonth] = useState(() => initialBookingValues.calendarMonth)
  const [activeDateMenu, setActiveDateMenu] = useState<'month' | 'year' | null>(null)
  const [userName] = useState<string | null>(() => {
    if (typeof window === 'undefined') {
      return null
    }

    const storedUser = localStorage.getItem('user')

    if (!storedUser) {
      return null
    }

    try {
      const parsedUser = JSON.parse(storedUser) as User
      return parsedUser.name
    } catch {
      return null
    }
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const datePickerRef = useRef<HTMLDivElement | null>(null)
  const dateTriggerRef = useRef<HTMLButtonElement | null>(null)

  const selectedDate = bookingDate ? parseISO(bookingDate) : null
  const nextAvailableSlot = roundUpToBookingSlot()
  const todayValue = getTodayValue()
  const minimumTodayStartTime = formatTimeValue(nextAvailableSlot)
  const minimumEndTime = getMinimumEndTime(startTime)
  const checkInDate = bookingDate && startTime ? new Date(`${bookingDate}T${startTime}:00`) : null
  const checkOutDate = bookingDate && endTime ? new Date(`${bookingDate}T${endTime}:00`) : null
  const durationHours = checkInDate && checkOutDate && checkOutDate > checkInDate
    ? (checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60)
    : 0
  const totalCost = durationHours * room.price_per_hour
  const calendarDays = eachDayOfInterval({
    start: startOfWeek(startOfMonth(calendarMonth), { weekStartsOn: 0 }),
    end: endOfWeek(endOfMonth(calendarMonth), { weekStartsOn: 0 })
  })
  const yearOptions = Array.from({ length: 11 }, (_, index) => getYear(new Date()) - 5 + index)

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node

      if (
        showDatePicker &&
        datePickerRef.current &&
        !datePickerRef.current.contains(target) &&
        dateTriggerRef.current &&
        !dateTriggerRef.current.contains(target)
      ) {
        setShowDatePicker(false)
        setActiveDateMenu(null)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [showDatePicker])

  function handleDateSelect(date: Date) {
    const nextBookingDate = format(date, 'yyyy-MM-dd')
    const nextStartTime = nextBookingDate === todayValue && startTime < minimumTodayStartTime
      ? minimumTodayStartTime
      : startTime
    const nextMinimumEndTime = getMinimumEndTime(nextStartTime)

    setBookingDate(nextBookingDate)
    setStartTime(nextStartTime)

    if (endTime < nextMinimumEndTime) {
      setEndTime(nextMinimumEndTime)
    }

    setCalendarMonth(date)
    setShowDatePicker(false)
    setActiveDateMenu(null)
  }

  function handleStartTimeChange(value: string) {
    const normalizedValue = normalizeTimeInput(value)
    const clampedValue = normalizedValue > MAX_START_TIME ? MAX_START_TIME : normalizedValue
    const nextStartTime = bookingDate === todayValue && clampedValue < minimumTodayStartTime
      ? minimumTodayStartTime
      : clampedValue
    const nextMinimumEndTime = getMinimumEndTime(nextStartTime)

    setStartTime(nextStartTime)

    if (endTime < nextMinimumEndTime) {
      setEndTime(nextMinimumEndTime)
    }
  }

  function handleEndTimeChange(value: string) {
    const normalizedValue = normalizeTimeInput(value)
    const clampedValue = normalizedValue > MAX_END_TIME ? MAX_END_TIME : normalizedValue
    setEndTime(clampedValue < minimumEndTime ? minimumEndTime : clampedValue)
  }

  async function handleBooking() {
    setError('')
    setSuccess('')

    if (!room.is_available) {
      setError('Ruangan ini sedang tidak tersedia untuk booking.')
      return
    }

    const storedUser = localStorage.getItem('user')
    if (!storedUser) {
      router.push('/auth/login')
      return
    }

    let user: User

    try {
      user = JSON.parse(storedUser) as User
    } catch {
      setError('Sesi login tidak valid. Silakan login ulang.')
      router.push('/auth/login')
      return
    }

    if (!bookingDate || !startTime || !endTime) {
      setError('Tanggal dan waktu booking wajib diisi.')
      return
    }

    if (!checkInDate || !checkOutDate || checkOutDate <= checkInDate) {
      setError('Jam selesai harus lebih besar dari jam mulai.')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user_id: user.user_id,
          room_id: room.room_id,
          date: bookingDate,
          start_time: startTime,
          end_time: endTime,
          notes: facilityRequest,
          additional_message: facilityRequest
        })
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Booking gagal diproses.')
      }

      setSuccess(result.message || 'Booking berhasil dibuat.')
      setTimeout(() => {
        router.push('/customer/bookings')
      }, 900)
    } catch (bookingError) {
      setError(
        bookingError instanceof Error
          ? bookingError.message
          : 'Terjadi kesalahan saat membuat booking.'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <aside className="room-booking-panel">
      <div className="room-booking-head">
        <span className={`room-booking-status ${room.is_available ? 'available' : 'unavailable'}`}>
          {room.is_available ? 'Tersedia' : 'Tidak tersedia'}
        </span>
        <div className="room-booking-price">
          <strong>{formatRupiah(room.price_per_hour)}</strong>
          <span>/jam</span>
        </div>
        <p>
          {userName
            ? `Booking cepat atas nama ${userName}.`
            : 'Login customer akan dipakai otomatis saat membuat booking.'}
        </p>
      </div>

      <div className="room-booking-grid">
        <div className="room-booking-field full room-booking-date-field" ref={datePickerRef}>
          <span>Tanggal booking</span>
          <button
            ref={dateTriggerRef}
            type="button"
            className="sf-date-trigger room-booking-date-trigger"
            onClick={() => {
              setCalendarMonth(selectedDate ?? new Date())
              setActiveDateMenu(null)
              setShowDatePicker(prev => !prev)
            }}
          >
            <span className={`sf-date-value room-booking-date-value${bookingDate ? ' has-value' : ''}`}>
              {selectedDate ? format(selectedDate, 'dd/MM/yyyy') : 'dd/mm/yyyy'}
            </span>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </button>

          {showDatePicker && (
            <div className="sf-date-dropdown room-booking-date-dropdown">
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
                  const isPastDay = day < getStartOfToday()

                  return (
                    <button
                      key={day.toISOString()}
                      type="button"
                      className={`sf-date-cell${isSelectedDay ? ' selected' : ''}${isCurrentMonth ? '' : ' muted'}`}
                      onClick={() => handleDateSelect(day)}
                      disabled={isPastDay}
                    >
                      {format(day, 'd')}
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        <label className="room-booking-field">
          <span>Jam mulai</span>
          <input
            type="time"
            step={1800}
            value={startTime}
            min={bookingDate === todayValue ? minimumTodayStartTime : '00:00'}
            max={MAX_START_TIME}
            onChange={event => handleStartTimeChange(event.target.value)}
          />
        </label>

        <label className="room-booking-field">
          <span>Jam selesai</span>
          <input
            type="time"
            step={1800}
            value={endTime}
            min={minimumEndTime}
            max={MAX_END_TIME}
            onChange={event => handleEndTimeChange(event.target.value)}
          />
        </label>

        <label className="room-booking-field full">
          <span>PESAN TAMBAHAN</span>
          <textarea
            rows={4}
            value={facilityRequest}
            onChange={event => setFacilityRequest(event.target.value)}
            placeholder="Contoh: mohon siapkan whiteboard tambahan, kabel HDMI, atau power strip."
          />
        </label>
      </div>

      <div className="room-booking-summary">
        <div>
          <span>Durasi</span>
          <strong>{durationHours > 0 ? `${durationHours} jam` : '-'}</strong>
        </div>
        <div>
          <span>Estimasi total</span>
          <strong>{durationHours > 0 ? formatRupiah(totalCost) : '-'}</strong>
        </div>
      </div>

      {error && <p className="room-booking-feedback error">{error}</p>}
      {success && <p className="room-booking-feedback success">{success}</p>}

      <button
        type="button"
        className="room-booking-button"
        disabled={isSubmitting || !room.is_available}
        onClick={handleBooking}
      >
        {isSubmitting ? 'Memproses booking...' : 'Booking sekarang'}
      </button>
    </aside>
  )
}
