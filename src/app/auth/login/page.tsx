import Link from 'next/link'

import LoginForm from '@/features/auth/components/LoginForm'

// Static server-rendered shell. The only interactive part is <LoginForm/>,
// which talks to the `signIn` server action — no auth logic ships to the client.
export default function LoginPage() {
  return (
    <div className="min-h-screen bg-sky-50 flex items-center justify-center px-4">
      <div className="card w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="text-4xl" aria-label="Ir al inicio">🦷</Link>
          <h1 className="text-2xl font-bold text-slate-800 mt-2">Iniciar sesión</h1>
          <p className="text-slate-500 text-sm mt-1">Consultorio Juan Carlos Molina</p>
        </div>

        <LoginForm />

        <p className="text-center text-sm text-slate-500 mt-6">
          ¿No tienes cuenta?{' '}
          <Link href="/auth/register" className="text-sky-600 font-semibold hover:underline">
            Regístrate aquí
          </Link>
        </p>

        <div className="text-center mt-4">
          <Link href="/" className="text-sm text-slate-400 hover:text-slate-600">
            ← Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  )
}
