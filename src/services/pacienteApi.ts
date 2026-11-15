import { api } from './api';

export type PerfilPaciente = {
  id: number;
  user_id: number;
  user_name: string;
  email: string;
  phone: string | null;
  cpf: string | null;
  birth_date: string | null;
  address: string | null;
  sex: string | null;
  is_active: boolean;
};

export type DadosPerfilPaciente = Pick<PerfilPaciente, 'phone' | 'cpf' | 'birth_date'> &
  Partial<Pick<PerfilPaciente, 'address' | 'sex'>>;

export type Especialidade = { id: number; name: string; description: string | null; is_active: boolean; professional_ids: number[] };
export type Servico = { id: number; name: string; description: string | null; duration_minutes: number; buffer_minutes: number; specialty_id: number; professional_ids: number[]; is_active: boolean };
export type Profissional = { id: number; name: string; phone: string; council_number: string; council_type: string; council_state: string; is_active: boolean; specialty_ids: number[]; service_ids: number[] };
export type JanelaDisponivel = { start_at: string; end_at: string };
export type Consulta = { id: number; verification_code: string; patient_id: number; patient_name: string; professional_id: number; professional_name: string; service_id: number; service_name: string; start_at: string; end_at: string; status: 'SCHEDULED' | 'CANCELLED' | 'COMPLETED'; created_at: string; updated_at: string };
export type ConsultaDetalhe = Consulta & { history: { id: number; action: string; previous_start_at: string | null; previous_end_at: string | null; new_start_at: string | null; new_end_at: string | null; previous_status: string | null; new_status: string | null; reason: string | null; created_at: string }[] };
export type Notificacao = { id: number; appointment_id: number | null; event_type: string; title: string; body: string; available_at: string; read_at: string | null; created_at: string };

export const buscarPerfil = async () => (await api.get<PerfilPaciente>('/patients/me')).data;
export const criarPerfil = async (dados: DadosPerfilPaciente) => (await api.post<PerfilPaciente>('/patients/me', dados)).data;
export const atualizarPerfil = async (dados: Partial<DadosPerfilPaciente>) => (await api.patch<PerfilPaciente>('/patients/me', dados)).data;
export const listarEspecialidades = async () => (await api.get<Especialidade[]>('/specialties/')).data;
export const listarServicos = async () => (await api.get<Servico[]>('/services/')).data;
export const listarProfissionais = async () => (await api.get<Profissional[]>('/professionals/')).data;
export const buscarDias = async (professionalId: number, serviceId: number, start: string, end: string) =>
  (await api.get<string[]>('/availability/days', { params: { professional_id: professionalId, service_id: serviceId, start, end } })).data;
export const buscarJanelas = async (professionalId: number, serviceId: number, date: string) =>
  (await api.get<{ windows: JanelaDisponivel[] }>('/availability/windows', { params: { professional_id: professionalId, service_id: serviceId, date } })).data.windows;
export const criarConsulta = async (professionalId: number, serviceId: number, startAt: string) =>
  (await api.post<Consulta>('/appointments/', { professional_id: professionalId, service_id: serviceId, start_at: startAt })).data;
export const listarConsultas = async (historico = false) =>
  (await api.get<Consulta[]>(historico ? '/appointments/me/history' : '/appointments/me/upcoming')).data;
export const buscarConsulta = async (id: number) => (await api.get<ConsultaDetalhe>(`/appointments/${id}`)).data;
export const cancelarConsulta = async (id: number, reason?: string) =>
  (await api.post<Consulta>(`/appointments/${id}/cancel`, { reason: reason || null })).data;
export const remarcarConsulta = async (id: number, startAt: string, reason?: string) =>
  (await api.post<Consulta>(`/appointments/${id}/reschedule`, { start_at: startAt, reason: reason || null })).data;
export const listarNotificacoes = async (unreadOnly = false) =>
  (await api.get<Notificacao[]>('/notifications/me', { params: { unread_only: unreadOnly } })).data;
export const marcarNotificacaoLida = async (id: number) =>
  (await api.patch<Notificacao>(`/notifications/${id}/read`)).data;
