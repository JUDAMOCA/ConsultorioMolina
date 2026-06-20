'use client'

import { useEffect, useState } from 'react'

// The only interactive part of the hero: auto-rotating banner images + dots.
// The hero background, logo, heading, subtitle and CTA are server-rendered.
export default function BannerSlider({ images }: { images: string[] }) {
  const [sliderIndex, setSliderIndex] = useState(0)

  useEffect(() => {
    if (images.length <= 1) return
    const t = setInterval(() => setSliderIndex((i) => (i + 1) % images.length), 4000)
    return () => clearInterval(t)
  }, [images.length])

  if (images.length === 0) {
    return <div className="absolute inset-0 bg-gradient-to-br from-sky-600 to-cyan-400" />
  }

  return (
    <>
      {images.map((src, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={src}
          src={src}
          alt=""
          className="absolute inset-0 w-full h-full object-cover transition-opacity duration-1000"
          style={{ opacity: i === sliderIndex ? 1 : 0 }}
        />
      ))}
      <div className="absolute inset-0 bg-black/40" />
      {images.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          {images.map((src, i) => (
            <button
              key={src}
              type="button"
              aria-label={`Ir a la imagen ${i + 1}`}
              onClick={() => setSliderIndex(i)}
              className={`w-2 h-2 rounded-full transition-all ${
                i === sliderIndex ? 'bg-white scale-125' : 'bg-white/50'
              }`}
            />
          ))}
        </div>
      )}
    </>
  )
}
