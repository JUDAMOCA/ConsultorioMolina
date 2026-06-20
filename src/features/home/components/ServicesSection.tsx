import Link from 'next/link'

import { getServices } from '@/lib/data'

export default async function ServicesSection() {
  const services = await getServices()

  return (
    <section id="servicios" className="py-16 px-4 bg-sky-50">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold text-center text-slate-800 mb-3">Nuestros Servicios</h2>
        <p className="text-center text-slate-500 mb-10">Tratamientos dentales con la mas alta calidad</p>
        {services.length === 0 ? (
          <div className="text-center text-slate-400 py-12">
            <div className="text-5xl mb-3">🦷</div>
            <p>Los servicios apareceran aqui pronto.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {services.map((svc) => (
              <div
                key={svc.id}
                className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow"
              >
                <div className="flex-1">
                  <h3 className="font-bold text-slate-800 text-lg">{svc.name}</h3>
                  {svc.description && (
                    <p className="text-slate-500 text-sm mt-1">{svc.description}</p>
                  )}
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-xs text-slate-400">
                      {svc.duration_minutes >= 60
                        ? `${Math.floor(svc.duration_minutes / 60)} hora`
                        : `${svc.duration_minutes} min`}
                    </span>
                    <span className="font-bold text-sky-600 text-lg">
                      ${svc.price_cop.toLocaleString('es-CO')}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="text-center mt-8">
          <Link href="/agendar" className="btn-primary px-8 py-3 text-lg">
            Agendar ahora
          </Link>
        </div>
      </div>
    </section>
  )
}
