// PAKET-10A: halaman Tentang; isinya dari pengaturan CMS (bawaan: teks WordPress lama)
import Link from "next/link";
import { getTentang } from "@/lib/tentang";
import { sanitizeHtml } from "@/lib/sanitize";

export const dynamic = "force-dynamic";
export const metadata = { title: "Tentang Memori Sejarah" };

const kartu = "rounded-2xl border border-ms-line bg-ms-surface p-6 md:p-8";
const judulKelas = "font-serif text-2xl font-bold text-ms-gold";
const isiKelas = "prose prose-invert max-w-none leading-relaxed prose-headings:font-serif prose-a:text-ms-gold prose-blockquote:border-ms-gold prose-blockquote:font-serif prose-p:my-3";
const Isi = ({ html }: { html: string }) => <div className={isiKelas} dangerouslySetInnerHTML={{ __html: sanitizeHtml(html) }} />;

export default async function Tentang() {
  const bagian = await getTentang();
  const logo = bagian.find((b) => b.kunci === "logo");
  const biasa = bagian.filter((b) => b.kunci !== "logo");
  return (
    <div className="-mb-16 min-h-[70vh] bg-ms-bg pb-24 text-ms-cream">
      <section className="mx-auto max-w-[90rem] px-6 pt-12 md:px-10 lg:px-16">
        <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center">
          <img src="/brand/logo-memori-sejarah-kecil.png" alt="Logo Memori Sejarah" className="h-24 w-24 rounded-full" />
          <div>
            <h1 className="font-serif text-4xl font-bold md:text-5xl">Tentang Memori Sejarah</h1>
            <p className="mt-2 text-xs font-semibold uppercase tracking-[0.2em] text-ms-gold">Tempat Mengingat Sejarah</p>
          </div>
        </div>

        <div className="mt-10 grid items-start gap-6 lg:grid-cols-2">
          {biasa.map((b, i) => (
            <div key={i} className={kartu}>
              <h2 className={`${judulKelas} mb-4`}>{b.judul}</h2>
              <Isi html={b.isi} />
            </div>
          ))}
        </div>

        {logo && (
          <div className={`${kartu} mt-6`}>
            <h2 className={`${judulKelas} mb-4`}>{logo.judul}</h2>
            <div className="grid items-center gap-8 lg:grid-cols-[1.6fr_1fr]">
              <Isi html={logo.isi} />
              <div className="text-center">
                <img src="/brand/logo-memori-sejarah.png" alt="Logo Memori Sejarah" className="mx-auto w-56 max-w-full rounded-full" />
                <p className="mt-3 font-serif text-lg font-bold">Memori Sejarah</p>
                <p className="text-xs uppercase tracking-[0.2em] text-ms-gold">Tempat Mengingat Sejarah</p>
              </div>
            </div>
          </div>
        )}

        <p className="mt-10 text-sm text-ms-cream/70">
          Ingin tahu siapa di balik Memori Sejarah? <Link href="/tentang/redaksi" className="text-ms-gold">Lihat Susunan Redaksi &rarr;</Link>
        </p>
      </section>
    </div>
  );
}