'use client'

import { useRouter } from 'next/navigation'
import './BackButton.css'

type BackButtonProps = {
  onClick?: () => void
  href?: string
  className?: string
  ariaLabel?: string
}

export default function BackButton({ onClick, href, className = '', ariaLabel = 'Kembali' }: BackButtonProps) {
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
    <button
      type="button"
      className={`rooms-back-btn ${className}`.trim()}
      onClick={handleClick}
      aria-label={ariaLabel}
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 12H5M12 19l-7-7 7-7" />
      </svg>
    </button>
  )
}
