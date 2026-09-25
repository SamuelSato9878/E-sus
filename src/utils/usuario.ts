import type { Usuario } from '../db/Database';

/**
 * Nome mostrado nas saudações. O cadastro ainda não pede nome, então usa
 * o início do email; quando o backend devolver o nome, troque só aqui.
 */
export function nomeDeExibicao(usuario: Usuario | null): string | undefined {
  return usuario?.email.split('@')[0];
}
