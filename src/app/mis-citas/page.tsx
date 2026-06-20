import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import Link from 'next/link'

import Navbar from '@/features/navigation/components/Navbar'
import CitasView from '@/features/appointments/components/CitasView'
import { getMyAppointments } from '@/features/appointments/data'
import { getSessionUser } from '@/lib/session'

export default function MisCitasPage() {
  return (
    <main className="min-h-screen bg-sky-50">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">📋 Mis citas</h1>
            <p className="text-slate-500 mt-1">Historial y próximas citas agendadas</p>
          </div>
          <Link href="/agendar" className="btn-primary text-sm py-2 px-4">+ Nueva cita</Link>
        </div>

        <Suspense fallback={<div className="card text-center py-12 text-slate-400">Cargando...</div>}>
          <CitasList />
        </Suspense>
      </div>
    </main>
  )
}

async function CitasList() {
  const user = await getSessionUser()
  if (!user) redirect('/auth/login')

  const appointments = await getMyAppointments(user.id)
  return <CitasView appointments={appointments} />
}
