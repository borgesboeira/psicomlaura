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

export default function CalendarConteudo() {
  const { data, upsertContentItem, deleteContentItem } = useData();
  const [view, setView] = useState<View>("month");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ContentItem | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);

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
        <h1 className="font-(--font-display) text-2xl">
          Calendário de Conteúdos
        </h1>
        <p className="text-sm text-black/60 mt-1">
          Planejamento editorial (Instagram/TikTok etc.) com visão M/S/D.
        </p>
      </div>

      <div className="mt-3 sticker rounded-3xl bg-white p-3">
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
