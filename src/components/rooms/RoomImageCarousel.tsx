'use client'

import { useMemo, useState } from 'react'

type Props = {
  images: string[]
  alt: string
}

export default function RoomImageCarousel({ images, alt }: Props) {
  const normalizedImages = useMemo(() => (images.length > 0 ? images : ['/images/gambarRuangan.png']), [images])
  const [activeIndex, setActiveIndex] = useState(0)

  function goNext() {
    setActiveIndex(prev => (prev + 1) % normalizedImages.length)
  }

  function goPrev() {
    setActiveIndex(prev => (prev - 1 + normalizedImages.length) % normalizedImages.length)
  }

  return (
    <div className="customer-room-gallery">
      <img src={normalizedImages[activeIndex]} alt={alt} />

      <button type="button" className="customer-room-gallery-nav prev" onClick={goPrev} aria-label="Gambar sebelumnya">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6">
          <path strokeLinecap="round" strokeLinejoin="round" d="m15 18-6-6 6-6" />
        </svg>
      </button>

      <button type="button" className="customer-room-gallery-nav next" onClick={goNext} aria-label="Gambar selanjutnya">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6">
          <path strokeLinecap="round" strokeLinejoin="round" d="m9 18 6-6-6-6" />
        </svg>
      </button>

      <div className="customer-room-gallery-dots" role="tablist" aria-label="Navigasi gambar ruangan">
        {normalizedImages.map((image, index) => (
          <button
            key={`${image}-${index}`}
            type="button"
            className={index === activeIndex ? 'active' : ''}
            onClick={() => setActiveIndex(index)}
            aria-label={`Pilih gambar ${index + 1}`}
          />
        ))}
      </div>
    </div>
  )
}

