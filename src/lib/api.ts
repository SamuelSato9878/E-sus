import axios from "axios";
import { supabase } from "./supabase";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use(async (config) => {
  const { data } = (await supabase?.auth.getSession()) ?? {
    data: { session: null },
  };
  const token = data.session?.access_token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && original && !original._retried) {
      original._retried = true;
      const { data } = (await supabase?.auth.refreshSession()) ?? {
        data: { session: null },
      };
      if (data.session?.access_token) {
        original.headers.Authorization = `Bearer ${data.session.access_token}`;
        return api(original);
      }
      await supabase?.auth.signOut();
      window.dispatchEvent(new Event("admin-session-expired"));
    }
    return Promise.reject(error);
  },
);

export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const detail = error.response?.data?.detail;
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail))
      return detail
        .map((item) => `${item.loc?.slice(-1)[0] ?? "Campo"}: ${item.msg}`)
        .join(" · ");
    if (!error.response)
      return "Não foi possível conectar à API. Confira a URL e o CORS do backend.";
  }
  return error instanceof Error ? error.message : "Ocorreu um erro inesperado.";
}
