import type { EarningsMonth } from '@/features/panel/lib/types'

// Pure presentation — earnings are bucketed server-side in getEarnings().
export default function EarningsTab({ earnings }: { earnings: EarningsMonth[] }) {
  const maxTotal = Math.max(...earnings.map((e) => e.total), 1)
  const thisMonth = earnings[earnings.length - 1]
  const lastMonth = earnings[earnings.length - 2]
  const totalYear = earnings.reduce((s, e) => s + e.total, 0)
  const totalCitas = earnings.reduce((s, e) => s + e.count, 0)

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-800">💰 Ganancias</h2>
        <p className="text-slate-500 text-sm mt-1">Ingresos de citas activas (no canceladas) de los últimos 6 meses</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="card bg-gradient-to-br from-sky-50 to-sky-100 border-sky-200">
          <p className="text-xs text-sky-600 font-medium mb-1">Este mes</p>
          <p className="text-2xl font-bold text-sky-700">${(thisMonth?.total ?? 0).toLocaleString('es-CO')}</p>
          <p className="text-xs text-sky-500 mt-1">{thisMonth?.count ?? 0} citas</p>
          {lastMonth && lastMonth.total > 0 && (
            <p className={`text-xs mt-1 font-medium ${(thisMonth?.total ?? 0) >= lastMonth.total ? 'text-green-600' : 'text-red-500'}`}>
              {(thisMonth?.total ?? 0) >= lastMonth.total ? '↑' : '↓'}{' '}
              {Math.abs(Math.round((((thisMonth?.total ?? 0) - lastMonth.total) / lastMonth.total) * 100))}% vs mes anterior
            </p>
          )}
        </div>
        <div className="card bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
          <p className="text-xs text-emerald-600 font-medium mb-1">Últimos 6 meses</p>
          <p className="text-2xl font-bold text-emerald-700">${totalYear.toLocaleString('es-CO')}</p>
          <p className="text-xs text-emerald-500 mt-1">{totalCitas} citas en total</p>
        </div>
      </div>

      {/* Bar chart */}
      <div className="card">
        <h3 className="font-bold text-slate-700 mb-6">Ingresos por mes</h3>
        <div className="flex items-end gap-3 h-48">
          {earnings.map((e, i) => {
            const isCurrentMonth = i === earnings.length - 1
            const heightPct = maxTotal > 0 ? (e.total / maxTotal) * 100 : 0
            return (
              <div key={e.month} className="flex-1 flex flex-col items-center gap-2">
                <div className="text-xs text-slate-500 font-medium text-center">
                  {e.total > 0 ? `$${Math.round(e.total / 1000)}k` : '—'}
                </div>
                <div className="w-full flex items-end" style={{ height: '140px' }}>
                  <div
                    className={`w-full rounded-t-lg transition-all ${isCurrentMonth ? 'bg-sky-500' : 'bg-sky-200'}`}
                    style={{ height: `${Math.max(heightPct, e.total > 0 ? 4 : 0)}%` }}
                    title={`$${e.total.toLocaleString('es-CO')} · ${e.count} citas`}
                  />
                </div>
                <div className="text-xs text-slate-500 text-center">{e.label}</div>
                {e.count > 0 && <div className="text-xs text-slate-400">{e.count} citas</div>}
              </div>
            )
          })}
        </div>
        <div className="flex items-center gap-3 mt-4 pt-4 border-t border-slate-100 text-xs text-slate-500">
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-sky-500" /> Mes actual</div>
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-sky-200" /> Meses anteriores</div>
        </div>
      </div>

      {/* Monthly breakdown */}
      <div className="card mt-4">
        <h3 className="font-bold text-slate-700 mb-4">Detalle por mes</h3>
        <div className="space-y-2">
          {[...earnings].reverse().map((e) => (
            <div key={e.month} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
              <div>
                <span className="font-medium text-slate-700 capitalize">{e.label}</span>
                <span className="text-xs text-slate-400 ml-2">· {e.count} citas</span>
              </div>
              <span className={`font-bold ${e.total > 0 ? 'text-slate-800' : 'text-slate-300'}`}>
                {e.total > 0 ? `$${e.total.toLocaleString('es-CO')}` : '$0'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
