"use client";

import { useMemo, useState } from "react";
import { useData } from "@/lib/data";
import { Modal } from "@/components/Modal";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Page() {
  const { data, upsertAppointment } = useData();
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);

  // Busca os dados do paciente selecionado para o Modal
  const selectedPatient = useMemo(() => {
    if (!selectedPatientId) return null;
    const patient = data.patients.find((p) => p.id === selectedPatientId);
    const appointments = data.appointments
      .filter((a) => a.patientId === selectedPatientId)
      .sort((a, b) => b.inicioISO.localeCompare(a.inicioISO)); // Mais recentes primeiro

    return { ...patient, appointments };
  }, [selectedPatientId, data.patients, data.appointments]);

  const rows = useMemo(() => {
    return data.patients
      .map((p) => {
        const ap = data.appointments.filter((a) => a.patientId === p.id);
        const pagos = ap.filter((a) => a.pagamento === "pago");
        const naoPagos = ap.filter((a) => a.pagamento === "nao_pago");
        
        const totalPago = pagos.reduce((acc, a) => acc + (a.valor ?? 0), 0);
        const totalAberto = naoPagos.reduce((acc, a) => acc + (a.valor ?? 0), 0);

        // Pega o valor da última consulta como base (ou 0 se não houver)
        const valorPorConsulta = ap.length > 0 ? (ap[0].valor ?? 0) : 0;

        return {
          id: p.id,
          nome: p.nome,
          consultas: ap.length,
          pagos: pagos.length,
          naoPagos: naoPagos.length,
          totalPago,
          totalAberto,
          valorPorConsulta,
        };
      })
      .sort((a, b) => a.nome.localeCompare(b.nome));
  }, [data.patients, data.appointments]);

  const togglePayment = (appointmentId: string) => {
    const appt = data.appointments.find(a => a.id === appointmentId);
    if (!appt) return;

    upsertAppointment({
      ...appt,
      pagamento: appt.pagamento === "pago" ? "nao_pago" : "pago"
    });
  };

  return (
    <div>
      <div className="rounded-3xl sticker bg-[var(--butter)] p-5">
        <h1 className="font-[var(--font-display)] text-2xl">Finanças</h1>
        <p className="text-sm text-black/60 mt-1">
          Gestão de pagamentos e histórico por paciente.
        </p>
      </div>

      <div className="mt-4 rounded-3xl sticker bg-white p-4 overflow-x-auto">
        <table className="min-w-[850px] w-full text-sm">
          <thead>
            <tr className="text-left">
              <th className="py-2">Paciente</th>
              <th className="py-2">Valor/Sessão</th>
              <th className="py-2 text-center">Consultas</th>
              <th className="py-2">Pagas</th>
              <th className="py-2">Em aberto</th>
              <th className="py-2 text-right">Total pago</th>
              <th className="py-2 text-right px-4">Total aberto</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t hover:bg-black/[0.02] transition-colors">
                <td className="py-3">
                  <button 
                    onClick={() => setSelectedPatientId(r.id)}
                    className="font-bold text-(--coral) hover:underline text-left"
                  >
                    {r.nome}
                  </button>
                </td>
                <td className="py-3 text-black/60">R$ {r.valorPorConsulta.toFixed(2)}</td>
                <td className="py-3 text-center">{r.consultas}</td>
                <td className="py-3 text-green-600 font-medium">{r.pagos}</td>
                <td className="py-3 text-red-500 font-medium">{r.naoPagos}</td>
                <td className="py-3 text-right">R$ {r.totalPago.toFixed(2)}</td>
                <td className="py-3 text-right font-bold px-4">R$ {r.totalAberto.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal de Detalhes do Paciente */}
      <Modal 
        open={!!selectedPatientId} 
        onClose={() => setSelectedPatientId(null)}
        title={`Histórico Financeiro: ${selectedPatient?.nome}`}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-green-50 border border-green-100">
              <p className="text-xs text-green-600 uppercase font-bold">Total Pago</p>
              <p className="text-xl font-bold text-green-700">
                R$ {selectedPatient?.appointments
                  .filter(a => a.pagamento === "pago")
                  .reduce((acc, a) => acc + (a.valor ?? 0), 0).toFixed(2)}
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-red-50 border border-red-100">
              <p className="text-xs text-red-600 uppercase font-bold">Em Aberto</p>
              <p className="text-xl font-bold text-red-700">
                R$ {selectedPatient?.appointments
                  .filter(a => a.pagamento === "nao_pago")
                  .reduce((acc, a) => acc + (a.valor ?? 0), 0).toFixed(2)}
              </p>
            </div>
          </div>

          <div className="max-h-[400px] overflow-y-auto border-t pt-4">
            <h3 className="font-bold mb-3">Histórico de Sessões</h3>
            {selectedPatient?.appointments.length === 0 ? (
              <p className="text-black/40 text-sm">Nenhuma sessão registrada.</p>
            ) : (
              <div className="space-y-2">
                {selectedPatient?.appointments.map((appt) => (
                  <div key={appt.id} className="flex items-center justify-between p-3 rounded-xl border bg-gray-50/50">
                    <div>
                      <p className="font-semibold">
                        {format(parseISO(appt.inicioISO), "dd 'de' MMMM", { locale: ptBR })}
                      </p>
                      <p className="text-xs text-black/50 uppercase">{appt.status} • {appt.modalidade}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-mono font-bold">R$ {(appt.valor ?? 0).toFixed(2)}</span>
                      <button
                        onClick={() => togglePayment(appt.id)}
                        className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                          appt.pagamento === "pago" 
                            ? "bg-green-100 text-green-700 border border-green-200" 
                            : "bg-red-100 text-red-700 border border-red-200 hover:bg-red-200"
                        }`}
                      >
                        {appt.pagamento === "pago" ? "PAGO" : "MARCAR PAGO"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}