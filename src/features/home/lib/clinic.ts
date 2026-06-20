import type { ClinicInfo } from "@/lib/data";

// Pure formatting helpers + the fallback clinic profile used when the database
// has no clinic_info row yet. No React, no Supabase.

const DAY_NAMES = ["Dom", "Lun", "Mar", "Mie", "Jue", "Vie", "Sab"];

function formatTime(t: string): string {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "pm" : "am";
  const hour = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return m === 0
    ? `${hour}${ampm}`
    : `${hour}:${String(m).padStart(2, "0")}${ampm}`;
}

export function formatSchedule(ci: ClinicInfo): string {
  const days = (ci.working_days ?? [1, 2, 3, 4, 5]).map((d) => DAY_NAMES[d]);
  const daysStr =
    days.length > 0 ? `${days[0]}-${days[days.length - 1]}` : "Lun-Vie";
  const morning = `${formatTime(ci.morning_start ?? "08:00")}-${formatTime(ci.morning_end ?? "12:00")}`;
  const afternoon = `${formatTime(ci.afternoon_start ?? "14:00")}-${formatTime(ci.afternoon_end ?? "18:00")}`;
  return `${daysStr} ${morning} / ${afternoon}`;
}

export const DEFAULT_CI: ClinicInfo = {
  address: "Direccion del consultorio",
  phone: "(000) 000-0000",
  email: "contacto@consultorio.com",
  morning_start: "08:00",
  morning_end: "12:00",
  afternoon_start: "14:00",
  afternoon_end: "18:00",
  working_days: [1, 2, 3, 4, 5],
  clinic_name: "Consultorio Juan Carlos Molina",
  logo_url: null,
  banner_subtitle:
    "Tu salud dental en manos expertas. Agenda tu cita facil y rapido.",
  feature_1_title: "Horarios flexibles",
  feature_1_desc: "Lun-Vie de 8am-12pm y 2pm-6pm. Agenda online en minutos.",
  feature_2_title: "Experiencia comprobada",
  feature_2_desc:
    "Mas de 15 anos atendiendo pacientes con dedicacion y profesionalismo.",
  feature_3_title: "Pago facil",
  feature_3_desc: "Paga en efectivo en el consultorio o con tarjeta en linea.",
};
