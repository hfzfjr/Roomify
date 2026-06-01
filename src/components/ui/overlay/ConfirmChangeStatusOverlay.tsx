'use client'

import React from 'react'
import styles from './ConfirmChangeStatusOverlay.module.css'

interface ConfirmChangeStatusOverlayProps {
  roomName: string
  roomId: string
  currentStatus: string
  newStatus: string
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmChangeStatusOverlay({
  roomName,
  roomId,
  currentStatus,
  newStatus,
  onConfirm,
  onCancel,
}: ConfirmChangeStatusOverlayProps) {
  const isDeactivating = newStatus === 'nonaktif'
  const isSuspending = newStatus === 'suspend'
  const isSuspended = currentStatus === 'suspend'
  const isDisabled = isSuspended // Button disabled when room is suspended

  const getStatusBadgeClass = (status: string) => {
    if (status === 'aktif') return styles.statusAktif
    if (status === 'suspend') return styles.statusSuspend
    return styles.statusNonaktif
  }

  const formatStatus = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1)
  }

  const getConfirmButtonClass = () => {
    if (isSuspended) return styles.activateButton // When suspended, show activate button styling
    if (isDeactivating) return styles.deactivateButton
    if (isSuspending) return styles.suspendButton
    return styles.activateButton
  }

  const getConfirmLabel = () => {
    if (isSuspended) return 'Aktifkan' // When suspended, only option is to activate
    if (isDeactivating) return 'Nonaktifkan'
    if (isSuspending) return 'Suspend'
    return 'Aktifkan'
  }

  const getMessage = () => {
    if (isSuspended) return {
      title: 'Ruangan dalam status Suspend',
      desc: 'Ruangan ini di-suspend oleh admin dan hanya dapat diaktifkan kembali oleh admin. Hubungi admin untuk informasi lebih lanjut tentang alasan suspend ini.',
    }
    if (isDeactivating) return {
      title: 'Apakah Anda yakin ingin menonaktifkan ruangan ini?',
      desc: 'Ruangan ini tidak akan muncul di halaman pencarian dan customer tidak bisa melakukan pemesanan baru',
    }
    if (isSuspending) return {
      title: 'Apakah Anda yakin ingin mensuspend ruangan ini?',
      desc: 'Ruangan ini akan disuspend dan tidak dapat diakses hingga status diubah kembali',
    }
    return {
      title: 'Apakah Anda yakin ingin mengaktifkan ruangan ini?',
      desc: 'Ruangan ini akan muncul kembali di halaman pencarian dan customer bisa melakukan pemesanan baru',
    }
  }

  const message = getMessage()

  return (
    <div className={styles.overlay} onClick={onCancel}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>

        <div className={styles.header}>
          <h2 className={styles.title}>Konfirmasi Ubah Status</h2>
          <button className={styles.closeButton} onClick={onCancel} type="button">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18" strokeLinecap="round" strokeLinejoin="round" />
              <line x1="6" y1="6" x2="18" y2="18" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        <div className={styles.card}>
          <div className={styles.roomInfo}>
            <div className={styles.infoLeft}>
              <p className={styles.roomName}>Nama Ruangan: {roomName}</p>
              <p className={styles.roomId}>ID Ruangan : #{roomId}</p>
            </div>
            <div className={styles.statusSection}>
              <span className={styles.statusLabel}>Status Ruangan:</span>
              <span className={`${styles.statusBadge} ${getStatusBadgeClass(currentStatus)}`}>
                {formatStatus(currentStatus)}
              </span>
            </div>
          </div>

          <div className={styles.divider} />

          <div className={styles.confirmationMessage}>
            <p className={styles.messageTitle}>{message.title}</p>
            <p className={styles.messageDescription}>{message.desc}</p>
          </div>
        </div>

        <div className={styles.actions}>
          <button className={styles.cancelButton} onClick={onCancel} type="button">
            Batal
          </button>
          <button
            className={`${styles.confirmButton} ${getConfirmButtonClass()} ${isDisabled ? styles.disabled : ''}`}
            onClick={onConfirm}
            type="button"
            disabled={isDisabled}
          >
            {getConfirmLabel()}
          </button>
        </div>

      </div>
    </div>
  )
}
