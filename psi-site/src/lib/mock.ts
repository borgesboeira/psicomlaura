export type Tag = string;

export type SessionEntry = {
  id: string;
  dataISO: string;
  relato: string;
  intervencoes: string;
  observacoes: string;
};

export type Patient = {
  id: string;
  nome: string;

  dataNascimento?: string;
  cpf?: string;
  endereco?: string;
  telefone?: string;
  profissao?: string;
  religiao?: string;

  contatoEmergencia?: { nome: string; telefone: string };

  tags: Tag[];
  queixas: string[];
  objetivos: string[];
  sessoes: SessionEntry[];
};

export type Appointment = {
  id: string;
  patientId: string;
  inicioISO: string;
  fimISO: string;

  modalidade: "online" | "presencial";
  status: "agendada" | "atendida" | "reagendada" | "cancelada";
  pagamento: "pago" | "nao_pago";
  valor?: number;

  observacao?: string;
};

export type ContentItem = {
  id: string;
  inicioISO: string;
  fimISO: string;
  plataforma: "Instagram" | "TikTok" | "YouTube" | "Outro";
  tema: string;
  status: "ideia" | "roteiro" | "gravado" | "postado";
};

export type AppData = {
  version: number;
  patients: Patient[];
  appointments: Appointment[];
  contentItems: ContentItem[];
};

export const seedData: AppData = {
  version: 1,
  patients: [
    {
      id: "ana-souza",
      nome: "Ana Souza",
      tags: ["online", "semanal", "ativo"],
      queixas: ["ansiedade"],
      objetivos: ["regulação emocional", "rotina de sono"],
      sessoes: [],
    },
    {
      id: "bruno-lima",
      nome: "Bruno Lima",
      tags: ["presencial", "quinzenal", "ativo"],
      queixas: [],
      objetivos: [],
      sessoes: [],
    },
  ],
  appointments: [],
  contentItems: [],
};
