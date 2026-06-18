'use client'

import { useState, useEffect } from 'react'
import { formatDateLong } from '@/utils/formatDate'
import './ReviewRoomOverlay.css'

interface ReviewRoomOverlayProps {
  isOpen: boolean
  onClose: () => void
  roomName?: string
  bookingId?: string
  bookingDate?: string
  roomId?: string
  userId?: string
}

export default function ReviewRoomOverlay({ isOpen, onClose, roomName, bookingId, bookingDate, roomId, userId }: ReviewRoomOverlayProps) {
  const [rating, setRating] = useState(0)
  const [review, setReview] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [showSuccess, setShowSuccess] = useState(false)
  const [hasReviewed, setHasReviewed] = useState(false)
  const [loadingReview, setLoadingReview] = useState(false)

  // Check if user has already reviewed this booking
  useEffect(() => {
    if (!isOpen || !bookingId || !userId) return

    async function checkExistingReview() {
      setLoadingReview(true)
      try {
        const response = await fetch(`/api/reviews?booking_id=${bookingId}`)
        const result = await response.json()

        if (response.ok && result.success && result.data) {
          const existingReview = result.data
          setRating(existingReview.rating)
          setReview(existingReview.review || '')
          setHasReviewed(true)
        } else {
          setRating(0)
          setReview('')
          setHasReviewed(false)
        }
      } catch (error) {
        console.error('Error checking existing review:', error)
        setRating(0)
        setReview('')
        setHasReviewed(false)
      } finally {
        setLoadingReview(false)
      }
    }

    checkExistingReview()
  }, [isOpen, bookingId, userId])

  // Reset form when overlay closes
  useEffect(() => {
    if (!isOpen) {
      setRating(0)
      setReview('')
      setSuccessMessage('')
      setShowSuccess(false)
      setHasReviewed(false)
    }
  }, [isOpen])

  if (!isOpen) return null

  async function handleSubmit() {
    if (rating === 0) {
      alert('Mohon berikan rating')
      return
    }

    if (!bookingId || !roomId || !userId) {
      alert('Data booking tidak lengkap')
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          booking_id: bookingId,
          room_id: roomId,
          user_id: userId,
          rating,
          comment: review,
        }),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Gagal mengirim ulasan')
      }

      setSuccessMessage('Ulasan berhasil dikirim')
      setShowSuccess(true)
      setHasReviewed(true)

      setTimeout(() => {
        onClose()
        setSuccessMessage('')
        setShowSuccess(false)
        setRating(0)
        setReview('')
        setHasReviewed(false)
      }, 3000)
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Gagal mengirim ulasan')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="review-room-overlay" onClick={onClose}>
      <div className="review-room-modal" onClick={(e) => e.stopPropagation()}>
        <div className="review-room-header">
          <h2>Review & Feedback</h2>
          <button type="button" className="review-room-close" onClick={onClose}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="review-room-content">
          <div className="review-room-info">
            <p>Ruang: <strong>{roomName || '-'}</strong></p>
            <p>Tanggal Booking: <strong>{bookingDate ? formatDateLong(bookingDate) : '-'}</strong></p>
          </div>

          <div className="review-room-form">
            <div className="review-room-field">
              <label>Rating</label>
              <div className="review-room-stars">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    className={`review-room-star ${star <= rating ? 'active' : ''}`}
                    onClick={() => !hasReviewed && setRating(star)}
                    disabled={hasReviewed || loadingReview}
                  >
                    <svg width="32" height="32" viewBox="0 0 24 24" fill={star <= rating ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                  </button>
                ))}
              </div>
            </div>

            <div className="review-room-field">
              <label>Ulasan</label>
              <textarea
                rows={5}
                value={review}
                onChange={(e) => !hasReviewed && setReview(e.target.value)}
                placeholder="Bagikan pengalaman Anda menggunakan ruangan ini..."
                disabled={hasReviewed || loadingReview}
              />
              {showSuccess && (
                <p className="review-room-success-message">{successMessage}</p>
              )}
              {hasReviewed && !showSuccess && (
                <p className="review-room-success-message" style={{ color: '#6b7280' }}>
                  Anda sudah memberikan ulasan untuk booking ini
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="review-room-footer">
          <button
            type="button"
            className="review-room-btn review-room-btn-cancel"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Batal
          </button>
          <button
            type="button"
            className="review-room-btn review-room-btn-submit"
            onClick={handleSubmit}
            disabled={isSubmitting || hasReviewed || loadingReview}
          >
            {hasReviewed ? 'Sudah Direview' : isSubmitting ? 'Mengirim...' : 'Kirim Ulasan'}
          </button>
        </div>
      </div>
    </div>
  )
}
