'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Link from 'next/link'

const STATUS_LABELS: Record<string, string> = {
  pending: '⏳ Pendiente',
  confirmed: '✅ Confirmada',
  cancelled: '❌ Cancelada',
}
const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-green-100 text-green-700',
  cancelled: 'bg-slate-100 text-slate-500',
}

export default function MisCitasPage() {
  const [appointments, setAppointments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [cancelling, setCancelling] = useState<string | null>(null)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }
      const { data } = await supabase
        .from('appointments')
        .select('*, services(name, duration_minutes, price_cop)')
        .eq('patient_id', user.id)
        .order('appointment_date', { ascending: true })
        .order('start_time', { ascending: true })
      setAppointments(data || [])
      setLoading(false)
    }
    init()
  }, [])

  const canCancel = (appt: any) => {
    if (appt.status === 'cancelled') return false
    const apptDateTime = new Date(`${appt.appointment_date}T${appt.start_time}`)
    const now = new Date()
    const diffMs = apptDateTime.getTime() - now.getTime()
    const diffHours = diffMs / (1000 * 60 * 60)
    return diffHours > 1
  }

  const handleCancel = async (id: string) => {
    if (!confirm('¿Estás seguro de que deseas cancelar esta cita?')) return
    setCancelling(id)
    await supabase.from('appointments').update({ status: 'cancelled' }).eq('id', id)
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: 'cancelled' } : a))
    setCancelling(null)
  }

  const upcoming = appointments.filter(a => {
    const d = new Date(`${a.appointment_date}T${a.start_time}`)
    return d >= new Date() && a.status !== 'cancelled'
  })
  const past = appointments.filter(a => {
    const d = new Date(`${a.appointment_date}T${a.start_time}`)
    return d < new Date() || a.status === 'cancelled'
  })

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

        {loading ? (
          <div className="card text-center py-12 text-slate-400">Cargando...</div>
        ) : appointments.length === 0 ? (
          <div className="card text-center py-16">
            <div className="text-5xl mb-4">📭</div>
            <p className="text-slate-500 mb-4">No tienes citas agendadas aún.</p>
            <Link href="/agendar" className="btn-primary">Agendar mi primera cita</Link>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Próximas */}
            {upcoming.length > 0 && (
              <div>
                <h2 className="font-bold text-slate-700 text-lg mb-3">Próximas citas</h2>
                <div className="space-y-4">
                  {upcoming.map(appt => (
                    <div key={appt.id} className="card">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS[appt.status]}`}>
                              {STATUS_LABELS[appt.status]}
                            </span>
                            <span className="text-xs text-slate-400">
                              {appt.payment_method === 'cash' ? '💵 Efectivo' : '💳 En línea'}
                            </span>
                          </div>
                          <p className="font-bold text-slate-800 text-lg">{appt.services?.name}</p>
                          <p className="text-sky-600 font-medium">
                            {new Date(appt.appointment_date + 'T12:00:00').toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                          </p>
                          <p className="text-slate-500 text-sm">🕐 {appt.start_time?.slice(0,5)} – {appt.end_time?.slice(0,5)}</p>
                          {appt.services?.price_cop && (
                            <p className="text-sm text-slate-400 mt-1">💰 ${appt.services.price_cop.toLocaleString('es-CO')} COP</p>
                          )}
                        </div>
                        <div>
                          {canCancel(appt) ? (
                            <button
                              onClick={() => handleCancel(appt.id)}
                              disabled={cancelling === appt.id}
                              className="bg-red-50 hover:bg-red-100 text-red-600 font-semibold py-2 px-4 rounded-xl text-sm transition-all border border-red-200"
                            >
                              {cancelling === appt.id ? 'Cancelando...' : 'Cancelar cita'}
                            </button>
                          ) : appt.status !== 'cancelled' && (
                            <div className="text-xs text-slate-400 text-center max-w-[120px]">
                              ⚠️ Solo puedes cancelar con más de 1 hora de anticipación
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Historial */}
            {past.length > 0 && (
              <div>
                <h2 className="font-bold text-slate-700 text-lg mb-3">Historial</h2>
                <div className="space-y-3">
                  {past.map(appt => (
                    <div key={appt.id} className="card opacity-70">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS[appt.status]}`}>
                            {STATUS_LABELS[appt.status]}
                          </span>
                          <p className="font-semibold text-slate-700 mt-1">{appt.services?.name}</p>
                          <p className="text-slate-400 text-sm">
                            {new Date(appt.appointment_date + 'T12:00:00').toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })} · {appt.start_time?.slice(0,5)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  )
}
