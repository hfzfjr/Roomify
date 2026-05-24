'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { formatDate, formatTime } from '@/utils/formatDate'
import { formatRupiah } from '@/utils/formatRupiah'
import BackButton from '@/components/ui/BackButton'
import '@/styles/rooms.css'
import Microphone from '@/components/icons/facility/Microphone'
import Whiteboard from '@/components/icons/facility/Whiteboard'
import SoundSystem from '@/components/icons/facility/SoundSystem'
import Proyektor from '@/components/icons/facility/Proyektor'
import AC from '@/components/icons/facility/AC'
import Podium from '@/components/icons/facility/Podium'
import Monitor from '@/components/icons/facility/Monitor'
import HDMICable from '@/components/icons/facility/HDMICable'
import Lightning from '@/components/icons/facility/Lightning'
import GreenScreen from '@/components/icons/facility/GreenScreen'
import Computer from '@/components/icons/facility/Computer'
import Wifi from '@/components/icons/facility/Wifi'
import Printer from '@/components/icons/facility/Printer'
import Locker from '@/components/icons/facility/Locker'
import CameraDSLR from '@/components/icons/facility/CameraDSLR'
import MixerAudio from '@/components/icons/facility/MixerAudio'
import SoundProofing from '@/components/icons/facility/SoundProofing'
import VideoConference from '@/components/icons/facility/VideoConference'

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

  const iconMap: Record<string, React.ReactNode> = {
    microphone: <Microphone />,
    mic: <Microphone />,
    whiteboard: <Whiteboard />,
    board: <Whiteboard />,
    sound: <SoundSystem />,
    sound_system: <SoundSystem />,
    soundsystem: <SoundSystem />,
    speaker: <SoundSystem />,
    proyektor: <Proyektor />,
    projector: <Proyektor />,
    ac: <AC />,
    air_conditioner: <AC />,
    podium: <Podium />,
    monitor: <Monitor />,
    hdmi_cable: <HDMICable />,
    hdmi: <HDMICable />,
    lighting: <Lightning />,
    light: <Lightning />,
    green_screen: <GreenScreen />,
    computer: <Computer />,
    komputer: <Computer />,
    wifi: <Wifi />,
    'wi-fi': <Wifi />,
    printer: <Printer />,
    locker: <Locker />,
    camera_dslr: <CameraDSLR />,
    kamera_dslr: <CameraDSLR />,
    camera: <CameraDSLR />,
    kamera: <CameraDSLR />,
    dslr: <CameraDSLR />,
    mixer_audio: <MixerAudio />,
    mixer: <MixerAudio />,
    sound_proofing: <SoundProofing />,
    soundproofing: <SoundProofing />,
    video_conference: <VideoConference />,
    videoconference: <VideoConference />,
  }

  return iconMap[key] || (
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
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('qris')
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
      { label: 'Tanggal', value: formatDate(detail?.booking?.check_in) },
      { label: 'Jam mulai', value: formatTime(detail?.booking?.check_in) },
      { label: 'Jam selesai', value: formatTime(detail?.booking?.check_out) },
      { label: 'Durasi', value: `${detail?.summary?.duration_hours} jam` },
      { label: 'Nama Pemesan', value: detail?.customer?.name },
      { label: 'Kontak Pemesan', value: detail?.customer?.email }
    ]
  }, [detail])

  if (loading) {
    return (
      <div className="customer-payment-page">
        <BackButton title="Detail Pembayaran" />

        <div className="customer-payment-shell">
          <div className="customer-payment-layout">
            <div className="customer-payment-main">
              <section className="customer-payment-card">
                <div className="customer-payment-section-header">
                  <h2>Detail Booking</h2>
                  <p>Ringkasan jadwal dan fasilitas ruangan yang dipilih</p>
                </div>
                <div className="customer-payment-room-row">
                  <div className="customer-payment-skeleton-avatar" />
                  <div className="customer-payment-room-meta">
                    <div className="customer-payment-skeleton-text long" />
                    <div className="customer-payment-skeleton-text medium" />
                  </div>
                  <div className="customer-payment-skeleton-text short" />
                </div>

                <div className="customer-payment-info-list">
                  <div><span>Tanggal</span><strong className="customer-payment-skeleton-text medium" /></div>
                  <div><span>Jam mulai</span><strong className="customer-payment-skeleton-text medium" /></div>
                  <div><span>Jam selesai</span><strong className="customer-payment-skeleton-text medium" /></div>
                  <div><span>Durasi</span><strong className="customer-payment-skeleton-text short" /></div>
                  <div><span>Nama Pemesan</span><strong className="customer-payment-skeleton-text long" /></div>
                  <div><span>Kontak Pemesan</span><strong className="customer-payment-skeleton-text long" /></div>
                </div>

                <div className="customer-payment-facilities">
                  <h4>Fasilitas yang didapatkan</h4>
                  <div>
                    <div className="customer-payment-skeleton-text medium" />
                    <div className="customer-payment-skeleton-text short" />
                  </div>
                </div>
              </section>

              <section className="customer-payment-card customer-payment-method-section">
                <div className="customer-payment-method-list">
                  <h2>Metode Pembayaran</h2>
                  <div className="customer-payment-skeleton-text full" />
                  <div className="customer-payment-skeleton-text full" />
                  <div className="customer-payment-skeleton-text full" />
                </div>
              </section>
            </div>

            <aside className="customer-payment-summary">
              <div className="customer-payment-summary-lines">
                <h2>Ringkasan Pembayaran</h2>
                <div><span>Harga sewa</span><strong className="customer-payment-skeleton-text medium" /></div>
                <div><span>Durasi</span><strong className="customer-payment-skeleton-text short" /></div>
                <div><span>Subtotal</span><strong className="customer-payment-skeleton-text medium" /></div>
                <div><span>Biaya layanan</span><strong className="customer-payment-skeleton-text medium" /></div>
                <div><span>PPN (11%)</span><strong className="customer-payment-skeleton-text medium" /></div>
              </div>

              <div className="customer-payment-summary-total">
                <span>Total bayar</span>
                <strong className="customer-payment-skeleton-text long" />
              </div>

              <div className="customer-payment-summary-actions">
                <button type="button" className="secondary cancel" disabled>
                  <div className="customer-payment-skeleton-text short" />
                </button>
                <button type="button" className="primary" disabled>
                  <div className="customer-payment-skeleton-text medium" />
                </button>
              </div>
            </aside>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="customer-payment-page">
        <div className="customer-payment-shell">
          <p className="rooms-empty">{error || 'Detail pembayaran tidak ditemukan.'}</p>
        </div>
      </div>
    )
  }

  const bookingStatus = detail?.booking?.status
  const isPending = bookingStatus === 'pending'
  const isPaid = bookingStatus === 'confirmed' || bookingStatus === 'completed'

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
          booking_id: detail?.booking?.booking_id,
          user_id: userId,
          action: 'cancel'
        })
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Gagal membatalkan pembayaran.')
      }

      router.push(`/customer/rooms/${detail?.room?.room_id}`)
    } catch (cancelError) {
      setError(cancelError instanceof Error ? cancelError.message : 'Gagal membatalkan pembayaran.')
      setShowCancelOverlay(false)
    } finally {
      setIsCancelling(false)
    }
  }

  return (
    <div className="customer-payment-page">
      <BackButton title="Detail Pembayaran" onClick={() => setShowCancelOverlay(true)} />

      <div className="customer-payment-shell">
        <div className="customer-payment-layout">
          <div className="customer-payment-main">
            <section className="customer-payment-card">
              <div className="customer-payment-section-header">
                <h2>Detail Booking</h2>
                <p>Ringkasan jadwal dan fasilitas ruangan yang dipilih</p>
              </div>
              <div className="customer-payment-room-row">
                <img src={detail?.room?.images?.[0] || '/images/gambarRuangan.png'} alt={detail?.room?.name} />
                <div className="customer-payment-room-meta">
                  <h3>{detail?.room?.name}</h3>
                  <p>{detail?.room?.location}</p>
                </div>
                <span>{getRoomTypeLabel(detail?.room?.type)}</span>
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
                  {detail?.room?.facilities && detail.room.facilities.length > 0 ? (
                    detail?.room?.facilities?.map(facility => (
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
              <div><span>Harga sewa</span><strong>{formatRupiah(detail?.summary?.price_per_hour || 0)}/jam</strong></div>
              <div><span>Durasi</span><strong>{detail?.summary?.duration_hours || 0} jam</strong></div>
              <div><span>Subtotal</span><strong>{formatRupiah(detail?.summary?.subtotal || 0)}</strong></div>
              <div><span>Biaya layanan</span><strong>{formatRupiah(detail?.summary?.service_fee || 0)}</strong></div>
              <div><span>PPN (11%)</span><strong>{formatRupiah(detail?.summary?.tax_amount || 0)}</strong></div>
            </div>

            <div className="customer-payment-summary-total">
              <span>Total bayar</span>
              <strong>{formatRupiah(detail?.summary?.total_payment || 0)}</strong>
            </div>

            <div className="customer-payment-summary-actions">
              <button type="button" className="secondary cancel" onClick={() => setShowCancelOverlay(true)}>
                Batalkan
              </button>
              <button
                type="button"
                className="primary"
                disabled={!isPending}
                onClick={() => {
                  router.push(`/customer/payments/${detail?.booking?.booking_id}/process?method=${selectedMethod}`)
                }}
              >
                {isPending ? 'Bayar sekarang' : isPaid ? 'Status sudah lunas' : 'Pembayaran tidak tersedia'}
              </button>
            </div>
          </aside>
        </div>
      </div>

      {showCancelOverlay && (
        <div className="customer-payment-overlay" role="presentation" onClick={() => setShowCancelOverlay(false)}>
          <div className="customer-payment-overlay-card" role="dialog" aria-modal="true" onClick={event => event.stopPropagation()}>
            <div className="customer-payment-overlay-icon">
              <svg width="48" height="48" viewBox="5 0 80 80" fill="none">
                <g stroke="#dc2626" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" fill="none">
                  <line x1="40" y1="20" x2="65" y2="20"/>
                  <line x1="65" y1="20" x2="65" y2="60"/>
                  <line x1="40" y1="60" x2="65" y2="60"/>
                  <line x1="40" y1="30" x2="40" y2="20"/>
                  <line x1="40" y1="60" x2="40" y2="50"/>
                  <line x1="18" y1="40" x2="50" y2="40"/>
                  <polyline points="28,30 18,40 28,50"/>
                </g>
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
