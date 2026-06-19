'use client'

import { useState } from 'react'

interface WompiButtonProps {
  amountCOP: number
  reference: string
  redirectUrl: string
}

export default function WompiButton({ amountCOP, reference }: WompiButtonProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handlePay = async () => {
    setLoading(true)
    setError('')

    try {
      const uniqueRef = `${reference}-${Date.now()}`
      const amountInCents = amountCOP * 100

      const res = await fetch('/api/wompi/signature', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reference: uniqueRef, amountInCents, currency: 'COP' }),
      })

      const data = await res.json()
      if (data.error) { setError(data.error); setLoading(false); return }

      const publicKey = process.env.NEXT_PUBLIC_WOMPI_PUBLIC_KEY
      // Usa la URL pública de ngrok si está definida, si no usa window.location.origin
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin
      const finalRedirect = `${siteUrl}/pagos/resultado?reference=${reference}`

      const params = new URLSearchParams({
        'public-key': publicKey || '',
        'currency': 'COP',
        'amount-in-cents': String(amountInCents),
        'reference': uniqueRef,
        'signature:integrity': data.signature,
        'redirect-url': finalRedirect,
      })

      window.location.href = `https://checkout.wompi.co/p/?${params.toString()}`

    } catch (e: any) {
      setError('Error al conectar con la pasarela de pago.')
      setLoading(false)
    }
  }

  return (
    <div>
      <button
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
