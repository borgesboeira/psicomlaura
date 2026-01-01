"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AUTH_COOKIE } from "@/lib/auth";

function NavPill({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={[
        "px-4 py-2 rounded-full border-2 text-sm font-semibold transition",
        active
          ? "bg-(--coral) text-white border-black/10"
          : "bg-white hover:bg-(--rose-100) border-black/10",
      ].join(" ")}
    >
      {label}
    </Link>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  function sair() {
    document.cookie = `${AUTH_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
    router.push("/");
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 bg-(--bg)/90 backdrop-blur border-b border-black/10">
        <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between gap-4">
          <div>
            <div className="font-(--font-display) text-xl leading-none">
              Psi • Maria Laura
            </div>
            <div className="text-xs text-black/60">
              painel da psicóloga (MVP local)
            </div>
          </div>

          <nav className="flex flex-wrap items-center gap-2 justify-end">
            <NavPill
              href="/app/calendario"
              label="Consultas"
              active={pathname.startsWith("/app/calendario")}
            />
            <NavPill
              href="/app/prontuarios"
              label="Prontuários"
              active={pathname.startsWith("/app/prontuarios")}
            />
            <NavPill
              href="/app/financas"
              label="Finanças"
              active={pathname.startsWith("/app/financas")}
            />
            <NavPill
              href="/app/conteudos"
              label="Conteúdos"
              active={pathname.startsWith("/app/conteudos")}
            />
            <button
              onClick={sair}
              className="px-3 py-2 rounded-full border-2 border-black/10 bg-(--butter) font-semibold text-sm"
            >
              Sair
            </button>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}
