import { AppShell } from "@/components/app-shell";
import { requireSession } from "@/lib/session";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const actor = await requireSession();

  return <AppShell actor={actor}>{children}</AppShell>;
}
