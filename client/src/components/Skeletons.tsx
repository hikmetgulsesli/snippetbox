export function SnippetCardSkeleton() {
  return (
    <div className="card p-5 animate-pulse">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-3 flex-1">
          <div className="w-10 h-10 rounded-lg bg-[var(--surface-elevated)] flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="h-6 w-3/4 bg-[var(--surface-elevated)] rounded mb-2" />
            <div className="h-4 w-1/2 bg-[var(--surface-elevated)] rounded" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-5 w-16 bg-[var(--surface-elevated)] rounded" />
        </div>
      </div>

      {/* Code Preview */}
      <div className="h-20 bg-[var(--surface-elevated)] rounded-lg mb-4" />

      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-5 w-12 bg-[var(--surface-elevated)] rounded" />
          <div className="h-5 w-12 bg-[var(--surface-elevated)] rounded" />
        </div>
        <div className="flex items-center gap-1">
          <div className="h-8 w-8 bg-[var(--surface-elevated)] rounded" />
          <div className="h-8 w-8 bg-[var(--surface-elevated)] rounded" />
          <div className="h-8 w-8 bg-[var(--surface-elevated)] rounded" />
        </div>
      </div>
    </div>
  );
}

export function SnippetListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <SnippetCardSkeleton key={i} />
      ))}
    </div>
  );
}
