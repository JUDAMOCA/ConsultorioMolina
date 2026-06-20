'use server'

import { buildCheckoutUrl } from '@pulgueta/wompi/server'

import { createServerSupabaseClient } from '@/lib/supabase-server'
import { buildAppointmentReference } from '@/lib/wompi'

type CheckoutResult = { url: string } | { error: string }

/**
 * Start a Wompi checkout for an appointment the caller owns.
 *
 * Everything that matters for the charge is decided here, on the server:
 *  - the user is authenticated and must own the appointment,
 *  - the amount is derived from the service price in the database (never the
 *    client), so it cannot be tampered with,
 *  - the integrity signature is computed inside `buildCheckoutUrl` from the
 *    server-only integrity key, which is never sent to the browser.
 *
 * The client only receives the final checkout URL to redirect to.
 */
export async function startAppointmentCheckout(
  appointmentId: string
): Promise<CheckoutResult> {
  if (!appointmentId) return { error: 'Cita no especificada.' }

  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Debes iniciar sesión para pagar.' }

  // RLS already scopes this to the user's rows; we re-check ownership below.
  const { data: appointment } = await supabase
    .from('appointments')
    .select('id, patient_id, payment_method, payment_status, services(price_cop, name)')
    .eq('id', appointmentId)
    .maybeSingle()

  if (!appointment || appointment.patient_id !== user.id) {
    return { error: 'Cita no encontrada.' }
  }
  if (appointment.payment_status === 'paid') {
    return { error: 'Esta cita ya fue pagada.' }
  }
  if (appointment.payment_method !== 'online') {
    return { error: 'Esta cita no requiere pago en línea.' }
  }

  const service = Array.isArray(appointment.services)
    ? appointment.services[0]
    : appointment.services
  const priceCop = Number((service as { price_cop?: number } | null)?.price_cop ?? 0)
  const amountInCents = Math.round(priceCop * 100)
  if (!Number.isInteger(amountInCents) || amountInCents <= 0) {
    return { error: 'El servicio no tiene un precio válido configurado.' }
  }

  const publicKey = process.env.WOMPI_PUBLIC_KEY
  const integrityKey = process.env.WOMPI_INTEGRITY_KEY
  if (!publicKey || !integrityKey) {
    return { error: 'La pasarela de pago no está configurada.' }
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
  const reference = buildAppointmentReference(appointment.id)

  try {
    const url = await buildCheckoutUrl({
      publicKey,
      reference,
      amountInCents,
      currency: 'COP',
      integrityKey,
      redirectUrl: siteUrl ? `${siteUrl}/pagos/resultado` : undefined,
      customerData: { email: user.email },
    })
    return { url }
  } catch {
    return { error: 'No se pudo iniciar el pago. Intenta de nuevo.' }
  }
}
