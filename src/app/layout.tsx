import type { Metadata } from "next";
import Link from "next/link";
import { Playfair_Display, Inter } from "next/font/google";
import "./globals.css";

const serif = Playfair_Display({ subsets: ["latin"], variable: "--font-serif" });
const sans = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: { default: "Memori Sejarah", template: "%s | Memori Sejarah" },
  description: "Menelusuri jejak masa lalu, merawat ingatan bangsa.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={`${serif.variable} ${sans.variable}`}>
      <body className="flex min-h-screen flex-col" suppressHydrationWarning>
        <header className="bg-charcoal text-cream">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
            <Link href="/" className="font-serif text-2xl tracking-wide text-gold">Memori Sejarah</Link>
            <nav className="flex gap-6 text-sm"><Link href="/">Beranda</Link><Link href="/admin">Admin</Link></nav>
          </div>
        </header>
        <main className="flex-1 pb-16">{children}</main>
        <footer className="bg-charcoal py-8 text-center text-sm text-cream/60">
          © {new Date().getFullYear()} Memori Sejarah
        </footer>
      </body>
    </html>
  );
}
