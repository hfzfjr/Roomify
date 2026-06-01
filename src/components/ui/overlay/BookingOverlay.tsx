'use client'

import ConfirmModal from '@/components/ui/ConfirmModal'
import BookingOverlayIcon from '@/components/icons/overlay/BookingOverlayIcon'

interface BookingOverlayProps {
  onConfirm: () => void
  onCancel: () => void
}

export default function BookingOverlay({ onConfirm, onCancel }: BookingOverlayProps) {
  return (
    <ConfirmModal
      icon={<BookingOverlayIcon />}
      iconBgColor="#e0f7fa"
      iconBorderColor="#67e8f9"
      title="Booking sekarang?"
      description="Pastikan jadwal dan detail ruangan sudah sesuai sebelum lanjut ke pembayaran"
      confirmColor="#22d3ee"
      confirmHoverColor="#06b6d4"
      onCancel={onCancel}
      onConfirm={onConfirm}
    />
  )
}