'use client'

import ConfirmModal from '@/components/ui/ConfirmModal'
import EditRoomOverlayIcon from '@/components/icons/overlay/EditRoomOverlayIcon'

interface SaveChangeOverlayProps {
  onConfirm: () => void
  onCancel: () => void
}

export default function SaveChangeOverlay({ onConfirm, onCancel }: SaveChangeOverlayProps) {
  return (
    <ConfirmModal
      icon={<EditRoomOverlayIcon />}
      title="Simpan Perubahan"
      description="Pastikan perubahan yang dilakukan sudah benar"
      onCancel={onCancel}
      onConfirm={onConfirm}
    />
  )
}