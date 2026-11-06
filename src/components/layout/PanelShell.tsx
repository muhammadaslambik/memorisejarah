// PAKET-14A: bingkai halaman masuk CMS dan daftar memakai header dan footer situs yang baru (tema gelap/terang, logo)
import { Header } from "./Header";
import { Footer } from "./Footer";

export function PanelShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-ms-bg">
      <Header />
      <main className="flex-1 pb-16">{children}</main>
      <Footer />
    </div>
  );
}
