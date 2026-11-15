import { api } from './api';

export type AuthTokens = {
  access_token: string | null;
  refresh_token: string | null;
  user_id: string;
  email: string | null;
  message?: string | null;
  user?: Usuario;
};

export type Usuario = {
  id: number;
  supabase_user_id: string;
  user_name: string;
  email: string;
  role: 'PATIENT' | 'ADMIN' | 'PROFESSIONAL';
};

function normalizarEmail(email: string) {
  return email.trim().toLowerCase();
}

export async function cadastrar(user_name: string, email: string, password: string) {
  const response = await api.post<AuthTokens>('/auth/signup', {
    user_name: user_name.trim(),
    email: normalizarEmail(email),
    password,
  });
  return response.data;
}

export async function login(email: string, password: string) {
  const response = await api.post<AuthTokens>('/auth/login', {
    email: normalizarEmail(email),
    password,
  });
  return response.data;
}

export async function buscarUsuarioAtual() {
  const response = await api.get<Usuario>('/auth/me');
  return response.data;
}

export async function encerrarSessao() {
  await api.post('/auth/logout');
}

export async function solicitarRecuperacaoSenha(email: string) {
  await api.post('/auth/recover', { email: normalizarEmail(email) });
}

export async function redefinirSenha(access_token: string, refresh_token: string, password: string) {
  await api.post('/auth/password', { access_token, refresh_token, password });
}
