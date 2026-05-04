'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  getMonth,
  getYear,
  isSameDay,
  isSameMonth,
  parseISO,
  setMonth,
  setYear,
  startOfMonth,
  startOfWeek,
  subMonths
} from 'date-fns'
import { id as localeId } from 'date-fns/locale'
import { useRouter } from 'next/navigation'
import { RoomDetail, User } from '@/types'
import '@/styles/dashboard.css'

interface Props {
  room: RoomDetail
}

type AvailabilityState = 'idle' | 'available' | 'unavailable' | 'invalid'

type ActiveBooking = {
  bookingId: string
  checkIn: Date
  checkOut: Date
}

const WEEK_DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
const MONTH_OPTIONS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const BOOKING_TIME_STEP_MINUTES = 30
const MAX_START_TIME = '23:00'
const MAX_END_TIME = '23:30'
const SCHEDULE_OPEN_HOUR = 8
const SCHEDULE_CLOSE_HOUR = 22

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

function toMinutes(value: string) {
  const [hours, minutes] = value.split(':').map(Number)
  return (hours * 60) + minutes
}

function fromMinutes(totalMinutes: number) {
  const hours = String(Math.floor(totalMinutes / 60)).padStart(2, '0')
  const minutes = String(totalMinutes % 60).padStart(2, '0')
  return `${hours}:${minutes}`
}

function buildTimeOptions(minValue: string, maxValue: string) {
  const options: string[] = []
  const minMinutes = toMinutes(minValue)
  const maxMinutes = toMinutes(maxValue)

  for (let current = minMinutes; current <= maxMinutes; current += BOOKING_TIME_STEP_MINUTES) {
    options.push(fromMinutes(current))
  }

  return options
}

function isOverlapping(startDate: Date, endDate: Date, booking: ActiveBooking) {
  return startDate < booking.checkOut && endDate > booking.checkIn
}

export default function RoomBookingPanel({ room }: Props) {
  const router = useRouter()
  const [bookingDate, setBookingDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [facilityRequest, setFacilityRequest] = useState('')
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [calendarMonth, setCalendarMonth] = useState(() => new Date())
  const [activeDateMenu, setActiveDateMenu] = useState<'month' | 'year' | null>(null)
  const [showScheduleModal, setShowScheduleModal] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
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
  const [fieldErrors, setFieldErrors] = useState({ date: false, startTime: false, endTime: false })
  const datePickerRef = useRef<HTMLDivElement | null>(null)
  const dateTriggerRef = useRef<HTMLButtonElement | null>(null)

  const selectedDate = bookingDate ? parseISO(bookingDate) : null
  const nextAvailableSlot = roundUpToBookingSlot()
  const todayValue = getTodayValue()
  const minimumTodayStartTime = formatTimeValue(nextAvailableSlot)
  const minimumStartTime = bookingDate === todayValue ? minimumTodayStartTime : '00:00'
  const minimumEndTime = startTime ? getMinimumEndTime(startTime) : getMinimumEndTime(minimumStartTime)
  const calendarDays = eachDayOfInterval({
    start: startOfWeek(startOfMonth(calendarMonth), { weekStartsOn: 0 }),
    end: endOfWeek(endOfMonth(calendarMonth), { weekStartsOn: 0 })
  })
  const yearOptions = Array.from({ length: 11 }, (_, index) => getYear(new Date()) - 5 + index)

  const activeBookings = useMemo<ActiveBooking[]>(() => {
    return (room.upcoming_bookings ?? [])
      .map(booking => {
        const checkIn = new Date(booking.check_in)
        const checkOut = new Date(booking.check_out)

        if (Number.isNaN(checkIn.getTime()) || Number.isNaN(checkOut.getTime())) {
          return null
        }

        return {
          bookingId: booking.booking_id,
          checkIn,
          checkOut
        }
      })
      .filter((booking): booking is ActiveBooking => booking !== null)
  }, [room.upcoming_bookings])

  const startTimeOptions = useMemo(() => buildTimeOptions(minimumStartTime, MAX_START_TIME), [minimumStartTime])
  const endTimeOptions = useMemo(() => buildTimeOptions(minimumEndTime, MAX_END_TIME), [minimumEndTime])
  const effectiveStartTime = startTime && startTimeOptions.includes(startTime) ? startTime : ''
  const effectiveEndTime = endTime && endTimeOptions.includes(endTime) ? endTime : ''
  const checkInDate = bookingDate && effectiveStartTime ? new Date(`${bookingDate}T${effectiveStartTime}:00`) : null
  const checkOutDate = bookingDate && effectiveEndTime ? new Date(`${bookingDate}T${effectiveEndTime}:00`) : null
  const durationHours = checkInDate && checkOutDate && checkOutDate > checkInDate
    ? (checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60)
    : 0
  const totalCost = durationHours * room.price_per_hour
  const slotAvailability: { state: AvailabilityState; message: string } = (() => {
    if (!bookingDate || !effectiveStartTime || !effectiveEndTime) {
      return {
        state: 'idle',
        message: 'Pilih tanggal dan jam untuk melihat ketersediaan ruangan'
      }
    }

    if (!checkInDate || !checkOutDate || checkOutDate <= checkInDate) {
      return {
        state: 'invalid',
        message: 'Jam selesai harus lebih besar dari jam mulai.'
      }
    }

    if (!room.is_available) {
      return {
        state: 'unavailable',
        message: 'Ruangan sedang tidak tersedia untuk dibooking.'
      }
    }

    const hasConflict = activeBookings.some(booking => isOverlapping(checkInDate, checkOutDate, booking))

    if (hasConflict) {
      return {
        state: 'unavailable',
        message: 'Ruangan sudah dibook pada jam yang Anda pilih.'
      }
    }

    return {
      state: 'available',
      message: 'Ruangan tersedia pada jam yang Anda pilih!'
    }
  })()
  const scheduleSlots: Array<{ label: string; isBooked: boolean }> = (() => {
    if (!bookingDate) {
      return []
    }

    const slots: Array<{ label: string; isBooked: boolean }> = []

    for (let hour = SCHEDULE_OPEN_HOUR; hour < SCHEDULE_CLOSE_HOUR; hour += 1) {
      const slotStart = new Date(`${bookingDate}T${String(hour).padStart(2, '0')}:00:00`)
      const slotEnd = new Date(`${bookingDate}T${String(hour + 1).padStart(2, '0')}:00:00`)
      const isBooked = activeBookings.some(booking => isOverlapping(slotStart, slotEnd, booking))

      slots.push({
        label: `${format(slotStart, 'HH:mm')} - ${format(slotEnd, 'HH:mm')}`,
        isBooked
      })
    }

    return slots
  })()

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
    const nextStartTime = nextBookingDate === todayValue && startTime && startTime < minimumTodayStartTime
      ? minimumTodayStartTime
      : startTime

    setBookingDate(nextBookingDate)
    setStartTime(nextStartTime)

    if (endTime && nextStartTime) {
      const nextMinimumEndTime = getMinimumEndTime(nextStartTime)
      if (endTime < nextMinimumEndTime) {
        setEndTime(nextMinimumEndTime)
      }
    }

    setCalendarMonth(date)
    setShowDatePicker(false)
    setActiveDateMenu(null)
    setError('')
    setFieldErrors(prev => ({ ...prev, date: false }))
  }

  function handleStartTimeChange(value: string) {
    const normalizedValue = normalizeTimeInput(value)
    const clampedValue = normalizedValue > MAX_START_TIME ? MAX_START_TIME : normalizedValue
    const nextStartTime = bookingDate === todayValue && clampedValue < minimumTodayStartTime
      ? minimumTodayStartTime
      : clampedValue
    const nextMinimumEndTime = getMinimumEndTime(nextStartTime)

    setStartTime(nextStartTime)

    if (endTime && endTime < nextMinimumEndTime) {
      setEndTime(nextMinimumEndTime)
    }

    setError('')
    setFieldErrors(prev => ({ ...prev, startTime: false }))
  }

  function handleEndTimeChange(value: string) {
    const normalizedValue = normalizeTimeInput(value)
    const clampedValue = normalizedValue > MAX_END_TIME ? MAX_END_TIME : normalizedValue
    setEndTime(clampedValue < minimumEndTime ? minimumEndTime : clampedValue)
    setError('')
    setFieldErrors(prev => ({ ...prev, endTime: false }))
  }

  function openScheduleModal() {
    if (!bookingDate) {
      setError('Pilih tanggal terlebih dahulu untuk melihat jadwal ruangan.')
      return
    }

    setError('')
    setShowScheduleModal(true)
  }

  function handleOpenConfirmBooking() {
    setError('')
    setSuccess('')
    setFieldErrors({ date: false, startTime: false, endTime: false })

    if (!room.is_available) {
      setError('Ruangan ini sedang tidak tersedia untuk booking.')
      return
    }

    // Validate required fields
    const errors = {
      date: !bookingDate,
      startTime: !effectiveStartTime,
      endTime: !effectiveEndTime
    }

    if (errors.date || errors.startTime || errors.endTime) {
      setFieldErrors(errors)
      const missingFields = []
      if (errors.date) missingFields.push('Tanggal')
      if (errors.startTime) missingFields.push('Waktu mulai')
      if (errors.endTime) missingFields.push('Waktu selesai')
      setError(`Field wajib harus diisi: ${missingFields.join(', ')}`)
      return
    }

    if (!checkInDate || !checkOutDate || checkOutDate <= checkInDate) {
      setError('Jam selesai harus lebih besar dari jam mulai.')
      return
    }

    if (slotAvailability.state !== 'available') {
      setError('Jadwal yang dipilih belum tersedia. Silakan pilih slot lain.')
      return
    }

    setShowConfirmModal(true)
  }

  async function submitBooking() {
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
          start_time: effectiveStartTime,
          end_time: effectiveEndTime,
          notes: facilityRequest,
          additional_message: facilityRequest
        })
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Booking gagal diproses.')
      }

      setSuccess(result.message || 'Booking berhasil dibuat.')
      const createdBookingId = result?.data?.booking_id as string | null | undefined
      setShowConfirmModal(false)
      setTimeout(() => {
        if (createdBookingId) {
          router.push(`/customer/payments/${createdBookingId}`)
          return
        }

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
    <>
      <aside className="customer-room-booking-panel">
        <div className="customer-room-booking-head">
          <h2>Booking Ruangan</h2>
          <p>Atas nama <strong>{userName || 'Customer'}</strong></p>
          <div className="customer-room-info-message">
            <span className="customer-room-info-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" />
                <rect x="11" y="5.5" width="2" height="9" rx="1" fill="currentColor" />
                <circle cx="12" cy="17" r="1.2" fill="currentColor" />
              </svg>
            </span>
            <p>Pilih tanggal dan jam untuk melihat ketersediaan ruangan</p>
          </div>
        </div>

        <div className="customer-room-booking-grid">
          <div className={`room-booking-field full room-booking-date-field${fieldErrors.date ? ' has-error' : ''}`} ref={datePickerRef}>
            <span className="required-field-label">
              Pilih tanggal
              <svg className="required-star" width="12" height="12" viewBox="0 0 24 24" fill="#ff1c1c">
                <path d="M12 2L14.09 8.26L20.18 9.27L15.54 13.14L16.82 19.02L12 15.77L7.18 19.02L8.46 13.14L3.82 9.27L9.91 8.26L12 2Z"/>
              </svg>
            </span>
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

          <div className="room-booking-time-row">
            <div className={`room-booking-field${fieldErrors.startTime ? ' has-error' : ''}`}>
              <span className="required-field-label">
                Waktu mulai
                <svg className="required-star" width="12" height="12" viewBox="0 0 24 24" fill="#ff1c1c">
                  <path d="M12 2L14.09 8.26L20.18 9.27L15.54 13.14L16.82 19.02L12 15.77L7.18 19.02L8.46 13.14L3.82 9.27L9.91 8.26L12 2Z"/>
                </svg>
              </span>
              <div className="customer-room-select-wrap">
                <select value={effectiveStartTime} onChange={event => handleStartTimeChange(event.target.value)}>
                  <option value="">--:--</option>
                  {startTimeOptions.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className={`room-booking-field${fieldErrors.endTime ? ' has-error' : ''}`}>
              <span className="required-field-label">
                Waktu selesai
                <svg className="required-star" width="12" height="12" viewBox="0 0 24 24" fill="#ff1c1c">
                  <path d="M12 2L14.09 8.26L20.18 9.27L15.54 13.14L16.82 19.02L12 15.77L7.18 19.02L8.46 13.14L3.82 9.27L9.91 8.26L12 2Z"/>
                </svg>
              </span>
              <div className="customer-room-select-wrap">
                <select value={effectiveEndTime} onChange={event => handleEndTimeChange(event.target.value)}>
                  <option value="">--:--</option>
                  {endTimeOptions.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
            </div>

            <button type="button" className="customer-room-view-schedule" onClick={openScheduleModal}>
              Lihat jadwal
            </button>
          </div>

          {/* Availability banner - only show when date and times are selected */}
          {slotAvailability.state !== 'idle' && (
            <div className={`customer-room-availability-banner ${slotAvailability.state}`}>
              <span className="customer-room-availability-icon" aria-hidden="true">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  {/* Lingkaran outline tebal */}
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" />
                  {/* Batang tanda seru */}
                  <rect x="11" y="5.5" width="2" height="9" rx="1" fill="currentColor" />
                  {/* Titik tanda seru */}
                  <circle cx="12" cy="17" r="1.2" fill="currentColor" />
                </svg>
              </span>
              <p>{slotAvailability.message}</p>
            </div>
          )}

          <label className="room-booking-field full">
            <span>Tambahkan pesan</span>
            <textarea
              rows={4}
              value={facilityRequest}
              onChange={event => setFacilityRequest(event.target.value)}
              placeholder="Contoh: saya butuh tambahan whiteboard dan spidol berwarna merah"
            />
          </label>
        </div>

        {/* Error message display */}
        {error && (
          <div className="customer-room-booking-error">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ff1c1c" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <span>{error}</span>
          </div>
        )}

        <div className="customer-room-booking-summary">
          <div>
            <span>Durasi</span>
            <strong>{durationHours > 0 ? `${durationHours} jam` : '-'}</strong>
          </div>
          <div>
            <span>Estimasi total</span>
            <strong>{durationHours > 0 ? `Rp ${new Intl.NumberFormat('id-ID').format(totalCost)}` : '-'}</strong>
          </div>
        </div>

        <button
          type="button"
          className="room-booking-button customer-room-booking-button"
          disabled={isSubmitting || !room.is_available}
          onClick={handleOpenConfirmBooking}
        >
          {isSubmitting ? 'Memproses booking...' : 'Booking Sekarang'}
        </button>
      </aside>

      {showScheduleModal && (
        <div className="customer-room-modal-backdrop" role="presentation" onClick={() => setShowScheduleModal(false)}>
          <div className="customer-room-schedule-modal" role="dialog" aria-modal="true" onClick={event => event.stopPropagation()}>
            <div className="customer-room-schedule-head">
              <h3>Jadwal Ruangan</h3>
              <p>
                <strong>{room.name}</strong>
                <span>&nbsp;• {selectedDate ? format(selectedDate, 'd MMMM yyyy', { locale: localeId }) : '-'}</span>
              </p>
            </div>

            <div className="customer-room-schedule-list">
              {scheduleSlots.map(slot => (
                <div key={slot.label} className="customer-room-schedule-row">
                  <span>{slot.label}</span>
                  <strong className={slot.isBooked ? 'booked' : 'available'}>
                    {slot.isBooked ? 'Sudah dibook' : 'Tersedia'}
                  </strong>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {showConfirmModal && (
        <div className="customer-room-modal-backdrop" role="presentation" onClick={() => setShowConfirmModal(false)}>
          <div className="customer-room-confirm-modal" role="dialog" aria-modal="true" onClick={event => event.stopPropagation()}>
            <div className="customer-room-confirm-icon">
              <svg width="70" height="70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M3 20h6l.8-3H3z" />
                <path d="m9.8 17 5.9-2.1c.8-.3 1.7.2 2 1 .3.8-.2 1.7-1 2l-4.7 1.7H8.9" />
                <path d="M14 11c1.7 0 3-1.3 3-3s-1.3-3-3-3-3 1.3-3 3 1.3 3 3 3Z" />
              </svg>
            </div>

            <h4>Booking sekarang?</h4>
            <p>Pastikan jadwal dan detail ruangan sudah sesuai sebelum lanjut ke pembayaran</p>

            <div className="customer-room-confirm-actions">
              <button type="button" className="cancel" onClick={() => setShowConfirmModal(false)}>
                Tidak
              </button>
              <button type="button" className="confirm" onClick={submitBooking} disabled={isSubmitting}>
                {isSubmitting ? 'Memproses...' : 'Ya'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

