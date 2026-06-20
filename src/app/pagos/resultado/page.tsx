import { Suspense } from 'react'
import Link from 'next/link'

import Navbar from '@/components/Navbar'
import { confirmAppointmentByTransaction, type ReconcileOutcome } from '@/lib/wompi'

type View = 'approved' | 'pending' | 'declined' | 'unverified'

function toView(outcome: ReconcileOutcome): View {
  if (outcome === 'approved') return 'approved'
  if (outcome === 'pending') return 'pending'
  if (outcome === 'declined') return 'declined'
  return 'unverified' // amount_mismatch | not_found | error
}

export default function ResultadoPagoPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  return (
    <main className="min-h-screen bg-sky-50">
      <Navbar />
      <Suspense fallback={
        <div className="flex items-center justify-center py-20 px-4">
          <div className="card max-w-md w-full text-center">
            <div className="text-5xl mb-4">⏳</div>
            <h2 className="text-xl font-bold text-slate-700">Verificando pago...</h2>
            <p className="text-slate-400 text-sm mt-2">Esto toma solo unos segundos</p>
          </div>
        </div>
      }>
        <Resultado searchParams={searchParams} />
      </Suspense>
    </main>
  )
}

// Reads runtime search params and reconciles payment server-side. The
// transaction is read from Wompi and reconciled against the DB entirely on the
// server (amount verified against the service price). The browser never decides
// whether the appointment is paid. The dynamic read lives behind <Suspense>, so
// the page stays dynamic without a route segment config (Cache Components).
async function Resultado({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams
  const rawId = params.id
  const transactionId = Array.isArray(rawId) ? rawId[0] : rawId

  const result = transactionId
    ? await confirmAppointmentByTransaction(transactionId)
    : null

  const view: View = result ? toView(result.outcome) : 'unverified'
  const transaction = result?.transaction ?? null

  return (
    <div className="flex items-center justify-center py-20 px-4">
      <div className="card max-w-md w-full text-center">
        {view === 'approved' && (
          <>
            <div className="text-6xl mb-4">✅</div>
            <h2 className="text-2xl font-bold text-green-600 mb-2">¡Pago exitoso!</h2>
            <p className="text-slate-600 mb-1">Tu cita ha sido confirmada y pagada.</p>
            {transaction && (
              <div className="bg-green-50 border border-green-100 rounded-xl p-4 my-4 text-left space-y-1">
                <p className="text-sm text-slate-600"><strong>Referencia:</strong> {transaction.reference}</p>
                {transaction.amountInCents !== undefined && (
                  <p className="text-sm text-slate-600"><strong>Valor:</strong> ${(transaction.amountInCents / 100).toLocaleString('es-CO')} COP</p>
                )}
                <p className="text-sm text-slate-600"><strong>ID transacción:</strong> {transaction.id}</p>
              </div>
            )}
            <Link href="/mis-citas" className="btn-primary w-full block mt-4">Ver mis citas</Link>
          </>
        )}

        {view === 'pending' && (
          <>
            <div className="text-6xl mb-4">🕐</div>
            <h2 className="text-2xl font-bold text-yellow-600 mb-2">Pago en proceso</h2>
            <p className="text-slate-500 mb-4">El pago está siendo procesado. Te confirmaremos tu cita en cuanto se acredite.</p>
            <Link href="/mis-citas" className="btn-primary w-full block">Ver mis citas</Link>
          </>
        )}

        {view === 'declined' && (
          <>
            <div className="text-6xl mb-4">❌</div>
            <h2 className="text-2xl font-bold text-red-600 mb-2">Pago rechazado</h2>
            <p className="text-slate-500 mb-4">El pago no pudo procesarse. Tu cita sigue pendiente de pago.</p>
            <div className="flex gap-3">
              <Link href="/agendar" className="btn-secondary flex-1 text-center">Intentar de nuevo</Link>
              <Link href="/" className="btn-primary flex-1 text-center">Ir al inicio</Link>
            </div>
          </>
        )}

        {view === 'unverified' && (
          <>
            <div className="text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-slate-700 mb-2">No pudimos verificar tu pago</h2>
            <p className="text-slate-500 mb-4">Si se realizó un cobro, no fue posible asociarlo a tu cita. Por favor contáctanos para revisarlo.</p>
            <Link href="/mis-citas" className="btn-primary w-full block">Ver mis citas</Link>
          </>
        )}
      </div>
    </div>
  )
}
