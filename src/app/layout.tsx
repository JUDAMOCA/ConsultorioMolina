import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
// @ts-ignore: global CSS import type declarations
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Consultorio Juan Carlos Molina',
  description: 'Tu salud dental en las mejores manos. Agenda tu cita hoy.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className={inter.className}>
        {children}
      </body>
    </html>
  )
}
