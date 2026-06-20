'use client'

import { useEffect, useReducer } from 'react'
import { useRouter } from 'next/navigation'

import WompiButton from '@/features/payments/components/WompiButton'
import type { Service, ClinicInfo } from '@/lib/data'
import { createAppointment, getAvailableSlots } from '@/features/booking/actions'
import { getAvailableDates, minToTime, timeToMin, toDateKey } from '@/features/booking/lib/slots'

type Step = 'service' | 'date' | 'time' | 'payment' | 'wompi' | 'success'
type PaymentMethod = 'cash' | 'online'

// Ordered wizard steps for the progress indicator. Module scope keeps the array
// identity stable across renders.
const STEPS = ['service', 'date', 'time', 'payment'] as const

// The whole wizard is one logical flow, so its state lives in a single reducer
// instead of ~10 useState calls (vercel-react-best-practices: avoid render
// fan-out; react-doctor: prefer-useReducer).
interface State {
  step: Step
  service: Service | null
  dateKey: string | null
  time: string | null
  paymentMethod: PaymentMethod | null
  slots: string[]
  slotsLoading: boolean
  appointmentId: string | null
  error: string
  saving: boolean
}

type Action =
  | { type: 'pickService'; service: Service }
  | { type: 'goto'; step: Step }
  | { type: 'pickDate'; dateKey: string }
  | { type: 'loadingSlots' }
  | { type: 'slots'; slots: string[] }
  | { type: 'pickTime'; time: string }
  | { type: 'pickPayment'; method: PaymentMethod }
  | { type: 'saving' }
  | { type: 'error'; message: string }
  | { type: 'created'; id: string; method: PaymentMethod }
  | { type: 'reset' }

const INITIAL: State = {
  step: 'service',
  service: null,
  dateKey: null,
  time: null,
  paymentMethod: null,
  slots: [],
  slotsLoading: false,
  appointmentId: null,
  error: '',
  saving: false,
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'pickService':
      return { ...state, service: action.service, step: 'date' }
    case 'goto':
      return { ...state, step: action.step }
    case 'pickDate':
      return { ...state, dateKey: action.dateKey, time: null, step: 'time' }
    case 'loadingSlots':
      return { ...state, slotsLoading: true }
    case 'slots':
      return { ...state, slots: action.slots, slotsLoading: false }
    case 'pickTime':
      return { ...state, time: action.time, step: 'payment' }
    case 'pickPayment':
      return { ...state, paymentMethod: action.method }
    case 'saving':
      return { ...state, saving: true, error: '' }
    case 'error':
      return { ...state, saving: false, error: action.message }
    case 'created':
      return {
        ...state,
        saving: false,
        appointmentId: action.id,
        step: action.method === 'cash' ? 'success' : 'wompi',
      }
    case 'reset':
      return INITIAL
    default:
      return state
  }
}

export default function BookingFlow({
  services,
  clinicInfo,
}: {
  services: Service[]
  clinicInfo: ClinicInfo | null
}) {
  const router = useRouter()
  const [state, dispatch] = useReducer(reducer, INITIAL)
  const serviceId = state.service?.id

  // Fresh availability whenever the selected (service, date) changes. The read
  // is a server action — no Supabase client in the browser. `active` guards
  // against a stale response overwriting a newer selection.
  useEffect(() => {
    if (!state.dateKey || !serviceId) return
    let active = true
    dispatch({ type: 'loadingSlots' })
    getAvailableSlots(serviceId, state.dateKey).then((slots) => {
      if (active) dispatch({ type: 'slots', slots })
    })
    return () => {
      active = false
    }
  }, [state.dateKey, serviceId])

  const handleConfirm = async () => {
    if (!state.service || !state.dateKey || !state.time || !state.paymentMethod) return
    dispatch({ type: 'saving' })
    const result = await createAppointment({
      serviceId: state.service.id,
      dateKey: state.dateKey,
      startTime: state.time,
      paymentMethod: state.paymentMethod,
    })
    if ('error' in result) {
      dispatch({ type: 'error', message: result.error })
      return
    }
    dispatch({ type: 'created', id: result.id, method: state.paymentMethod })
  }

  const availableDates = getAvailableDates(clinicInfo?.working_days ?? [1, 2, 3, 4, 5])
  const selectedDate = state.dateKey ? new Date(state.dateKey + 'T12:00:00') : null
  const isMorningSlot = (t: string) => timeToMin(t) < timeToMin(clinicInfo?.afternoon_start ?? '14:00')
  const morningSlots = state.slots.filter(isMorningSlot)
  const afternoonSlots = state.slots.filter((t) => !isMorningSlot(t))

  return (
    <>
      {/* Progress */}
      {state.step !== 'success' && state.step !== 'wompi' && (
        <div className="flex items-center justify-center gap-2 mb-8">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors
                ${state.step === s ? 'bg-sky-600 text-white' :
                  STEPS.indexOf(state.step as typeof STEPS[number]) > i ? 'bg-green-500 text-white' : 'bg-slate-200 text-slate-500'}`}>
                {STEPS.indexOf(state.step as typeof STEPS[number]) > i ? '✓' : i + 1}
              </div>
              {i < 3 && <div className="w-8 h-0.5 bg-slate-200" />}
            </div>
          ))}
        </div>
      )}

      {/* ── STEP 1: Servicio ── */}
      {state.step === 'service' && (
        <div>
          <h2 className="font-bold text-slate-700 text-lg mb-4">1. Selecciona el servicio</h2>
          {services.length === 0 ? (
            <div className="card text-center py-12 text-slate-400">No hay servicios disponibles aún.</div>
          ) : (
            <div className="space-y-3">
              {services.map((svc) => (
                <button key={svc.id} type="button" onClick={() => dispatch({ type: 'pickService', service: svc })}
                  className={`w-full card text-left hover:border-sky-300 hover:shadow-md transition-all border-2 ${state.service?.id === svc.id ? 'border-sky-500 bg-sky-50' : 'border-transparent'}`}>
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
      {state.step === 'date' && (
        <div>
          <button type="button" onClick={() => dispatch({ type: 'goto', step: 'service' })} className="text-sm text-sky-600 hover:underline mb-4 block">← Volver</button>
          <h2 className="font-bold text-slate-700 text-lg mb-1">2. Selecciona la fecha</h2>
          <p className="text-sm text-slate-500 mb-4">Servicio: <strong>{state.service?.name}</strong></p>
          {availableDates.length === 0 ? (
            <div className="card text-center py-12 text-slate-400">No hay fechas disponibles.</div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {availableDates.map((d) => {
                const key = toDateKey(d)
                const isSelected = state.dateKey === key
                return (
                  <button key={key} type="button"
                    onClick={() => dispatch({ type: 'pickDate', dateKey: key })}
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
      {state.step === 'time' && (
        <div>
          <button type="button" onClick={() => dispatch({ type: 'goto', step: 'date' })} className="text-sm text-sky-600 hover:underline mb-4 block">← Volver</button>
          <h2 className="font-bold text-slate-700 text-lg mb-1">3. Selecciona la hora</h2>
          <p className="text-sm text-slate-500 mb-4">
            {selectedDate?.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
          {state.slotsLoading ? (
            <div className="card text-center py-12 text-slate-400">Cargando horarios disponibles...</div>
          ) : state.slots.length === 0 ? (
            <div className="card text-center py-12">
              <p className="text-slate-500">No hay horarios disponibles para este día.</p>
              <button type="button" onClick={() => dispatch({ type: 'goto', step: 'date' })} className="btn-secondary mt-4">Elegir otra fecha</button>
            </div>
          ) : (
            <div className="space-y-4">
              {morningSlots.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-slate-600 mb-2">☀️ Mañana</p>
                  <div className="grid grid-cols-4 gap-2">
                    {morningSlots.map((t) => (
                      <button key={t} type="button" onClick={() => dispatch({ type: 'pickTime', time: t })}
                        className={`py-2 rounded-xl text-sm font-semibold border-2 transition-all ${state.time === t ? 'border-sky-500 bg-sky-50 text-sky-700' : 'border-slate-200 hover:border-sky-300 bg-white text-slate-700'}`}>
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
                    {afternoonSlots.map((t) => (
                      <button key={t} type="button" onClick={() => dispatch({ type: 'pickTime', time: t })}
                        className={`py-2 rounded-xl text-sm font-semibold border-2 transition-all ${state.time === t ? 'border-sky-500 bg-sky-50 text-sky-700' : 'border-slate-200 hover:border-sky-300 bg-white text-slate-700'}`}>
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
      {state.step === 'payment' && (
        <div>
          <button type="button" onClick={() => dispatch({ type: 'goto', step: 'time' })} className="text-sm text-sky-600 hover:underline mb-4 block">← Volver</button>
          <h2 className="font-bold text-slate-700 text-lg mb-4">4. Método de pago</h2>

          {/* Resumen */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 mb-6">
            <h3 className="font-bold text-slate-700 mb-3">Resumen de tu cita</h3>
            <div className="space-y-2 text-sm text-slate-600">
              <div className="flex justify-between"><span>Servicio</span><span className="font-medium">{state.service?.name}</span></div>
              <div className="flex justify-between"><span>Fecha</span><span className="font-medium">{selectedDate?.toLocaleDateString('es-CO',{weekday:'long',day:'numeric',month:'long'})}</span></div>
              <div className="flex justify-between"><span>Hora</span><span className="font-medium">{state.time} – {state.time ? minToTime(timeToMin(state.time) + (state.service?.duration_minutes || 0)) : ''}</span></div>
              <div className="flex justify-between pt-2 border-t border-slate-100 text-base font-bold text-slate-800">
                <span>Total</span><span className="text-sky-600">${state.service?.price_cop.toLocaleString('es-CO')} COP</span>
              </div>
            </div>
          </div>

          <div className="space-y-3 mb-6">
            <button type="button" onClick={() => dispatch({ type: 'pickPayment', method: 'cash' })}
              className={`w-full card text-left border-2 transition-all ${state.paymentMethod === 'cash' ? 'border-sky-500 bg-sky-50' : 'border-transparent hover:border-sky-200'}`}>
              <div className="flex items-center gap-4">
                <div className="text-3xl">💵</div>
                <div>
                  <p className="font-bold text-slate-800">Pago en efectivo</p>
                  <p className="text-sm text-slate-500">Paga directamente en el consultorio</p>
                </div>
                {state.paymentMethod === 'cash' && <div className="ml-auto text-sky-600 text-xl">✓</div>}
              </div>
            </button>
            <button type="button" onClick={() => dispatch({ type: 'pickPayment', method: 'online' })}
              className={`w-full card text-left border-2 transition-all ${state.paymentMethod === 'online' ? 'border-sky-500 bg-sky-50' : 'border-transparent hover:border-sky-200'}`}>
              <div className="flex items-center gap-4">
                <div className="text-3xl">💳</div>
                <div>
                  <p className="font-bold text-slate-800">Pago en línea</p>
                  <p className="text-sm text-slate-500">Tarjeta de crédito/débito o PSE via Wompi</p>
                </div>
                {state.paymentMethod === 'online' && <div className="ml-auto text-sky-600 text-xl">✓</div>}
              </div>
            </button>
          </div>

          {state.error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3 mb-4">{state.error}</div>}

          <button type="button" onClick={handleConfirm} disabled={!state.paymentMethod || state.saving}
            className="btn-primary w-full py-4 text-lg">
            {state.saving ? 'Guardando...' : state.paymentMethod === 'online' ? '💳 Continuar con Wompi' : '✅ Confirmar cita'}
          </button>
        </div>
      )}

      {/* ── STEP: Wompi ── */}
      {state.step === 'wompi' && state.service && state.appointmentId && (
        <div>
          <div className="card text-center mb-6">
            <div className="text-5xl mb-3">💳</div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">Pago en línea</h2>
            <p className="text-slate-500 text-sm">Tu cita está guardada. Completa el pago para confirmarla.</p>
            <div className="bg-slate-50 rounded-xl p-4 mt-4 text-sm text-slate-600">
              <p><strong>{state.service.name}</strong></p>
              <p className="text-sky-600 font-bold text-xl mt-1">${state.service.price_cop.toLocaleString('es-CO')} COP</p>
            </div>
          </div>
          <WompiButton appointmentId={state.appointmentId} />
          <button type="button" onClick={() => dispatch({ type: 'goto', step: 'success' })} className="w-full text-sm text-slate-400 hover:text-slate-600 mt-4 py-2">
            Pagar en efectivo en el consultorio →
          </button>
        </div>
      )}

      {/* ── STEP: Éxito ── */}
      {state.step === 'success' && (
        <div className="card text-center py-10">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">¡Cita agendada!</h2>
          <p className="text-slate-500 mb-6">Tu cita ha sido registrada exitosamente.</p>
          <div className="bg-sky-50 rounded-2xl p-5 text-left mb-6 space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-slate-500">Servicio</span><span className="font-medium">{state.service?.name}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Fecha</span><span className="font-medium">{selectedDate?.toLocaleDateString('es-CO',{weekday:'long',day:'numeric',month:'long'})}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Hora</span><span className="font-medium">{state.time}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Pago</span><span className="font-medium">{state.paymentMethod === 'cash' ? '💵 Efectivo en consultorio' : '💳 En línea'}</span></div>
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={() => router.push('/mis-citas')} className="btn-primary flex-1">Ver mis citas</button>
            <button type="button" onClick={() => dispatch({ type: 'reset' })} className="btn-secondary flex-1">Nueva cita</button>
          </div>
        </div>
      )}
    </>
  )
}
