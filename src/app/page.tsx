import { Suspense } from 'react'

import Navbar from '@/features/navigation/components/Navbar'
import HeroAndFeatures from '@/features/home/components/HeroAndFeatures'
import ServicesSection from '@/features/home/components/ServicesSection'
import ContactAndFooter from '@/features/home/components/ContactAndFooter'
import GallerySection from '@/features/home/components/GallerySection'
import { GallerySkeleton, HeroSkeleton, ServicesSkeleton } from '@/features/home/components/skeletons'

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <Navbar />

      <Suspense fallback={<HeroSkeleton />}>
        <HeroAndFeatures />
      </Suspense>

      <Suspense fallback={<ServicesSkeleton />}>
        <ServicesSection />
      </Suspense>

      {/* Gallery */}
      <section id="galeria" className="py-16 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-slate-800 mb-3">Galeria</h2>
          <p className="text-center text-slate-500 mb-10">
            Conoce nuestro consultorio y los resultados de nuestros tratamientos
          </p>
          <Suspense fallback={<GallerySkeleton />}>
            <GallerySection />
          </Suspense>
        </div>
      </section>

      <Suspense fallback={null}>
        <ContactAndFooter />
      </Suspense>
    </main>
  )
}
