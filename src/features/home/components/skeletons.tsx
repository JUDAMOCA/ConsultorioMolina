// Static streaming fallbacks for the homepage sections. Pure presentational —
// no data, no client code.

export function HeroSkeleton() {
  return (
    <>
      <div className="h-[520px] bg-gradient-to-br from-sky-600 to-cyan-400 animate-pulse" />
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-40 rounded-2xl bg-slate-100 animate-pulse" />
          ))}
        </div>
      </div>
    </>
  )
}

export function ServicesSkeleton() {
  return (
    <section className="py-16 px-4 bg-sky-50">
      <div className="max-w-4xl mx-auto">
        <div className="h-9 w-64 mx-auto rounded bg-slate-200 animate-pulse mb-3" />
        <div className="h-5 w-80 mx-auto rounded bg-slate-100 animate-pulse mb-10" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 rounded-2xl bg-white border border-slate-100 animate-pulse" />
          ))}
        </div>
      </div>
    </section>
  )
}

export function GallerySkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="aspect-square rounded-2xl bg-slate-100 animate-pulse" />
      ))}
    </div>
  )
}
