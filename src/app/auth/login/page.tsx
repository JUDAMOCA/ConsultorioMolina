import Link from "next/link";

import LoginForm from "@/features/auth/components/LoginForm";

// Static server-rendered shell. The only interactive part is <LoginForm/>,
// which talks to the `signIn` server action — no auth logic ships to the client.
export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-sky-50 px-4">
      <div className="card w-full max-w-md">
        <div className="mb-8 text-center">
          <Link href="/" className="text-4xl" aria-label="Ir al inicio">
            🦷
          </Link>
          <h1 className="mt-2 font-bold text-2xl text-slate-800">
            Iniciar sesión
          </h1>
          <p className="mt-1 text-slate-500 text-sm">
            Consultorio Juan Carlos Molina
          </p>
        </div>

        <LoginForm />

        <p className="mt-6 text-center text-slate-500 text-sm">
          ¿No tienes cuenta?{" "}
          <Link
            href="/auth/register"
            className="font-semibold text-sky-600 hover:underline"
          >
            Regístrate aquí
          </Link>
        </p>

        <div className="mt-4 text-center">
          <Link
            href="/"
            className="text-slate-400 text-sm hover:text-slate-600"
          >
            ← Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}
