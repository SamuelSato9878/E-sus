import { API_CONFIGURADA } from '../config/env';
import { createUser, validateLogin, type AuthResult, type Usuario } from '../db/Database';
import { api, mensagemDeErro } from './api';

/**
 * Autenticação. Com EXPO_PUBLIC_API_URL preenchida, fala com o backend via
 * HTTPS; sem ela, continua usando o banco local (SQLite) para testes.
 *
 * Contrato ESPERADO da API — confirmar com o backend e ajustar só aqui:
 *   POST /auth/login     { email, senha }  ->  { token, usuario: { id, email } }
 *   POST /auth/cadastro  { email, senha }  ->  2xx
 */

export type LoginResult =
  | { success: true; token: string; usuario: Usuario }
  | { success: false; error: string };

function normalizarEmail(email: string) {
  return email.trim().toLowerCase();
}

export async function login(email: string, senha: string): Promise<LoginResult> {
  if (!API_CONFIGURADA) {
    const resultado = await validateLogin(email, senha);
    if (!resultado.success) return resultado;
    // Token fictício só para o modo local; a API vai devolver um de verdade.
    return { success: true, token: `local:${resultado.usuario.id}`, usuario: resultado.usuario };
  }

  try {
    const { data } = await api.post<{ token: string; usuario: Usuario }>('/auth/login', {
      email: normalizarEmail(email),
      senha,
    });
    return { success: true, token: data.token, usuario: data.usuario };
  } catch (e) {
    return { success: false, error: mensagemDeErro(e, 'Email ou senha inválidos.') };
  }
}

export async function cadastrar(email: string, senha: string): Promise<AuthResult> {
  if (!API_CONFIGURADA) return createUser(email, senha);

  try {
    await api.post('/auth/cadastro', { email: normalizarEmail(email), senha });
    return { success: true };
  } catch (e) {
    return { success: false, error: mensagemDeErro(e, 'Não foi possível cadastrar. Tente novamente.') };
  }
}
