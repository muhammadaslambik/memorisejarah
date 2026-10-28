import Link from "next/link";

// Bingkai bergaya krem: dipakai panel admin dan halaman daftar.
export function PanelShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="bg-charcoal text-cream">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
          <Link href="/" className="font-serif text-2xl tracking-wide text-gold">Memori Sejarah</Link>
          <nav className="flex gap-6 text-sm"><Link href="/">Beranda</Link><Link href="/admin">Admin</Link></nav>
        </div>
      </header>
      <main className="flex-1 pb-16">{children}</main>
      <footer className="bg-charcoal py-8 text-center text-sm text-cream/60">
        &copy; {new Date().getFullYear()} Memori Sejarah
      </footer>
    </div>
  );
}