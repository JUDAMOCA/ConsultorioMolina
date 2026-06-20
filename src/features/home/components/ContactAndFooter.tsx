import Link from "next/link";
import { cacheLife, cacheTag } from "next/cache";

import { getClinicInfo } from "@/lib/data";
import { DEFAULT_CI, formatSchedule } from "@/features/home/lib/clinic";

export default async function ContactAndFooter() {
  "use cache";
  cacheLife("hours");
  cacheTag("clinic-info");
  const ci = (await getClinicInfo()) ?? DEFAULT_CI;
  const clinicName = ci.clinic_name || "Consultorio Juan Carlos Molina";

  return (
    <>
      {/* Contact */}
      <section id="contacto" className="bg-sky-50 px-4 py-16">
        <div className="mx-auto max-w-xl text-center">
          <h2 className="mb-8 font-bold text-3xl text-slate-800">
            Como llegar
          </h2>
          <div className="space-y-4 rounded-2xl border border-slate-100 bg-white p-8 text-left shadow-sm">
            <div>
              <p className="font-semibold text-slate-700">Direccion</p>
              <p className="text-slate-500">{ci.address}</p>
            </div>
            <div>
              <p className="font-semibold text-slate-700">Telefono</p>
              <p className="text-slate-500">{ci.phone}</p>
            </div>
            <div>
              <p className="font-semibold text-slate-700">Email</p>
              <p className="text-slate-500">{ci.email}</p>
            </div>
            <div>
              <p className="font-semibold text-slate-700">Horario</p>
              <p className="text-slate-500">{formatSchedule(ci)}</p>
            </div>
          </div>
          <div className="mt-8">
            <Link href="/agendar" className="btn-primary px-8 py-3 text-lg">
              Agendar mi cita
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-800 px-4 py-8 text-center text-slate-400">
        <p className="mb-1 font-semibold text-lg text-white">{clinicName}</p>
        <p className="text-sm">
          {ci.phone} · {ci.email}
        </p>
        <p className="mt-2 text-sm">{ci.address}</p>
        <p className="mt-4 text-slate-600 text-xs">
          © {new Date().getFullYear()} Todos los derechos reservados
        </p>
      </footer>
    </>
  );
}
