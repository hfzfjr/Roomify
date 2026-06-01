'use client'

import ConfirmModal from '@/components/ui/ConfirmModal'
import EditRoomOverlayIcon from '@/components/icons/overlay/EditRoomOverlayIcon'

interface EditRoomOverlayProps {
  onConfirm: () => void
  onCancel: () => void
}

export default function EditRoomOverlay({ onConfirm, onCancel }: EditRoomOverlayProps) {
  return (
    <ConfirmModal
      icon={<EditRoomOverlayIcon />}
      title="Edit Ruangan?"
      description="Tindakan ini akan mengarahkan Anda ke halaman edit ruangan"
      onCancel={onCancel}
      onConfirm={onConfirm}
    />
  )
}