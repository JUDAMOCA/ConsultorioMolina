'use client'

import { useState } from 'react'

import { startAppointmentCheckout } from '@/app/pagos/actions'

interface WompiButtonProps {
  appointmentId: string
}

export default function WompiButton({ appointmentId }: WompiButtonProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handlePay = async () => {
    setLoading(true)
    setError('')

    // The amount, reference, signature and keys are all decided on the server
    // inside the action — the client only receives the final checkout URL.
    const result = await startAppointmentCheckout(appointmentId)

    if ('error' in result) {
      setError(result.error)
      setLoading(false)
      return
    }

    window.location.href = result.url
  }

  return (
    <div>
      <button
        type="button"
        onClick={handlePay}
        disabled={loading}
        className="w-full bg-[#FF5B30] hover:bg-[#e04e26] text-white font-bold py-4 px-6 rounded-xl text-lg transition-all shadow-md flex items-center justify-center gap-3 disabled:opacity-60"
      >
        {loading ? (
          <><div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Conectando con Wompi...</>
        ) : '💳 Pagar con Wompi'}
      </button>
      {error && (
        <div className="mt-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3">⚠️ {error}</div>
      )}
    </div>
  )
}
