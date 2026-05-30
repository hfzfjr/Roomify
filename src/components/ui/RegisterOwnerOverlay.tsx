'use client'

import ConfirmModal from '@/components/ui/ConfirmModal'
import RegisterOwnerIcon from '@/components/icons/overlay/RegisterOwner'

interface RegisterOwnerProps {
  onConfirm: () => void
  onCancel: () => void
}

export default function RegisterOwner({ onConfirm, onCancel }: RegisterOwnerProps) {
  return (
    <ConfirmModal
      icon={<RegisterOwnerIcon />}
      iconBgColor="#e0f7fa"
      iconBorderColor="#67e8f9"
      title="Daftarkan ruangan?"
      description="Anda belum memiliki akun owner. Silakan daftar terlebih dahulu untuk menambahkan ruangan"
      confirmColor="#22d3ee"
      confirmHoverColor="#06b6d4"
      onCancel={onCancel}
      onConfirm={onConfirm}
    />
  )
}