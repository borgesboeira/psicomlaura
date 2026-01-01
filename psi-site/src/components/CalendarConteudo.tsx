"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Calendar, dateFnsLocalizer, type View } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Modal } from "@/components/Modal";
import { makeId, useData } from "@/lib/data";
import type { ContentItem } from "@/lib/mock";

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
  resource: { contentId: string };
};

function toDateInputValue(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

type Task = { id: string; text: string; done: boolean };

const LS_NOTES_KEY = "psi_conteudos_notes";
const LS_TASKS_KEY = "psi_conteudos_tasks";


export default function CalendarConteudo() {
  const { data, upsertContentItem, deleteContentItem } = useData();
  const [view, setView] = useState<View>("month");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ContentItem | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);

    // ===== Notas / Tarefas (salvas) =====
  const [openNotes, setOpenNotes] = useState(false);
  const [tab, setTab] = useState<"notes" | "tasks">("notes");

  const [notes, setNotes] = useState("");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [taskText, setTaskText] = useState("");

useEffect(() => {
  function onKeyDown(e: KeyboardEvent) {
    const el = document.activeElement as HTMLElement | null;

    // só funciona quando o calendário está "ativo" (foco dentro do wrapper)
    if (wrapRef.current && el && !wrapRef.current.contains(el)) return;

    // se estiver digitando em input/textarea/select ou contenteditable, ignora
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
    }

      // Carrega do localStorage quando abre a página
  useEffect(() => {
    try {
      const n = localStorage.getItem(LS_NOTES_KEY);
      if (n) setNotes(n);

      const t = localStorage.getItem(LS_TASKS_KEY);
      if (t) setTasks(JSON.parse(t));
    } catch {}
  }, []);

  // Salva notas sempre que mudar
  useEffect(() => {
    try {
      localStorage.setItem(LS_NOTES_KEY, notes);
    } catch {}
  }, [notes]);

  // Salva tarefas sempre que mudar
  useEffect(() => {
    try {
      localStorage.setItem(LS_TASKS_KEY, JSON.stringify(tasks));
    } catch {}
  }, [tasks]);

  }

  window.addEventListener("keydown", onKeyDown, { passive: false });
  return () => window.removeEventListener("keydown", onKeyDown);
}, []);


  const events: RBCEvent[] = useMemo(() => {
    return data.contentItems.map((c) => ({
      id: c.id,
      title: `${c.plataforma}: ${c.tema}`,
      start: new Date(c.inicioISO),
      end: new Date(c.fimISO),
      resource: { contentId: c.id },
    }));
  }, [data.contentItems]);

  function newDraft(start?: Date, end?: Date): ContentItem {
    const s = start ?? new Date();
    const e = end ?? new Date(s.getTime() + 60 * 60 * 1000);
    return {
      id: makeId("cnt"),
      inicioISO: s.toISOString(),
      fimISO: e.toISOString(),
      plataforma: "Instagram",
      tema: "Ideia de post",
      status: "ideia",
    };
  }

  function save() {
    if (!editing) return;
    upsertContentItem(editing);
    setOpen(false);
  }

  function addTask() {
    const text = taskText.trim();
    if (!text) return;
    setTasks((prev) => [{ id: makeId("tsk"), text, done: false }, ...prev]);
    setTaskText("");
  }

  function toggleTask(id: string) {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  }

  function removeTask(id: string) {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }

  function clearDone() {
    setTasks((prev) => prev.filter((t) => !t.done));
  }


const RBCToolbar = (props: any) => {
  const { label, onNavigate } = props;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
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

      <button
        type="button"
        className="sticker rounded-3xl bg-(--pink) px-4 py-3 font-semibold"
        onClick={() => {
          setEditing(newDraft());
          setOpen(true);
        }}
      >
        + Novo conteúdo
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
    <div className="fixed right-6 top-1/2 -translate-y-1/2 z-30">
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
      <div className="rounded-3xl sticker bg-(--blue-100) p-5">
  <div className="flex items-start justify-between gap-3">
    <div>
      <h1 className="font-(--font-display) text-2xl">
        Calendário de Conteúdos
      </h1>
      <p className="text-sm text-black/60 mt-1">
        Planejamento editorial (Instagram/TikTok etc.) com visão M/S/D/A.
      </p>
    </div>

    <button
      type="button"
      className="chip w-10 h-10 grid place-items-center"
      title="Notas / Tarefas"
      aria-label="Notas / Tarefas"
      onClick={() => setOpenNotes(true)}
    >
      📝
    </button>
  </div>
</div>

      <div className="mt-3 sticker rounded-3xl bg-white p-3">
        <Calendar
  culture="pt-BR"
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
            setEditing(newDraft(slot.start, slot.end));
            setOpen(true);
          }}
          onSelectEvent={(e) => {
            const found = data.contentItems.find((x) => x.id === e.id) ?? null;
            setEditing(found);
            setOpen(true);
          }}
          messages={{
  next: "",
  previous: "",
  today: "",
  month: "",
  week: "",
  day: "",
  agenda: "",
}}

        />
      </div>

<Modal
  open={openNotes}
  title="Notas e Tarefas (Conteúdos)"
  onClose={() => setOpenNotes(false)}
>
  <div className="flex gap-2 mb-3">
    <button
      type="button"
      className={`px-4 py-2 rounded-full border-2 text-sm font-semibold transition ${
        tab === "notes"
          ? "bg-(--coral) text-white border-black/10"
          : "bg-white border-black/10"
      }`}
      onClick={() => setTab("notes")}
    >
      Notas
    </button>

    <button
      type="button"
      className={`px-4 py-2 rounded-full border-2 text-sm font-semibold transition ${
        tab === "tasks"
          ? "bg-(--coral) text-white border-black/10"
          : "bg-white border-black/10"
      }`}
      onClick={() => setTab("tasks")}
    >
      Tarefas
    </button>

    {tab === "tasks" && (
      <button
        type="button"
        className="ml-auto px-4 py-2 rounded-full border-2 text-sm font-semibold transition bg-white border-black/10"
        onClick={clearDone}
      >
        Limpar concluídas
      </button>
    )}
  </div>

  {tab === "notes" ? (
    <div className="space-y-2">
      <label className="text-sm font-semibold">Bloco de notas</label>
      <textarea
        className="w-full rounded-2xl border-2 border-black/10 p-3 min-h-55"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Escreva aqui… (fica salvo neste navegador)"
      />
      <p className="text-xs opacity-70">
        Salvo automaticamente neste navegador (localStorage).
      </p>
    </div>
  ) : (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input
          className="w-full rounded-2xl border-2 border-black/10 px-3 py-2"
          value={taskText}
          onChange={(e) => setTaskText(e.target.value)}
          placeholder="Nova tarefa…"
          onKeyDown={(e) => {
            if (e.key === "Enter") addTask();
          }}
        />
        <button
          type="button"
          className="px-4 py-2 rounded-full border-2 text-sm font-semibold transition bg-(--coral) text-white border-black/10"
          onClick={addTask}
        >
          Adicionar
        </button>
      </div>

      <div className="space-y-2">
        {tasks.length === 0 ? (
          <p className="text-sm opacity-70">Sem tarefas ainda.</p>
        ) : (
          tasks.map((t) => (
            <div key={t.id} className="sticker bg-white px-4 py-3 flex items-center gap-3">
              <input
                type="checkbox"
                checked={t.done}
                onChange={() => toggleTask(t.id)}
                className="w-5 h-5"
              />
              <div className={`flex-1 ${t.done ? "line-through opacity-60" : ""}`}>
                {t.text}
              </div>
              <button
                type="button"
                className="px-3 py-1 rounded-full border-2 text-sm font-semibold bg-white border-black/10"
                onClick={() => removeTask(t.id)}
                aria-label="Excluir tarefa"
                title="Excluir tarefa"
              >
                ✕
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )}
</Modal>

<ViewDock />


      <Modal
        open={open}
        title="Conteúdo"
        onClose={() => setOpen(false)}
      >
        {!editing ? null : (
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-semibold">Plataforma</label>
                <select
                  className="mt-1 w-full rounded-xl border px-3 py-2"
                  value={editing.plataforma}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      plataforma: e.target.value as ContentItem["plataforma"],
                    })
                  }
                >
                  <option>Instagram</option>
                  <option>TikTok</option>
                  <option>YouTube</option>
                  <option>Outro</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-semibold">Status</label>
                <select
                  className="mt-1 w-full rounded-xl border px-3 py-2"
                  value={editing.status}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      status: e.target.value as ContentItem["status"],
                    })
                  }
                >
                  <option value="ideia">Ideia</option>
                  <option value="roteiro">Roteiro</option>
                  <option value="gravado">Gravado</option>
                  <option value="postado">Postado</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-semibold">Início</label>
                <input
                  className="mt-1 w-full rounded-xl border px-3 py-2"
                  type="datetime-local"
  step={1800}  // 1800s = 30 min
                  value={toDateInputValue(new Date(editing.inicioISO))}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      inicioISO: new Date(e.target.value).toISOString(),
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
                      fimISO: new Date(e.target.value).toISOString(),
                    })
                  }
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-sm font-semibold">Tema</label>
                <input
                  className="mt-1 w-full rounded-xl border px-3 py-2"
                  value={editing.tema}
                  onChange={(e) => setEditing({ ...editing, tema: e.target.value })}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
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
                  deleteContentItem(editing.id);
                  setOpen(false);
                }}
              >
                Excluir
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
