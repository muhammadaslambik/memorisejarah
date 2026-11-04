// PAKET-12D3: nama penulis di artikel = tautan ke halaman penulis /nama-penulis (atau halaman tulisan bila belum punya profil).
import Link from "next/link";
import type { RingkasPenulis } from "@/lib/penulis";

export function PenulisInfo({ data }: { data: RingkasPenulis }) {
  const href = data.profilSlug ? `/${data.profilSlug}` : `/penulis/${data.id}`;
  return (
    <Link href={href} className="font-semibold text-ms-gold underline decoration-dotted underline-offset-4 hover:decoration-solid">
      {data.nama.split(",")[0]}
    </Link>
  );
}
