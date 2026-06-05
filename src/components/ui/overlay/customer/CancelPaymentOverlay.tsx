'use client'

import ConfirmModal from '@/components/ui/ConfirmModal'
import CancelPaymentOverlayIcon from '@/components/icons/overlay/CancelPaymentOverlayIcon'

interface CancelPaymentOverlayProps {
  isOpen: boolean
  onConfirm: () => void
  onCancel: () => void
}

export default function CancelPaymentOverlay({ isOpen, onConfirm, onCancel }: CancelPaymentOverlayProps) {
  if (!isOpen) return null

  return (
    <ConfirmModal
      icon={<CancelPaymentOverlayIcon />}
      iconBorderColor="var(--cancel-button-text)"
      iconBgColor="var(--cancel-button-bg)"
      title="Batalkan Pembayaran?"
      description="Semua data yang telah Anda masukkan akan hilang dan pesanan ini akan dibatalkan secara otomatis"
      confirmLabel="Batalkan"
      confirmColor="var(--cancel-button-text)"
      confirmHoverColor="var(--cancel-button-hover)"
      onCancel={onCancel}
      onConfirm={onConfirm}
    />
  )
}