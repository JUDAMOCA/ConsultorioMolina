'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import WompiButton from '@/components/WompiButton'
import type { Service, ClinicInfo } from '@/lib/data'

type Step = 'service' | 'date' | 'time' | 'payment' | 'wompi' | 'success'

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
function timeToMin(t: string) {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

function minToTime(m: number) {
  const h = Math.floor(m / 60).toString().padStart(2, '0')
  const min = (m % 60).toString().padStart(2, '0')
  return `${h}:${min}`
}

function generateSlots(start: string, end: string, duration: number, bookedSlots: Array<{s: number, e: number}>) {
  const startMin = timeToMin(start)
  const endMin = timeToMin(end)
  const slots: string[] = []
  for (let t = startMin; t + duration <= endMin; t += duration) {
    const e = t + duration
    const overlaps = bookedSlots.some(b => t < b.e && e > b.s)
    if (!overlaps) slots.push(minToTime(t))
  }
  return slots
}

function getAvailableDates(workingDays: number[] = [1,2,3,4,5], weeksAhead = 4) {
  const dates: Date[] = []
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  for (let i = 1; i <= weeksAhead * 7; i++) {
    const d = new Date(today)
    d.setDate(today.getDate() + i)
    if (workingDays.includes(d.getDay())) dates.push(d)
  }
  return dates
}

// ─────────────────────────────────────────────
// Flujo de agendamiento (interactivo)
// ─────────────────────────────────────────────
export default function BookingFlow({
  services,
  clinicInfo,
  userId,
}: {
  services: Service[]
  clinicInfo: ClinicInfo | null
  userId: string
}) {
  const supabase = createClient()
  const router = useRouter()

  // Booking flow
  const [step, setStep] = useState<Step>('service')
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'online' | null>(null)
  const [slots, setSlots] = useState<string[]>([])
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [appointmentId, setAppointmentId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  // ── Load slots when date is selected (client-side: reads live bookings)
  useEffect(() => {
    if (!selectedDate || !selectedService) return
    const loadSlots = async () => {
      setSlotsLoading(true)
      const dateStr = selectedDate.toISOString().slice(0, 10)
      const { data: booked } = await supabase
        .from('appointments')
        .select('start_time, end_time')
        .eq('appointment_date', dateStr)
        .neq('status', 'cancelled')
      const bookedSlots = (booked || []).map(a => ({
        s: timeToMin(a.start_time),
        e: timeToMin(a.end_time),
      }))
      const duration = selectedService.duration_minutes
      const morningSlots = generateSlots(clinicInfo?.morning_start ?? '08:00', clinicInfo?.morning_end ?? '12:00', duration, bookedSlots)
      const afternoonSlots = generateSlots(clinicInfo?.afternoon_start ?? '14:00', clinicInfo?.afternoon_end ?? '18:00', duration, bookedSlots)
      setSlots([...morningSlots, ...afternoonSlots])
      setSlotsLoading(false)
    }
    loadSlots()
  }, [selectedDate, selectedService, clinicInfo])

  // ── Create appointment (cash) or prepare Wompi
  const handleConfirm = async () => {
    if (!selectedService || !selectedDate || !selectedTime || !paymentMethod) return
    setError('')
    setSaving(true)

    const dateStr = selectedDate.toISOString().slice(0, 10)
    const endMin = timeToMin(selectedTime) + selectedService.duration_minutes
    const endTime = minToTime(endMin)

    const { data, error: insertError } = await supabase
      .from('appointments')
      .insert({
        patient_id: userId,
        service_id: selectedService.id,
        appointment_date: dateStr,
        start_time: selectedTime + ':00',
        end_time: endTime + ':00',
        status: 'pending',
        payment_method: paymentMethod,
        payment_status: paymentMethod === 'cash' ? 'pending' : 'pending',
      })
      .select()
      .single()

    setSaving(false)
    if (insertError || !data) { setError('Error al guardar: ' + (insertError?.message || 'intenta de nuevo')); return }

    setAppointmentId(data.id)
    if (paymentMethod === 'cash') {
      setStep('success')
    } else {
      setStep('wompi')
    }
  }

  // ─────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────
  const availableDates = getAvailableDates(clinicInfo?.working_days ?? [1,2,3,4,5])

  const isMorningSlot = (t: string) => timeToMin(t) < timeToMin(clinicInfo?.afternoon_start ?? '14:00')
  const morningSlots = slots.filter(isMorningSlot)
  const afternoonSlots = slots.filter(t => !isMorningSlot(t))

  return (
    <>
      {/* Progress */}
      {step !== 'success' && step !== 'wompi' && (
        <div className="flex items-center justify-center gap-2 mb-8">
          {(['service','date','time','payment'] as const).map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors
                ${step === s ? 'bg-sky-600 text-white' :
                  ['service','date','time','payment'].indexOf(step) > i ? 'bg-green-500 text-white' : 'bg-slate-200 text-slate-500'}`}>
                {['service','date','time','payment'].indexOf(step) > i ? '✓' : i + 1}
              </div>
              {i < 3 && <div className="w-8 h-0.5 bg-slate-200" />}
            </div>
          ))}
        </div>
      )}

      {/* ── STEP 1: Servicio ── */}
      {step === 'service' && (
        <div>
          <h2 className="font-bold text-slate-700 text-lg mb-4">1. Selecciona el servicio</h2>
          {services.length === 0 ? (
            <div className="card text-center py-12 text-slate-400">No hay servicios disponibles aún.</div>
          ) : (
            <div className="space-y-3">
              {services.map(svc => (
                <button key={svc.id} onClick={() => { setSelectedService(svc); setStep('date') }}
                  className={`w-full card text-left hover:border-sky-300 hover:shadow-md transition-all border-2 ${selectedService?.id === svc.id ? 'border-sky-500 bg-sky-50' : 'border-transparent'}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-slate-800">{svc.name}</p>
                      <p className="text-sm text-slate-500">⏱ {svc.duration_minutes} minutos</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-sky-600 text-lg">${svc.price_cop.toLocaleString('es-CO')}</p>
                      <p className="text-xs text-slate-400">COP</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── STEP 2: Fecha ── */}
      {step === 'date' && (
        <div>
          <button onClick={() => setStep('service')} className="text-sm text-sky-600 hover:underline mb-4 block">← Volver</button>
          <h2 className="font-bold text-slate-700 text-lg mb-1">2. Selecciona la fecha</h2>
          <p className="text-sm text-slate-500 mb-4">Servicio: <strong>{selectedService?.name}</strong></p>
          {availableDates.length === 0 ? (
            <div className="card text-center py-12 text-slate-400">No hay fechas disponibles.</div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {availableDates.map((d, i) => {
                const isSelected = selectedDate?.toISOString().slice(0,10) === d.toISOString().slice(0,10)
                return (
                  <button key={i}
                    onClick={() => { setSelectedDate(d); setSelectedTime(null); setStep('time') }}
                    className={`p-3 rounded-2xl border-2 text-center transition-all ${isSelected ? 'border-sky-500 bg-sky-50' : 'border-slate-200 hover:border-sky-300 bg-white'}`}>
                    <div className="text-xs text-slate-500 font-medium">
                      {d.toLocaleDateString('es-CO', { weekday: 'short' }).toUpperCase()}
                    </div>
                    <div className="text-xl font-bold text-slate-800">{d.getDate()}</div>
                    <div className="text-xs text-slate-500">
                      {d.toLocaleDateString('es-CO', { month: 'short' })}
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ── STEP 3: Hora ── */}
      {step === 'time' && (
        <div>
          <button onClick={() => setStep('date')} className="text-sm text-sky-600 hover:underline mb-4 block">← Volver</button>
          <h2 className="font-bold text-slate-700 text-lg mb-1">3. Selecciona la hora</h2>
          <p className="text-sm text-slate-500 mb-4">
            {selectedDate?.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
          {slotsLoading ? (
            <div className="card text-center py-12 text-slate-400">Cargando horarios disponibles...</div>
          ) : slots.length === 0 ? (
            <div className="card text-center py-12">
              <p className="text-slate-500">No hay horarios disponibles para este día.</p>
              <button onClick={() => setStep('date')} className="btn-secondary mt-4">Elegir otra fecha</button>
            </div>
          ) : (
            <div className="space-y-4">
              {morningSlots.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-slate-600 mb-2">☀️ Mañana</p>
                  <div className="grid grid-cols-4 gap-2">
                    {morningSlots.map(t => (
                      <button key={t} onClick={() => { setSelectedTime(t); setStep('payment') }}
                        className={`py-2 rounded-xl text-sm font-semibold border-2 transition-all ${selectedTime === t ? 'border-sky-500 bg-sky-50 text-sky-700' : 'border-slate-200 hover:border-sky-300 bg-white text-slate-700'}`}>
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {afternoonSlots.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-slate-600 mb-2">🌤 Tarde</p>
                  <div className="grid grid-cols-4 gap-2">
                    {afternoonSlots.map(t => (
                      <button key={t} onClick={() => { setSelectedTime(t); setStep('payment') }}
                        className={`py-2 rounded-xl text-sm font-semibold border-2 transition-all ${selectedTime === t ? 'border-sky-500 bg-sky-50 text-sky-700' : 'border-slate-200 hover:border-sky-300 bg-white text-slate-700'}`}>
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── STEP 4: Método de pago ── */}
      {step === 'payment' && (
        <div>
          <button onClick={() => setStep('time')} className="text-sm text-sky-600 hover:underline mb-4 block">← Volver</button>
          <h2 className="font-bold text-slate-700 text-lg mb-4">4. Método de pago</h2>

          {/* Resumen */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 mb-6">
            <h3 className="font-bold text-slate-700 mb-3">Resumen de tu cita</h3>
            <div className="space-y-2 text-sm text-slate-600">
              <div className="flex justify-between"><span>Servicio</span><span className="font-medium">{selectedService?.name}</span></div>
              <div className="flex justify-between"><span>Fecha</span><span className="font-medium">{selectedDate?.toLocaleDateString('es-CO',{weekday:'long',day:'numeric',month:'long'})}</span></div>
              <div className="flex justify-between"><span>Hora</span><span className="font-medium">{selectedTime} – {minToTime(timeToMin(selectedTime!) + (selectedService?.duration_minutes || 0))}</span></div>
              <div className="flex justify-between pt-2 border-t border-slate-100 text-base font-bold text-slate-800">
                <span>Total</span><span className="text-sky-600">${selectedService?.price_cop.toLocaleString('es-CO')} COP</span>
              </div>
            </div>
          </div>

          <div className="space-y-3 mb-6">
            <button onClick={() => setPaymentMethod('cash')}
              className={`w-full card text-left border-2 transition-all ${paymentMethod === 'cash' ? 'border-sky-500 bg-sky-50' : 'border-transparent hover:border-sky-200'}`}>
              <div className="flex items-center gap-4">
                <div className="text-3xl">💵</div>
                <div>
                  <p className="font-bold text-slate-800">Pago en efectivo</p>
                  <p className="text-sm text-slate-500">Paga directamente en el consultorio</p>
                </div>
                {paymentMethod === 'cash' && <div className="ml-auto text-sky-600 text-xl">✓</div>}
              </div>
            </button>
            <button onClick={() => setPaymentMethod('online')}
              className={`w-full card text-left border-2 transition-all ${paymentMethod === 'online' ? 'border-sky-500 bg-sky-50' : 'border-transparent hover:border-sky-200'}`}>
              <div className="flex items-center gap-4">
                <div className="text-3xl">💳</div>
                <div>
                  <p className="font-bold text-slate-800">Pago en línea</p>
                  <p className="text-sm text-slate-500">Tarjeta de crédito/débito o PSE via Wompi</p>
                </div>
                {paymentMethod === 'online' && <div className="ml-auto text-sky-600 text-xl">✓</div>}
              </div>
            </button>
          </div>

          {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3 mb-4">{error}</div>}

          <button onClick={handleConfirm} disabled={!paymentMethod || saving}
            className="btn-primary w-full py-4 text-lg">
            {saving ? 'Guardando...' : paymentMethod === 'online' ? '💳 Continuar con Wompi' : '✅ Confirmar cita'}
          </button>
        </div>
      )}

      {/* ── STEP: Wompi ── */}
      {step === 'wompi' && selectedService && appointmentId && (
        <div>
          <div className="card text-center mb-6">
            <div className="text-5xl mb-3">💳</div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">Pago en línea</h2>
            <p className="text-slate-500 text-sm">Tu cita está guardada. Completa el pago para confirmarla.</p>
            <div className="bg-slate-50 rounded-xl p-4 mt-4 text-sm text-slate-600">
              <p><strong>{selectedService.name}</strong></p>
              <p className="text-sky-600 font-bold text-xl mt-1">${selectedService.price_cop.toLocaleString('es-CO')} COP</p>
            </div>
          </div>
          <WompiButton appointmentId={appointmentId} />
          <button onClick={() => setStep('success')} className="w-full text-sm text-slate-400 hover:text-slate-600 mt-4 py-2">
            Pagar en efectivo en el consultorio →
          </button>
        </div>
      )}

      {/* ── STEP: Éxito ── */}
      {step === 'success' && (
        <div className="card text-center py-10">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">¡Cita agendada!</h2>
          <p className="text-slate-500 mb-6">Tu cita ha sido registrada exitosamente.</p>
          <div className="bg-sky-50 rounded-2xl p-5 text-left mb-6 space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-slate-500">Servicio</span><span className="font-medium">{selectedService?.name}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Fecha</span><span className="font-medium">{selectedDate?.toLocaleDateString('es-CO',{weekday:'long',day:'numeric',month:'long'})}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Hora</span><span className="font-medium">{selectedTime}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Pago</span><span className="font-medium">{paymentMethod === 'cash' ? '💵 Efectivo en consultorio' : '💳 En línea'}</span></div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => router.push('/mis-citas')} className="btn-primary flex-1">Ver mis citas</button>
            <button onClick={() => { setStep('service'); setSelectedService(null); setSelectedDate(null); setSelectedTime(null); setPaymentMethod(null) }}
              className="btn-secondary flex-1">Nueva cita</button>
          </div>
        </div>
      )}
    </>
  )
}
