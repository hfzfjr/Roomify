'use client'

import { useState, useEffect } from 'react'
import BackButton from '@/components/ui/BackButton'
import styles from './page.module.css'

type Review = {
  id: string
  roomName: string
  rating: number
  review: string
  date: string
}

export default function ReviewPage() {
  const [selectedRooms, setSelectedRooms] = useState<string[]>(['semua'])
  const [selectedRatings, setSelectedRatings] = useState<string[]>(['semua'])
  const [rooms, setRooms] = useState<string[]>([])
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const response = await fetch('/api/reviews')
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch reviews')
      }

      console.log('API response:', data)

      setRooms(data.rooms || [])
      setReviews(data.reviews || [])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredReviews = reviews.filter((r) => {
    const roomMatch = selectedRooms.includes('semua') || selectedRooms.includes(r.roomName)
    const ratingMatch = selectedRatings.includes('semua') || selectedRatings.includes(r.rating.toString())
    return roomMatch && ratingMatch
  })

  const handleRoomToggle = (room: string) => {
    setSelectedRooms((prev) => {
      if (room === 'semua') {
        // If selecting 'semua', select all rooms
        return ['semua', ...rooms]
      }
      const newSelection = prev.includes(room)
        ? prev.filter((r) => r !== room && r !== 'semua')
        : [...prev.filter((r) => r !== 'semua'), room]
      
      // If no rooms selected, default to 'semua'
      return newSelection.length === 0 ? ['semua'] : newSelection
    })
  }

  const handleRatingToggle = (rating: string) => {
    setSelectedRatings((prev) => {
      if (rating === 'semua') {
        // If selecting 'semua', select all ratings
        return ['semua', '1', '2', '3', '4', '5']
      }
      const newSelection = prev.includes(rating)
        ? prev.filter((r) => r !== rating && r !== 'semua')
        : [...prev.filter((r) => r !== 'semua'), rating]
      
      // If no ratings selected, default to 'semua'
      return newSelection.length === 0 ? ['semua'] : newSelection
    })
  }

  const renderStars = (rating: number) =>
    Array.from({ length: 5 }, (_, i) => (
      <span key={i} className={i < rating ? styles.starFilled : styles.starEmpty}>
        ★
      </span>
    ))

  return (
    <div className={styles.container}>
      <BackButton href="/owner/dashboard" title="Review & Feedback" />

      <div className={styles.body}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '48px', color: '#888' }}>
            Memuat data...
          </div>
        ) : (
          <>
            {/* Summary Card */}
            <div className={styles.summaryCard}>
              <h2>Ringkasan Performa Keseluruhan</h2>
              <div className={styles.summaryStats}>
                <div className={styles.statItem}>
                  Total Ulasan: <strong>{reviews.length} ulasan</strong>
                </div>
                <div className={styles.statItem}>
                  Rata-rata Rating:
                  <span className={styles.statStar}>★</span>
                  <strong>
                    {reviews.length > 0
                      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
                      : '0'}/5.0
                  </strong>
                </div>
              </div>
            </div>

        {/* Sort Row */}
        <div className={styles.sortRow}>
          <span className={styles.sortLabel}>Urutkan Berdasarkan:</span>
          <button className={styles.sortDropdown}>
            Harga terendah
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>
        </div>

        {/* Main Grid */}
        <div className={styles.mainGrid}>
          {/* Sidebar */}
          <div className={styles.sidebar}>
            {/* Room Filter Box */}
            <div className={styles.filterBox}>
              <p className={styles.filterGroupTitle}>Ruangan</p>

              {/* Semua Ruangan */}
              <div
                className={`${styles.filterOption} ${selectedRooms.includes('semua') ? styles.active : ''}`}
                onClick={() => handleRoomToggle('semua')}
              >
                <div className={styles.checkbox}>
                  {selectedRooms.includes('semua') && (
                    <svg width="11" height="9" viewBox="0 0 11 9" fill="none">
                      <path
                        d="M1 4L4 7L10 1"
                        stroke="#fff"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </div>
                <span className={styles.filterLabel}>Semua</span>
              </div>

              {rooms.map((room) => (
                <div
                  key={room}
                  className={`${styles.filterOption} ${selectedRooms.includes(room) ? styles.active : ''}`}
                  onClick={() => handleRoomToggle(room)}
                >
                  <div className={styles.checkbox}>
                    {selectedRooms.includes(room) && (
                      <svg width="11" height="9" viewBox="0 0 11 9" fill="none">
                        <path
                          d="M1 4L4 7L10 1"
                          stroke="#fff"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </div>
                  <span className={styles.filterLabel}>{room}</span>
                </div>
              ))}
            </div>

            {/* Rating Filter Box */}
            <div className={styles.filterBox}>
              <p className={styles.filterGroupTitle}>Rating</p>

              {/* Semua Rating */}
              <div
                className={`${styles.filterOption} ${selectedRatings.includes('semua') ? styles.active : ''}`}
                onClick={() => handleRatingToggle('semua')}
              >
                <div className={styles.checkbox}>
                  {selectedRatings.includes('semua') && (
                    <svg width="11" height="9" viewBox="0 0 11 9" fill="none">
                      <path
                        d="M1 4L4 7L10 1"
                        stroke="#fff"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </div>
                <span className={styles.filterLabel}>Semua</span>
              </div>

              {[5, 4, 3, 2, 1].map((star) => (
                <div
                  key={star}
                  className={`${styles.filterOption} ${selectedRatings.includes(star.toString()) ? styles.active : ''}`}
                  onClick={() => handleRatingToggle(star.toString())}
                >
                  <div className={styles.checkbox}>
                    {selectedRatings.includes(star.toString()) && (
                      <svg width="11" height="9" viewBox="0 0 11 9" fill="none">
                        <path
                          d="M1 4L4 7L10 1"
                          stroke="#fff"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </div>
                  <span className={styles.filterLabel}>
                    {star} <span className={styles.filterStarIcon}>★</span>
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Reviews */}
          <div className={styles.reviewsContainer}>
            {filteredReviews.map((review) => (
              <div key={review.id} className={styles.reviewCard}>
                <div className={styles.reviewRow}>
                  <span className={styles.reviewKey}>Ruang</span>
                  <span className={styles.reviewColon}>:</span>
                  <span className={styles.reviewRoomName}>{review.roomName}</span>
                </div>
                <div className={styles.reviewRow} style={{ marginBottom: '8px' }}>
                  <span className={styles.reviewKey}>Rating</span>
                  <span className={styles.reviewColon}>:</span>
                  <div className={styles.reviewStars}>{renderStars(review.rating)}</div>
                </div>
                <p className={styles.reviewLabel}>Review :</p>
                <div className={styles.reviewTextBox}>{review.review}</div>
                <div className={styles.reviewFooter}>
                  <button className={styles.replyButton}>
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#fff"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M9 14L4 9l5-5" />
                      <path d="M4 9h10.5a5.5 5.5 0 010 11H11" />
                    </svg>
                    Balas
                  </button>
                </div>
              </div>
            ))}

            {filteredReviews.length === 0 && (
              <div
                style={{
                  textAlign: 'center',
                  padding: '48px',
                  color: '#888',
                  background: '#fff',
                  borderRadius: '16px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                }}
              >
                Tidak ada review yang sesuai filter.
              </div>
            )}
          </div>
        </div>
          </>
        )}
      </div>
    </div>
  )
}