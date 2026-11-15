import { create, isAxiosError, type InternalAxiosRequestConfig } from 'axios';
import { API_URL } from '../config/env';
import { atualizarAccessToken, limparSessao, refreshTokenAtual, tokenAtual } from './sessaoStorage';


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
api.interceptors.request.use(async (config) => {
  if (['/auth/login', '/auth/signup', '/auth/refresh'].includes(config.url ?? '')) return config;
  const token = await tokenAtual();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
  
let aoSessaoExpirar: (() => void) | null = null;

/** Registra o que fazer quando a API recusar o token (ex.: deslogar). */
export function definirAoSessaoExpirar(callback: (() => void | Promise<void>) | null) {
  aoSessaoExpirar = callback;
}

let refreshEmAndamento: Promise<string | null> | null = null;

type TokensRenovados = { access_token: string; refresh_token: string };

async function renovarAccessToken(): Promise<string | null> {
  const refreshToken = await refreshTokenAtual();
  if (!refreshToken) return null;
  const response = await api.post<TokensRenovados>('/auth/refresh', { refresh_token: refreshToken });
  await atualizarAccessToken(response.data.access_token, response.data.refresh_token);
  return response.data.access_token;
}

// 401 numa requisição que levava token = sessão expirada/inválida.
// (Um 401 no próprio login, sem token, é só senha errada e não entra aqui.)
api.interceptors.response.use(undefined, async (erro) => {
  if (
    isAxiosError(erro) &&
    erro.response?.status === 401 &&
    erro.config?.headers?.Authorization &&
    erro.config.url !== '/auth/refresh' &&
    (erro.config as InternalAxiosRequestConfig & { _retry?: boolean })._retry !== true
  ) {
    const config = erro.config as InternalAxiosRequestConfig & { _retry?: boolean };
    config._retry = true;
    try {
      refreshEmAndamento ??= renovarAccessToken().finally(() => { refreshEmAndamento = null; });
      const accessToken = await refreshEmAndamento;
      if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`;
        return api.request(config);
      }
    } catch (erroRefresh) {
      // Falhas temporárias não invalidam uma sessão que ainda pode ser recuperada.
      const statusRefresh = isAxiosError(erroRefresh) ? erroRefresh.response?.status : undefined;
      if (statusRefresh !== 400 && statusRefresh !== 401 && statusRefresh !== 403) {
        return Promise.reject(erro);
      }
    }
    await limparSessao();
    await aoSessaoExpirar?.();
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

  const dados = erro.response.data as { detail?: unknown; message?: unknown; mensagem?: unknown; error?: unknown };
  const detail = dados?.detail;
  const doBackend = typeof detail === 'string'
    ? detail
    : Array.isArray(detail)
      ? detail.map((item) => typeof item === 'object' && item && 'msg' in item ? String(item.msg) : '').filter(Boolean).join('\n')
      : dados?.message ?? dados?.mensagem ?? dados?.error;
  if (typeof doBackend === 'string' && doBackend.trim()) return doBackend;

  if (erro.response.status >= 500) return 'Erro no servidor. Tente novamente mais tarde.';
  return padrao;
}
