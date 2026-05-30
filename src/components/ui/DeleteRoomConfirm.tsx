'use client'

import { useState } from 'react'
import './DeleteRoomConfirm.css'

interface DeleteRoomConfirmProps {
  roomName: string
  onConfirm: () => void
  onCancel: () => void
}

export default function DeleteRoomConfirm({ roomName, onConfirm, onCancel }: DeleteRoomConfirmProps) {
  const [inputValue, setInputValue] = useState('')
  const isMatch = inputValue === roomName

  return (
    <div className="delete-room-confirm-overlay">
      <div className="delete-room-confirm-modal">
        <div className="delete-room-confirm-header">
          <h2 className="delete-room-confirm-title">Hapus Ruangan</h2>
          <button type="button" className="delete-room-confirm-close" onClick={onCancel}>
            ✕
          </button>
        </div>

        <div className="delete-room-confirm-divider" />

        <div className="delete-room-confirm-body">
          <p className="delete-room-confirm-description">
            Tulis nama ruangan <strong>&ldquo;{roomName}&rdquo;</strong>, untuk hapus ruangan
          </p>
          <input
            type="text"
            className="delete-room-confirm-input"
            placeholder="Masukkan nama ruangan"
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
          />
          <button
            type="button"
            className={`delete-room-confirm-btn${isMatch ? ' active' : ''}`}
            onClick={isMatch ? onConfirm : undefined}
            disabled={!isMatch}
          >
            Hapus
          </button>
        </div>
      </div>
    </div>
  )
}