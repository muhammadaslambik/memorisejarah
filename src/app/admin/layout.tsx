import { PanelShell } from "@/components/layout/PanelShell";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <PanelShell>{children}</PanelShell>;
}