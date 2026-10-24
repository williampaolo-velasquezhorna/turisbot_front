import type { ReactNode } from "react";

export function SkeletonLine({
  width,
  height = "1rem",
}: {
  width: string;
  height?: string;
}) {
  return <div className="skeleton-line" style={{ width, height }} />;
}

export function StatCardSkeleton() {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
      <div className="flex items-center justify-between">
        <div className="flex-1 space-y-2">
          <SkeletonLine width="45%" height="0.875rem" />
          <SkeletonLine width="70%" height="2.25rem" />
        </div>
        <div
          className="skeleton-block"
          style={{ width: "3rem", height: "3rem", borderRadius: "0.5rem" }}
        />
      </div>
      <div style={{ marginTop: "1rem" }}>
        <SkeletonLine width="40%" height="0.875rem" />
      </div>
    </div>
  );
}

export function ListSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3 py-4">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          <SkeletonLine width={`${30 + (i % 3) * 15}%`} />
          <div className="ml-auto">
            <SkeletonLine width="4rem" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function InlineSpinner({ text = "Cargando..." }: { text?: string }) {
  return (
    <div className="http-inline-spinner flex flex-col items-center gap-3 py-12">
      <div className="http-loading-circle w-11 h-11 rounded-full border-4 border-blue-100 border-t-[#1e88e5] animate-spin" />
      <span className="text-gray-500 text-sm">{text}</span>
    </div>
  );
}

export function EmptyState({
  message,
  action,
}: {
  message: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="text-center py-12">
      {action}
      <p className="text-gray-500">{message}</p>
    </div>
  );
}
