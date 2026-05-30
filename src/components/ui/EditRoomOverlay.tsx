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
      iconBgColor="#e0f7fa"
      iconBorderColor="#67e8f9"
      title="Edit Ruangan?"
      description="Tindakan ini akan mengarahkan Anda ke halaman edit ruangan"
      confirmColor="#22d3ee"
      confirmHoverColor="#06b6d4"
      onCancel={onCancel}
      onConfirm={onConfirm}
    />
  )
}