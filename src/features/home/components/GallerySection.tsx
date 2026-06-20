import Image from "next/image";

import { getGallery } from "@/lib/data";

export default async function GallerySection() {
  const images = await getGallery();

  if (images.length === 0) {
    return (
      <div className="py-12 text-center text-slate-400">
        <div className="mb-3 text-5xl">📷</div>
        <p>Las fotos del consultorio aparecerán aquí pronto.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
      {images.map((img) => (
        <div
          key={img.id}
          className="relative overflow-hidden rounded-2xl border border-slate-100 shadow-sm"
          style={{ aspectRatio: "4/3" }}
        >
          <Image
            src={img.image_url}
            alt="Foto del consultorio"
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
            className="object-cover transition-transform duration-300 hover:scale-105"
          />
        </div>
      ))}
    </div>
  );
}
