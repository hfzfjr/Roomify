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
      title="Pindah ke mode Customer?"
      description="Klik lanjutkan untuk pindah ke mode Customer dan mulai menyewa ruangan"
      confirmLabel='Lanjutkan'
      cancelLabel='Batal'
      onCancel={onCancel}
      onConfirm={onConfirm}
    />
  )
}