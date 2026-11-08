import type { Metadata } from "next";
import { Playfair_Display, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { KeteranganSeragam } from "@/components/KeteranganSeragam";

const serif = Playfair_Display({ subsets: ["latin"], variable: "--font-serif" });
const sans = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: { default: "Memori Sejarah", template: "%s | Memori Sejarah" },
  description: "Menelusuri jejak masa lalu, merawat ingatan bangsa.",
  icons: { icon: "/brand/logo-memori-sejarah-kecil.png", apple: "/brand/logo-memori-sejarah-kecil.png" },
};

// PAKET-12C: menerapkan pilihan mode gelap/terang sebelum halaman tampil (tanpa berkedip)
const SKRIP_TEMA = `try{if(localStorage.getItem("ms-tema")==="terang")document.documentElement.dataset.tema="terang"}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={`${serif.variable} ${sans.variable}`} suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: SKRIP_TEMA }} /></head>
      <body suppressHydrationWarning>{children}<KeteranganSeragam /></body>
    </html>
  );
}