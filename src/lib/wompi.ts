import { WompiClient } from '@pulgueta/wompi'
import type { TransactionStatus } from '@pulgueta/wompi/schemas'

import { createAdminClient } from '@/lib/supabase-server'

// Server-only Wompi integration. This module transitively imports
// `@/lib/supabase-server` (which uses `next/headers`), so it can never be
// bundled into a Client Component. All Wompi keys stay on the server.

let client: WompiClient | null = null

/**
 * Lazily-constructed, memoized Wompi client. `WompiClient` validates its
 * options with Zod at construction time and throws synchronously if
 * `publicKey` is missing — callers must handle that.
 *
 * `privateKey` is optional here: `getTransaction` only needs the public key.
 * Provide `WOMPI_PRIVATE_KEY` to enable admin operations (void/list/sources).
 */
export function getWompiClient(): WompiClient {
  if (client) return client
  client = new WompiClient({
    publicKey: process.env.WOMPI_PUBLIC_KEY!,
    privateKey: process.env.WOMPI_PRIVATE_KEY,
    sandbox: true,
  })
  return client
}

const REFERENCE_PREFIX = 'appt'

/**
 * Build a unique, server-trusted transaction reference for an appointment.
 * The appointment id (a UUID, so no `_`) is embedded so the redirect/webhook
 * can map a Wompi transaction back to the appointment without a DB column.
 */
export function buildAppointmentReference(appointmentId: string): string {
  return `${REFERENCE_PREFIX}_${appointmentId}_${Date.now()}`
}

/** Recover the appointment id from a reference produced above. */
export function appointmentIdFromReference(reference: string): string | null {
  const match = /^appt_(.+)_\d+$/.exec(reference)
  return match ? match[1] : null
}

export type ReconcileOutcome =
  | 'approved'
  | 'declined'
  | 'pending'
  | 'amount_mismatch'
  | 'not_found'
  | 'error'

interface ReconcileInput {
  reference: string
  status: TransactionStatus
  amountInCents?: number
  currency?: string
}

/**
 * Authoritatively reconcile a Wompi transaction outcome against an
 * appointment. The expected amount is derived **server-side** from the
 * service price in the database — the amount Wompi charged must match it
 * exactly before the appointment is marked paid. This is what prevents a
 * tampered (e.g. COP 1) charge, or an APPROVED transaction for one
 * appointment, from confirming a different/expensive appointment.
 *
 * The write is idempotent (only flips rows still pending payment), so it is
 * safe to call from both the webhook and the result page.
 */
export async function reconcileAppointmentPayment(
  input: ReconcileInput
): Promise<{ outcome: ReconcileOutcome; appointmentId: string | null }> {
  const appointmentId = appointmentIdFromReference(input.reference)
  if (!appointmentId) return { outcome: 'not_found', appointmentId: null }

  const admin = createAdminClient()
  const { data: appointment, error } = await admin
    .from('appointments')
    .select('id, payment_status, status, payment_method, services(price_cop)')
    .eq('id', appointmentId)
    .maybeSingle()

  if (error || !appointment) return { outcome: 'not_found', appointmentId }

  if (input.status === 'PENDING') return { outcome: 'pending', appointmentId }
  if (input.status !== 'APPROVED') return { outcome: 'declined', appointmentId }

  // APPROVED — verify the charged amount equals the real service price.
  const service = Array.isArray(appointment.services)
    ? appointment.services[0]
    : appointment.services
  const priceCop = Number((service as { price_cop?: number } | null)?.price_cop ?? 0)
  const expectedAmountInCents = Math.round(priceCop * 100)

  if (
    !Number.isInteger(expectedAmountInCents) ||
    expectedAmountInCents <= 0 ||
    input.amountInCents !== expectedAmountInCents ||
    (input.currency !== undefined && input.currency !== 'COP')
  ) {
    return { outcome: 'amount_mismatch', appointmentId }
  }

  await admin
    .from('appointments')
    .update({ payment_status: 'paid', status: 'confirmed' })
    .eq('id', appointmentId)
    .neq('payment_status', 'paid')

  return { outcome: 'approved', appointmentId }
}

/**
 * Read a transaction from Wompi via the SDK (no client trust) and reconcile
 * it. Used by the payment-result page so confirmation never depends on
 * client-reported status.
 */
export async function confirmAppointmentByTransaction(transactionId: string): Promise<{
  outcome: ReconcileOutcome
  appointmentId: string | null
  transaction: {
    id: string
    reference: string
    status: TransactionStatus
    amountInCents?: number
  } | null
}> {
  const [error, transaction] = await getWompiClient().transactions.getTransaction(transactionId)
  if (error || !transaction) return { outcome: 'error', appointmentId: null, transaction: null }

  const { outcome, appointmentId } = await reconcileAppointmentPayment({
    reference: transaction.reference,
    status: transaction.status,
    amountInCents: transaction.amount_in_cents,
    currency: transaction.currency,
  })

  return {
    outcome,
    appointmentId,
    transaction: {
      id: transaction.id,
      reference: transaction.reference,
      status: transaction.status,
      amountInCents: transaction.amount_in_cents,
    },
  }
}
