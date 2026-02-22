import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse bg-surface-700 rounded',
        className
      )}
    />
  );
}

export function SnippetCardSkeleton() {
  return (
    <div className="rounded-xl overflow-hidden bg-surface-800 border border-surface-700">
      {/* Header */}
      <div className="p-4 border-b border-surface-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="w-10 h-10 rounded-lg" />
            <div className="space-y-2">
              <Skeleton className="w-32 h-4" />
              <Skeleton className="w-48 h-3" />
            </div>
          </div>
          <Skeleton className="w-16 h-6 rounded-md" />
        </div>
      </div>

      {/* Code Preview */}
      <div className="p-4 space-y-2">
        <Skeleton className="w-full h-4" />
        <Skeleton className="w-3/4 h-4" />
        <Skeleton className="w-1/2 h-4" />
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-surface-700">
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <Skeleton className="w-16 h-5 rounded-full" />
            <Skeleton className="w-12 h-5 rounded-full" />
          </div>
          <Skeleton className="w-24 h-4" />
        </div>
      </div>
    </div>
  );
}

export function SnippetDetailSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Skeleton className="w-10 h-10 rounded-lg" />
          <div className="space-y-2">
            <Skeleton className="w-48 h-6" />
            <Skeleton className="w-64 h-4" />
          </div>
        </div>
        <div className="flex gap-2">
          <Skeleton className="w-24 h-10 rounded-lg" />
          <Skeleton className="w-20 h-10 rounded-lg" />
        </div>
      </div>

      {/* Metadata */}
      <div className="flex gap-4 p-4 bg-surface-800 rounded-lg border border-surface-700">
        <Skeleton className="w-24 h-6 rounded-md" />
        <Skeleton className="w-20 h-6 rounded-md" />
        <Skeleton className="w-28 h-6 rounded-md" />
      </div>

      {/* Code */}
      <div className="rounded-xl overflow-hidden border border-surface-700">
        <div className="p-3 bg-surface-800 border-b border-surface-700">
          <Skeleton className="w-24 h-4" />
        </div>
        <div className="p-4 space-y-2 bg-surface-900">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className={cn('h-4', i % 3 === 0 ? 'w-full' : i % 3 === 1 ? 'w-3/4' : 'w-1/2')} />
          ))}
        </div>
      </div>
    </div>
  );
}
