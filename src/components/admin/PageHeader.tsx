// PAKET-10B: kepala halaman CMS (ikon, judul, deskripsi, tombol aksi)
import type { ReactNode } from "react";
import { IkonAdmin } from "@/components/admin/ikon-admin";

export function PageHeader({ ikon, judul, deskripsi, aksi }: { ikon: string; judul: string; deskripsi?: string; aksi?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        <span className="a-ico h-12 w-12 rounded-2xl" style={{ ["--c" as string]: "var(--a-accent)" }}><IkonAdmin nama={ikon} className="h-6 w-6" /></span>
        <div>
          <h1 className="font-serif text-2xl font-bold leading-tight md:text-3xl">{judul}</h1>
          {deskripsi && <p className="a-muted mt-0.5 text-sm">{deskripsi}</p>}
        </div>
      </div>
      {aksi && <div className="flex flex-wrap items-center gap-2">{aksi}</div>}
    </div>
  );
}