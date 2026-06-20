"use client";

import { useState } from "react";

import { signOut } from "@/features/auth/actions";
import CalendarTab from "./CalendarTab";
import ClinicInfoTab from "./ClinicInfoTab";
import EarningsTab from "./EarningsTab";
import GalleryTab from "./GalleryTab";
import QrTab from "./QrTab";
import ServicesTab from "./ServicesTab";
import type {
  EarningsMonth,
  GalleryItem,
  PanelAppointment,
  PanelClinicInfo,
  PanelService,
} from "@/features/panel/lib/types";

type Tab = "calendar" | "ganancias" | "servicios" | "info" | "galeria" | "qr";

const TABS: { key: Tab; label: string }[] = [
  { key: "calendar", label: "📅 Calendario" },
  { key: "ganancias", label: "💰 Ganancias" },
  { key: "servicios", label: "🦷 Servicios" },
  { key: "info", label: "🏥 Información" },
  { key: "galeria", label: "🖼️ Galería" },
  { key: "qr", label: "📱 QR" },
];

// The only stateful client piece of the panel: tab selection. All data arrives
// as server-fetched props; each tab mutates through server actions that
// revalidate /panel, so fresh data flows back down without any browser fetch.
export default function PanelShell({
  appointments,
  services,
  gallery,
  clinicInfo,
  earnings,
  siteUrl,
}: {
  appointments: PanelAppointment[];
  services: PanelService[];
  gallery: GalleryItem[];
  clinicInfo: PanelClinicInfo | null;
  earnings: EarningsMonth[];
  siteUrl: string;
}) {
  const [tab, setTab] = useState<Tab>("calendar");

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-30 border-slate-200 border-b bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <h1 className="font-bold text-slate-800 text-xl">
            🦷 Panel del odontólogo
          </h1>
          <form action={signOut}>
            <button
              type="submit"
              className="text-slate-500 text-sm transition-colors hover:text-red-500"
            >
              Cerrar sesión →
            </button>
          </form>
        </div>
        {/* Tabs */}
        <div className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 pb-1">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`whitespace-nowrap rounded-t-lg px-4 py-2 font-medium text-sm transition-colors ${tab === t.key ? "bg-sky-600 text-white" : "text-slate-600 hover:bg-slate-100"}`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-6">
        {tab === "calendar" && <CalendarTab appointments={appointments} />}
        {tab === "ganancias" && <EarningsTab earnings={earnings} />}
        {tab === "servicios" && <ServicesTab services={services} />}
        {tab === "info" && <ClinicInfoTab clinicInfo={clinicInfo} />}
        {tab === "galeria" && <GalleryTab gallery={gallery} />}
        {tab === "qr" && <QrTab siteUrl={siteUrl} />}
      </div>
    </div>
  );
}
