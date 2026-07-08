export default function Loading() {
  return (
    <div className="min-h-screen bg-parchment flex flex-col items-center justify-center">
      <div className="flex flex-col items-center gap-6">
        {/* Un indicador visual minimalista tipo editorial */}
        <div className="w-12 h-12 border border-lines flex items-center justify-center animate-pulse text-charcoal/30">
          <span className="text-2xl font-serif">¶</span>
        </div>
        <p className="font-sans text-sm uppercase tracking-widest text-charcoal/60">
          Recopilando manuscritos...
        </p>
      </div>
    </div>
  );
}
