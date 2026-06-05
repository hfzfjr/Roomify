'use client'

import { useState } from 'react'
import './ReviewRoomOverlay.css'

interface ReviewRoomOverlayProps {
  isOpen: boolean
  onClose: () => void
  roomName?: string
  bookingId?: string
}

export default function ReviewRoomOverlay({ isOpen, onClose, roomName, bookingId }: ReviewRoomOverlayProps) {
  const [rating, setRating] = useState(0)
  const [review, setReview] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!isOpen) return null

  async function handleSubmit() {
    if (rating === 0 || !review) {
      alert('Mohon berikan rating dan ulasan')
      return
    }

    setIsSubmitting(true)
    try {
      // TODO: Implement API call to submit review
      console.log('Submitting review:', { rating, review, bookingId })
      alert('Ulasan berhasil dikirim')
      onClose()
    } catch (error) {
      alert('Gagal mengirim ulasan')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="review-room-overlay" onClick={onClose}>
      <div className="review-room-modal" onClick={(e) => e.stopPropagation()}>
        <div className="review-room-header">
          <h2>Beri Ulasan</h2>
          <button type="button" className="review-room-close" onClick={onClose}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="review-room-content">
          <div className="review-room-info">
            <p>Ruangan: <strong>{roomName || '-'}</strong></p>
            <p>ID Booking: <strong>{bookingId || '-'}</strong></p>
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
                    onClick={() => setRating(star)}
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
                onChange={(e) => setReview(e.target.value)}
                placeholder="Bagikan pengalaman Anda menggunakan ruangan ini..."
                required
              />
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
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Mengirim...' : 'Kirim Ulasan'}
          </button>
        </div>
      </div>
    </div>
  )
}
