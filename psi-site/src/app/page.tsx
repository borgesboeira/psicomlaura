"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useData } from "@/lib/data";

export default function Page() {
  const { data } = useData();
  const [q, setQ] = useState("");

  const items = useMemo(() => {
    const qq = q.trim().toLowerCase();
    return [...data.patients]
      .filter((p) => (qq ? p.nome.toLowerCase().includes(qq) : true))
      .sort((a, b) => a.nome.localeCompare(b.nome));
  }, [data.patients, q]);

  return (
    <div>
      <div className="rounded-3xl sticker bg-[var(--pink)] p-5">
        <h1 className="font-[var(--font-display)] text-2xl">Prontuários</h1>
        <p className="text-sm text-black/60 mt-1">
          Clique em um paciente para abrir o prontuário.
        </p>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <input
          className="w-full rounded-2xl border px-4 py-3"
          placeholder="Buscar paciente..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        {items.map((p) => (
          <Link
            key={p.id}
            href={`/app/prontuarios/${p.id}`}
            className="rounded-3xl sticker bg-white p-5 hover:bg-[var(--rose-100)] transition"
          >
            <div className="text-lg font-semibold">{p.nome}</div>
            <div className="mt-2 flex flex-wrap gap-2">
              {p.tags.slice(0, 6).map((t) => (
                <span
                  key={t}
                  className="px-3 py-1 rounded-full text-xs font-semibold bg-[var(--blue-100)] border border-black/10"
                >
                  {t}
                </span>
              ))}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
