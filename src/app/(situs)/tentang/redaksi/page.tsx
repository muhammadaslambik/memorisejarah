// PAKET-3B: susunan redaksi dari blog WordPress lama (hanya nama dan peran; data pribadi tidak disalin)
export const metadata = { title: "Susunan Redaksi" };

const ASLAMBIK = "Muhammad Aslambik, S.Hum.";
const SIGID = "Sigid Nugrohowati";
const RIFKY = "Rifky Arya Pramadana";
const IQBAL = "Iqbal Al Irfan, S.Hum.";
const FAJRI = "Fajri Ana Zahrotul Jannah, S.Hum.";
const DEWA = "Dewa Alfaquin Faturangga, S.Hum.";

const TIM: { nama: string; anggota: string[] }[] = [
  { nama: "Tim Editor dan Kreatif", anggota: [ASLAMBIK, SIGID, RIFKY, IQBAL, FAJRI] },
  { nama: "Tim Humas & Jaringan Relasi", anggota: [ASLAMBIK, RIFKY, DEWA] },
  { nama: "Tim IT (Situs Website)", anggota: [ASLAMBIK] },
  { nama: "Tim Sosial-Media", anggota: [FAJRI + " (Instagram)", SIGID + " (Grup WA & Saluran WA)", RIFKY + " (YouTube)"] },
  { nama: "Tim Riset", anggota: [ASLAMBIK, SIGID, RIFKY, DEWA, IQBAL, FAJRI, "Amin Nur Huda, S.Hum.", "Rina Mutoharoh, S.Hum.", "Arya Bagus Nur Ajiyanto, S.Hum."] },
];

export default function Redaksi() {
  return (
    <div className="-mb-16 min-h-[70vh] bg-ms-bg pb-24 text-ms-cream">
      <section className="mx-auto max-w-[90rem] px-6 pt-12 md:px-10 lg:px-16">
        <h1 className="font-serif text-4xl font-bold md:text-5xl">Susunan Redaksi</h1>
        <div className="mt-8 rounded-2xl border border-ms-gold/40 bg-ms-surface p-6 md:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ms-gold">Pendiri &amp; Pemimpin Redaksi</p>
          <p className="mt-2 font-serif text-2xl font-bold">{ASLAMBIK}</p>
        </div>
        <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {TIM.map((t) => (
            <div key={t.nama} className="rounded-2xl border border-ms-line bg-ms-surface p-6">
              <h2 className="font-serif text-xl font-bold text-ms-gold">{t.nama}</h2>
              <ul className="mt-4 space-y-2 text-ms-cream/80">
                {t.anggota.map((n) => <li key={n}>{n}</li>)}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}