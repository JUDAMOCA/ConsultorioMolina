import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { getServices, getClinicInfo } from '@/lib/data'
import BookingFlow from './BookingFlow'

export default function AgendarPage() {
  return (
    <main className="min-h-screen bg-sky-50">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-800">🦷 Agendar cita</h1>
          <p className="text-slate-500 mt-1">Elige el servicio y horario de tu preferencia</p>
        </div>

        <Suspense fallback={<div className="card text-center py-16 text-slate-400">Cargando...</div>}>
          <AgendarGate />
        </Suspense>
      </div>
    </main>
  )
}

async function AgendarGate() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login?redirect=/agendar')

  // No dejar que el odontólogo agende
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role === 'dentist') redirect('/panel')

  const [services, clinicInfo] = await Promise.all([getServices(true), getClinicInfo()])

  return <BookingFlow services={services} clinicInfo={clinicInfo} userId={user.id} />
}
