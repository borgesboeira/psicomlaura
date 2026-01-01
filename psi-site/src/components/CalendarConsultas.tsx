"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Calendar, dateFnsLocalizer, type View } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/Modal";
import { makeId, useData } from "@/lib/data";
import type { Appointment, Patient } from "@/lib/mock";

const locales = { "pt-BR": ptBR };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 0 }),
  getDay,
  locales,
});

type RBCEvent = {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: { appointmentId: string; patientId: string };
};

function toDateInputValue(d: Date) {
  // yyyy-MM-ddTHH:mm
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

function parseDateInputValue(v: string) {
  return new Date(v);
}

export default function CalendarConsultas() {
  const { data, upsertAppointment, deleteAppointment } = useData();
  const router = useRouter();

  const [view, setView] = useState<View>("month");
  const [open, setOpen] = useState(false);

  const [editing, setEditing] = useState<Appointment | null>(null);

const [openHelp, setOpenHelp] = useState(false);

const wrapRef = useRef<HTMLDivElement | null>(null);

useEffect(() => {
  function onKeyDown(e: KeyboardEvent) {
    const el = document.activeElement as HTMLElement | null;

    // se estiver digitando em input/textarea/select, não dispara atalhos
    const tag = el?.tagName?.toLowerCase();
    const isTyping =
      tag === "input" ||
      tag === "textarea" ||
      tag === "select" ||
      (el?.isContentEditable ?? false);

    if (isTyping) return;

    const k = e.key.toLowerCase();

    if (k === "m") {
      e.preventDefault();
      setView("month");
    } else if (k === "s") {
      e.preventDefault();
      setView("week");
    } else if (k === "d") {
      e.preventDefault();
      setView("day");
      } else if (k === "a") {
  e.preventDefault();
  setView("agenda");
    } else if (k === "?") {
      e.preventDefault();
      setOpenHelp(true);
    }
  }

  // passive:false garante que preventDefault funciona
  window.addEventListener("keydown", onKeyDown, { passive: false });
  return () => window.removeEventListener("keydown", onKeyDown);
}, []);


  const patientsById = useMemo(() => {
    const m = new Map<string, Patient>();
    data.patients.forEach((p) => m.set(p.id, p));
    return m;
  }, [data.patients]);

  const events: RBCEvent[] = useMemo(() => {
    return data.appointments.map((a) => {
      const p = patientsById.get(a.patientId);
      const title = p ? p.nome : a.patientId;
      return {
        id: a.id,
        title,
        start: new Date(a.inicioISO),
        end: new Date(a.fimISO),
        resource: { appointmentId: a.id, patientId: a.patientId },
      };
    });
  }, [data.appointments, patientsById]);

  function newDraft(slotStart?: Date, slotEnd?: Date): Appointment {
    const start = slotStart ?? new Date();
    const end = slotEnd ?? new Date(start.getTime() + 50 * 60 * 1000);
    return {
      id: makeId("apt"),
      patientId: data.patients[0]?.id ?? "novo-paciente",
      inicioISO: start.toISOString(),
      fimISO: end.toISOString(),
      modalidade: "online",
      status: "agendada",
      pagamento: "nao_pago",
      valor: 0,
      observacao: "",
    };
  }

  function openCreateFromSlot(start: Date, end: Date) {
    setEditing(newDraft(start, end));
    setOpen(true);
  }

  function openEditFromEvent(appointmentId: string) {
    const a = data.appointments.find((x) => x.id === appointmentId) ?? null;
    setEditing(a);
    setOpen(true);
  }

  function save() {
    if (!editing) return;
    upsertAppointment(editing);
    setOpen(false);
  }

  const RBCToolbar = (props: any) => {
  const { label, onNavigate } = props;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
      {/* Navegação (setas + Hoje) */}
      <div className="sticker rounded-3xl bg-white px-4 py-3 flex items-center gap-2">
        <button
          type="button"
          className="chip w-10 h-10 grid place-items-center text-lg"
          onClick={() => onNavigate("PREV")}
          aria-label="Anterior"
          title="Anterior"
        >
          ‹
        </button>

        <button
          type="button"
          className="chip px-4 py-2"
          onClick={() => onNavigate("TODAY")}
          aria-label="Voltar para hoje"
          title="Voltar para hoje"
        >
          Hoje
        </button>

        <button
          type="button"
          className="chip w-10 h-10 grid place-items-center text-lg"
          onClick={() => onNavigate("NEXT")}
          aria-label="Próximo"
          title="Próximo"
        >
          ›
        </button>

        <span className="ml-2 text-sm font-semibold opacity-80">{label}</span>
      </div>

      {/* Ação principal */}
      <button
        type="button"
        className="sticker rounded-3xl bg-(--periwinkle) px-4 py-3 font-semibold"
        onClick={() => {
          setEditing(newDraft());
          setOpen(true);
        }}
      >
        + Nova consulta
      </button>
    </div>
  );
};
const ViewDock = () => {
  const Btn = ({ v, t, title }: { v: View; t: string; title: string }) => (
    <button
      type="button"
      className={`w-12 h-12 rounded-full border-2 font-extrabold grid place-items-center transition
        ${view === v ? "bg-(--coral) text-white border-black/10" : "bg-white border-black/10"}
      `}
      onClick={() => setView(v)}
      aria-label={title}
      title={title}
    >
      {t}
    </button>
  );

  return (
    <div className="fixed right-4 bottom-4 md:right-6 md:top-1/2 md:-translate-y-1/2 md:bottom-auto z-30">
      <div className="sticker bg-white p-2 flex flex-col gap-2">
        <Btn v="month" t="M" title="Mês (tecla M)" />
        <Btn v="week" t="S" title="Semana (tecla S)" />
        <Btn v="day" t="D" title="Dia (tecla D)" />
        <Btn v="agenda" t="A" title="Agenda (tecla A)" />
      </div>
    </div>
  );
};

  return (
  <div
    ref={wrapRef}
    tabIndex={0}
    onMouseDown={() => wrapRef.current?.focus()}
    className="outline-none"
  >
      <div className="rounded-3xl sticker bg-(--rose-100) p-5">
        <div className="flex items-start justify-between gap-3">
  <div>
    <h1 className="text-2xl font-semibold">Calendário de Consultas</h1>
  </div>

  <button
    type="button"
    className="chip w-9 h-9 grid place-items-center"
    title="Ajuda"
    aria-label="Ajuda"
    onClick={() => setOpenHelp(true)}
  >
    ?
  </button>
</div>

      </div>

      <div className="mt-4">
        <div className="sticker rounded-3xl bg-white p-3">
          <Calendar
  localizer={localizer}
  events={events}
  startAccessor="start"
  endAccessor="end"
  style={{ height: 650 }}
  view={view}
  onView={(v) => setView(v)}
  views={["month", "week", "day", "agenda"]}
  components={{ toolbar: RBCToolbar }}
            selectable
            onSelectSlot={(slot) => openCreateFromSlot(slot.start, slot.end)}
            onSelectEvent={(e) => openEditFromEvent(e.resource.appointmentId)}
            messages={{
              next: "Próx",
              previous: "Ant",
              today: "Hoje",
              month: "Mês",
              week: "Semana",
              day: "Dia",
              agenda: "Agenda",
            }}
            eventPropGetter={(event) => {
  const a = data.appointments.find((x) => x.id === event.id);
  const bg = a?.modalidade === "presencial" ? "var(--butter)" : "var(--blue-100)";

  return {
    style: {
      backgroundColor: bg,
      color: "var(--text)",
      border: "2px solid rgba(44,44,52,0.12)",
      borderRadius: "14px",
      boxShadow: "0 3px 0 rgba(44,44,52,0.06)",
      padding: "2px 8px",
    },
  };
}}
          />
        </div>
      </div>

<ViewDock />

      <Modal
        open={open}
        title={editing ? "Consulta" : "Consulta"}
        onClose={() => setOpen(false)}
      >
        {!editing ? null : (
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-semibold">Paciente</label>
                <select
                  className="mt-1 w-full rounded-xl border px-3 py-2"
                  value={editing.patientId}
                  onChange={(e) =>
                    setEditing({ ...editing, patientId: e.target.value })
                  }
                >
                  {data.patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-semibold">Modalidade</label>
                <select
                  className="mt-1 w-full rounded-xl border px-3 py-2"
                  value={editing.modalidade}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      modalidade: e.target.value as Appointment["modalidade"],
                    })
                  }
                >
                  <option value="online">Online</option>
                  <option value="presencial">Presencial</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-semibold">Início</label>
                <input
                  className="mt-1 w-full rounded-xl border px-3 py-2"
                  type="datetime-local"
                  value={toDateInputValue(new Date(editing.inicioISO))}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      inicioISO: parseDateInputValue(e.target.value).toISOString(),
                    })
                  }
                />
              </div>

              <div>
                <label className="text-sm font-semibold">Fim</label>
                <input
                  className="mt-1 w-full rounded-xl border px-3 py-2"
                  type="datetime-local"
                  value={toDateInputValue(new Date(editing.fimISO))}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      fimISO: parseDateInputValue(e.target.value).toISOString(),
                    })
                  }
                />
              </div>

              <div>
                <label className="text-sm font-semibold">Status</label>
                <select
                  className="mt-1 w-full rounded-xl border px-3 py-2"
                  value={editing.status}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      status: e.target.value as Appointment["status"],
                    })
                  }
                >
                  <option value="agendada">Agendada</option>
                  <option value="atendida">Atendida</option>
                  <option value="reagendada">Reagendada</option>
                  <option value="cancelada">Cancelada</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-semibold">Pagamento</label>
                <select
                  className="mt-1 w-full rounded-xl border px-3 py-2"
                  value={editing.pagamento}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      pagamento: e.target.value as Appointment["pagamento"],
                    })
                  }
                >
                  <option value="nao_pago">Não pago</option>
                  <option value="pago">Pago</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-semibold">Valor (R$)</label>
                <input
                  className="mt-1 w-full rounded-xl border px-3 py-2"
                  type="number"
                  value={editing.valor ?? 0}
                  onChange={(e) =>
                    setEditing({ ...editing, valor: Number(e.target.value) })
                  }
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-sm font-semibold">Observação</label>
                <input
                  className="mt-1 w-full rounded-xl border px-3 py-2"
                  value={editing.observacao ?? ""}
                  onChange={(e) =>
                    setEditing({ ...editing, observacao: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2 justify-between pt-2">
              <button
                className="rounded-full border px-4 py-2 font-semibold"
                onClick={() => {
                  router.push(`/app/prontuarios/${editing.patientId}`);
                  setOpen(false);
                }}
              >
                Abrir prontuário
              </button>

              <div className="flex gap-2">
                <button
                  className="rounded-full border px-4 py-2 font-semibold"
                  onClick={() => setOpen(false)}
                >
                  Cancelar
                </button>
                <button
                  className="rounded-full bg-(--coral) text-white px-4 py-2 font-semibold"
                  onClick={save}
                >
                  Salvar
                </button>
                <button
                  className="rounded-full bg-black text-white px-4 py-2 font-semibold"
                  onClick={() => {
                    deleteAppointment(editing.id);
                    setOpen(false);
                  }}
                >
                  Excluir
                </button>
              </div>
            </div>
          </div>
        )}
            </Modal>

      {/* Modal de Ajuda (fica fora do modal de consulta) */}
      <Modal
        open={openHelp}
        title="Como usar o calendário"
        onClose={() => setOpenHelp(false)}
      >
        <div className="space-y-2 text-sm">
          <p>• Clique em um horário vazio para criar uma consulta.</p>
          <p>• Clique em uma consulta para editar ou abrir o prontuário.</p>
        </div>
      </Modal>
    </div>
  );
}

