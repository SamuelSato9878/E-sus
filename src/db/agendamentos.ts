import { diasNoMes, horaAtual, montarISODate, parseISODate, toISODate } from '../utils/datas';
import { getDb } from './Database';

/**
 * Agenda e agendamentos no banco local. Quando o backend chegar, troque o
 * corpo destas funções por chamadas HTTP mantendo o mesmo retorno.
 */

export type NovoAgendamento = {
  medicoId: number;
  data: string; // 'YYYY-MM-DD'
  hora: string; // 'HH:MM'
  nome: string;
  cpf: string;
  motivo?: string;
};

export type AgendamentoResult =
  | { success: true; id: number }
  | { success: false; error: string };

type SlotRow = { dia_semana: number; hora: string };
type OcupadoRow = { data: string; hora: string };

/** Horários livres de um dia: agenda semanal - já reservados - horas que já passaram. */
function horariosLivres(
  data: string,
  agenda: SlotRow[],
  ocupados: OcupadoRow[],
  agora: Date
): string[] {
  const hoje = toISODate(agora);
  if (data < hoje) return [];

  const diaSemana = parseISODate(data).getDay();
  const reservados = new Set(ocupados.filter((o) => o.data === data).map((o) => o.hora));
  const limite = data === hoje ? horaAtual(agora) : null;

  return agenda
    .filter((s) => s.dia_semana === diaSemana)
    .map((s) => s.hora)
    .filter((hora) => !reservados.has(hora) && (limite === null || hora > limite))
    .sort();
}

async function carregarAgenda(medicoId: number, dataInicio: string, dataFim: string) {
  const db = await getDb();
  const [agenda, ocupados] = await Promise.all([
    db.getAllAsync<SlotRow>(
      'SELECT dia_semana, hora FROM agenda_semanal WHERE medico_id = ?;',
      [medicoId]
    ),
    db.getAllAsync<OcupadoRow>(
      'SELECT data, hora FROM agendamentos WHERE medico_id = ? AND data BETWEEN ? AND ?;',
      [medicoId, dataInicio, dataFim]
    ),
  ]);
  return { agenda, ocupados };
}

/** Dias do mês (0-11) que ainda têm pelo menos um horário livre. */
export async function listarDiasDisponiveis(
  medicoId: number,
  ano: number,
  mes: number
): Promise<string[]> {
  const totalDias = diasNoMes(ano, mes);
  const inicio = montarISODate(ano, mes, 1);
  const fim = montarISODate(ano, mes, totalDias);
  const { agenda, ocupados } = await carregarAgenda(medicoId, inicio, fim);
  const agora = new Date();

  const dias: string[] = [];
  for (let dia = 1; dia <= totalDias; dia++) {
    const data = montarISODate(ano, mes, dia);
    if (horariosLivres(data, agenda, ocupados, agora).length > 0) {
      dias.push(data);
    }
  }
  return dias;
}

export async function listarHorariosDisponiveis(medicoId: number, data: string): Promise<string[]> {
  const { agenda, ocupados } = await carregarAgenda(medicoId, data, data);
  return horariosLivres(data, agenda, ocupados, new Date());
}

export async function criarAgendamento(dados: NovoAgendamento): Promise<AgendamentoResult> {
  const livres = await listarHorariosDisponiveis(dados.medicoId, dados.data);
  if (!livres.includes(dados.hora)) {
    return { success: false, error: 'Esse horário não está mais disponível. Escolha outro.' };
  }

  const db = await getDb();
  try {
    const { lastInsertRowId } = await db.runAsync(
      'INSERT INTO agendamentos (medico_id, data, hora, nome, cpf, motivo) VALUES (?, ?, ?, ?, ?, ?);',
      [dados.medicoId, dados.data, dados.hora, dados.nome, dados.cpf, dados.motivo ?? null]
    );
    return { success: true, id: lastInsertRowId };
  } catch (e: any) {
    if (String(e?.message).includes('UNIQUE')) {
      return { success: false, error: 'Esse horário acabou de ser reservado. Escolha outro.' };
    }
    return { success: false, error: 'Não foi possível enviar o agendamento. Tente novamente.' };
  }
}
