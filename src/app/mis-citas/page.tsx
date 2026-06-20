import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import CitasView from './CitasView'

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
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data } = await supabase
    .from('appointments')
    .select('*, services(name, duration_minutes, price_cop)')
    .eq('patient_id', user.id)
    .order('appointment_date', { ascending: true })
    .order('start_time', { ascending: true })

  return <CitasView appointments={data ?? []} />
}
