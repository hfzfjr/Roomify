'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { formatPaymentCountdown, getRemainingPaymentMs } from '@/utils/booking'
import { formatDate, formatTime } from '@/utils/formatDate'
import ReceiptModal from '@/components/ReceiptModal'
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
    payment_due_at?: string | null
  }
  room: {
    room_id: string
    name: string
  }
  summary: {
    total_payment: number
  }
}

function getPaymentMethodLabel(method: PaymentMethod) {
  const labels: Record<PaymentMethod, string> = {
    qris: 'QRIS',
    bca_va: 'Transfer Virtual Account BCA',
    bni_va: 'Transfer Virtual Account BNI',
    gopay: 'GoPay'
  }
  return labels[method] || method
}

function getPaymentInstructions(method: PaymentMethod) {
  if (method === 'qris') {
    return {
      title: 'Instruksi Pembayaran QRIS',
      virtualAccountLabel: 'Kode pembayaran QRIS',
      virtualAccountValue: 'QRIS-ROOMIFY-782901',
      steps: [
        ['Buka aplikasi e-wallet atau m-banking', 'Gunakan aplikasi yang mendukung pembayaran QRIS.'],
        ['Pilih menu Bayar QR', 'Scan kode QR pembayaran dari merchant Roomify.'],
        ['Masukkan nominal pembayaran', 'Pastikan nominal sesuai total tagihan.'],
        ['Konfirmasi transaksi', 'Periksa detail pembayaran lalu tekan Bayar.'],
        ['Simpan bukti transaksi', 'Gunakan bukti transaksi jika verifikasi tertunda.']
      ]
    }
  }

  if (method === 'bni_va') {
    return {
      title: 'Instruksi Transfer Bank BNI',
      virtualAccountLabel: 'Nomor Virtual Account BNI',
      virtualAccountValue: '8808 0920 1144 7766',
      steps: [
        ['Buka aplikasi atau ATM BNI', 'Gunakan BNI Mobile Banking, Internet Banking, atau ATM.'],
        ['Pilih menu Transfer -> Virtual Account', 'Pilih opsi pembayaran Virtual Account BNI.'],
        ['Masukkan nomor Virtual Account', 'Masukkan nomor VA sesuai yang tertera di atas.'],
        ['Konfirmasi tagihan', 'Pastikan nama merchant dan nominal sesuai.'],
        ['Masukkan PIN', 'Transaksi selesai setelah PIN berhasil diverifikasi.']
      ]
    }
  }

  if (method === 'gopay') {
    return {
      title: 'Instruksi Pembayaran GoPay',
      virtualAccountLabel: 'Kode pembayaran GoPay',
      virtualAccountValue: 'GOPAY-ROOMIFY-1182',
      steps: [
        ['Buka aplikasi Gojek', 'Pastikan saldo GoPay Anda mencukupi nominal pembayaran.'],
        ['Pilih menu Bayar', 'Gunakan fitur bayar dan masukkan kode pembayaran.'],
        ['Periksa detail transaksi', 'Pastikan merchant dan total tagihan sudah benar.'],
        ['Konfirmasi pembayaran', 'Masukkan PIN GoPay untuk menyelesaikan transaksi.'],
        ['Simpan bukti transaksi', 'Ambil screenshot bukti sebagai arsip pribadi.']
      ]
    }
  }

  return {
    title: 'Instruksi Transfer Bank BCA',
    virtualAccountLabel: 'Nomor Virtual Account BCA',
    virtualAccountValue: '1244 1231 0984 1242',
    steps: [
      ['Buka aplikasi atau ATM BCA', 'Mobile banking, internet banking, atau ATM terdekat.'],
      ['Pilih menu Transfer -> Virtual Account', 'Pilih menu m-Transfer lalu opsi BCA Virtual Account.'],
      ['Masukkan nomor Virtual Account', 'Pastikan nomor yang Anda masukkan sesuai dengan nomor Virtual Account di atas.'],
      ['Konfirmasi tagihan', 'Pastikan nominal tagihan sudah benar, lalu tekan OK.'],
      ['Masukkan PIN', 'Masukkan PIN m-BCA Anda untuk menyelesaikan transaksi.']
    ]
  }
}

export default function CustomerPaymentProcessPage() {
  const params = useParams<{ bookingId: string }>()
  const searchParams = useSearchParams()
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
  const [successMessage, setSuccessMessage] = useState('')
  const [actionLoading, setActionLoading] = useState<'confirm' | 'cancel' | null>(null)
  const [nowTime, setNowTime] = useState(() => Date.now())
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false)

  const method = (searchParams.get('method') as PaymentMethod) || 'bca_va'
  const instruction = useMemo(() => getPaymentInstructions(method), [method])

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

  // Removed localStorage-based payment start time
  // Using server-side payment_due_at from booking data

  useEffect(() => {
    if (!userId || !bookingId) {
      return
    }

    let isMounted = true

    async function fetchDetail() {
      try {
        setLoading(true)
        const response = await fetch(`/api/payments/${bookingId}?user_id=${encodeURIComponent(userId)}`)
        const result = await response.json()

        if (!response.ok || !result.success) {
          throw new Error(result.message || 'Gagal memuat proses pembayaran.')
        }

        if (isMounted) {
          setDetail(result.data as PaymentDetailResponse)
        }
      } catch (fetchError) {
        if (isMounted) {
          setError(fetchError instanceof Error ? fetchError.message : 'Gagal memuat proses pembayaran.')
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

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNowTime(Date.now())
    }, 1000)

    return () => window.clearInterval(timer)
  }, [])

  // Calculate remaining time based on server's payment_due_at
  const remainingPaymentMs = detail?.booking?.payment_due_at
    ? getRemainingPaymentMs(detail.booking.payment_due_at, nowTime)
    : 0

  async function refreshDetail() {
    if (!userId || !bookingId) return

    try {
      const response = await fetch(`/api/payments/${bookingId}?user_id=${encodeURIComponent(userId)}`)
      const result = await response.json()

      if (response.ok && result.success) {
        setDetail(result.data as PaymentDetailResponse)
      }
    } catch {
      // Silent fail on refresh
    }
  }

  async function handleBookingAction(action: 'confirm_payment' | 'cancel') {
    if (!detail || !userId) {
      return
    }

    setActionLoading(action === 'confirm_payment' ? 'confirm' : 'cancel')
    setError('')
    setSuccessMessage('')

    try {
      const response = await fetch('/api/bookings', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          booking_id: detail?.booking?.booking_id,
          user_id: userId,
          action,
          payment_method: method // Pass payment method for invoice
        })
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Aksi pembayaran gagal diproses.')
      }

      if (action === 'confirm_payment') {
        // Refresh data to show updated status, stay on page
        await refreshDetail()
        setSuccessMessage('Pembayaran berhasil dikonfirmasi! Booking Anda telah dikonfirmasi.')
        // Clear payment start time from localStorage
        localStorage.removeItem(`payment_start_${bookingId}`)
        return
      }

      // For cancel action, redirect to rooms page
      router.push('/customer/rooms')
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'Aksi pembayaran gagal diproses.')
    } finally {
      setActionLoading(null)
    }
  }

  async function copyVirtualAccount() {
    try {
      await navigator.clipboard.writeText(instruction.virtualAccountValue.replaceAll(' ', ''))
    } catch {
      setError('Nomor tidak berhasil disalin. Silakan salin manual.')
    }
  }

  if (loading) {
    return (
      <div className="customer-payment-page">
        <div className="customer-payment-subheader">
          <button type="button" disabled aria-label="Kembali">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
              <path strokeLinecap="round" strokeLinejoin="round" d="m15 18-6-6 6-6" />
            </svg>
          </button>
          <h1>Pembayaran</h1>
        </div>

        <div className="customer-payment-shell">
          <div className="customer-process-layout">
            <div className="customer-process-main">
              <section className="customer-process-wait-card">
                <div className="customer-process-wait-icon">
                  <div className="customer-payment-skeleton-avatar" />
                </div>
                <div>
                  <h2>Menunggu pembayaran</h2>
                  <p>Silakan lakukan pembayaran untuk mengonfirmasi ruangan</p>
                  <div className="customer-process-deadline">
                    <span>Kadaluwarsa dalam</span>
                    <strong><div className="customer-payment-skeleton-text medium" /></strong>
                  </div>
                </div>
              </section>

              <section className="customer-payment-card customer-process-instruction-card">
                <h2>Instruksi Pembayaran</h2>
                <p>Gunakan nomor pembayaran di bawah ini untuk verifikasi otomatis</p>
                <div className="customer-process-qr-box">
                  <span>Scan QR Code untuk pembayaran</span>
                  <div className="customer-payment-skeleton-avatar" style={{ width: '200px', height: '200px' }} />
                </div>

                <div className="customer-process-step-list">
                  <div className="customer-process-step-item">
                    <span>1</span>
                    <div>
                      <h4><div className="customer-payment-skeleton-text long" /></h4>
                      <p><div className="customer-payment-skeleton-text full" /></p>
                    </div>
                  </div>
                  <div className="customer-process-step-item">
                    <span>2</span>
                    <div>
                      <h4><div className="customer-payment-skeleton-text long" /></h4>
                      <p><div className="customer-payment-skeleton-text full" /></p>
                    </div>
                  </div>
                  <div className="customer-process-step-item">
                    <span>3</span>
                    <div>
                      <h4><div className="customer-payment-skeleton-text long" /></h4>
                      <p><div className="customer-payment-skeleton-text full" /></p>
                    </div>
                  </div>
                </div>

                <div className="customer-process-actions">
                  <button type="button" className="secondary" disabled>
                    <div className="customer-payment-skeleton-text medium" />
                  </button>
                  <button type="button" className="primary" disabled>
                    <div className="customer-payment-skeleton-text medium" />
                  </button>
                </div>
              </section>
            </div>

            <aside className="customer-process-side-card">
              <div className="customer-process-side-header">
                <img src="/images/roomify-biru.png" alt="Roomify" />
                <span>Belum lunas</span>
              </div>

              <div className="customer-process-side-content">
                <div className="customer-process-side-details">
                  <div className="detail-row">
                    <span className="detail-label">No Transaksi</span>
                    <span className="detail-value"><div className="customer-payment-skeleton-text medium" /></span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Ruangan</span>
                    <span className="detail-value"><div className="customer-payment-skeleton-text long" /></span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Tanggal</span>
                    <span className="detail-value"><div className="customer-payment-skeleton-text medium" /></span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Waktu</span>
                    <span className="detail-value"><div className="customer-payment-skeleton-text medium" /></span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Metode pembayaran</span>
                    <span className="detail-value"><div className="customer-payment-skeleton-text long" /></span>
                  </div>
                </div>

                <div className="customer-process-side-divider" />

                <div className="customer-process-side-pricing">
                  <div className="detail-row">
                    <span className="detail-label">Subtotal</span>
                    <span className="detail-value"><div className="customer-payment-skeleton-text medium" /></span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Biaya layanan</span>
                    <span className="detail-value"><div className="customer-payment-skeleton-text short" /></span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">PPN (11%)</span>
                    <span className="detail-value"><div className="customer-payment-skeleton-text medium" /></span>
                  </div>
                </div>

                <div className="customer-process-side-total">
                  <span className="total-label">Total bayar</span>
                  <span className="total-amount"><div className="customer-payment-skeleton-text medium" /></span>
                </div>

                <button type="button" className="customer-process-download-receipt secondary" disabled>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15V3m0 12l-4-4m4 4l4-4M3 15v4a2 2 0 002 2h14a2 2 0 002-2v-4" />
                  </svg>
                  Unduh Struk
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
          <p className="rooms-empty">{error || 'Data pembayaran tidak ditemukan.'}</p>
        </div>
      </div>
    )
  }

  const isPending = detail?.booking?.status === 'pending'

  return (
    <div className="customer-payment-page">
      <div className="customer-payment-subheader">
        <button type="button" onClick={() => router.back()} aria-label="Kembali">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
            <path strokeLinecap="round" strokeLinejoin="round" d="m15 18-6-6 6-6" />
          </svg>
        </button>
        <h1>Pembayaran</h1>
      </div>

      <div className="customer-payment-shell">
        <div className="customer-process-layout">
          <div className="customer-process-main">
            {successMessage && (
              <div className="customer-process-success-alert">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <span>{successMessage}</span>
              </div>
            )}
            <section className="customer-process-wait-card">
              <div className="customer-process-wait-icon">
                <img src="/images/payment/logo-menunggu-pembayaran.png" alt="Menunggu pembayaran"/>
              </div>
              <div>
                <h2>Menunggu pembayaran</h2>
                <p>Silakan lakukan pembayaran untuk mengonfirmasi ruangan</p>
                {detail?.booking?.payment_due_at && (
                  <div className="customer-process-deadline">
                    <span>Kadaluwarsa dalam</span>
                    <strong>{formatPaymentCountdown(remainingPaymentMs)}</strong>
                  </div>
                )}
              </div>
            </section>

            <section className="customer-payment-card customer-process-instruction-card">
                <h2>{instruction.title}</h2>
                <p>Gunakan nomor pembayaran di bawah ini untuk verifikasi otomatis</p>
              {method === 'qris' ? (
                <div className="customer-process-qr-box">
                  <span>Scan QR Code untuk pembayaran</span>
                  <img src="/images/payment/qris-pembayaran.jpeg" alt="QR Code Pembayaran" />
                </div>
              ) : (
                <div className="customer-process-va-box">
                  <span>{instruction.virtualAccountLabel}</span>
                  <strong>{instruction.virtualAccountValue}</strong>
                  <button type="button" onClick={copyVirtualAccount}>Salin nomor</button>
                </div>
              )}

              <div className="customer-process-step-list">
                {instruction.steps.map((step, index) => (
                  <div key={step[0]} className="customer-process-step-item">
                    <span>{index + 1}</span>
                    <div>
                      <h4>{step[0]}</h4>
                      <p>{step[1]}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="customer-process-actions">
                <button
                  type="button"
                  className="secondary"
                  disabled={!isPending || actionLoading !== null}
                  onClick={() => handleBookingAction('cancel')}
                >
                  {actionLoading === 'cancel' ? 'Memproses...' : 'Batalkan booking'}
                </button>
                <button
                  type="button"
                  className="primary"
                  disabled={!isPending || remainingPaymentMs <= 0 || actionLoading !== null}
                  onClick={() => handleBookingAction('confirm_payment')}
                >
                  {actionLoading === 'confirm' ? 'Memproses...' : 'Saya sudah bayar'}
                </button>
              </div>
            </section>
          </div>

          <aside className="customer-process-side-card">
            <div className="customer-process-side-header">
              <img src="/images/roomify-biru.png" alt="Roomify" />
              <span className={isPending ? 'pending' : 'paid'}>{isPending ? 'Belum lunas' : 'Lunas'}</span>
            </div>

            <div className="customer-process-side-content">
              <div className="customer-process-side-details">
                <div className="detail-row">
                  <span className="detail-label">No Transaksi</span>
                  <span className="detail-value">{detail?.booking?.booking_id || '-'}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Ruangan</span>
                  <span className="detail-value">{detail?.room?.name || '-'}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Tanggal</span>
                  <span className="detail-value">{detail?.booking?.check_in ? formatDate(detail.booking.check_in) : '-'}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Waktu</span>
                  <span className="detail-value">
                    {detail?.booking?.check_in && detail?.booking?.check_out
                      ? `${formatTime(detail.booking.check_in)} - ${formatTime(detail.booking.check_out)}`
                      : '-'
                    }
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Metode pembayaran</span>
                  <span className="detail-value">{getPaymentMethodLabel(method)}</span>
                </div>
              </div>

              <div className="customer-process-side-divider" />

              <div className="customer-process-side-pricing">
                <div className="detail-row">
                  <span className="detail-label">Subtotal</span>
                  <span className="detail-value">Rp {new Intl.NumberFormat('id-ID').format(detail?.summary?.total_payment || 0)}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Biaya layanan</span>
                  <span className="detail-value">Rp 2.500</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">PPN (11%)</span>
                  <span className="detail-value">Rp {new Intl.NumberFormat('id-ID').format(Math.round((detail?.summary?.total_payment || 0) * 0.11))}</span>
                </div>
              </div>

              <div className="customer-process-side-total">
                <span className="total-label">Total bayar</span>
                <span className="total-amount">Rp {new Intl.NumberFormat('id-ID').format((detail?.summary?.total_payment || 0) + 2500 + Math.round((detail?.summary?.total_payment || 0) * 0.11))}</span>
              </div>

              <button
                type="button"
                className={`customer-process-download-receipt ${isPending ? 'secondary' : 'primary'}`}
                disabled={isPending}
                onClick={() => setIsReceiptModalOpen(true)}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15V3m0 12l-4-4m4 4l4-4M3 15v4a2 2 0 002 2h14a2 2 0 002-2v-4" />
                </svg>
                Unduh Struk
              </button>
            </div>
          </aside>
        </div>
      </div>

      <ReceiptModal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        bookingId={bookingId}
        userId={userId}
      />
    </div>
  )
}
