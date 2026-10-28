// Ikon logo asli + tulisan, mengikuti susunan contoh.
export function Logo() {
  return (
    <span className="flex items-center gap-3">
      <img src="/brand/logo-memori-sejarah-kecil.png" alt="" className="h-10 w-10 shrink-0 rounded-full object-cover" />
      <span className="leading-tight">
        <span className="block font-serif text-xl font-bold text-ms-cream">Memori Sejarah</span>
        <span className="block text-[10px] font-semibold uppercase tracking-[0.22em] text-ms-gold">Tempat Mengingat Sejarah</span>
      </span>
    </span>
  );
}