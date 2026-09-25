import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import type { Usuario } from '../db/Database';

/**
 * Guarda a sessão (token + dados básicos do usuário) entre aberturas do app.
 * No celular usa o expo-secure-store (Keychain/Keystore). O SecureStore não
 * funciona na web, então lá cai no localStorage, como recomenda a Expo.
 */

export type SessaoSalva = {
  token: string;
  usuario: Usuario;
};

const CHAVE = 'esus.sessao';

// Cópia em memória do token para não ler o armazenamento a cada requisição.
let tokenEmMemoria: string | null = null;

async function ler(): Promise<string | null> {
  if (Platform.OS === 'web') return globalThis.localStorage?.getItem(CHAVE) ?? null;
  return SecureStore.getItemAsync(CHAVE);
}

async function gravar(valor: string | null) {
  if (Platform.OS === 'web') {
    if (valor === null) globalThis.localStorage?.removeItem(CHAVE);
    else globalThis.localStorage?.setItem(CHAVE, valor);
    return;
  }
  if (valor === null) await SecureStore.deleteItemAsync(CHAVE);
  else await SecureStore.setItemAsync(CHAVE, valor);
}

export async function lerSessao(): Promise<SessaoSalva | null> {
  const bruto = await ler();
  if (!bruto) return null;
  try {
    const sessao = JSON.parse(bruto) as SessaoSalva;
    tokenEmMemoria = sessao.token;
    return sessao;
  } catch {
    // Formato antigo ou corrompido: descarta.
    await limparSessao();
    return null;
  }
}

export async function salvarSessao(sessao: SessaoSalva) {
  tokenEmMemoria = sessao.token;
  await gravar(JSON.stringify(sessao));
}

export async function limparSessao() {
  tokenEmMemoria = null;
  await gravar(null);
}

/** Token atual, usado pelo cliente HTTP para montar o header Authorization. */
export function tokenAtual(): string | null {
  return tokenEmMemoria;
}
