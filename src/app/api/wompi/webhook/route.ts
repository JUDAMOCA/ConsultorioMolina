import { NextResponse } from 'next/server'

import { isTransactionUpdatedEvent, verifyWebhookEvent } from '@pulgueta/wompi/server'

import { reconcileAppointmentPayment } from '@/lib/wompi'

// Authoritative payment confirmation. Wompi POSTs transaction updates here;
// this is the reliable path (the redirect can be skipped by the user). The
// event signature is verified with the merchant events secret before anything
// is trusted — anyone can POST to a public webhook endpoint.
export async function POST(request: Request) {
  const eventsKey = process.env.WOMPI_EVENTS_KEY
  if (!eventsKey) {
    return NextResponse.json({ error: 'Webhook no configurado' }, { status: 500 })
  }

  const rawBody = await request.text()
  const [error, event] = await verifyWebhookEvent(rawBody, { eventsKey })
  if (error) {
    return NextResponse.json({ error: 'Firma del evento inválida' }, { status: 403 })
  }

  if (isTransactionUpdatedEvent(event)) {
    const transaction = event.data.transaction
    // Idempotent + amount-validated against the DB inside reconcile.
    await reconcileAppointmentPayment({
      reference: transaction.reference,
      status: transaction.status,
      amountInCents: transaction.amount_in_cents,
      currency: transaction.currency,
    })
  }

  return NextResponse.json({ received: true })
}
