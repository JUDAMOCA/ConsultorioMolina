import Link from 'next/link'

import RegisterForm from '@/features/auth/components/RegisterForm'

// Static server-rendered shell. <RegisterForm/> is the only interactive island;
// it submits to the `signUp` server action which creates the user and profile
// server-side (the client never sets its own `role`).
export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-sky-50 flex items-center justify-center px-4 py-10">
      <div className="card w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="text-4xl" aria-label="Ir al inicio">🦷</Link>
          <h1 className="text-2xl font-bold text-slate-800 mt-2">Crear cuenta</h1>
          <p className="text-slate-500 text-sm mt-1">Regístrate para agendar tus citas</p>
        </div>

        <RegisterForm />

        <p className="text-center text-sm text-slate-500 mt-6">
          ¿Ya tienes cuenta?{' '}
          <Link href="/auth/login" className="text-sky-600 font-semibold hover:underline">
            Inicia sesión
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
