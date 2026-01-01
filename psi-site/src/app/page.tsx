import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen">
      {/* Topbar */}
      <header className="mx-auto max-w-6xl px-6 pt-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="sticker w-10 h-10 bg-(--periwinkle) grid place-items-center font-bold">
            Ψ
          </div>
          <div>
            <div className="font-semibold">Psi • Maria Laura</div>
            <div className="text-sm opacity-70">psicóloga</div>
          </div>
        </div>

        <Link className="btn btn-secondary" href="/login">
          Login
        </Link>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 mt-8">
        <div className="sticker bg-(--rose-100) p-8 relative overflow-hidden">
          <div className="chip mb-4" style={{ background: "var(--butter)" }}>
            <span style={{ fontFamily: "var(--font-script)" }} className="text-base">
              acolhimento + ciência + leveza ✨
            </span>
          </div>

          <h1
            className="text-4xl md:text-6xl leading-[1.05]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Cuidado emocional com leveza,
            <span className="block" style={{ color: "var(--coral)" }}>
              ciência e acolhimento.
            </span>
          </h1>

          <p className="mt-4 text-base md:text-lg max-w-2xl opacity-80">
            Site público para pacientes + painel privado para a psicóloga (agenda, prontuários, finanças e calendário de conteúdos).
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link className="btn btn-primary" href="/login">
              Entrar no painel
            </Link>
            <Link className="btn btn-secondary" href="/app/calendario">
              Ver calendário (após login)
            </Link>
          </div>
        </div>
      </section>

      {/* Cards */}
      <section className="mx-auto max-w-6xl px-6 mt-6 grid gap-4 md:grid-cols-3 pb-16">
        <Card title="Agenda" color="var(--blue-100)" desc="Visão mensal/semanal/diária com consultas e status." />
        <Card title="Prontuários" color="var(--peach-100)" desc="Dados, tags, queixas/objetivos e sessões com modelo pronto." />
        <Card title="Conteúdos" color="var(--butter)" desc="Calendário editorial para Instagram/TikTok com etapas." />
      </section>
    </main>
  );
}

function Card({ title, desc, color }: { title: string; desc: string; color: string }) {
  return (
    <div className="sticker p-6" style={{ background: color }}>
      <h2 className="text-xl font-semibold" style={{ fontFamily: "var(--font-display)" }}>
        {title}
      </h2>
      <p className="mt-2 opacity-80">{desc}</p>
    </div>
  );
}
