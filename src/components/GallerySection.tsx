'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'

export default function GallerySection() {
  const [images, setImages] = useState<{ id: string; image_url: string }[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('gallery')
        .select('id, image_url')
        .order('created_at', { ascending: false })
      setImages(data || [])
      setLoading(false)
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="aspect-square rounded-2xl bg-slate-100 animate-pulse" />
        ))}
      </div>
    )
  }

  if (images.length === 0) {
    return (
      <div className="text-center py-12 text-slate-400">
        <div className="text-5xl mb-3">📷</div>
        <p>Las fotos del consultorio aparecerán aquí pronto.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
      {images.map(img => (
        <div key={img.id} className="rounded-2xl overflow-hidden shadow-sm border border-slate-100" style={{ aspectRatio: '4/3' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={img.image_url}
            alt="Foto del consultorio"
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
          />
        </div>
      ))}
    </div>
  )
}
