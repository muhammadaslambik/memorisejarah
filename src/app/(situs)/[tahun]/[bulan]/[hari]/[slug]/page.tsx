// PAKET-8A: alamat lama WordPress /YYYY/MM/DD/slug dialihkan permanen ke /artikel/slug
import { notFound, permanentRedirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AlamatLama({ params }: { params: Promise<{ tahun: string; bulan: string; hari: string; slug: string }> }) {
  const { tahun, bulan, hari, slug } = await params;
  if (!/^\d{4}$/.test(tahun) || !/^\d{2}$/.test(bulan) || !/^\d{2}$/.test(hari) || !slug) notFound();
  permanentRedirect(`/artikel/${slug}`);
}