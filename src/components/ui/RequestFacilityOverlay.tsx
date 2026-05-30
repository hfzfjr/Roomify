'use client'

import ConfirmModal from '@/components/ui/ConfirmModal'
import RequestFacilityOverlayIcon from '@/components/icons/overlay/RequestFacilityOverlayIcon'

interface RequestFacilityOverlayProps {
  onConfirm: () => void
  onCancel: () => void
}

export default function RequestFacilityOverlay({ onConfirm, onCancel }: RequestFacilityOverlayProps) {
  return (
    <ConfirmModal
      icon={<RequestFacilityOverlayIcon />}
      title="Konfirmasi Fasilitas Tambahan"
      description="Pastikan fasilitas tambahan yang diminta tersedia"
      onCancel={onCancel}
      onConfirm={onConfirm}
    />
  )
}