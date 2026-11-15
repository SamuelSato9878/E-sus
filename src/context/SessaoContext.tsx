import { isAxiosError } from 'axios';
import { router } from 'expo-router';
import { createContext, use, useEffect, useState, type PropsWithChildren } from 'react';
import { definirAoSessaoExpirar, mensagemDeErro } from '../services/api';
import { buscarUsuarioAtual, encerrarSessao, login, type AuthTokens, type Usuario } from '../services/auth';
import { buscarPerfil, type PerfilPaciente } from '../services/pacienteApi';
import { limparSessao, salvarSessao, tokenAtual } from '../services/sessaoStorage';

type EntrarResult = { success: true; perfilNecessario: boolean } | { success: false; error: string };
type SessaoContextData = {
  usuario: Usuario | null;
  perfil: PerfilPaciente | null;
  carregando: boolean;
  perfilCarregando: boolean;
  entrar: (email: string, password: string) => Promise<EntrarResult>;
  sair: () => Promise<void>;
  atualizarPerfilSessao: (perfil: PerfilPaciente | null) => void;
  recarregarPerfil: () => Promise<void>;
};

const SessaoContext = createContext<SessaoContextData | null>(null);

export function useSessao() {
  const sessao = use(SessaoContext);
  if (!sessao) throw new Error('useSessao precisa estar dentro de <SessaoProvider>.');
  return sessao;
}

export function SessaoProvider({ children }: PropsWithChildren) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [perfil, setPerfil] = useState<PerfilPaciente | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [perfilCarregando, setPerfilCarregando] = useState(false);

  async function recarregarPerfil() {
    if (!usuario) return;
    setPerfilCarregando(true);
    try {
      setPerfil(await buscarPerfil());
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 404) setPerfil(null);
      else throw error;
    } finally {
      setPerfilCarregando(false);
    }
  }

  useEffect(() => {
    let ativo = true;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;
    async function restaurar() {
      try {
        if (!(await tokenAtual())) {
          if (ativo) setCarregando(false);
          return;
        }
        const usuarioAtual = await buscarUsuarioAtual();
        if (!ativo) return;
        if (usuarioAtual.role !== 'PATIENT') {
          await limparSessao();
          setCarregando(false);
          return;
        }
        setUsuario(usuarioAtual);
        try {
          setPerfil(await buscarPerfil());
        } catch (error) {
          if (isAxiosError(error) && error.response?.status === 404) setPerfil(null);
          // Network/server failures preserve the session and can be retried in the app.
        }
      } catch (error) {
        // Interceptor clears storage only when refresh is definitively rejected.
        // Keep the splash visible and retry if a temporary outage left tokens intact.
        if (ativo && await tokenAtual()) {
          if (isAxiosError(error) && [403, 404].includes(error.response?.status ?? 0)) {
            await limparSessao();
            setCarregando(false);
            return;
          }
          retryTimer = setTimeout(() => { retryTimer = undefined; void restaurar(); }, 5000);
          return;
        }
      } finally {
        if (ativo && !retryTimer) setCarregando(false);
      }
    }
    void restaurar();
    return () => { ativo = false; if (retryTimer) clearTimeout(retryTimer); };
  }, []);

  useEffect(() => {
    definirAoSessaoExpirar(() => {
      setUsuario(null);
      setPerfil(null);
      router.replace('/login');
    });
    return () => definirAoSessaoExpirar(null);
  }, []);

  async function entrar(email: string, password: string): Promise<EntrarResult> {
    let tokens: AuthTokens;
    try {
      tokens = await login(email, password);
    } catch (error) {
      return {
        success: false,
        error: mensagemDeErro(error, 'Não foi possível validar seu login. Confira o e-mail e a senha e tente novamente.'),
      };
    }

    if (!tokens.access_token || !tokens.refresh_token) {
      return { success: false, error: tokens.message || 'Confirme seu e-mail antes de entrar.' };
    }

    try {
      await salvarSessao(tokens.access_token, tokens.refresh_token);
    } catch {
      return { success: false, error: 'Login confirmado, mas não foi possível salvar a sessão neste aparelho. Tente novamente.' };
    }

    let usuarioAtual: Usuario;
/*    try {
      usuarioAtual = await buscarUsuarioAtual();
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 404) {
        await limparSessao();
        return { success: false, error: 'Esta conta ainda não está vinculada ao sistema de pacientes. Fale com o suporte.' };
      }
      return {
        success: false,
        error: mensagemDeErro(error, 'Login confirmado, mas não foi possível verificar sua conta. Tente novamente.'),
      };
    }

    if (usuarioAtual.role !== 'PATIENT') {
      await limparSessao();
      return { success: false, error: 'Esta conta não tem acesso ao aplicativo do paciente.' };
    }*/

    try {
      usuarioAtual = await buscarUsuarioAtual();
    } catch (error) {
      if (isAxiosError(error) && [403, 404].includes(error.response?.status ?? 0)) {
        await limparSessao();
        return {
          success: false,
          error: error.response?.status === 403
            ? 'Esta conta não tem acesso ao aplicativo do paciente.'
            : 'Esta conta ainda não está vinculada ao sistema de pacientes.',
        };
      }

      return {
        success: false,
        error: mensagemDeErro(
          error,
          'Login confirmado, mas não foi possível verificar sua conta.'
        ),
      };
    }

    if (usuarioAtual.role !== 'PATIENT') {
      await limparSessao();
      return { success: false, error: 'Esta conta não tem acesso ao aplicativo do paciente.' };
    }


    try {
      const perfilAtual = await buscarPerfil();
      setPerfil(perfilAtual);
      // Só libera as rotas autenticadas quando toda a sessão inicial estiver
      // pronta. O Stack.Protected pode redirecionar a tela de login assim que
      // `usuario` muda.
      setUsuario(usuarioAtual);
      return { success: true, perfilNecessario: !perfilAtual.is_active };
    } catch (error) {
      if (isAxiosError(error)) {
        console.error('Falha ao consultar GET /patients/me após login:', {
          status: error.response?.status ?? null,
          url: error.config?.url ?? '/patients/me',
          method: error.config?.method ?? 'get',
        });
      }
      if (isAxiosError(error) && error.response?.status === 404) {
        setPerfil(null);
        setUsuario(usuarioAtual);
        return { success: true, perfilNecessario: true };
      }
      // Perfil indisponível não invalida uma autenticação já confirmada por /auth/me.
      setPerfil(null);
      setUsuario(usuarioAtual);
      return {
        success: true,
        perfilNecessario: false,
      };
    }
  }

  async function sair() {
    try {
      await encerrarSessao();
    } catch {
      // Clear local credentials even if the server is temporarily unavailable.
    } finally {
      await limparSessao();
      setUsuario(null);
      setPerfil(null);
    }
  }

  return (
    <SessaoContext.Provider value={{ usuario, perfil, carregando, perfilCarregando, entrar, sair, atualizarPerfilSessao: setPerfil, recarregarPerfil }}>
      {children}
    </SessaoContext.Provider>
  );
}
