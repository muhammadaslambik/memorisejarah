// PAKET-2B
export function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-4">
      <h2 className="inline-flex shrink-0 items-center rounded-full bg-gradient-to-r from-red-900 to-amber-700 px-4 py-2 text-sm font-semibold text-white">{children}</h2>
      <span className="h-px flex-1 bg-ms-line" />
    </div>
  );
}