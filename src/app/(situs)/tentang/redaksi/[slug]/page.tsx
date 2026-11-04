// PAKET-12D3: alamat lama profil redaksi dialihkan permanen ke alamat penulis (/nama-penulis)
import { permanentRedirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ProfilLama({ params }: { params: Promise<{ slug: string }> }) {
  permanentRedirect(`/${encodeURIComponent((await params).slug)}`);
}
