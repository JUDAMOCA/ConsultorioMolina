import type { EarningsMonth } from "@/features/panel/lib/types";

// Pure presentation — earnings are bucketed server-side in getEarnings().
export default function EarningsTab({
  earnings,
}: {
  earnings: EarningsMonth[];
}) {
  const maxTotal = Math.max(...earnings.map((e) => e.total), 1);
  const thisMonth = earnings[earnings.length - 1];
  const lastMonth = earnings[earnings.length - 2];
  const totalYear = earnings.reduce((s, e) => s + e.total, 0);
  const totalCitas = earnings.reduce((s, e) => s + e.count, 0);

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h2 className="font-bold text-2xl text-slate-800">💰 Ganancias</h2>
        <p className="mt-1 text-slate-500 text-sm">
          Ingresos de citas activas (no canceladas) de los últimos 6 meses
        </p>
      </div>

      {/* Summary cards */}
      <div className="mb-6 grid grid-cols-2 gap-4">
        <div className="card border-sky-200 bg-gradient-to-br from-sky-50 to-sky-100">
          <p className="mb-1 font-medium text-sky-600 text-xs">Este mes</p>
          <p className="font-bold text-2xl text-sky-700">
            ${(thisMonth?.total ?? 0).toLocaleString("es-CO")}
          </p>
          <p className="mt-1 text-sky-500 text-xs">
            {thisMonth?.count ?? 0} citas
          </p>
          {lastMonth && lastMonth.total > 0 && (
            <p
              className={`mt-1 font-medium text-xs ${(thisMonth?.total ?? 0) >= lastMonth.total ? "text-green-600" : "text-red-500"}`}
            >
              {(thisMonth?.total ?? 0) >= lastMonth.total ? "↑" : "↓"}{" "}
              {Math.abs(
                Math.round(
                  (((thisMonth?.total ?? 0) - lastMonth.total) /
                    lastMonth.total) *
                    100,
                ),
              )}
              % vs mes anterior
            </p>
          )}
        </div>
        <div className="card border-emerald-200 bg-gradient-to-br from-emerald-50 to-emerald-100">
          <p className="mb-1 font-medium text-emerald-600 text-xs">
            Últimos 6 meses
          </p>
          <p className="font-bold text-2xl text-emerald-700">
            ${totalYear.toLocaleString("es-CO")}
          </p>
          <p className="mt-1 text-emerald-500 text-xs">
            {totalCitas} citas en total
          </p>
        </div>
      </div>

      {/* Bar chart */}
      <div className="card">
        <h3 className="mb-6 font-bold text-slate-700">Ingresos por mes</h3>
        <div className="flex h-48 items-end gap-3">
          {earnings.map((e, i) => {
            const isCurrentMonth = i === earnings.length - 1;
            const heightPct = maxTotal > 0 ? (e.total / maxTotal) * 100 : 0;
            return (
              <div
                key={e.month}
                className="flex flex-1 flex-col items-center gap-2"
              >
                <div className="text-center font-medium text-slate-500 text-xs">
                  {e.total > 0 ? `$${Math.round(e.total / 1000)}k` : "—"}
                </div>
                <div
                  className="flex w-full items-end"
                  style={{ height: "140px" }}
                >
                  <div
                    className={`w-full rounded-t-lg transition-all ${isCurrentMonth ? "bg-sky-500" : "bg-sky-200"}`}
                    style={{
                      height: `${Math.max(heightPct, e.total > 0 ? 4 : 0)}%`,
                    }}
                    title={`$${e.total.toLocaleString("es-CO")} · ${e.count} citas`}
                  />
                </div>
                <div className="text-center text-slate-500 text-xs">
                  {e.label}
                </div>
                {e.count > 0 && (
                  <div className="text-slate-400 text-xs">{e.count} citas</div>
                )}
              </div>
            );
          })}
        </div>
        <div className="mt-4 flex items-center gap-3 border-slate-100 border-t pt-4 text-slate-500 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded bg-sky-500" /> Mes actual
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded bg-sky-200" /> Meses anteriores
          </div>
        </div>
      </div>

      {/* Monthly breakdown */}
      <div className="card mt-4">
        <h3 className="mb-4 font-bold text-slate-700">Detalle por mes</h3>
        <div className="space-y-2">
          {[...earnings].reverse().map((e) => (
            <div
              key={e.month}
              className="flex items-center justify-between border-slate-50 border-b py-2 last:border-0"
            >
              <div>
                <span className="font-medium text-slate-700 capitalize">
                  {e.label}
                </span>
                <span className="ml-2 text-slate-400 text-xs">
                  · {e.count} citas
                </span>
              </div>
              <span
                className={`font-bold ${e.total > 0 ? "text-slate-800" : "text-slate-300"}`}
              >
                {e.total > 0 ? `$${e.total.toLocaleString("es-CO")}` : "$0"}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
