'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { formatDate, formatTime } from '@/utils/formatDate'
import { formatRupiah } from '@/utils/formatRupiah'
import '@/styles/rooms.css'

type PaymentMethod = 'qris' | 'bca_va' | 'bni_va' | 'gopay'

type PaymentDetailResponse = {
  booking: {
    booking_id: string
    booking_date: string
    check_in: string
    check_out: string
    total_cost: number
    status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
    notes?: string | null
    payment_due_at?: string | null
  }
  room: {
    room_id: string
    name: string
    location: string
    capacity: number
    type?: string | null
    price_per_hour: number
    description?: string | null
    image_url?: string | null
    images: string[]
    facilities: string[]
  }
  customer: {
    name: string
    email: string
  }
  summary: {
    price_per_hour: number
    duration_hours: number
    subtotal: number
    service_fee: number
    tax_amount: number
    total_payment: number
  }
}

const PAYMENT_METHODS: Array<{ value: PaymentMethod; label: string; caption: string; logo?: string }> = [
  { value: 'qris', label: 'QRIS', caption: '', logo: '/images/payment/logo-qris.svg' },
  { value: 'bca_va', label: 'Transfer Virtual Account Bank BCA', caption: '', logo: '/images/payment/logo-bca.png' },
  { value: 'bni_va', label: 'Transfer Virtual Account Bank BNI', caption: '', logo: '/images/payment/logo-bni.png' },
  { value: 'gopay', label: 'GoPay', caption: '', logo: '/images/payment/logo-gopay.png' }
]

function getRoomTypeLabel(type?: string | null) {
  if (!type) {
    return 'Ruangan'
  }

  return type
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

function normalizeFacilityKey(value: string) {
  return value.toLowerCase().replace(/\s+/g, '_')
}

function FacilityIcon({ facility }: { facility: string }) {
  const key = normalizeFacilityKey(facility)

  if (key.includes('microphone') || key.includes('mic')) {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="9" y="2" width="6" height="12" rx="3" />
        <path d="M5 11a7 7 0 0 0 14 0" />
        <line x1="12" y1="18" x2="12" y2="22" />
      </svg>
    )
  }

  if (key.includes('whiteboard') || key.includes('board')) {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="4" width="18" height="12" rx="2" />
        <line x1="8" y1="20" x2="10" y2="16" />
        <line x1="16" y1="20" x2="14" y2="16" />
      </svg>
    )
  }

  if (key.includes('sound') || key.includes('speaker')) {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="6" y="3" width="12" height="18" rx="2" />
        <circle cx="12" cy="8" r="2.2" />
        <circle cx="12" cy="15.5" r="3.3" />
      </svg>
    )
  }

  if (key.includes('proyektor') || key.includes('projector')) {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="7" width="18" height="10" rx="2" />
        <circle cx="8" cy="12" r="2" />
        <line x1="14" y1="12" x2="18" y2="12" />
      </svg>
    )
  }

  if (key === 'ac' || key.includes('air_conditioner')) {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="5" width="18" height="6" rx="2" />
        <line x1="7" y1="15" x2="7" y2="21" />
        <line x1="12" y1="15" x2="12" y2="21" />
        <line x1="17" y1="15" x2="17" y2="21" />
      </svg>
    )
  }

  if (key.includes('wifi') || key.includes('wi-fi')) {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M2 8a16 16 0 0 1 20 0" />
        <path d="M5 12a11 11 0 0 1 14 0" />
        <path d="M8.5 15.5a6 6 0 0 1 7 0" />
        <circle cx="12" cy="19" r="1.2" fill="currentColor" stroke="none" />
      </svg>
    )
  }

  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="8" />
      <path d="M12 8v4l3 2" />
    </svg>
  )
}

export default function CustomerPaymentDetailPage() {
  const params = useParams<{ bookingId: string }>()
  const router = useRouter()
  const bookingId = params.bookingId

  const [userId] = useState(() => {
    if (typeof window === 'undefined') {
      return ''
    }

    const storedUser = localStorage.getItem('user')

    if (!storedUser) {
      return ''
    }

    try {
      const parsedUser = JSON.parse(storedUser) as { user_id: string }
      return parsedUser.user_id
    } catch {
      return ''
    }
  })
  const [detail, setDetail] = useState<PaymentDetailResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('bca_va')
  const [showCancelOverlay, setShowCancelOverlay] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)

  useEffect(() => {
    if (!userId) {
      router.push('/auth/login')
    }
  }, [router, userId])

  useEffect(() => {
    document.body.classList.add('hide-global-navbar')
    return () => {
      document.body.classList.remove('hide-global-navbar')
    }
  }, [])

  useEffect(() => {
    if (!userId || !bookingId) {
      return
    }

    let isMounted = true

    async function fetchDetail() {
      try {
        setLoading(true)
        setError('')

        const response = await fetch(`/api/payments/${bookingId}?user_id=${encodeURIComponent(userId)}`)
        const result = await response.json()

        if (!response.ok || !result.success) {
          throw new Error(result.message || 'Gagal memuat detail pembayaran.')
        }

        if (isMounted) {
          setDetail(result.data as PaymentDetailResponse)
        }
      } catch (fetchError) {
        if (isMounted) {
          setError(fetchError instanceof Error ? fetchError.message : 'Gagal memuat detail pembayaran.')
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    void fetchDetail()

    return () => {
      isMounted = false
    }
  }, [bookingId, userId])

  const bookingInfoRows = useMemo(() => {
    if (!detail) {
      return []
    }

    return [
      { label: 'Tanggal', value: formatDate(detail.booking.check_in) },
      { label: 'Jam mulai', value: formatTime(detail.booking.check_in) },
      { label: 'Jam selesai', value: formatTime(detail.booking.check_out) },
      { label: 'Durasi', value: `${detail.summary.duration_hours} jam` },
      { label: 'Nama Pemesan', value: detail.customer.name },
      { label: 'Kontak Pemesan', value: detail.customer.email }
    ]
  }, [detail])

  if (loading) {
    return (
      <div className="customer-payment-page">
        <div className="customer-payment-shell">
          <p className="rooms-empty">Memuat detail pembayaran...</p>
        </div>
      </div>
    )
  }

  if (error || !detail) {
    return (
      <div className="customer-payment-page">
        <div className="customer-payment-shell">
          <p className="rooms-empty">{error || 'Detail pembayaran tidak ditemukan.'}</p>
        </div>
      </div>
    )
  }

  const isPending = detail.booking.status === 'pending'

  async function handleCancelPayment() {
    if (!detail) {
      return
    }

    setIsCancelling(true)
    try {
      const response = await fetch('/api/bookings', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          booking_id: detail.booking.booking_id,
          user_id: userId,
          action: 'cancel'
        })
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Gagal membatalkan pembayaran.')
      }

      router.push(`/customer/rooms/${detail.room.room_id}`)
    } catch (cancelError) {
      setError(cancelError instanceof Error ? cancelError.message : 'Gagal membatalkan pembayaran.')
      setShowCancelOverlay(false)
    } finally {
      setIsCancelling(false)
    }
  }

  return (
    <div className="customer-payment-page">
      <div className="customer-payment-subheader">
        <button type="button" onClick={() => setShowCancelOverlay(true)} aria-label="Kembali">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
            <path strokeLinecap="round" strokeLinejoin="round" d="m15 18-6-6 6-6" />
          </svg>
        </button>
        <h1>Detail Pembayaran</h1>
      </div>

      <div className="customer-payment-shell">
        <div className="customer-payment-layout">
          <div className="customer-payment-main">
            <section className="customer-payment-card">
              <h2>Detail Booking</h2>
              <p>Ringkasan jadwal dan fasilitas ruangan yang dipilih</p>
              <div className="customer-payment-room-row">
                <img src={detail.room.images[0] || '/images/gambarRuangan.png'} alt={detail.room.name} />
                <div className="customer-payment-room-meta">
                  <h3>{detail.room.name}</h3>
                  <p>{detail.room.location}</p>
                </div>
                <span>{getRoomTypeLabel(detail.room.type)}</span>
              </div>

              <div className="customer-payment-info-list">
                {bookingInfoRows.map(row => (
                  <div key={row.label}>
                    <span>{row.label}</span>
                    <strong>{row.value}</strong>
                  </div>
                ))}
              </div>

              <div className="customer-payment-facilities">
                <h4>Fasilitas yang didapatkan</h4>
                <div>
                  {detail.room.facilities.length > 0 ? (
                    detail.room.facilities.map(facility => (
                      <span key={facility}>
                        <FacilityIcon facility={facility} />
                        {facility}
                      </span>
                    ))
                  ) : (
                    <p className="room-detail-muted">Belum ada fasilitas tambahan.</p>
                  )}
                </div>
              </div>
            </section>

            <section className="customer-payment-card customer-payment-method-section">
              <div className="customer-payment-method-list">
                <h2>Metode Pembayaran</h2>
                <p>Pilih salah satu metode pembayaran di bawah ini</p>
                {PAYMENT_METHODS.map(method => (
                  <label key={method.value} className={`customer-payment-method-item${selectedMethod === method.value ? ' active' : ''}`}>
                    <div className="customer-payment-method-meta">
                      {method.logo ? (
                        <img src={method.logo} alt={method.label} />
                      ) : (
                        <span className="customer-payment-method-fallback">
                          {method.label.split(' ').map(part => part[0]).join('').slice(0, 3)}
                        </span>
                      )}
                      <strong>{method.label}</strong>
                    </div>
                    <div>
                      <p>{method.caption}</p>
                    </div>
                    <input
                      type="radio"
                      name="payment_method"
                      checked={selectedMethod === method.value}
                      onChange={() => setSelectedMethod(method.value)}
                    />
                  </label>
                ))}
              </div>
            </section>
          </div>

          <aside className="customer-payment-summary">
            <div className="customer-payment-summary-lines">
              <h2>Ringkasan Pembayaran</h2>
              <div><span>Harga sewa</span><strong>{formatRupiah(detail.summary.price_per_hour)}/jam</strong></div>
              <div><span>Durasi</span><strong>{detail.summary.duration_hours} jam</strong></div>
              <div><span>Subtotal</span><strong>{formatRupiah(detail.summary.subtotal)}</strong></div>
              <div><span>Biaya layanan</span><strong>{formatRupiah(detail.summary.service_fee)}</strong></div>
              <div><span>PPN (11%)</span><strong>{formatRupiah(detail.summary.tax_amount)}</strong></div>
            </div>

            <div className="customer-payment-summary-total">
              <span>Total bayar</span>
              <strong>{formatRupiah(detail.summary.total_payment)}</strong>
            </div>

            <div className="customer-payment-summary-actions">
              <button type="button" className="secondary" onClick={() => setShowCancelOverlay(true)}>
                Kembali
              </button>
              <button
                type="button"
                className="primary"
                disabled={!isPending}
                onClick={() => router.push(`/customer/payments/${detail.booking.booking_id}/process?method=${selectedMethod}`)}
              >
                {isPending ? 'Bayar sekarang' : 'Status sudah lunas'}
              </button>
            </div>
          </aside>
        </div>
      </div>

      {showCancelOverlay && (
        <div className="customer-payment-overlay" role="presentation" onClick={() => setShowCancelOverlay(false)}>
          <div className="customer-payment-overlay-card" role="dialog" aria-modal="true" onClick={event => event.stopPropagation()}>
            <div className="customer-payment-overlay-icon">
              <svg width="62" height="62" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M17 3h4v18h-4" />
                <path d="M11 7 5 12l6 5" />
                <path d="M5 12h12" />
              </svg>
            </div>
            <h3>Batalkan pembayaran?</h3>
            <p>Semua data yang telah Anda masukkan akan hilang dan pesanan ini akan dibatalkan secara otomatis.</p>
            <div className="customer-payment-overlay-actions">
              <button type="button" onClick={() => setShowCancelOverlay(false)}>Tidak</button>
              <button type="button" className="confirm" disabled={isCancelling} onClick={handleCancelPayment}>
                {isCancelling ? 'Memproses...' : 'Ya'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
