'use client'

import { useState } from 'react'
import './ReportRoomOverlay.css'

interface ReportRoomOverlayProps {
  isOpen: boolean
  onClose: () => void
  roomName?: string
  bookingId?: string
}

export default function ReportRoomOverlay({ isOpen, onClose, roomName, bookingId }: ReportRoomOverlayProps) {
  const [reportType, setReportType] = useState('')
  const [description, setDescription] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!isOpen) return null

  async function handleSubmit() {
    if (!reportType || !description) {
      alert('Mohon lengkapi semua field')
      return
    }

    setIsSubmitting(true)
    try {
      // TODO: Implement API call to submit report
      console.log('Submitting report:', { reportType, description, bookingId })
      alert('Laporan berhasil dikirim')
      onClose()
    } catch (error) {
      alert('Gagal mengirim laporan')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="report-room-overlay" onClick={onClose}>
      <div className="report-room-modal" onClick={(e) => e.stopPropagation()}>
        <div className="report-room-header">
          <h2>Laporkan Ruangan</h2>
          <button type="button" className="report-room-close" onClick={onClose}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="report-room-content">
          <div className="report-room-info">
            <p>Ruangan: <strong>{roomName || '-'}</strong></p>
            <p>ID Booking: <strong>{bookingId || '-'}</strong></p>
          </div>

          <div className="report-room-form">
            <div className="report-room-field">
              <label>Jenis Laporan</label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                required
              >
                <option value="">Pilih jenis laporan</option>
                <option value="facility">Fasilitas tidak sesuai</option>
                <option value="cleanliness">Kebersihan kurang</option>
                <option value="service">Pelayanan buruk</option>
                <option value="other">Lainnya</option>
              </select>
            </div>

            <div className="report-room-field">
              <label>Deskripsi</label>
              <textarea
                rows={5}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Jelaskan detail masalah yang Anda alami..."
                required
              />
            </div>
          </div>
        </div>

        <div className="report-room-footer">
          <button
            type="button"
            className="report-room-btn report-room-btn-cancel"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Batal
          </button>
          <button
            type="button"
            className="report-room-btn report-room-btn-submit"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Mengirim...' : 'Kirim Laporan'}
          </button>
        </div>
      </div>
    </div>
  )
}
