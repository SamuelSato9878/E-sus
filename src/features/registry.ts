import type { EntityConfig } from "../components/EntityPage";

const active = (value: unknown) => (value ? "Ativo" : "Inativo");
const roleLabel = (value: unknown) =>
  value === "ADMIN" ? "Administrador" : "Paciente";
export const entities: Record<string, EntityConfig> = {
  specialties: {
    title: "Especialidades",
    description: "Gerencie as áreas médicas oferecidas pela clínica.",
    endpoint: "/specialties/",
    columns: [
      { key: "name", label: "Especialidade" },
      { key: "description", label: "Descrição" },
      {
        key: "professional_ids",
        label: "Profissionais",
        render: (v) => String(Array.isArray(v) ? v.length : 0),
      },
      { key: "is_active", label: "Situação", render: active },
    ],
    fields: [
      { key: "name", label: "Nome", required: true },
      { key: "description", label: "Descrição", type: "textarea" },
      { key: "is_active", label: "Ativo", type: "checkbox", updateOnly: true },
    ],
  },
  professionals: {
    title: "Profissionais",
    description: "Cadastre profissionais e vincule suas especialidades.",
    endpoint: "/professionals/",
    columns: [
      { key: "name", label: "Nome" },
      {
        key: "council_type",
        label: "Conselho",
        render: (_, r) =>
          [
            r.council_type,
            r.council_number &&
              `${r.council_number}${r.council_state ? `/${r.council_state}` : ""}`,
          ]
            .filter(Boolean)
            .join(" ") || "—",
      },
      { key: "phone", label: "Telefone" },
      {
        key: "specialty_ids",
        label: "Especialidades",
        render: (v) => String(Array.isArray(v) ? v.length : 0),
      },
      { key: "is_active", label: "Situação", render: active },
    ],
    fields: [
      { key: "name", label: "Nome", required: true },
      { key: "phone", label: "Telefone (opcional)", type: "tel" },
      { key: "council_type", label: "Tipo de conselho (opcional)" },
      { key: "council_number", label: "Número do conselho (opcional)" },
      { key: "council_state", label: "UF", required: true, max: 2 },
      {
        key: "specialty_ids",
        label: "Especialidades",
        type: "checkboxes",
        numeric: true,
        source: { url: "/specialties/", label: "name" },
      },
      { key: "is_active", label: "Ativo", type: "checkbox", updateOnly: true },
    ],
  },
  services: {
    title: "Serviços",
    description: "Configure os serviços, duração e profissionais habilitados.",
    endpoint: "/services/",
    columns: [
      { key: "name", label: "Serviço" },
      { key: "duration_minutes", label: "Duração", render: (v) => `${v} min` },
      { key: "buffer_minutes", label: "Intervalo", render: (v) => `${v} min` },
      { key: "specialty_id", label: "Especialidade" },
      { key: "is_active", label: "Situação", render: active },
    ],
    fields: [
      { key: "name", label: "Nome", required: true },
      { key: "description", label: "Descrição", type: "textarea" },
      {
        key: "duration_minutes",
        label: "Duração (minutos)",
        type: "number",
        required: true,
        min: 1,
      },
      {
        key: "buffer_minutes",
        label: "Intervalo (minutos)",
        type: "number",
        min: 0,
      },
      {
        key: "specialty_id",
        label: "Especialidade",
        type: "select",
        numeric: true,
        required: true,
        source: { url: "/specialties/", label: "name" },
      },
      {
        key: "professional_ids",
        label: "Profissionais habilitados",
        type: "checkboxes",
        numeric: true,
        source: { url: "/professionals/", label: "name" },
      },
      { key: "is_active", label: "Ativo", type: "checkbox", updateOnly: true },
    ],
  },
  patients: {
    title: "Pacientes",
    description:
      "Consulte e atualize perfis de pacientes vinculados a usuários existentes.",
    notice:
      "O cadastro cria somente o perfil do paciente e exige um user_id já existente. A API não cria uma identidade ou senha no Supabase.",
    endpoint: "/patients/",
    columns: [
      { key: "user_name", label: "Paciente" },
      { key: "email", label: "E-mail" },
      { key: "phone", label: "Telefone" },
      { key: "cpf", label: "CPF" },
      { key: "is_active", label: "Situação", render: active },
    ],
    fields: [
      {
        key: "user_id",
        label: "ID do usuário vinculado",
        type: "number",
        required: true,
        min: 1,
        createOnly: true,
      },
      { key: "phone", label: "Telefone (opcional)", type: "tel" },
      {
        key: "cpf",
        label: "CPF",
        required: true,
        placeholder: "Somente números",
      },
      {
        key: "birth_date",
        label: "Data de nascimento",
        type: "date",
        required: true,
      },
      { key: "address", label: "Endereço", type: "textarea" },
      { key: "sex", label: "Sexo" },
      { key: "is_active", label: "Ativo", type: "checkbox", updateOnly: true },
    ],
  },
  users: {
    title: "Administradores",
    description: "Cadastre e gerencie as contas administrativas do painel.",
    notice:
      "Pacientes são cadastrados pelo aplicativo. A senha é usada somente para criar a identidade no Supabase e não é armazenada pelo painel.",
    endpoint: "/users/",
    createEndpoint: "/users/admins",
    updateMethod: "put",
    delete: true,
    filterRows: (row) => row.role === "ADMIN",
    columns: [
      { key: "user_name", label: "Nome" },
      { key: "email", label: "E-mail" },
      { key: "role", label: "Papel", render: roleLabel },
    ],
    fields: [
      { key: "user_name", label: "Nome", required: true },
      { key: "email", label: "E-mail", type: "email", required: true },
      {
        key: "password",
        label: "Senha",
        type: "password",
        required: true,
        createOnly: true,
        minLength: 8,
      },
    ],
  },
};
