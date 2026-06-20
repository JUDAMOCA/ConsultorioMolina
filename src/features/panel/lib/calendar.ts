import type { PanelAppointment } from "./types";

// Pure calendar geometry + stats for the panel's weekly view. No React, no
// Supabase — used by the client tabs to render data passed down as props.

export const PX_PER_MIN = 1.2;
export const START_MINUTES = 480; // 08:00
export const END_MINUTES = 1080; // 18:00
export const TOTAL_PX = (END_MINUTES - START_MINUTES) * PX_PER_MIN;

export const HOUR_LABELS = [
  "8am",
  "9am",
  "10am",
  "11am",
  "12pm",
  "1pm",
  "2pm",
  "3pm",
  "4pm",
  "5pm",
  "6pm",
];
export const DAY_NAMES = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
export const DAY_NAMES_FULL = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];

export const STATUS_COLOR: Record<string, string> = {
  pending: "bg-yellow-200 border-yellow-400 text-yellow-900",
  confirmed: "bg-green-200 border-green-400 text-green-900",
  cancelled: "bg-slate-200 border-slate-400 text-slate-500",
};

export function timeToMin(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

export function getWeekDates(base: Date): Date[] {
  const mon = new Date(base);
  const day = mon.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  mon.setDate(mon.getDate() + diff);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(mon);
    d.setDate(mon.getDate() + i);
    return d;
  });
}

export interface PanelStats {
  total: number;
  week: number;
  pending: number;
}

export function computeStats(list: PanelAppointment[]): PanelStats {
  const today = new Date();
  const monday = getWeekDates(today)[1];
  const friday = getWeekDates(today)[5];
  const monStr = monday.toISOString().slice(0, 10);
  const friStr = friday.toISOString().slice(0, 10);
  const active = list.filter((a) => a.status !== "cancelled");
  return {
    total: active.length,
    week: active.filter(
      (a) => a.appointment_date >= monStr && a.appointment_date <= friStr,
    ).length,
    pending: active.filter((a) => a.status === "pending").length,
  };
}
