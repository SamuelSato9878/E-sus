export type Role = "ADMIN" | "PATIENT";
export interface User {
  id: number;
  user_name: string;
  email: string;
  role: Role;
  supabase_user_id?: string;
}
export interface Specialty {
  id: number;
  name: string;
  description: string | null;
  is_active: boolean;
  professional_ids: number[];
}
export interface Professional {
  id: number;
  name: string;
  phone: string | null;
  council_number: string | null;
  council_type: string | null;
  council_state: string;
  is_active: boolean;
  specialty_ids: number[];
  service_ids: number[];
}
export interface MedicalService {
  id: number;
  name: string;
  description: string | null;
  duration_minutes: number;
  buffer_minutes: number;
  specialty_id: number;
  professional_ids: number[];
  is_active: boolean;
}
export interface Patient {
  id: number;
  user_id: number;
  user_name: string;
  email: string;
  phone: string;
  cpf: string;
  birth_date: string;
  address: string | null;
  sex: string | null;
  is_active: boolean;
}
export interface Appointment {
  id: number;
  patient_id: number;
  patient_name: string;
  professional_id: number;
  professional_name: string;
  service_id: number;
  service_name: string;
  start_at: string;
  end_at: string;
  status: "SCHEDULED" | "CANCELLED" | "COMPLETED";
}
export interface Schedule {
  id: number;
  professional_id: number;
  valid_from: string;
  valid_until: string | null;
  timezone_name: string;
  is_active: boolean;
  days: ScheduleDay[];
}
export interface ScheduleDay {
  id: number;
  weekday: number;
  is_active: boolean;
  periods: { id: number; start_time: string; end_time: string }[];
}
export interface NotificationRule {
  id: number;
  event_type: string;
  is_enabled: boolean;
  title_template: string;
  body_template: string;
  reminder_minutes_before: number | null;
}
