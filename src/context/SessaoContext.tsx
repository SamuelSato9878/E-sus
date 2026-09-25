import { router } from 'expo-router';
import { createContext, use, useEffect, useState, type PropsWithChildren } from 'react';
import type { AuthResult, Usuario } from '../db/Database';
import { definirAoSessaoExpirar } from '../services/api';
import { login } from '../services/auth';
import { limparSessao, lerSessao, salvarSessao } from '../services/sessaoStorage';

/**
 * Sessão do usuário logado. O token e os dados básicos do usuário ficam
 * salvos com segurança (services/sessaoStorage) para manter o login entre
 * aberturas do app. Se a API recusar o token (401), a sessão é encerrada.
 */

type Sessao = {
  usuario: Usuario | null;
  /** true enquanto a sessão salva ainda está sendo lida. */
  carregando: boolean;
  entrar: (email: string, senha: string) => Promise<AuthResult>;
  sair: () => Promise<void>;
};

const SessaoContext = createContext<Sessao | null>(null);

export function useSessao() {
  const sessao = use(SessaoContext);
  if (!sessao) {
    throw new Error('useSessao precisa estar dentro de <SessaoProvider>.');
  }
  return sessao;
}

export function SessaoProvider({ children }: PropsWithChildren) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    lerSessao()
      .then((salva) => setUsuario(salva?.usuario ?? null))
      .catch((e) => console.warn('Não foi possível restaurar a sessão.', e))
      .finally(() => setCarregando(false));
  }, []);

  useEffect(() => {
    definirAoSessaoExpirar(() => {
      limparSessao();
      setUsuario(null);
      router.replace('/login');
    });
    return () => definirAoSessaoExpirar(null);
  }, []);

  async function entrar(email: string, senha: string): Promise<AuthResult> {
    const resultado = await login(email, senha);
    if (!resultado.success) return resultado;

    await salvarSessao({ token: resultado.token, usuario: resultado.usuario });
    setUsuario(resultado.usuario);
    return { success: true };
  }

  async function sair() {
    await limparSessao();
    setUsuario(null);
  }

  return (
    <SessaoContext value={{ usuario, carregando, entrar, sair }}>{children}</SessaoContext>
  );
}
