"use client";

import { useMemo } from "react";
import { useData } from "@/lib/data";

export default function Page() {
  const { data } = useData();

  const rows = useMemo(() => {
    return data.patients
      .map((p) => {
        const ap = data.appointments.filter((a) => a.patientId === p.id);
        const pagos = ap.filter((a) => a.pagamento === "pago");
        const naoPagos = ap.filter((a) => a.pagamento === "nao_pago");
        const totalPago = pagos.reduce((acc, a) => acc + (a.valor ?? 0), 0);
        const totalAberto = naoPagos.reduce((acc, a) => acc + (a.valor ?? 0), 0);

        return {
          id: p.id,
          nome: p.nome,
          consultas: ap.length,
          pagos: pagos.length,
          naoPagos: naoPagos.length,
          totalPago,
          totalAberto,
        };
      })
      .sort((a, b) => a.nome.localeCompare(b.nome));
  }, [data.patients, data.appointments]);

  return (
    <div>
      <div className="rounded-3xl sticker bg-[var(--butter)] p-5">
        <h1 className="font-[var(--font-display)] text-2xl">Finanças</h1>
        <p className="text-sm text-black/60 mt-1">
          Resumo por paciente (MVP local). Depois ligamos no Firestore.
        </p>
      </div>

      <div className="mt-4 rounded-3xl sticker bg-white p-4 overflow-x-auto">
        <table className="min-w-[850px] w-full text-sm">
          <thead>
            <tr className="text-left">
              <th className="py-2">Paciente</th>
              <th className="py-2">Consultas</th>
              <th className="py-2">Pagas</th>
              <th className="py-2">Em aberto</th>
              <th className="py-2">Total pago</th>
              <th className="py-2">Total aberto</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="py-2 font-semibold">{r.nome}</td>
                <td className="py-2">{r.consultas}</td>
                <td className="py-2">{r.pagos}</td>
                <td className="py-2">{r.naoPagos}</td>
                <td className="py-2">R$ {r.totalPago.toFixed(2)}</td>
                <td className="py-2">R$ {r.totalAberto.toFixed(2)}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td className="py-3 text-black/60" colSpan={6}>
                  Sem dados ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
