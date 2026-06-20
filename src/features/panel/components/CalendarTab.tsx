'use client'

import { useState, useTransition } from 'react'

import { updateAppointmentStatus } from '@/features/panel/actions'
import {
  computeStats,
  DAY_NAMES,
  getWeekDates,
  HOUR_LABELS,
  PX_PER_MIN,
  START_MINUTES,
  STATUS_COLOR,
  timeToMin,
  TOTAL_PX,
} from '@/features/panel/lib/calendar'
import type { PanelAppointment } from '@/features/panel/lib/types'

export default function CalendarTab({ appointments }: { appointments: PanelAppointment[] }) {
  const [weekBase, setWeekBase] = useState(() => new Date())
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  // Derive from props so the detail panel reflects fresh data after a status
  // change revalidates the page (no stale snapshot in local state).
  const selected = selectedId ? appointments.find((a) => a.id === selectedId) ?? null : null
  const stats = computeStats(appointments)
  const weekDates = getWeekDates(weekBase)
  const todayKey = new Date().toISOString().slice(0, 10)

  const apptsByDay: Record<string, PanelAppointment[]> = {}
  weekDates.forEach((d) => {
    const key = d.toISOString().slice(0, 10)
    apptsByDay[key] = appointments.filter((a) => a.appointment_date === key && a.status !== 'cancelled')
  })

  const handleStatus = (id: string, status: 'confirmed' | 'cancelled') => {
    startTransition(async () => {
      const result = await updateAppointmentStatus(id, status)
      if ('error' in result) alert(result.error)
    })
  }

  return (
    <>
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total citas', value: stats.total, icon: '📋' },
          { label: 'Esta semana', value: stats.week, icon: '📅' },
          { label: 'Pendientes', value: stats.pending, icon: '⏳' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <div className="text-2xl mb-1">{s.icon}</div>
            <div className="text-3xl font-bold text-slate-800">{s.value}</div>
            <div className="text-sm text-slate-500">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Week nav */}
      <div className="flex items-center gap-4 mb-4">
        <button type="button" onClick={() => { const d = new Date(weekBase); d.setDate(d.getDate() - 7); setWeekBase(d) }}
          className="btn-secondary text-sm px-3 py-1">← Ant.</button>
        <span className="font-semibold text-slate-700" suppressHydrationWarning>
          {weekDates[1].toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })} – {weekDates[5].toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })}
        </span>
        <button type="button" onClick={() => { const d = new Date(weekBase); d.setDate(d.getDate() + 7); setWeekBase(d) }}
          className="btn-secondary text-sm px-3 py-1">Sig. →</button>
        <button type="button" onClick={() => setWeekBase(new Date())}
          className="text-xs text-sky-600 hover:underline ml-2">Hoy</button>
      </div>

      <div className="flex gap-4">
        {/* Calendar grid */}
        <div className="flex-1 overflow-x-auto">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden min-w-[700px]">
            {/* Day headers */}
            <div className="grid border-b border-slate-200" style={{ gridTemplateColumns: '48px repeat(7, 1fr)' }}>
              <div />
              {weekDates.map((d) => {
                const dayKey = d.toISOString().slice(0, 10)
                const isToday = dayKey === todayKey
                return (
                  <div key={dayKey} className={`text-center py-3 text-sm font-semibold border-l border-slate-100 ${isToday ? 'bg-sky-50 text-sky-700' : 'text-slate-600'}`}>
                    <div>{DAY_NAMES[d.getDay()]}</div>
                    <div className={`text-xl font-bold ${isToday ? 'text-sky-600' : 'text-slate-800'}`}>{d.getDate()}</div>
                  </div>
                )
              })}
            </div>
            {/* Time grid */}
            <div className="relative flex" style={{ height: TOTAL_PX + 'px' }}>
              {/* Hour labels */}
              <div className="w-12 flex-shrink-0 relative">
                {HOUR_LABELS.map((h, i) => (
                  <div key={h} className="absolute right-2 text-xs text-slate-400" style={{ top: i * 60 * PX_PER_MIN - 8 }}>{h}</div>
                ))}
              </div>
              {/* Horizontal hour lines */}
              <div className="absolute inset-0 ml-12 pointer-events-none">
                {HOUR_LABELS.map((_, i) => (
                  <div key={i} className="absolute w-full border-t border-slate-100" style={{ top: i * 60 * PX_PER_MIN }} />
                ))}
                {/* Lunch break shading */}
                <div className="absolute w-full bg-slate-50/60"
                  style={{ top: (720 - START_MINUTES) * PX_PER_MIN, height: (840 - 720) * PX_PER_MIN }} />
              </div>
              {/* Day columns */}
              {weekDates.map((d) => {
                const key = d.toISOString().slice(0, 10)
                const dayAppts = apptsByDay[key] || []
                return (
                  <div key={key} className="flex-1 relative border-l border-slate-100">
                    {dayAppts.map((appt) => {
                      const start = timeToMin(appt.start_time)
                      const end = timeToMin(appt.end_time)
                      const top = (start - START_MINUTES) * PX_PER_MIN
                      const height = Math.max((end - start) * PX_PER_MIN, 20)
                      return (
                        <button key={appt.id} type="button"
                          onClick={() => setSelectedId(appt.id)}
                          className={`absolute left-1 right-1 rounded-lg border px-1 py-0.5 text-xs cursor-pointer overflow-hidden hover:opacity-90 transition-opacity text-left ${STATUS_COLOR[appt.status]}`}
                          style={{ top, height }}>
                          <div className="font-semibold truncate">{appt.services?.name}</div>
                          <div className="opacity-80 truncate">{appt.profiles?.full_name}</div>
                        </button>
                      )
                    })}
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Detail sidebar */}
        {selected && (
          <div className="w-72 flex-shrink-0">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 sticky top-24">
              <div className="flex items-start justify-between mb-4">
                <h3 className="font-bold text-slate-800">Detalle de cita</h3>
                <button type="button" onClick={() => setSelectedId(null)} className="text-slate-400 hover:text-slate-600 text-xl leading-none" aria-label="Cerrar detalle">×</button>
              </div>
              <div className="space-y-3 text-sm">
                <div><span className="label text-xs">Servicio</span><p className="font-semibold">{selected.services?.name}</p></div>
                <div><span className="label text-xs">Paciente</span><p>{selected.profiles?.full_name}</p></div>
                {selected.profiles?.phone && <div><span className="label text-xs">Teléfono</span><p>{selected.profiles.phone}</p></div>}
                <div><span className="label text-xs">Email</span><p className="truncate">{selected.profiles?.email}</p></div>
                <div><span className="label text-xs">Fecha</span><p>{new Date(selected.appointment_date + 'T12:00:00').toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })}</p></div>
                <div><span className="label text-xs">Hora</span><p>{selected.start_time?.slice(0, 5)} – {selected.end_time?.slice(0, 5)}</p></div>
                <div><span className="label text-xs">Pago</span><p>{selected.payment_method === 'cash' ? '💵 Efectivo' : '💳 En línea'} · {selected.payment_status === 'paid' ? '✅ Pagado' : '⏳ Pendiente'}</p></div>
                <div>
                  <span className="label text-xs">Estado</span>
                  <span className={`inline-block text-xs px-2 py-1 rounded-full font-medium mt-1 ${STATUS_COLOR[selected.status]}`}>
                    {selected.status === 'pending' ? 'Pendiente' : selected.status === 'confirmed' ? 'Confirmada' : 'Cancelada'}
                  </span>
                </div>
              </div>
              {selected.status !== 'cancelled' && (
                <div className="mt-4 space-y-2">
                  {selected.status !== 'confirmed' && (
                    <button type="button" onClick={() => handleStatus(selected.id, 'confirmed')}
                      className="w-full bg-green-100 hover:bg-green-200 text-green-800 font-semibold py-2 rounded-xl text-sm transition-colors">
                      ✅ Confirmar cita
                    </button>
                  )}
                  <button type="button" onClick={() => handleStatus(selected.id, 'cancelled')}
                    className="w-full bg-red-50 hover:bg-red-100 text-red-600 font-semibold py-2 rounded-xl text-sm transition-colors">
                    ❌ Cancelar cita
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  )
}
