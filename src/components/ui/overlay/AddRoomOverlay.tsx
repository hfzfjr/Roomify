'use client'

import ConfirmModal from '@/components/ui/ConfirmModal'
import AddRoomOverlayIcon from '@/components/icons/overlay/AddRoomOverlayIcon'

interface AddRoomOverlayProps {
  onConfirm: () => void
  onCancel: () => void
}

export default function AddRoomOverlay({ onConfirm, onCancel }: AddRoomOverlayProps) {
  return (
    <ConfirmModal
      icon={<AddRoomOverlayIcon />}
      title="Tambah Ruangan?"
      description="Pastikan data sudah benar. Ruangan akan langsung aktif dan bisa langsung disewakan"
      onCancel={onCancel}
      onConfirm={onConfirm}
    />
  )
}