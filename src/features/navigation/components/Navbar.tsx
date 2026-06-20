import { Suspense } from "react";
import Link from "next/link";

import { getSessionProfile } from "@/lib/session";
import NavbarClient from "./NavbarClient";

// Server entry point. The auth-dependent read lives inside <Suspense> so the
// route still prerenders its static shell under Cache Components; the
// personalized nav streams in. Call sites just render <Navbar/>.
export default function Navbar() {
  return (
    <Suspense fallback={<NavbarFallback />}>
      <NavbarAuth />
    </Suspense>
  );
}

async function NavbarAuth() {
  const { user, role } = await getSessionProfile();
  return <NavbarClient userPresent={!!user} role={role} />;
}

// Visually-identical static frame (logo + public links). The auth slot shows a
// neutral placeholder rather than guessing logged-in/out, so nothing flickers
// from wrong content to right content when the real nav streams in.
function NavbarFallback() {
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
          <div className="hidden items-center gap-6 font-medium text-slate-600 text-sm md:flex">
            <Link
              href="/#servicios"
              className="transition-colors hover:text-sky-600"
            >
              Servicios
            </Link>
            <Link
              href="/#galeria"
              className="transition-colors hover:text-sky-600"
            >
              Galería
            </Link>
            <Link
              href="/#contacto"
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
            <div
              className="h-8 w-28 animate-pulse rounded-lg bg-slate-100"
              aria-hidden="true"
            />
          </div>
          <div
            className="h-8 w-8 animate-pulse rounded bg-slate-100 md:hidden"
            aria-hidden="true"
          />
        </div>
      </div>
    </nav>
  );
}
