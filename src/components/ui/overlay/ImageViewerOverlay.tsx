'use client'

import styles from './ImageViewerOverlay.module.css'

interface ImageViewerOverlayProps {
    isOpen: boolean
    onClose: () => void
    imageUrl: string
}

export default function ImageViewerOverlay({ isOpen, onClose, imageUrl }: ImageViewerOverlayProps) {
    if (!isOpen) return null

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.overlayContent} onClick={(e) => e.stopPropagation()}>
                <button className={styles.closeButton} onClick={onClose} aria-label="Tutup">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <line x1="18" y1="6" x2="6" y2="18" strokeLinecap="round" />
                        <line x1="6" y1="6" x2="18" y2="18" strokeLinecap="round" />
                    </svg>
                </button>
                <img src={imageUrl} alt="Full size view" className={styles.image} />
            </div>
        </div>
    )
}
