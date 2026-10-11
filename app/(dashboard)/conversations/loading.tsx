export default function ConversationsLoading() {
  return (
    <div className="flex h-full min-h-0" aria-busy="true" aria-label="Loading conversations">
      <div className="w-full shrink-0 border-r border-zinc-200 bg-white lg:w-[340px]">
        <div className="space-y-3 border-b border-zinc-200 px-4 pt-4 pb-3">
          <h1 className="text-[15px] font-semibold tracking-tight text-zinc-900">Inbox</h1>
          <div className="h-9 rounded-lg bg-zinc-100" />
        </div>
        <ul className="animate-pulse">
          {Array.from({ length: 6 }, (_, i) => (
            <li key={i} className="flex gap-3 border-b border-zinc-100 px-4 py-3">
              <div className="size-9 shrink-0 rounded-full bg-zinc-200/70" />
              <div className="flex-1 space-y-2 py-0.5">
                <div className="h-3 w-1/2 rounded bg-zinc-200/70" />
                <div className="h-2.5 w-1/3 rounded bg-zinc-100" />
                <div className="h-2.5 w-4/5 rounded bg-zinc-100" />
              </div>
            </li>
          ))}
        </ul>
      </div>
      <div className="hidden flex-1 place-items-center bg-[#f7f7f5] text-sm text-zinc-500 lg:grid">Loading conversations…</div>
    </div>
  );
}
