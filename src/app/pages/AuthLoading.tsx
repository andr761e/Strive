export function AuthLoadingPage() {
  return (
    <div className="screen-shell flex items-center justify-center px-4">
      <div className="premium-card p-8 text-center">
        <div className="mx-auto mb-4 w-12 h-12 rounded-xl bg-blue-500/15 border border-blue-400/20 flex items-center justify-center text-blue-300 font-bold">
          S
        </div>
        <div className="mb-3 text-3xl font-semibold">Loading Strive</div>
        <p className="text-zinc-400">Opening your local training data...</p>
      </div>
    </div>
  );
}
