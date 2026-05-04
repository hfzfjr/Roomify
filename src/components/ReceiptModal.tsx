'use client'

import { useEffect, useState } from 'react'
import { formatDate, formatTime } from '@/utils/formatDate'
import '@/styles/rooms.css'

type InvoiceData = {
  invoice: {
    invoice_id: string
    payment_id: string
    payment_method: string
    total_amount: number
    printed_at: string
    pdf_url: string | null
    paid_at: string
  } | null
  booking: {
    booking_id: string
    booking_date: string
    check_in: string
    check_out: string
    status: string
    duration_hours: number
  }
  room: {
    name: string
    location: string
  }
  customer: {
    name: string
    email: string
  }
  summary: {
    subtotal: number
    service_fee: number
    tax_amount: number
    total_amount: number
  }
}

interface ReceiptModalProps {
  isOpen: boolean
  onClose: () => void
  bookingId: string
  userId: string
}

function getPaymentMethodLabel(method: string): string {
  const labels: Record<string, string> = {
    qris: 'QRIS',
    bca_va: 'Transfer Virtual Account BCA',
    bni_va: 'Transfer Virtual Account BNI',
    gopay: 'GoPay'
  }
  return labels[method] || method
}

export default function ReceiptModal({ isOpen, onClose, bookingId, userId }: ReceiptModalProps) {
  const [invoiceData, setInvoiceData] = useState<InvoiceData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isOpen && bookingId && userId) {
      fetchInvoiceData()
    }
  }, [isOpen, bookingId, userId])

  async function fetchInvoiceData() {
    setLoading(true)
    setError('')
    try {
      const response = await fetch(`/api/invoices/${bookingId}?user_id=${encodeURIComponent(userId)}`)
      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Gagal memuat data invoice.')
      }

      setInvoiceData(result.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan.')
    } finally {
      setLoading(false)
    }
  }

  function handlePrint() {
    window.print()
  }

  function handleDownloadPDF() {
    // For now, we'll use print to PDF functionality
    // In production, you might want to use a library like html2pdf.js
    handlePrint()
  }

  if (!isOpen) return null

  return (
    <div className="receipt-modal-overlay" onClick={onClose}>
      <div className="receipt-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="receipt-modal-header">
          <h2>Struk Pembayaran</h2>
          <button type="button" className="receipt-modal-close" onClick={onClose}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="receipt-modal-content">
          {loading ? (
            <div className="receipt-modal-loading">
              <div className="receipt-spinner" />
              <p>Memuat struk...</p>
            </div>
          ) : error ? (
            <div className="receipt-modal-error">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01" />
              </svg>
              <p>{error}</p>
              <button type="button" className="receipt-retry-btn" onClick={fetchInvoiceData}>
                Coba Lagi
              </button>
            </div>
          ) : invoiceData ? (
            <div className="receipt-paper">
              {/* Receipt Header */}
              <div className="receipt-header">
                <img src="/images/roomify-biru.png" alt="Roomify" className="receipt-logo" />
                <div className="receipt-status-badge paid">
                  LUNAS
                </div>
              </div>

              {/* Invoice Number */}
              <div className="receipt-invoice-number">
                <span>No. Invoice</span>
                <strong>{invoiceData.invoice?.invoice_id || '-'}</strong>
              </div>

              {/* Divider */}
              <div className="receipt-divider" />

              {/* Customer Info */}
              <div className="receipt-section">
                <h4>Informasi Pelanggan</h4>
                <div className="receipt-info-grid">
                  <div className="receipt-info-item">
                    <span>Nama</span>
                    <strong>{invoiceData.customer.name}</strong>
                  </div>
                  <div className="receipt-info-item">
                    <span>Email</span>
                    <strong>{invoiceData.customer.email}</strong>
                  </div>
                </div>
              </div>

              {/* Booking Info */}
              <div className="receipt-section">
                <h4>Detail Booking</h4>
                <div className="receipt-info-grid">
                  <div className="receipt-info-item">
                    <span>No. Booking</span>
                    <strong>{invoiceData.booking.booking_id}</strong>
                  </div>
                  <div className="receipt-info-item">
                    <span>Ruangan</span>
                    <strong>{invoiceData.room.name}</strong>
                  </div>
                  <div className="receipt-info-item">
                    <span>Lokasi</span>
                    <strong>{invoiceData.room.location}</strong>
                  </div>
                  <div className="receipt-info-item">
                    <span>Tanggal</span>
                    <strong>{formatDate(invoiceData.booking.check_in)}</strong>
                  </div>
                  <div className="receipt-info-item">
                    <span>Waktu</span>
                    <strong>
                      {formatTime(invoiceData.booking.check_in)} - {formatTime(invoiceData.booking.check_out)}
                    </strong>
                  </div>
                  <div className="receipt-info-item">
                    <span>Durasi</span>
                    <strong>{Math.round(invoiceData.booking.duration_hours)} jam</strong>
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div className="receipt-divider" />

              {/* Payment Info */}
              <div className="receipt-section">
                <h4>Informasi Pembayaran</h4>
                <div className="receipt-info-grid">
                  <div className="receipt-info-item">
                    <span>Metode Pembayaran</span>
                    <strong>{getPaymentMethodLabel(invoiceData.invoice?.payment_method || '-')}</strong>
                  </div>
                  <div className="receipt-info-item">
                    <span>Tanggal Pembayaran</span>
                    <strong>
                      {invoiceData.invoice?.paid_at
                        ? formatDate(invoiceData.invoice.paid_at)
                        : '-'}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div className="receipt-divider" />

              {/* Pricing Details */}
              <div className="receipt-section">
                <h4>Rincian Pembayaran</h4>
                <div className="receipt-pricing">
                  <div className="receipt-pricing-row">
                    <span>Subtotal</span>
                    <span>Rp {new Intl.NumberFormat('id-ID').format(invoiceData.summary.subtotal)}</span>
                  </div>
                  <div className="receipt-pricing-row">
                    <span>Biaya Layanan</span>
                    <span>Rp {new Intl.NumberFormat('id-ID').format(invoiceData.summary.service_fee)}</span>
                  </div>
                  <div className="receipt-pricing-row">
                    <span>PPN (11%)</span>
                    <span>Rp {new Intl.NumberFormat('id-ID').format(invoiceData.summary.tax_amount)}</span>
                  </div>
                </div>
              </div>

              {/* Total */}
              <div className="receipt-total">
                <span>Total Pembayaran</span>
                <strong>Rp {new Intl.NumberFormat('id-ID').format(invoiceData.summary.total_amount)}</strong>
              </div>

              {/* Footer */}
              <div className="receipt-footer">
                <p>Terima kasih telah menggunakan layanan Roomify</p>
                <p className="receipt-date">
                  Dicetak pada: {formatDate(new Date().toISOString())} {formatTime(new Date().toISOString())}
                </p>
              </div>
            </div>
          ) : null}
        </div>

        {/* Footer Actions */}
        {!loading && !error && invoiceData && (
          <div className="receipt-modal-footer">
            <button type="button" className="receipt-btn-secondary" onClick={handlePrint}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Cetak
            </button>
            <button type="button" className="receipt-btn-primary" onClick={handleDownloadPDF}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15V3m0 12l-4-4m4 4l4-4M3 15v4a2 2 0 002 2h14a2 2 0 002-2v-4" />
              </svg>
              Unduh PDF
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
