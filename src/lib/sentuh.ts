// PAKET-20: apakah perangkat utamanya layar sentuh (ponsel/tablet). Dipakai agar ketukan pertama langsung diterima pemutar YouTube.
"use client";
import { useEffect, useState } from "react";

export function usePerangkatSentuh() {
  const [sentuh, setSentuh] = useState(false);
  useEffect(() => {
    const m = window.matchMedia("(pointer: coarse)");
    const ubah = () => setSentuh(m.matches);
    ubah();
    m.addEventListener?.("change", ubah);
    return () => m.removeEventListener?.("change", ubah);
  }, []);
  return sentuh;
}
