export function AuthLoadingPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center px-4">
      <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-8 text-center shadow-xl">
        <div className="mb-4 text-3xl font-semibold">Loading Strive</div>
        <p className="text-zinc-400">Checking your session and syncing data...</p>
      </div>
    </div>
  );
}
