// PAKET-28: keterangan di bawah nama situs; mengikuti bahasa yang dibuka dan tidak diterjemahkan ulang oleh Google Translate.
"use client";
import { useEffect, useState } from "react";
import { TAGLINE, kodeBahasaAktif } from "@/lib/merek";

export function TaglineMerek({ className }: { className?: string }) {
  const [kode, setKode] = useState("id");
  useEffect(() => { setKode(kodeBahasaAktif()); }, []);
  return <span translate="no" className={`notranslate ${className ?? ""}`}>{TAGLINE[kode] ?? TAGLINE.id}</span>;
}
