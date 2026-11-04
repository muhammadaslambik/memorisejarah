// PAKET-12D2: tombol "Lihat Biografi" pada profil redaksi; membuka biografi lengkap di dalam kartu profil.
"use client";
import { useState } from "react";

export function BiografiLengkap({ html }: { html: string }) {
  const [buka, setBuka] = useState(false);
  return (
    <div className="mt-5">
      <button
        type="button"
        onClick={() => setBuka(!buka)}
        aria-expanded={buka}
        className="rounded-full border border-ms-gold/60 px-5 py-2 text-sm font-semibold text-ms-gold transition hover:bg-ms-gold/10"
      >
        {buka ? "Sembunyikan Biografi" : "Lihat Biografi"}
      </button>
      {buka && (
        <div
          className="prose prose-invert mt-5 max-w-none border-t border-ms-line pt-5 prose-headings:font-serif prose-h3:mb-2 prose-h3:mt-6 prose-h3:text-lg prose-h3:uppercase prose-h3:tracking-wide prose-p:my-2 prose-a:text-ms-gold prose-li:my-0.5"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      )}
    </div>
  );
}
