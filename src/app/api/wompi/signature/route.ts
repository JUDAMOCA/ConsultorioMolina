import { createHash } from 'crypto'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { reference, amountInCents, currency } = await request.json()

    const integrityKey = process.env.WOMPI_INTEGRITY_KEY
    if (!integrityKey) {
      return NextResponse.json({ error: 'Clave de integridad no configurada' }, { status: 500 })
    }

    const toHash = `${reference}${amountInCents}${currency}${integrityKey}`
    const signature = createHash('sha256').update(toHash).digest('hex')

    return NextResponse.json({ signature })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
