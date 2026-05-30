'use client'

import { useState } from 'react'
import ConfirmModal from '@/components/ui/ConfirmModal'
import DeleteRoomConfirm from './DeleteRoomConfirm'
import DeleteRoomOverlayIcon from '@/components/icons/overlay/DeleteRoomOverlayIcon'

interface DeleteRoomOverlayProps {
  roomName: string
  onConfirm: () => void
  onCancel: () => void
}

export default function DeleteRoomOverlay({ roomName, onConfirm, onCancel }: DeleteRoomOverlayProps) {
  const [showConfirm, setShowConfirm] = useState(false)

  if (showConfirm) {
    return (
      <DeleteRoomConfirm
        roomName={roomName}
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    )
  }

  return (
    <ConfirmModal
      icon={<DeleteRoomOverlayIcon />}
      iconBorderColor="var(--cancel-button-text)"
      iconBgColor="var(--cancel-button-bg)"
      title="Hapus Ruangan?"
      description="Tindakan ini akan menghapus data secara permanen dari sistem"
      confirmLabel="Hapus"
      cancelLabel="Batal"
      confirmColor="var(--cancel-button-text)"
      confirmHoverColor="var(--cancel-button-hover)"
      onCancel={onCancel}
      onConfirm={() => setShowConfirm(true)}
    />
  )
}