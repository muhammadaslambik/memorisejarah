// PAKET-12A: tanggal dengan nama hari, contoh "Selasa, 03 November 2026" (zona Asia/Jakarta)
export function tanggalLengkap(d: Date | null | undefined): string {
  if (!d) return "";
  return d.toLocaleDateString("id-ID", { weekday: "long", day: "2-digit", month: "long", year: "numeric", timeZone: "Asia/Jakarta" });
}
