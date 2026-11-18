import { TaglineMerek } from "./TaglineMerek";
// Ikon logo asli + tulisan, mengikuti susunan contoh.
export function Logo({ taglineSelalu = false }: { taglineSelalu?: boolean }) {
  return (
    <span className="flex min-w-0 items-center gap-2 sm:gap-3">
      <img src="/brand/logo-memori-sejarah-kecil.png" alt="" className="h-9 w-9 shrink-0 rounded-full object-cover sm:h-10 sm:w-10" />
      <span className="min-w-0 leading-tight">
        <span translate="no" className="notranslate block truncate font-serif text-lg font-bold text-ms-cream sm:text-xl">Memori Sejarah</span>
        <TaglineMerek className={`${taglineSelalu ? "block" : "hidden sm:block"} text-[10px] font-semibold uppercase tracking-[0.22em] text-ms-gold`} />
      </span>
    </span>
  );
}