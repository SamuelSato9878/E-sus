import { router } from 'expo-router';

import {
  createContext,
  use,
  useEffect,
  useState,
  type PropsWithChildren,
} from 'react';

import {
  definirAoSessaoExpirar,
} from '../services/api';

import {
  login,
  buscarUsuarioAtual,
} from '../services/auth';

import {
  limparSessao,
  salvarSessao,
  tokenAtual,
} from '../services/sessaoStorage';


// ============================================================
// TIPOS
// ============================================================

export type UserRole =
  | 'paciente'
  | 'medico'
  | 'admin';


export interface Usuario {
  id: string;
  email: string;
  name?: string;
  phone?: string;
  cpf?: string;
  role?: UserRole;
}


export interface LoginData {
  access_token: string;
  refresh_token: string;
  user_id: string;
  email: string;
}


export type LoginResult =
  | {
      success: true;
      data: LoginData;
    }
  | {
      success: false;
      error: string;
    };


interface SessaoContextData {

  usuario: Usuario | null;

  carregando: boolean;

  entrar: (
    email: string,
    password: string
  ) => Promise<LoginResult>;

  sair: () => Promise<void>;
}


// ============================================================
// CONTEXT
// ============================================================

const SessaoContext =
  createContext<SessaoContextData | null>(null);


// ============================================================
// HOOK
// ============================================================

export function useSessao(): SessaoContextData {

  const sessao = use(SessaoContext);

  if (!sessao) {
    throw new Error(
      'useSessao precisa estar dentro de <SessaoProvider>.'
    );
  }

  return sessao;
}


// ============================================================
// PROVIDER
// ============================================================

export function SessaoProvider({
  children,
}: PropsWithChildren) {

  const [usuario, setUsuario] =
    useState<Usuario | null>(null);

  const [carregando, setCarregando] =
    useState(true);


  // ==========================================================
  // RESTAURAR SESSÃO
  // ==========================================================

  useEffect(() => {

    async function restaurarSessao() {

      try {

        const token = await tokenAtual();

        // ----------------------------------------------
        // NÃO EXISTE TOKEN
        // ----------------------------------------------

        if (!token) {
          return;
        }


        // ----------------------------------------------
        // TOKEN EXISTE
        // BUSCAR USUÁRIO NO BACKEND
        // ----------------------------------------------

        const resultado =
          await buscarUsuarioAtual();


        if (resultado) {

          setUsuario(resultado);

        } else {

          await limparSessao();

        }

      } catch (error) {

        console.error(
          'Erro ao restaurar sessão:',
          error
        );

        await limparSessao();

      } finally {

        setCarregando(false);

      }

    }

    restaurarSessao();

  }, []);


  // ==========================================================
  // TOKEN EXPIRADO
  // ==========================================================

  useEffect(() => {

    definirAoSessaoExpirar(async () => {

      await limparSessao();

      setUsuario(null);

      router.replace('/login');

    });


    return () => {

      definirAoSessaoExpirar(null);

    };

  }, []);


  // ==========================================================
  // LOGIN
  // ==========================================================

  async function entrar(
    email: string,
    password: string
  ): Promise<LoginResult> {

    const resultado = await login(email, password);


    // ----------------------------------------------
    // LOGIN FALHOU
    // ----------------------------------------------

    if (!resultado.success) {
      return {success: false, error: "erro ao logar"};
    }


    // ----------------------------------------------
    // SALVAR TOKENS
    // ----------------------------------------------

    await salvarSessao(
      resultado.data.access_token,
      resultado.data.refresh_token
    );


    // ----------------------------------------------
    // BUSCAR USUÁRIO COMPLETO
    // ----------------------------------------------

    const usuario =
      await buscarUsuarioAtual();


    if (!usuario) {

      await limparSessao();

      return {
        success: false,
        error: 'Não foi possível carregar os dados do usuário.',
      };

    }


    // ----------------------------------------------
    // ATUALIZAR CONTEXT
    // ----------------------------------------------

    setUsuario(usuario);


    return {success: true, data: resultado.data};
  }


  // ==========================================================
  // LOGOUT
  // ==========================================================

  async function sair(): Promise<void> {

    await limparSessao();

    setUsuario(null);

    router.replace('/login');
  }


  // ==========================================================
  // PROVIDER
  // ==========================================================

  return (

    <SessaoContext.Provider
      value={{
        usuario,
        carregando,
        entrar,
        sair,
      }}
    >

      {children}

    </SessaoContext.Provider>

  );
}