export function BreakdownList({ title, items, emptyLabel = "No data yet" }: { title: string; items: { key: string; count: number }[]; emptyLabel?: string }) {
  const max = Math.max(1, ...items.map((i) => i.count));

  return (
    <div>
      <h3 className="text-sm font-semibold text-alloy">{title}</h3>
      {items.length === 0 ? (
        <p className="mt-3 text-xs text-alloy-faint">{emptyLabel}</p>
      ) : (
        <div className="mt-3 space-y-2.5">
          {items.map((item) => (
            <div key={item.key} className="flex items-center gap-3 text-xs">
              <span className="w-24 shrink-0 truncate text-alloy-dim" title={item.key}>
                {item.key}
              </span>
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-shadow-raised">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-electric to-ultraviolet"
                  style={{ width: `${(item.count / max) * 100}%` }}
                />
              </div>
              <span className="w-8 shrink-0 text-right font-mono text-alloy">{item.count}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
