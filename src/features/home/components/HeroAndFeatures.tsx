import Image from "next/image";
import Link from "next/link";

import { getClinicInfo } from "@/lib/data";
import { DEFAULT_CI } from "@/features/home/lib/clinic";
import BannerSlider from "./BannerSlider";

export default async function HeroAndFeatures() {
  const ci = (await getClinicInfo()) ?? DEFAULT_CI;
  const clinicName = ci.clinic_name || "Consultorio Juan Carlos Molina";
  const bannerType = ci.banner_type ?? "gradient";
  const bannerImages = ci.banner_images ?? [];
  const colorFrom = ci.banner_color_from ?? "#0284c7";
  const colorTo = ci.banner_color_to ?? "#06b6d4";

  const bannerStyle =
    bannerType !== "slider"
      ? {
          background:
            bannerType === "gradient"
              ? `linear-gradient(135deg, ${colorFrom}, ${colorTo})`
              : colorFrom,
        }
      : {};

  return (
    <>
      {/* Hero */}
      <section
        className="relative flex min-h-[340px] items-center overflow-hidden px-4 py-24 text-white"
        style={bannerStyle}
      >
        {bannerType === "slider" && <BannerSlider images={bannerImages} />}

        <div className="relative z-10 mx-auto w-full max-w-4xl text-center">
          {ci.logo_url && (
            <Image
              src={ci.logo_url}
              alt="Logo"
              width={96}
              height={96}
              className="mx-auto mb-6 h-24 w-24 rounded-2xl bg-white/10 object-contain p-2"
            />
          )}
          <h1 className="mb-4 font-bold text-5xl leading-tight drop-shadow-sm">
            {clinicName}
          </h1>
          <p className="mx-auto mb-8 max-w-xl text-white/90 text-xl drop-shadow-sm">
            {ci.banner_subtitle || "Tu salud dental en manos expertas."}
          </p>
          <Link
            href="/agendar"
            className="inline-block rounded-2xl bg-white px-8 py-4 font-bold text-lg text-sky-700 shadow-lg transition-all hover:bg-sky-50"
          >
            Agendar cita ahora
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="bg-white px-4 py-16">
        <div className="mx-auto grid max-w-4xl grid-cols-1 gap-8 md:grid-cols-3">
          {[
            {
              title: ci.feature_1_title || "Horarios flexibles",
              desc: ci.feature_1_desc || "Lun-Vie de 8am-12pm y 2pm-6pm.",
            },
            {
              title: ci.feature_2_title || "Experiencia comprobada",
              desc: ci.feature_2_desc || "Mas de 15 anos atendiendo pacientes.",
            },
            {
              title: ci.feature_3_title || "Pago facil",
              desc: ci.feature_3_desc || "Paga en efectivo o con tarjeta.",
            },
          ].map((f) => (
            <div
              key={f.title}
              className="rounded-2xl border border-slate-100 p-6 text-center shadow-sm"
            >
              <h3 className="mb-2 font-bold text-lg text-slate-800">
                {f.title}
              </h3>
              <p className="text-slate-500 text-sm">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
