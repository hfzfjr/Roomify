'use client'

import { useRouter } from 'next/navigation'
import './BackButton.css'

type BackButtonProps = {
  onClick?: () => void
  href?: string
  className?: string
  ariaLabel?: string
  title?: string
}

export default function BackButton({ onClick, href, className = '', ariaLabel = 'Kembali', title }: BackButtonProps) {
  const router = useRouter()

  const handleClick = () => {
    if (onClick) {
      onClick()
      return
    }

    if (href) {
      router.push(href)
      return
    }

    router.back()
  }

  return (
    <div className={`rooms-back-header ${className}`.trim()}>
      <div className="rooms-back-header-inner">
        <button
          type="button"
          className="rooms-back-header-btn"
          onClick={handleClick}
          aria-label={ariaLabel}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>
        {title && <h1 className="rooms-back-header-title">{title}</h1>}
      </div>
    </div>
  )
}

