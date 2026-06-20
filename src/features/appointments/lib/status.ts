// Pure presentation helpers for appointment status, shared by the client view.
// No React, no Supabase.

export const STATUS_LABELS: Record<string, string> = {
  pending: '⏳ Pendiente',
  confirmed: '✅ Confirmada',
  cancelled: '❌ Cancelada',
}

export const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-green-100 text-green-700',
  cancelled: 'bg-slate-100 text-slate-500',
}

const ONE_HOUR_MS = 60 * 60 * 1000

/** A patient may cancel an active appointment more than an hour before it starts. */
export function canCancel(appt: { status: string; appointment_date: string; start_time: string }): boolean {
  if (appt.status === 'cancelled') return false
  const when = new Date(`${appt.appointment_date}T${appt.start_time}`)
  return when.getTime() - Date.now() > ONE_HOUR_MS
}

/** Cancelled or already-started appointments belong in the history list. */
export function isPast(appt: { status: string; appointment_date: string; start_time: string }): boolean {
  if (appt.status === 'cancelled') return true
  return new Date(`${appt.appointment_date}T${appt.start_time}`).getTime() < Date.now()
}
