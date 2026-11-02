// PAKET-11A: pilihan jumlah artikel per halaman (tersimpan per akun)
"use client";
import { PILIHAN } from "@/lib/pilihan-halaman";

export function PilihPerHalaman({ nilai, kembali, aksi }: { nilai: number; kembali: string; aksi: (fd: FormData) => void | Promise<void> }) {
  return (
    <form action={aksi} className="flex items-center gap-2 text-sm">
      <input type="hidden" name="kembali" value={kembali} />
      <label htmlFor="per-halaman" className="a-muted whitespace-nowrap">Per halaman</label>
      <select id="per-halaman" name="per" defaultValue={nilai} onChange={(e) => e.currentTarget.form?.requestSubmit()} className="!py-1.5">
        {PILIHAN.map((n) => <option key={n} value={n}>{n === 0 ? "Semua" : n}</option>)}
      </select>
    </form>
  );
}