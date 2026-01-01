"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Calendar, dateFnsLocalizer, type View } from "react-big-calendar";
import {
  addMinutes,
  format,
  parse,
  startOfWeek,
  getDay,
  startOfDay,
  endOfDay,
  isSameDay,
} from "date-fns";
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

const APPT_MINUTES = 50;

function toDateInputValue(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

function parseDateInputValue(v: string) {
  return new Date(v);
}

function roundTo15(d: Date) {
  const ms = 15 * 60 * 1000;
  return new Date(Math.floor(d.getTime() / ms) * ms);
}

function computeEnd(start: Date) {
  return addMinutes(start, APPT_MINUTES);
}

const formats = {
  dayHeaderFormat: (date: Date, culture: any, localizer: any) =>
    localizer.format(date, "dd 'de' MMMM yyyy", culture),

  dayRangeHeaderFormat: ({ start, end }: any, culture: any, localizer: any) =>
    `${localizer.format(start, "dd/MM/yyyy", culture)} – ${localizer.format(end, "dd/MM/yyyy", culture)}`,

  agendaDateFormat: (date: Date, culture: any, localizer: any) =>
    localizer.format(date, "dd/MM/yyyy", culture),

  agendaTimeFormat: (date: Date, culture: any, localizer: any) =>
    localizer.format(date, "HH:mm", culture),

  agendaHeaderFormat: ({ start, end }: any, culture: any, localizer: any) =>
    `${localizer.format(start, "dd/MM/yyyy", culture)} – ${localizer.format(end, "dd/MM/yyyy", culture)}`,

  monthHeaderFormat: (date: Date, culture: any, localizer: any) =>
    localizer.format(date, "MMMM yyyy", culture),
};


export default function CalendarConsultas() {
  // ✅ inclui upsertPatient para criar paciente novo
  const { data, upsertAppointment, deleteAppointment, upsertPatient } = useData();
  const router = useRouter();

  const [view, setView] = useState<View>("month");

  const [openEdit, setOpenEdit] = useState(false);
  const [editing, setEditing] = useState<Appointment | null>(null);

  const [openHelp, setOpenHelp] = useState(false);

  // ✅ resumo do dia
  const [openDay, setOpenDay] = useState(false);
  const [dayRef, setDayRef] = useState<Date>(new Date());

  // ✅ criar paciente dentro da consulta
  const [newPatientMode, setNewPatientMode] = useState(false);
  const [newPatientName, setNewPatientName] = useState("");
  const [newPatientError, setNewPatientError] = useState<string | null>(null);

  const wrapRef = useRef<HTMLDivElement | null>(null);

  // atalhos do teclado: M/S/D/A e ?
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const el = document.activeElement as HTMLElement | null;

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
      } else if (k === "h") {
        // opcional: "H" = Hoje
        // não interfere no texto, mas é útil
      }
    }

    window.addEventListener("keydown", onKeyDown, { passive: false });
    return () => window.removeEventListener("keydown", onKeyDown as any);
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

  function newDraft(slotStart?: Date): Appointment {
    const start = roundTo15(slotStart ?? new Date());
    const end = computeEnd(start);

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

  function openCreateFromSlot(start: Date) {
    setNewPatientMode(false);
    setNewPatientName("");
    setNewPatientError(null);

    setEditing(newDraft(start));
    setOpenEdit(true);
  }

  function openEditFromEvent(appointmentId: string) {
    setNewPatientMode(false);
    setNewPatientName("");
    setNewPatientError(null);

    const a = data.appointments.find((x) => x.id === appointmentId) ?? null;
    setEditing(a);
    setOpenEdit(true);
  }

  function openDaySummary(day: Date) {
    setDayRef(day);
    setOpenDay(true);
  }

  const dayAppointments = useMemo(() => {
    const d = dayRef;
    return data.appointments
      .filter((a) => isSameDay(new Date(a.inicioISO), d))
      .sort((a, b) => new Date(a.inicioISO).getTime() - new Date(b.inicioISO).getTime());
  }, [data.appointments, dayRef]);

  function createPatientIfNeeded(): string | null {
    if (!newPatientMode) return editing?.patientId ?? null;

    const name = newPatientName.trim();
    if (!name) {
      setNewPatientError("Digite o nome do paciente.");
      return null;
    }

    const id = makeId("pat");

    // paciente “mínimo”, com arrays vazios
    const patient: Patient = {
      id,
      nome: name,
      tags: [],
      queixas: [],
      objetivos: [],
      sessoes: [],
      // se seu tipo tiver mais campos opcionais, tudo bem deixar de fora
      // (ou você pode adicionar strings vazias aqui, se preferir)
      contatoEmergencia: { nome: "", telefone: "" },
    } as Patient;

    upsertPatient(patient);
    return id;
  }

  function save() {
    if (!editing) return;

    const patientId = createPatientIfNeeded();
    if (!patientId) return;

    const start = roundTo15(new Date(editing.inicioISO));
    const end = computeEnd(start);

    upsertAppointment({
      ...editing,
      patientId,
      inicioISO: start.toISOString(),
      fimISO: end.toISOString(),
    });

    setOpenEdit(false);
    setNewPatientMode(false);
    setNewPatientName("");
    setNewPatientError(null);
  }

  // Toolbar do RBC (só navegação com setas + hoje + label)
  const RBCToolbar = (props: any) => {
    const { label, onNavigate } = props;

    return (
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div className="sticker rounded-3xl bg-white px-4 py-3 flex items-center gap-2">
          <button
            className="btn btn-secondary"
            type="button"
            onClick={() => onNavigate("PREV")}
            aria-label="Anterior"
            title="Anterior"
          >
            ←
          </button>

          <button
            className="btn btn-secondary"
            type="button"
            onClick={() => onNavigate("TODAY")}
            aria-label="Hoje"
            title="Hoje"
          >
            Hoje
          </button>

          <button
            className="btn btn-secondary"
            type="button"
            onClick={() => onNavigate("NEXT")}
            aria-label="Próximo"
            title="Próximo"
          >
            →
          </button>

          <span className="ml-2 text-sm font-semibold opacity-80">{label}</span>
        </div>

        <button
          type="button"
          className="sticker rounded-3xl bg-(--periwinkle) px-4 py-3 font-semibold"
          onClick={() => {
            setEditing(newDraft(new Date()));
            setOpenEdit(true);
          }}
        >
          + Nova consulta
        </button>
      </div>
    );
  };

  // Dock vertical de views (direita, fora do retângulo)
  const ViewDock = () => {
    const ViewBtn = ({ v, t }: { v: View; t: string }) => (
      <button
        type="button"
        className={`w-10 h-10 grid place-items-center rounded-2xl border-2 text-sm font-semibold sticker ${
          view === v ? "bg-(--coral) text-white border-black/10" : "bg-white border-black/10"
        }`}
        onClick={() => setView(v)}
        aria-label={`Visão ${t}`}
        title={`Visão ${t}`}
      >
        {t}
      </button>
    );

    return (
      <div className="hidden md:flex flex-col gap-2 sticky top-28">
        <ViewBtn v="month" t="M" />
        <ViewBtn v="week" t="S" />
        <ViewBtn v="day" t="D" />
        <ViewBtn v="agenda" t="A" />
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

      {/* CALENDÁRIO + DOCK À DIREITA */}
      <div className="mt-4 flex items-start gap-4">
        <div className="sticker rounded-3xl bg-white p-3 flex-1">
          <Calendar
          culture="pt-BR"
          formats={formats}
  step={30}
  timeslots={1}
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
            onSelectSlot={(slot) => {
              // ✅ no mês: abre resumo do dia
              if (view === "month") {
                openDaySummary(slot.start);
                return;
              }
              // ✅ week/day/agenda: cria consulta
              openCreateFromSlot(slot.start);
            }}
            onSelectEvent={(e) => {
              // ✅ no mês: abre resumo do dia
              if (view === "month") {
                openDaySummary(e.start);
                return;
              }
              // ✅ week/day/agenda: edita direto
              openEditFromEvent(e.resource.appointmentId);
            }}
            messages={{
              next: "Próx",
              previous: "Ant",
              today: "Hoje",
              month: "Mês",
              week: "Semana",
              day: "Dia",
              agenda: "Agenda",
              noEventsInRange: "Você ainda não adicionou nenhuma consulta.",
              showMore: (total) => `+${total} mais`,
            }}
            eventPropGetter={(event) => {
              const a = data.appointments.find((x) => x.id === event.id);
              const bg =
                a?.modalidade === "presencial" ? "var(--butter)" : "var(--blue-100)";

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

        <ViewDock />
      </div>

      {/* RESUMO DO DIA */}
      <Modal
        open={openDay}
        title={`Resumo — ${format(dayRef, "dd/MM/yyyy", { locale: ptBR })}`}
        onClose={() => setOpenDay(false)}
      >
        <div className="space-y-3">
          {dayAppointments.length === 0 ? (
            <p className="text-sm opacity-70">Nenhuma consulta neste dia.</p>
          ) : (
            <div className="space-y-2">
              {dayAppointments.map((a) => {
                const p = patientsById.get(a.patientId);
                const nome = p?.nome ?? a.patientId;
                const ini = new Date(a.inicioISO);
                const fim = new Date(a.fimISO);

                return (
                  <div
                    key={a.id}
                    className="sticker rounded-3xl bg-white border p-3 flex items-center justify-between gap-3"
                  >
                    <div>
                      <div className="font-semibold">
                        {format(ini, "HH:mm")}–{format(fim, "HH:mm")} • {nome}
                      </div>
                      <div className="text-sm opacity-70">
                        {a.modalidade} • {a.status} • {a.pagamento}
                      </div>
                    </div>

                    <button
                      className="btn btn-secondary"
                      type="button"
                      onClick={() => {
                        setOpenDay(false);
                        openEditFromEvent(a.id);
                      }}
                    >
                      Editar
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              className="btn btn-secondary"
              type="button"
              onClick={() => setOpenDay(false)}
            >
              Fechar
            </button>

            <button
              className="btn btn-primary"
              type="button"
              onClick={() => {
                // cria uma consulta “no dia” (09:00)
                const d = new Date(dayRef);
                d.setHours(9, 0, 0, 0);
                setOpenDay(false);
                openCreateFromSlot(d);
              }}
            >
              + Nova consulta nesse dia
            </button>
          </div>
        </div>
      </Modal>

      {/* MODAL EDITAR/CRIAR CONSULTA */}
      <Modal
        open={openEdit}
        title="Consulta"
        onClose={() => setOpenEdit(false)}
      >
        {!editing ? null : (
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* PACIENTE + NOVO PACIENTE */}
              <div className="md:col-span-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold">Paciente</label>

                  <button
                    type="button"
                    className="text-sm font-semibold underline"
                    onClick={() => {
                      setNewPatientError(null);
                      setNewPatientMode((v) => !v);
                    }}
                  >
                    {newPatientMode ? "Cancelar novo paciente" : "Novo paciente"}
                  </button>
                </div>

                {!newPatientMode ? (
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
                ) : (
                  <div className="mt-2 space-y-2">
                    <input
                      className="w-full rounded-xl border px-3 py-2"
                      placeholder="Nome do paciente"
                      value={newPatientName}
                      onChange={(e) => {
                        setNewPatientName(e.target.value);
                        setNewPatientError(null);
                      }}
                    />
                    {newPatientError ? (
                      <p className="text-sm text-red-600">{newPatientError}</p>
                    ) : (
                      <p className="text-xs opacity-70">
                        Ao salvar a consulta, este paciente será criado automaticamente
                        (prontuário em branco).
                      </p>
                    )}
                  </div>
                )}
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

              {/* INÍCIO (fim é automático) */}
              <div>
                <label className="text-sm font-semibold">Início</label>
                <input
                  className="mt-1 w-full rounded-xl border px-3 py-2"
                  type="datetime-local"
                  step={900} // ✅ 15min = 900s
                  value={toDateInputValue(new Date(editing.inicioISO))}
                  onChange={(e) => {
                    const start = roundTo15(parseDateInputValue(e.target.value));
                    const end = computeEnd(start);
                    setEditing({
                      ...editing,
                      inicioISO: start.toISOString(),
                      fimISO: end.toISOString(),
                    });
                  }}
                />
                <div className="mt-1 text-xs opacity-70">
                  Duração fixa: {APPT_MINUTES} min — termina às{" "}
                  <span className="font-semibold">
                    {format(new Date(editing.fimISO), "HH:mm")}
                  </span>
                </div>
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
                  setOpenEdit(false);
                }}
              >
                Abrir prontuário
              </button>

              <div className="flex gap-2">
                <button
                  className="rounded-full border px-4 py-2 font-semibold"
                  onClick={() => setOpenEdit(false)}
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
                    setOpenEdit(false);
                  }}
                >
                  Excluir
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* AJUDA */}
      <Modal
        open={openHelp}
        title="Como usar o calendário"
        onClose={() => setOpenHelp(false)}
      >
        <div className="space-y-2 text-sm">
          <p>• No mês: clique em um dia para ver o resumo.</p>
          <p>• Na semana/dia: clique em um horário vazio para criar.</p>
          <p>• Clique numa consulta para editar.</p>
          <p>• Atalhos: M (mês), S (semana), D (dia), A (agenda), ? (ajuda).</p>
        </div>
      </Modal>
    </div>
  );
}
