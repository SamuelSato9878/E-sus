import type { Usuario } from '../services/auth';

/**
 * Nome de exibição retornado pelo backend.
 */
export function nomeDeExibicao(usuario: Usuario | null): string | undefined {
  return usuario?.user_name || usuario?.email.split('@')[0];
}
