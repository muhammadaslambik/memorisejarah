// Ikon logo asli + tulisan, mengikuti susunan contoh.
export function Logo() {
  return (
    <span className="flex min-w-0 items-center gap-2 sm:gap-3">
      <img src="/brand/logo-memori-sejarah-kecil.png" alt="" className="h-9 w-9 shrink-0 rounded-full object-cover sm:h-10 sm:w-10" />
      <span className="min-w-0 leading-tight">
        <span className="block truncate font-serif text-lg font-bold text-ms-cream sm:text-xl">Memori Sejarah</span>
        <span className="hidden text-[10px] font-semibold uppercase tracking-[0.22em] text-ms-gold sm:block">Tempat Mengingat Sejarah</span>
      </span>
    </span>
  );
}