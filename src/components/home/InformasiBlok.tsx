// PAKET-3C2/21: Informasi Pilihan. Isi dan tata letak dari CMS (menu Informasi); bila kosong memakai teks dan tata bawaan. Tampilannya dipakai bersama editor CMS.
import Link from "next/link";
import { getInformasi, getInformasiTata } from "@/lib/pengaturan";
import { AnimasiMasuk } from "@/components/AnimasiMasuk";
import { InformasiTampilan, type Bungkus, type Isi, type Tombol } from "./InformasiTampilan";

const tebal = (s: string) => s.split("**").map((p, i) => (i % 2 ? <strong key={i}>{p}</strong> : p));

export async function InformasiBlok() {
  const [d, tata] = await Promise.all([getInformasi(), getInformasiTata().catch(() => null)]);
  const t = tata ?? (await import("@/lib/informasi-tata")).tataBawaan();
  const isi: Isi = (g, k, o) => {
    const v = (d[g] as unknown as Record<string, string>)[k];
    return o?.tebal ? tebal(v) : v;
  };
  const tombol: Tombol = (g, kelas, akhiran) => <Link href={d[g].href} className={kelas}>{d[g].tombol}{akhiran}</Link>;
  const bungkus: Bungkus = (id, node) => (
    <AnimasiMasuk key={id} anim={t.gaya[id].animasi} className="ms-blok" style={{ "--span": t.gaya[id].lebar } as React.CSSProperties}>{node}</AnimasiMasuk>
  );
  return <div className="mt-6"><InformasiTampilan isi={isi} tombol={tombol} tata={t} bungkus={bungkus} /></div>;
}
