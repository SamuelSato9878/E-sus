import { create, isAxiosError } from 'axios';
import { API_URL } from '../config/env';
import { tokenAtual } from './sessaoStorage';

/**
 * Cliente HTTP único do app. Todas as chamadas ao backend devem passar
 * por aqui, para herdar a URL base, o timeout, o token e o tratamento de erro.
 */
export const api = create({
  baseURL: API_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
});

// Envia o token da sessão (se houver) em todas as requisições.
api.interceptors.request.use((config) => {
  const token = tokenAtual();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let aoSessaoExpirar: (() => void) | null = null;

/** Registra o que fazer quando a API recusar o token (ex.: deslogar). */
export function definirAoSessaoExpirar(callback: (() => void) | null) {
  aoSessaoExpirar = callback;
}

// 401 numa requisição que levava token = sessão expirada/inválida.
// (Um 401 no próprio login, sem token, é só senha errada e não entra aqui.)
api.interceptors.response.use(undefined, (erro) => {
  if (
    isAxiosError(erro) &&
    erro.response?.status === 401 &&
    erro.config?.headers?.Authorization
  ) {
    aoSessaoExpirar?.();
  }
  return Promise.reject(erro);
});

/** Converte qualquer erro de requisição numa mensagem amigável para o usuário. */
export function mensagemDeErro(erro: unknown, padrao = 'Algo deu errado. Tente novamente.'): string {
  if (!isAxiosError(erro)) return padrao;

  if (erro.code === 'ECONNABORTED' || erro.code === 'ETIMEDOUT') {
    return 'O servidor demorou para responder. Tente novamente.';
  }
  if (!erro.response) {
    return 'Sem conexão com o servidor. Verifique sua internet.';
  }

  // Usa a mensagem do backend quando ele mandar uma.
  const dados = erro.response.data as { message?: unknown; mensagem?: unknown; error?: unknown };
  const doBackend = dados?.message ?? dados?.mensagem ?? dados?.error;
  if (typeof doBackend === 'string' && doBackend.trim()) return doBackend;

  if (erro.response.status >= 500) return 'Erro no servidor. Tente novamente mais tarde.';
  return padrao;
}
