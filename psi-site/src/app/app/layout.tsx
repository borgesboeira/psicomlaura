import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import AppShell from "@/components/AppShell";
import { AUTH_COOKIE } from "@/lib/auth";
import { DataProvider } from "@/lib/data";

export default async function Layout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const ok = cookieStore.get(AUTH_COOKIE)?.value === "1";
  if (!ok) redirect("/login");

  return (
    <DataProvider>
      <AppShell>{children}</AppShell>
    </DataProvider>
  );
}
