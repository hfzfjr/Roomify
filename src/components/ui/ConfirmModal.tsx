'use client'

import { ReactNode } from 'react'
import './ConfirmModal.css'

interface ModalProps {
  /** Icon component yang akan ditampilkan di dalam lingkaran */
  icon: ReactNode
  /** Warna background lingkaran icon, e.g. '#e0f7fa' */
  iconBgColor?: string
  /** Warna border lingkaran icon, e.g. '#67e8f9' */
  iconBorderColor?: string
  /** Judul modal */
  title: string
  /** Deskripsi / pesan modal */
  description: string
  /** Label tombol cancel (default: 'Tidak') */
  cancelLabel?: string
  /** Label tombol confirm (default: 'Ya') */
  confirmLabel?: string
  /** Warna background tombol confirm, e.g. '#22d3ee' */
  confirmColor?: string
  /** Warna background tombol confirm saat hover */
  confirmHoverColor?: string
  onCancel: () => void
  onConfirm: () => void
}

export default function ConfirmModal({
  icon,
  iconBgColor = 'var(--background-cyan)',
  iconBorderColor = 'var(--cyan)',
  title,
  description,
  cancelLabel = 'Tidak',
  confirmLabel = 'Ya',
  confirmColor = 'var(--cyan)',
  confirmHoverColor = 'var(--cyan-dark)',
  onCancel,
  onConfirm,
}: ModalProps) {
  return (
    <div className="confirm-modal-overlay">
      <div className="confirm-modal">
        <div className="confirm-modal-logo">
          <div
            className="confirm-modal-logo-circle"
            style={{ backgroundColor: iconBgColor, border: `2px solid ${iconBorderColor}` }}
          >
            {icon}
          </div>
        </div>

        <h2 className="confirm-modal-title">{title}</h2>
        <p className="confirm-modal-description">{description}</p>

        <div className="confirm-modal-actions">
          <button type="button" className="confirm-modal-btn cancel" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button
            type="button"
            className="confirm-modal-btn confirm"
            style={{ backgroundColor: confirmColor }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = confirmHoverColor)}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = confirmColor)}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
