/**
 * Datas trafegam como string 'YYYY-MM-DD' (formato que o backend
 * provavelmente vai usar) e são sempre interpretadas no fuso local.
 */

export const NOMES_MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

const NOMES_DIAS_SEMANA = [
  'Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira',
  'Quinta-feira', 'Sexta-feira', 'Sábado',
];

function doisDigitos(n: number) {
  return String(n).padStart(2, '0');
}

export function toISODate(data: Date): string {
  return `${data.getFullYear()}-${doisDigitos(data.getMonth() + 1)}-${doisDigitos(data.getDate())}`;
}

export function parseISODate(iso: string): Date {
  const [ano, mes, dia] = iso.split('-').map(Number);
  return new Date(ano, mes - 1, dia);
}

export function montarISODate(ano: number, mes: number, dia: number): string {
  return `${ano}-${doisDigitos(mes + 1)}-${doisDigitos(dia)}`;
}

export function horaAtual(agora: Date = new Date()): string {
  return `${doisDigitos(agora.getHours())}:${doisDigitos(agora.getMinutes())}`;
}

/** `mes` vai de 0 (janeiro) a 11 (dezembro), igual ao Date. */
export function diasNoMes(ano: number, mes: number): number {
  return new Date(ano, mes + 1, 0).getDate();
}

/** Ex.: '2026-11-05' -> 'Quinta-feira, 5 de Novembro 2026' */
export function formatarDataExtenso(iso: string): string {
  const data = parseISODate(iso);
  return `${NOMES_DIAS_SEMANA[data.getDay()]}, ${data.getDate()} de ${NOMES_MESES[data.getMonth()]} ${data.getFullYear()}`;
}
