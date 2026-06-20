import Link from "next/link";

import { getServices } from "@/lib/data";

export default async function ServicesSection() {
  const services = await getServices();

  return (
    <section id="servicios" className="bg-sky-50 px-4 py-16">
      <div className="mx-auto max-w-4xl">
        <h2 className="mb-3 text-center font-bold text-3xl text-slate-800">
          Nuestros Servicios
        </h2>
        <p className="mb-10 text-center text-slate-500">
          Tratamientos dentales con la mas alta calidad
        </p>
        {services.length === 0 ? (
          <div className="py-12 text-center text-slate-400">
            <div className="mb-3 text-5xl">🦷</div>
            <p>Los servicios apareceran aqui pronto.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {services.map((svc) => (
              <div
                key={svc.id}
                className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-slate-800">
                    {svc.name}
                  </h3>
                  {svc.description && (
                    <p className="mt-1 text-slate-500 text-sm">
                      {svc.description}
                    </p>
                  )}
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-slate-400 text-xs">
                      {svc.duration_minutes >= 60
                        ? `${Math.floor(svc.duration_minutes / 60)} hora`
                        : `${svc.duration_minutes} min`}
                    </span>
                    <span className="font-bold text-lg text-sky-600">
                      ${svc.price_cop.toLocaleString("es-CO")}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="mt-8 text-center">
          <Link href="/agendar" className="btn-primary px-8 py-3 text-lg">
            Agendar ahora
          </Link>
        </div>
      </div>
    </section>
  );
}
