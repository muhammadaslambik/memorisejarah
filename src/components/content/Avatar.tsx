// PAKET-9C: foto anggota atau inisial bila belum ada foto
import { kecil } from "@/lib/gambar-url";

export function Avatar({ nama, url, ukuran = 48 }: { nama: string; url: string | null; ukuran?: number }) {
  const awal = nama.split(",")[0].split(" ").filter(Boolean).slice(0, 2).map((x) => x[0]).join("").toUpperCase();
  return url ? (
    <img src={kecil(url, ukuran * 2)} alt="" width={ukuran} height={ukuran} loading="lazy" referrerPolicy="no-referrer"
      className="shrink-0 rounded-full object-cover" style={{ width: ukuran, height: ukuran }} />
  ) : (
    <span className="grid shrink-0 place-items-center rounded-full bg-ms-gold/20 font-serif font-bold text-ms-gold" style={{ width: ukuran, height: ukuran, fontSize: ukuran / 2.8 }}>{awal}</span>
  );
}