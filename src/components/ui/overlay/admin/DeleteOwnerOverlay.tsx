'use client'

import ConfirmModal from '@/components/ui/ConfirmModal'
import DeleteRoomOverlayIcon from '@/components/icons/overlay/DeleteRoomOverlayIcon'

interface DeleteOwnerOverlayProps {
    ownerName: string
    onConfirm: () => void
    onCancel: () => void
}

export default function DeleteOwnerOverlay({ ownerName, onConfirm, onCancel }: DeleteOwnerOverlayProps) {
    return (
        <ConfirmModal
            icon={<DeleteRoomOverlayIcon />}
            iconBorderColor="var(--cancel-button-text)"
            iconBgColor="var(--cancel-button-bg)"
            title="Hapus Owner?"
            description="Tindakan ini akan menghapus data secara permanen dari sistem"
            confirmLabel="Hapus"
            cancelLabel="Batal"
            confirmColor="var(--cancel-button-text)"
            confirmHoverColor="var(--cancel-button-hover)"
            onCancel={onCancel}
            onConfirm={onConfirm}
        />
    )
}