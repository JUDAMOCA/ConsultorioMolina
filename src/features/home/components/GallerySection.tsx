import Image from 'next/image'

import { getGallery } from '@/lib/data'

export default async function GallerySection() {
  const images = await getGallery()

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
      {images.map((img) => (
        <div key={img.id} className="relative rounded-2xl overflow-hidden shadow-sm border border-slate-100" style={{ aspectRatio: '4/3' }}>
          <Image
            src={img.image_url}
            alt="Foto del consultorio"
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
            className="object-cover hover:scale-105 transition-transform duration-300"
          />
        </div>
      ))}
    </div>
  )
}
