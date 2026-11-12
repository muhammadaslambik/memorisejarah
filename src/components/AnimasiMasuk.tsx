// PAKET-21: pembungkus animasi ringan. Hanya transform/opacity (dipercepat GPU), berjalan SEKALI saat terlihat (animasi masuk) atau hanya selama terlihat
// (animasi berulang), dihentikan otomatis di luar layar, dan dimatikan bagi pengguna yang memilih "kurangi gerakan". Tanpa pustaka tambahan.
"use client";
import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";

const BERULANG = new Set(["mengambang", "denyut", "kilau"]);

export function AnimasiMasuk({ anim, className = "", style, diam, children }: { anim?: string; className?: string; style?: CSSProperties; diam?: boolean; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || !anim || diam) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || typeof IntersectionObserver === "undefined") return;
    el.classList.add("ms-anim-siap");
    const ulang = BERULANG.has(anim);
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        el.classList.add(ulang ? "ms-anim-jalan" : "ms-anim-tampil");
        if (!ulang) io.disconnect();
      } else if (ulang) el.classList.remove("ms-anim-jalan");
    }, { threshold: 0.15 });
    io.observe(el);
    return () => { io.disconnect(); el.classList.remove("ms-anim-siap", "ms-anim-tampil", "ms-anim-jalan"); };
  }, [anim, diam]);
  return <div ref={ref} data-anim={anim || undefined} className={`ms-anim ${className}`} style={style}>{children}</div>;
}
