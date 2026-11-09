// PAKET-3C2/19: Informasi Pilihan. Isi dari CMS (menu Informasi); bila kosong memakai teks bawaan. Tampilannya dipakai bersama editor CMS.
import Link from "next/link";
import { getInformasi } from "@/lib/pengaturan";
import { InformasiTampilan, type Isi, type Tombol } from "./InformasiTampilan";

const tebal = (s: string) => s.split("**").map((p, i) => (i % 2 ? <strong key={i}>{p}</strong> : p));

export async function InformasiBlok() {
  const d = await getInformasi();
  const isi: Isi = (g, k, o) => {
    const v = (d[g] as unknown as Record<string, string>)[k];
    return o?.tebal ? tebal(v) : v;
  };
  const tombol: Tombol = (g, kelas, akhiran) => <Link href={d[g].href} className={kelas}>{d[g].tombol}{akhiran}</Link>;
  return <div className="mt-6"><InformasiTampilan isi={isi} tombol={tombol} /></div>;
}
