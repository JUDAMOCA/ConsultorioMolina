import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import PanelDashboard from './PanelDashboard'

export default function PanelPage() {
  return (
    <Suspense fallback={<PanelLoading />}>
      <PanelGate />
    </Suspense>
  )
}

function PanelLoading() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-400">
      Cargando panel...
    </div>
  )
}

async function PanelGate() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'dentist') redirect('/')

  const { data: appointments } = await supabase
    .from('appointments')
    .select('*, services(name, duration_minutes, price_cop), profiles(full_name, email, phone)')
    .order('appointment_date').order('start_time')

  return <PanelDashboard initialAppointments={appointments ?? []} />
}
