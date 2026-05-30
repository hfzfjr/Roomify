'use client'

import ConfirmModal from '@/components/ui/ConfirmModal'
import SwitchToCustomerOverlayIcon from '@/components/icons/overlay/SwitchToCustomerOverlayIcon'

interface SwitchToCustomerOverlayProps {
  onConfirm: () => void
  onCancel: () => void
}

export default function SwitchToCustomerOverlay({ onConfirm, onCancel }: SwitchToCustomerOverlayProps) {
  return (
    <ConfirmModal
      icon={<SwitchToCustomerOverlayIcon />}
      iconBgColor="#e0f7fa"
      iconBorderColor="#67e8f9"
      title="Pindah ke mode Customer?"
      description="Klik lanjutkan untuk pindah ke mode Customer dan mulai menyewa ruangan"
      confirmLabel='Lanjutkan'
      cancelLabel='Batal'
      confirmColor="#22d3ee"
      confirmHoverColor="#06b6d4"
      onCancel={onCancel}
      onConfirm={onConfirm}
    />
  )
}