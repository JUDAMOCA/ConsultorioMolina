'use client'

import { useActionState } from 'react'

import { signIn, type AuthState } from '@/features/auth/actions'

// Interactive island only: collects credentials and surfaces the server
// action's result. No Supabase client, no auth logic — `signIn` runs entirely
// on the server and redirects on success.
export default function LoginForm() {
  const [state, formAction, pending] = useActionState<AuthState, FormData>(signIn, null)

  return (
    <form action={formAction} className="space-y-5">
      <div>
        <label className="label" htmlFor="email">Correo electrónico</label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          className="input"
          placeholder="tucorreo@ejemplo.com"
          required
        />
      </div>

      <div>
        <label className="label" htmlFor="password">Contraseña</label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          className="input"
          placeholder="••••••••"
          required
        />
      </div>

      {state?.error && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3" role="alert">
          {state.error}
        </div>
      )}

      <button type="submit" disabled={pending} className="btn-primary w-full">
        {pending ? 'Ingresando...' : 'Ingresar'}
      </button>
    </form>
  )
}
