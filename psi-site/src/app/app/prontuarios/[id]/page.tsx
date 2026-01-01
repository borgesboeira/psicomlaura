"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { makeId, useData } from "@/lib/data";
import type { Patient, SessionEntry } from "@/lib/mock";
import { Modal } from "@/components/Modal";

export default function Page() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data, upsertPatient, addSession, deleteSession } = useData();

  const patient = useMemo(
  () => data.patients.find((p) => p.id === id),
  [data.patients, id]
);
  const [tagInput, setTagInput] = useState("");
  const [qInput, setQInput] = useState("");
  const [oInput, setOInput] = useState("");

  const [openSessao, setOpenSessao] = useState(false);
  const [sessao, setSessao] = useState<SessionEntry>({
    id: makeId("sess"),
    dataISO: new Date().toISOString(),
    relato: "",
    intervencoes: "",
    observacoes: "",
  });

  if (!patient) {
  return (
    <div className="rounded-3xl sticker bg-white p-6">
      <p>Paciente não encontrado.</p>
      <button
        className="mt-3 rounded-full border px-4 py-2"
        onClick={() => router.push("/app/prontuarios")}
      >
        Voltar
      </button>
    </div>
  );
}
const p = patient; // daqui pra baixo, p é sempre Patient (nunca undefined)


function save(patch: Partial<Patient>) {
  upsertPatient({
    ...p,
    ...patch,
    id: p.id,
    nome: patch.nome ?? p.nome,
    tags: patch.tags ?? p.tags,
    queixas: patch.queixas ?? p.queixas,
    objetivos: patch.objetivos ?? p.objetivos,
    sessoes: patch.sessoes ?? p.sessoes,
    contatoEmergencia: patch.contatoEmergencia ?? p.contatoEmergencia,
  });
}


  return (
    <div>
      <div className="rounded-3xl sticker bg-[var(--rose-100)] p-5 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-[var(--font-display)] text-2xl">{patient.nome}</h1>
          <p className="text-sm text-black/60 mt-1">Prontuário (MVP local)</p>
        </div>
        <button className="rounded-full border px-4 py-2 font-semibold bg-white" onClick={() => router.push("/app/prontuarios")}>
          ← Voltar
        </button>
      </div>

      {/* Dados básicos */}
      <div className="mt-4 rounded-3xl sticker bg-white p-5">
        <h2 className="text-lg font-semibold">Dados básicos</h2>

        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field label="Data de nascimento" value={patient.dataNascimento ?? ""} onChange={(v) => save({ dataNascimento: v })} />
          <Field label="CPF" value={patient.cpf ?? ""} onChange={(v) => save({ cpf: v })} />
          <Field label="Endereço" value={patient.endereco ?? ""} onChange={(v) => save({ endereco: v })} />
          <Field label="Telefone" value={patient.telefone ?? ""} onChange={(v) => save({ telefone: v })} />
          <Field label="Profissão" value={patient.profissao ?? ""} onChange={(v) => save({ profissao: v })} />
          <Field label="Religião" value={patient.religiao ?? ""} onChange={(v) => save({ religiao: v })} />
        </div>

        <div className="mt-4">
          <h3 className="font-semibold">Contato de emergência</h3>
          <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-3">
            <Field
              label="Nome"
              value={patient.contatoEmergencia?.nome ?? ""}
              onChange={(v) => save({ contatoEmergencia: { nome: v, telefone: patient.contatoEmergencia?.telefone ?? "" } })}
            />
            <Field
              label="Telefone"
              value={patient.contatoEmergencia?.telefone ?? ""}
              onChange={(v) => save({ contatoEmergencia: { nome: patient.contatoEmergencia?.nome ?? "", telefone: v } })}
            />
          </div>
        </div>
      </div>

      {/* Tags */}
      <div className="mt-4 rounded-3xl sticker bg-[var(--blue-100)] p-5">
        <h2 className="text-lg font-semibold">Tags</h2>
        <div className="mt-2 flex flex-wrap gap-2">
          {patient.tags.map((t) => (
            <button
              key={t}
              className="px-3 py-1 rounded-full text-xs font-semibold bg-white border border-black/10"
              onClick={() => save({ tags: patient.tags.filter((x) => x !== t) })}
              title="Clique para remover"
            >
              {t} ✕
            </button>
          ))}
        </div>

        <div className="mt-3 flex gap-2">
          <input
            className="w-full rounded-2xl border px-4 py-3 bg-white"
            placeholder="Adicionar tag (ex: semanal, ativo, online...)"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                const v = tagInput.trim();
                if (!v) return;
                if (!patient.tags.includes(v)) save({ tags: [...patient.tags, v] });
                setTagInput("");
              }
            }}
          />
          <button
            className="rounded-full bg-[var(--coral)] text-white px-5 font-semibold"
            onClick={() => {
              const v = tagInput.trim();
              if (!v) return;
              if (!patient.tags.includes(v)) save({ tags: [...patient.tags, v] });
              setTagInput("");
            }}
          >
            Add
          </button>
        </div>
      </div>

      {/* Queixas / Objetivos */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <BlockList
          title="Queixas"
          bg="bg-[var(--peach-100)]"
          items={patient.queixas}
          input={qInput}
          setInput={setQInput}
          onAdd={(v) => save({ queixas: [v, ...patient.queixas] })}
          onRemove={(idx) => save({ queixas: patient.queixas.filter((_, i) => i !== idx) })}
        />
        <BlockList
          title="Objetivos"
          bg="bg-[var(--butter)]"
          items={patient.objetivos}
          input={oInput}
          setInput={setOInput}
          onAdd={(v) => save({ objetivos: [v, ...patient.objetivos] })}
          onRemove={(idx) => save({ objetivos: patient.objetivos.filter((_, i) => i !== idx) })}
        />
      </div>

      {/* Sessões */}
      <div className="mt-4 rounded-3xl sticker bg-white p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Sessões</h2>
          <button
            className="rounded-full bg-[var(--periwinkle)] px-5 py-2 font-semibold sticker"
            onClick={() => {
              setSessao({
                id: makeId("sess"),
                dataISO: new Date().toISOString(),
                relato: "",
                intervencoes: "",
                observacoes: "",
              });
              setOpenSessao(true);
            }}
          >
            + Nova sessão
          </button>
        </div>

        <div className="mt-3 space-y-3">
          {patient.sessoes.map((s) => (
            <div key={s.id} className="rounded-3xl border p-4 bg-[var(--rose-100)]">
              <div className="flex items-center justify-between gap-3">
                <div className="font-semibold">
                  {new Date(s.dataISO).toLocaleString("pt-BR")}
                </div>
                <button
                  className="rounded-full bg-black text-white px-4 py-1 text-sm font-semibold"
                  onClick={() => deleteSession(patient.id, s.id)}
                >
                  Excluir
                </button>
              </div>
              <div className="mt-2 grid gap-2 text-sm">
                <p><span className="font-semibold">Relato:</span> {s.relato || "—"}</p>
                <p><span className="font-semibold">Intervenções:</span> {s.intervencoes || "—"}</p>
                <p><span className="font-semibold">Observações:</span> {s.observacoes || "—"}</p>
              </div>
            </div>
          ))}
          {patient.sessoes.length === 0 && (
            <p className="text-sm text-black/60">Nenhuma sessão registrada ainda.</p>
          )}
        </div>
      </div>

      <Modal open={openSessao} title="Nova sessão" onClose={() => setOpenSessao(false)}>
        <div className="space-y-3">
          <div>
            <label className="text-sm font-semibold">Data</label>
            <input
              className="mt-1 w-full rounded-xl border px-3 py-2"
              type="datetime-local"
              value={toLocalInput(sessao.dataISO)}
              onChange={(e) =>
                setSessao((x) => ({ ...x, dataISO: new Date(e.target.value).toISOString() }))
              }
            />
          </div>

          <Area label="Relato" value={sessao.relato} onChange={(v) => setSessao((x) => ({ ...x, relato: v }))} />
          <Area label="Intervenções" value={sessao.intervencoes} onChange={(v) => setSessao((x) => ({ ...x, intervencoes: v }))} />
          <Area label="Observações" value={sessao.observacoes} onChange={(v) => setSessao((x) => ({ ...x, observacoes: v }))} />

          <div className="flex justify-end gap-2">
            <button className="rounded-full border px-4 py-2 font-semibold" onClick={() => setOpenSessao(false)}>
              Cancelar
            </button>
            <button
              className="rounded-full bg-[var(--coral)] text-white px-4 py-2 font-semibold"
              onClick={() => {
                addSession(patient.id, sessao);
                setOpenSessao(false);
              }}
            >
              Salvar
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="text-sm font-semibold">{label}</label>
      <input
        className="mt-1 w-full rounded-xl border px-3 py-2"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function Area({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="text-sm font-semibold">{label}</label>
      <textarea
        className="mt-1 w-full rounded-xl border px-3 py-2 min-h-[90px]"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function BlockList({
  title,
  bg,
  items,
  input,
  setInput,
  onAdd,
  onRemove,
}: {
  title: string;
  bg: string;
  items: string[];
  input: string;
  setInput: (v: string) => void;
  onAdd: (v: string) => void;
  onRemove: (idx: number) => void;
}) {
  return (
    <div className={`rounded-3xl sticker p-5 ${bg}`}>
      <h2 className="text-lg font-semibold">{title}</h2>

      <div className="mt-2 flex gap-2">
        <input
          className="w-full rounded-2xl border px-4 py-3 bg-white"
          placeholder={`Adicionar ${title.toLowerCase()}...`}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              const v = input.trim();
              if (!v) return;
              onAdd(v);
              setInput("");
            }
          }}
        />
        <button
          className="rounded-full bg-[var(--coral)] text-white px-5 font-semibold"
          onClick={() => {
            const v = input.trim();
            if (!v) return;
            onAdd(v);
            setInput("");
          }}
        >
          Add
        </button>
      </div>

      <div className="mt-3 space-y-2">
        {items.map((it, idx) => (
          <div key={`${it}-${idx}`} className="flex items-center justify-between gap-2 rounded-2xl bg-white border px-3 py-2">
            <div className="text-sm">{it}</div>
            <button className="text-sm font-semibold" onClick={() => onRemove(idx)}>
              ✕
            </button>
          </div>
        ))}
        {items.length === 0 && (
          <p className="text-sm text-black/60">Nada ainda.</p>
        )}
      </div>
    </div>
  );
}

function toLocalInput(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
