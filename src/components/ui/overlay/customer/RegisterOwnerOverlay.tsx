'use client'

import ConfirmModal from '@/components/ui/ConfirmModal'
import RegisterOwnerIcon from '@/components/icons/overlay/RegisterOwnerIcon'

interface RegisterOwnerOverlayProps {
  onConfirm: () => void
  onCancel: () => void
}

export default function RegisterOwnerOverlay({ onConfirm, onCancel }: RegisterOwnerOverlayProps) {
  return (
    <ConfirmModal
      icon={<RegisterOwnerIcon />}
      title="Daftarkan ruangan?"
      description="Anda belum memiliki akun owner. Silakan daftar terlebih dahulu untuk menambahkan ruangan"
      onCancel={onCancel}
      onConfirm={onConfirm}
    />
  )
}