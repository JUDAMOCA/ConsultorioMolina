"use client";

import { useState, useTransition } from "react";

import { deleteService, saveService } from "@/features/panel/actions";
import type { PanelService } from "@/features/panel/lib/types";

interface FormState {
  id?: string;
  name: string;
  duration: string;
  price: string;
}

const EMPTY: FormState = { name: "", duration: "", price: "" };

export default function ServicesTab({
  services,
}: {
  services: PanelService[];
}) {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [showForm, setShowForm] = useState(false);
  const [pending, startTransition] = useTransition();

  const openNew = () => {
    setForm(EMPTY);
    setShowForm(true);
  };
  const openEdit = (s: PanelService) => {
    setForm({
      id: s.id,
      name: s.name,
      duration: String(s.duration_minutes),
      price: String(s.price_cop),
    });
    setShowForm(true);
  };

  const save = () => {
    if (!form.name || !form.duration || !form.price) return;
    startTransition(async () => {
      const result = await saveService({
        id: form.id,
        name: form.name,
        durationMinutes: Number(form.duration),
        priceCop: Number(form.price),
      });
      if ("error" in result) alert(result.error);
      else setShowForm(false);
    });
  };

  const remove = (id: string) => {
    if (!confirm("¿Eliminar este servicio?")) return;
    startTransition(async () => {
      const result = await deleteService(id);
      if ("error" in result) alert(result.error);
    });
  };

  return (
    <div className="max-w-2xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="font-bold text-2xl text-slate-800">🦷 Servicios</h2>
          <p className="mt-1 text-slate-500 text-sm">
            Gestiona los servicios del consultorio
          </p>
        </div>
        <button type="button" onClick={openNew} className="btn-primary">
          + Agregar servicio
        </button>
      </div>

      {showForm && (
        <div className="card mb-6 border-2 border-sky-200">
          <h3 className="mb-4 font-bold text-slate-800">
            {form.id ? "Editar servicio" : "Nuevo servicio"}
          </h3>
          <div className="space-y-4">
            <div>
              <label className="label" htmlFor="svc-name">
                Nombre del servicio
              </label>
              <input
                id="svc-name"
                className="input"
                placeholder="Ej: Limpieza dental"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label" htmlFor="svc-duration">
                  Duración (minutos)
                </label>
                <input
                  id="svc-duration"
                  type="number"
                  className="input"
                  placeholder="30"
                  value={form.duration}
                  onChange={(e) =>
                    setForm({ ...form, duration: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="label" htmlFor="svc-price">
                  Precio (COP)
                </label>
                <input
                  id="svc-price"
                  type="number"
                  className="input"
                  placeholder="80000"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={save}
                disabled={pending}
                className="btn-primary"
              >
                {pending
                  ? "Guardando..."
                  : form.id
                    ? "💾 Guardar cambios"
                    : "➕ Crear servicio"}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="btn-secondary"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {services.length === 0 ? (
        <div className="card py-12 text-center text-slate-400">
          <p className="mb-3 text-4xl">🦷</p>
          <p>Aún no hay servicios. ¡Agrega el primero!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {services.map((svc) => (
            <div
              key={svc.id}
              className="card flex items-center justify-between gap-4"
            >
              <div>
                <p className="font-bold text-slate-800">{svc.name}</p>
                <p className="text-slate-500 text-sm">
                  ⏱ {svc.duration_minutes} min · 💰 $
                  {svc.price_cop.toLocaleString("es-CO")} COP
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => openEdit(svc)}
                  className="rounded-lg bg-sky-50 px-3 py-1.5 font-medium text-sky-700 text-sm transition-colors hover:bg-sky-100"
                >
                  ✏️ Editar
                </button>
                <button
                  type="button"
                  onClick={() => remove(svc.id)}
                  className="rounded-lg bg-red-50 px-3 py-1.5 font-medium text-red-600 text-sm transition-colors hover:bg-red-100"
                >
                  🗑 Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
