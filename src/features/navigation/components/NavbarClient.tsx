"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { signOut } from "@/features/auth/actions";
import type { Role } from "@/lib/session";

// Presentational + interactive nav island. Auth state (`userPresent`, `role`)
// is resolved on the server and passed in as props — this component never
// touches Supabase. Sign-out is a server action submitted via a <form>.
export default function NavbarClient({
  userPresent,
  role,
}: {
  userPresent: boolean;
  role: Role | null;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  // On the homepage use bare anchors (#section); elsewhere prefix with `/`.
  const isHome = pathname === "/";
  const sectionLink = (anchor: string) =>
    isHome ? `#${anchor}` : `/#${anchor}`;

  return (
    <nav className="sticky top-0 z-50 bg-white shadow-sm">
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex h-16 items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 font-bold text-lg text-sky-700"
          >
            🦷 <span className="hidden sm:inline">Consultorio Molina</span>
          </Link>

          {/* Desktop links */}
          <div className="hidden items-center gap-6 font-medium text-slate-600 text-sm md:flex">
            <Link
              href={sectionLink("servicios")}
              className="transition-colors hover:text-sky-600"
            >
              Servicios
            </Link>
            <Link
              href={sectionLink("galeria")}
              className="transition-colors hover:text-sky-600"
            >
              Galería
            </Link>
            <Link
              href={sectionLink("contacto")}
              className="transition-colors hover:text-sky-600"
            >
              Contacto
            </Link>
            <Link
              href="/agendar"
              className="transition-colors hover:text-sky-600"
            >
              Agendar
            </Link>

            {userPresent && role === "patient" && (
              <Link
                href="/mis-citas"
                className="transition-colors hover:text-sky-600"
              >
                Mis citas
              </Link>
            )}
            {userPresent && role === "dentist" && (
              <Link
                href="/panel"
                className="transition-colors hover:text-sky-600"
              >
                Panel
              </Link>
            )}

            {userPresent ? (
              <form action={signOut}>
                <button
                  type="submit"
                  className="text-slate-400 transition-colors hover:text-red-500"
                >
                  Salir
                </button>
              </form>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  href="/auth/login"
                  className="transition-colors hover:text-sky-600"
                >
                  Iniciar sesión
                </Link>
                <Link
                  href="/auth/register"
                  className="btn-primary px-4 py-1.5 text-sm"
                >
                  Registrarse
                </Link>
              </div>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            type="button"
            className="p-2 text-slate-600 md:hidden"
            aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? "✕" : "☰"}
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="space-y-1 border-slate-100 border-t py-3 md:hidden">
            {[
              { label: "Servicios", href: sectionLink("servicios") },
              { label: "Galería", href: sectionLink("galeria") },
              { label: "Contacto", href: sectionLink("contacto") },
              { label: "Agendar cita", href: "/agendar" },
            ].map((item) => (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className="block rounded-lg px-3 py-2 text-slate-600 transition-colors hover:bg-sky-50 hover:text-sky-600"
              >
                {item.label}
              </Link>
            ))}

            {userPresent && role === "patient" && (
              <Link
                href="/mis-citas"
                onClick={() => setMenuOpen(false)}
                className="block rounded-lg px-3 py-2 text-slate-600 transition-colors hover:bg-sky-50 hover:text-sky-600"
              >
                📋 Mis citas
              </Link>
            )}
            {userPresent && role === "dentist" && (
              <Link
                href="/panel"
                onClick={() => setMenuOpen(false)}
                className="block rounded-lg px-3 py-2 text-slate-600 transition-colors hover:bg-sky-50 hover:text-sky-600"
              >
                🦷 Panel del odontólogo
              </Link>
            )}

            <div className="mt-2 border-slate-100 border-t pt-2">
              {userPresent ? (
                <form action={signOut}>
                  <button
                    type="submit"
                    className="block w-full rounded-lg px-3 py-2 text-left text-red-500 transition-colors hover:bg-red-50"
                  >
                    Cerrar sesión
                  </button>
                </form>
              ) : (
                <div className="space-y-1">
                  <Link
                    href="/auth/login"
                    onClick={() => setMenuOpen(false)}
                    className="block rounded-lg px-3 py-2 text-slate-600 transition-colors hover:bg-sky-50 hover:text-sky-600"
                  >
                    Iniciar sesión
                  </Link>
                  <Link
                    href="/auth/register"
                    onClick={() => setMenuOpen(false)}
                    className="block rounded-lg px-3 py-2 font-semibold text-sky-600 transition-colors hover:bg-sky-50"
                  >
                    Registrarse
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
