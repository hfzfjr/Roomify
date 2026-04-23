import { BookingStatus } from '@/types'

export const BOOKING_PAYMENT_WINDOW_MINUTES = 30

function toDate(value: string | Date) {
  if (value instanceof Date) {
    return new Date(value)
  }

  return new Date(value.includes('T') ? value : value.replace(' ', 'T'))
}

export function getPaymentDeadline(bookingDate: string | Date) {
  const baseDate = toDate(bookingDate)
  return new Date(baseDate.getTime() + BOOKING_PAYMENT_WINDOW_MINUTES * 60 * 1000)
}

export function getRemainingPaymentMs(bookingDate: string | Date, now: Date | number = new Date()) {
  const deadline = getPaymentDeadline(bookingDate).getTime()
  const currentTime = now instanceof Date ? now.getTime() : now
  return Math.max(0, deadline - currentTime)
}

export function isPendingPaymentExpired(status: BookingStatus | string, bookingDate?: string | null, now: Date | number = new Date()) {
  if (status !== 'pending' || !bookingDate) {
    return false
  }

  return getRemainingPaymentMs(bookingDate, now) <= 0
}

export function formatPaymentCountdown(remainingMs: number) {
  const totalSeconds = Math.max(0, Math.floor(remainingMs / 1000))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60

  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}
