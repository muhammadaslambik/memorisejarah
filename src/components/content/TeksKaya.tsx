// PAKET-9E: teks sederhana dari CMS. Paragraf dipisah baris kosong; "## " subjudul, "- " daftar, "1. " daftar bernomor,
// "> " kutipan, **tebal**, [teks](/alamat). Dirender sebagai elemen React (bukan HTML mentah), jadi aman.
import Link from "next/link";
import type { ReactNode } from "react";

const URL_AMAN = /^(\/(?!\/)|https:\/\/|mailto:)/i;
const kelasTautan = "text-ms-gold underline-offset-4 hover:underline";

function sebaris(s: string, kunci: string): ReactNode[] {
  return s.split(/(\*\*[^*]+\*\*|\[[^\]]+\]\([^)\s]+\))/g).map((p, i) => {
    const k = `${kunci}-${i}`;
    if (p.length > 4 && p.startsWith("**") && p.endsWith("**")) return <strong key={k} className="text-ms-cream">{p.slice(2, -2)}</strong>;
    const m = p.match(/^\[([^\]]+)\]\(([^)\s]+)\)$/);
    if (m && URL_AMAN.test(m[2])) {
      return m[2].startsWith("/")
        ? <Link key={k} href={m[2]} className={kelasTautan}>{m[1]}</Link>
        : <a key={k} href={m[2]} target="_blank" rel="noopener noreferrer" className={kelasTautan}>{m[1]}</a>;
    }
    return p;
  });
}

export function TeksKaya({ teks }: { teks: string }) {
  const blok = teks.replace(/\r\n/g, "\n").split(/\n{2,}/).map((b) => b.trim()).filter(Boolean);
  return (
    <div className="space-y-4 leading-relaxed text-ms-cream/80">
      {blok.map((b, i) => {
        const baris = b.split("\n");
        if (b.startsWith("## ")) return <h3 key={i} className="pt-2 font-serif text-lg font-bold text-ms-cream">{sebaris(b.slice(3), `h${i}`)}</h3>;
        if (b.startsWith("> ")) return <blockquote key={i} className="border-l-2 border-ms-gold pl-4 font-serif text-xl leading-snug text-ms-cream">{sebaris(baris.map((l) => l.replace(/^>\s?/, "")).join(" "), `q${i}`)}</blockquote>;
        if (baris.every((l) => /^-\s/.test(l))) return <ul key={i} className="list-disc space-y-3 pl-5">{baris.map((l, j) => <li key={j}>{sebaris(l.replace(/^-\s/, ""), `u${i}-${j}`)}</li>)}</ul>;
        if (baris.every((l) => /^\d+\.\s/.test(l))) return <ol key={i} className="list-decimal space-y-2 pl-5">{baris.map((l, j) => <li key={j}>{sebaris(l.replace(/^\d+\.\s/, ""), `o${i}-${j}`)}</li>)}</ol>;
        return <p key={i}>{sebaris(baris.join(" "), `p${i}`)}</p>;
      })}
    </div>
  );
}