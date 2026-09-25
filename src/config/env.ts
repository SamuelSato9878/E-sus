/**
 * Configuração da API lida das variáveis de ambiente (arquivo `.env`).
 *
 * Só variáveis com prefixo EXPO_PUBLIC_ chegam ao app, e precisam ser lidas
 * como `process.env.EXPO_PUBLIC_...` (com ponto) para serem embutidas no
 * bundle. Elas ficam visíveis dentro do app: nunca coloque segredos aqui.
 */

/** URL base da API, sem barra no final. Vazia enquanto o backend não estiver disponível. */
export const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? '').trim().replace(/\/+$/, '');

/** Enquanto for false, os serviços usam o banco local (SQLite) no lugar da API. */
export const API_CONFIGURADA = API_URL.length > 0;

if (API_CONFIGURADA && !API_URL.startsWith('https://')) {
  const mensagem = `EXPO_PUBLIC_API_URL precisa usar HTTPS (valor atual: "${API_URL}").`;
  // Em desenvolvimento só avisa, para permitir testar com um backend local em http.
  if (__DEV__) console.warn(mensagem);
  else throw new Error(mensagem);
}
