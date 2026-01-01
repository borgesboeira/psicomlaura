"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { readJson, writeJson } from "@/lib/storage";
import type { AppData, Appointment, ContentItem, Patient, SessionEntry } from "@/lib/mock";
import { seedData } from "@/lib/mock";

const KEY = "psi-site:data:v1";

type DataAPI = {
  data: AppData;
  setData: React.Dispatch<React.SetStateAction<AppData>>;

  upsertPatient: (p: Patient) => void;
  deletePatient: (patientId: string) => void;

  upsertAppointment: (a: Appointment) => void;
  deleteAppointment: (appointmentId: string) => void;

  upsertContentItem: (c: ContentItem) => void;
  deleteContentItem: (contentId: string) => void;

  addSession: (patientId: string, s: SessionEntry) => void;
  updateSession: (patientId: string, s: SessionEntry) => void;
  deleteSession: (patientId: string, sessionId: string) => void;
};

const Ctx = createContext<DataAPI | null>(null);

function uid(prefix = "id") {
  return `${prefix}-${Math.random().toString(16).slice(2)}-${Date.now().toString(16)}`;
}

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<AppData>(seedData);

  useEffect(() => {
    const stored = readJson<AppData>(KEY);
    if (stored && stored.version === seedData.version) setData(stored);
  }, []);

  useEffect(() => {
    writeJson(KEY, data);
  }, [data]);

  const api: DataAPI = useMemo(() => {
    const upsertPatient = (p: Patient) => {
      setData((d) => {
        const exists = d.patients.some((x) => x.id === p.id);
        const patients = exists
          ? d.patients.map((x) => (x.id === p.id ? p : x))
          : [...d.patients, p];
        return { ...d, patients };
      });
    };

    const deletePatient = (patientId: string) => {
      setData((d) => ({
        ...d,
        patients: d.patients.filter((p) => p.id !== patientId),
        appointments: d.appointments.filter((a) => a.patientId !== patientId),
      }));
    };

    const upsertAppointment = (a: Appointment) => {
      setData((d) => {
        const exists = d.appointments.some((x) => x.id === a.id);
        const appointments = exists
          ? d.appointments.map((x) => (x.id === a.id ? a : x))
          : [...d.appointments, a];
        return { ...d, appointments };
      });
    };

    const deleteAppointment = (appointmentId: string) => {
      setData((d) => ({
        ...d,
        appointments: d.appointments.filter((a) => a.id !== appointmentId),
      }));
    };

    const upsertContentItem = (c: ContentItem) => {
      setData((d) => {
        const exists = d.contentItems.some((x) => x.id === c.id);
        const contentItems = exists
          ? d.contentItems.map((x) => (x.id === c.id ? c : x))
          : [...d.contentItems, c];
        return { ...d, contentItems };
      });
    };

    const deleteContentItem = (contentId: string) => {
      setData((d) => ({
        ...d,
        contentItems: d.contentItems.filter((c) => c.id !== contentId),
      }));
    };

    const addSession = (patientId: string, s: SessionEntry) => {
      setData((d) => ({
        ...d,
        patients: d.patients.map((p) =>
          p.id === patientId ? { ...p, sessoes: [s, ...p.sessoes] } : p
        ),
      }));
    };

    const updateSession = (patientId: string, s: SessionEntry) => {
      setData((d) => ({
        ...d,
        patients: d.patients.map((p) =>
          p.id === patientId
            ? { ...p, sessoes: p.sessoes.map((x) => (x.id === s.id ? s : x)) }
            : p
        ),
      }));
    };

    const deleteSession = (patientId: string, sessionId: string) => {
      setData((d) => ({
        ...d,
        patients: d.patients.map((p) =>
          p.id === patientId
            ? { ...p, sessoes: p.sessoes.filter((x) => x.id !== sessionId) }
            : p
        ),
      }));
    };

    return {
      data,
      setData,
      upsertPatient,
      deletePatient,
      upsertAppointment,
      deleteAppointment,
      upsertContentItem,
      deleteContentItem,
      addSession,
      updateSession,
      deleteSession,
    };
  }, [data]);

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function useData() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useData deve ser usado dentro de <DataProvider/>");
  return v;
}

export function makeId(prefix?: string) {
  return uid(prefix);
}
