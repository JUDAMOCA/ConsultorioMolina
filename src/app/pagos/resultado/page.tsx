'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'
import Navbar from '@/components/Navbar'

function ResultadoContent() {
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'approved' | 'declined' | 'pending'>('loading')
  const [transaction, setTransaction] = useState<any>(null)
  const supabase = createClient()

  const transactionId = searchParams.get('id')
  const appointmentRef = searchParams.get('reference')

  useEffect(() => {
    if (!transactionId) { setStatus('declined'); return }

    const checkTransaction = async () => {
      try {
        // Consultar estado en Wompi
        const res = await fetch(`https://sandbox.wompi.co/v1/transactions/${transactionId}`)
        const data = await res.json()
        const txn = data.data

        setTransaction(txn)

        if (txn.status === 'APPROVED') {
          setStatus('approved')
          // Actualizar estado de pago en Supabase si tenemos la referencia
          if (appointmentRef) {
            await supabase
              .from('appointments')
              .update({ payment_status: 'paid', status: 'confirmed' })
              .eq('id', appointmentRef)
          }
        } else if (txn.status === 'DECLINED' || txn.status === 'ERROR' || txn.status === 'VOIDED') {
          setStatus('declined')
        } else {
          setStatus('pending')
        }
      } catch (e) {
        setStatus('declined')
      }
    }

    checkTransaction()
  }, [transactionId])

  return (
    <div className="flex items-center justify-center py-20 px-4">
      <div className="card max-w-md w-full text-center">

        {status === 'loading' && (
          <>
            <div className="text-5xl mb-4">⏳</div>
            <h2 className="text-xl font-bold text-slate-700">Verificando pago...</h2>
            <p className="text-slate-400 text-sm mt-2">Esto toma solo unos segundos</p>
          </>
        )}

        {status === 'approved' && (
          <>
            <div className="text-6xl mb-4">✅</div>
            <h2 className="text-2xl font-bold text-green-600 mb-2">¡Pago exitoso!</h2>
            <p className="text-slate-600 mb-1">Tu cita ha sido confirmada y pagada.</p>
            {transaction && (
              <div className="bg-green-50 border border-green-100 rounded-xl p-4 my-4 text-left space-y-1">
                <p className="text-sm text-slate-600"><strong>Referencia:</strong> {transaction.reference}</p>
                <p className="text-sm text-slate-600"><strong>Valor:</strong> ${(transaction.amount_in_cents / 100).toLocaleString('es-CO')} COP</p>
                <p className="text-sm text-slate-600"><strong>ID transacción:</strong> {transaction.id}</p>
              </div>
            )}
            <Link href="/" className="btn-primary w-full block mt-4">Volver al inicio</Link>
          </>
        )}

        {status === 'declined' && (
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

        {status === 'pending' && (
          <>
            <div className="text-6xl mb-4">🕐</div>
            <h2 className="text-2xl font-bold text-yellow-600 mb-2">Pago en proceso</h2>
            <p className="text-slate-500 mb-4">El pago está siendo procesado. Te notificaremos cuando se confirme.</p>
            <Link href="/" className="btn-primary w-full block">Volver al inicio</Link>
          </>
        )}

      </div>
    </div>
  )
}

export default function ResultadoPagoPage() {
  return (
    <main className="min-h-screen bg-sky-50">
      <Navbar />
      <Suspense fallback={
        <div className="flex items-center justify-center py-20">
          <div className="text-slate-400">Cargando...</div>
        </div>
      }>
        <ResultadoContent />
      </Suspense>
    </main>
  )
}
