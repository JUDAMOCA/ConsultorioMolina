import { Suspense } from "react";

import Navbar from "@/features/navigation/components/Navbar";
import HeroAndFeatures from "@/features/home/components/HeroAndFeatures";
import ServicesSection from "@/features/home/components/ServicesSection";
import ContactAndFooter from "@/features/home/components/ContactAndFooter";
import GallerySection from "@/features/home/components/GallerySection";
import {
  GallerySkeleton,
  HeroSkeleton,
  ServicesSkeleton,
} from "@/features/home/components/skeletons";

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
      <section id="galeria" className="bg-white px-4 py-16">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-3 text-center font-bold text-3xl text-slate-800">
            Galeria
          </h2>
          <p className="mb-10 text-center text-slate-500">
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
  );
}
