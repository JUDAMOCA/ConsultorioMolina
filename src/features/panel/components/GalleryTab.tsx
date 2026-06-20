'use client'

import { useRef, useTransition, type ChangeEvent } from 'react'

import { deleteGalleryImage, uploadGalleryImage } from '@/features/panel/actions'
import type { GalleryItem } from '@/features/panel/lib/types'

export default function GalleryTab({ gallery }: { gallery: GalleryItem[] }) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [pending, startTransition] = useTransition()

  const onPick = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const formData = new FormData()
    formData.append('file', file)
    startTransition(async () => {
      const result = await uploadGalleryImage(formData)
      if ('error' in result) alert('Error al subir: ' + result.error)
    })
    e.target.value = ''
  }

  const onDelete = (item: GalleryItem) => {
    if (!confirm('¿Eliminar esta imagen?')) return
    startTransition(async () => {
      const result = await deleteGalleryImage(item.id, item.file_path)
      if ('error' in result) alert(result.error)
    })
  }

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">🖼️ Galería</h2>
          <p className="text-slate-500 text-sm mt-1">Fotos que se muestran en la página de inicio</p>
        </div>
        <div>
          <input type="file" ref={fileRef} className="hidden" accept="image/*" aria-label="Subir foto a la galería" onChange={onPick} />
          <button type="button" onClick={() => fileRef.current?.click()} disabled={pending} className="btn-primary">
            {pending ? '⬆️ Subiendo...' : '+ Subir foto'}
          </button>
        </div>
      </div>

      {gallery.length === 0 ? (
        <div className="card text-center py-16">
          <div className="text-5xl mb-4">🖼️</div>
          <p className="text-slate-500">No hay fotos aún. ¡Sube la primera!</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {gallery.map((item) => (
            <div key={item.id} className="relative group rounded-2xl overflow-hidden aspect-square shadow-sm">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.image_url} alt="Galería" className="w-full h-full object-cover" />
              <button type="button" onClick={() => onDelete(item)}
                className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow-md">
                🗑 Eliminar
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
