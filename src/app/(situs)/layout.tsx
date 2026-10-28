import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

export default function SitusLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 pb-16">{children}</main>
      <Footer />
    </div>
  );
}