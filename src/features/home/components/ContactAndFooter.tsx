import Link from 'next/link'
import { cacheLife, cacheTag } from 'next/cache'

import { getClinicInfo } from '@/lib/data'
import { DEFAULT_CI, formatSchedule } from '@/features/home/lib/clinic'

export default async function ContactAndFooter() {
  'use cache'
  cacheLife('hours')
  cacheTag('clinic-info')
  const ci = (await getClinicInfo()) ?? DEFAULT_CI
  const clinicName = ci.clinic_name || 'Consultorio Juan Carlos Molina'

  return (
    <>
      {/* Contact */}
      <section id="contacto" className="py-16 px-4 bg-sky-50">
        <div className="max-w-xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-slate-800 mb-8">Como llegar</h2>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 text-left space-y-4">
            <div>
              <p className="font-semibold text-slate-700">Direccion</p>
              <p className="text-slate-500">{ci.address}</p>
            </div>
            <div>
              <p className="font-semibold text-slate-700">Telefono</p>
              <p className="text-slate-500">{ci.phone}</p>
            </div>
            <div>
              <p className="font-semibold text-slate-700">Email</p>
              <p className="text-slate-500">{ci.email}</p>
            </div>
            <div>
              <p className="font-semibold text-slate-700">Horario</p>
              <p className="text-slate-500">{formatSchedule(ci)}</p>
            </div>
          </div>
          <div className="mt-8">
            <Link href="/agendar" className="btn-primary px-8 py-3 text-lg">
              Agendar mi cita
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-800 text-slate-400 py-8 px-4 text-center">
        <p className="text-white font-semibold text-lg mb-1">{clinicName}</p>
        <p className="text-sm">{ci.phone} · {ci.email}</p>
        <p className="text-sm mt-2">{ci.address}</p>
        <p className="text-xs mt-4 text-slate-600">
          © {new Date().getFullYear()} Todos los derechos reservados
        </p>
      </footer>
    </>
  )
}
