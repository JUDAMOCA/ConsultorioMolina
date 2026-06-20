import { WompiClient } from '@pulgueta/wompi'
import { NextResponse } from 'next/server'

const wompi = new WompiClient({
  publicKey: process.env.WOMPI_PUBLIC_KEY!,
  sandbox: process.env.NODE_ENV !== 'production',
})

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const [error, transaction] = await wompi.transactions.getTransaction(id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ data: transaction })
}
