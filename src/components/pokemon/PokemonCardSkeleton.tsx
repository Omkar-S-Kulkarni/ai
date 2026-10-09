// ============================================================
// PokemonCardSkeleton Component
// src/components/pokemon/PokemonCardSkeleton.tsx
// ============================================================

export function PokemonCardSkeleton() {
  return (
    <div className="card p-4 bg-slate-900/60 border-slate-800 animate-pulse relative overflow-hidden">
      <div className="flex items-center justify-between mb-3">
        <div className="h-3 w-12 bg-slate-800 rounded" />
        <div className="h-6 w-6 bg-slate-800 rounded-full" />
      </div>

      <div className="flex flex-col items-center my-3">
        <div className="w-24 h-24 bg-slate-800/80 rounded-full mb-3" />
        <div className="h-4 w-28 bg-slate-800 rounded mb-2" />
        <div className="flex gap-1.5 justify-center">
          <div className="h-5 w-14 bg-slate-800 rounded-md" />
          <div className="h-5 w-14 bg-slate-800 rounded-md" />
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
        <div className="h-3 w-16 bg-slate-800 rounded" />
        <div className="h-6 w-16 bg-slate-800 rounded-lg" />
      </div>
    </div>
  )
}
