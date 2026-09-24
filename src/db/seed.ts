import type { SQLiteDatabase } from 'expo-sqlite';

/**
 * Dados FICTÍCIOS para testar o fluxo de agendamento enquanto o backend
 * não chega. Nomes e CRMs são inventados. Quando a API existir, este
 * arquivo pode ser apagado junto com as tabelas de médicos/agenda.
 */

const MANHA = ['08:00', '09:00', '10:00', '11:00'];
const TARDE = ['14:00', '15:00', '16:00', '17:00'];

type MedicoSeed = {
  nome: string;
  crm: string;
  especialidadeId: string;
  /** Dias da semana de atendimento (0 = domingo ... 6 = sábado). */
  dias: number[];
  horas: string[];
};

const MEDICOS: MedicoSeed[] = [
  { nome: 'Dr. Lucas Ribeiro', crm: 'CRM/SP 100101', especialidadeId: 'clinico-geral', dias: [1, 2, 4], horas: [...MANHA, ...TARDE] },
  { nome: 'Drª. Clara Nogueira', crm: 'CRM/SP 100102', especialidadeId: 'clinico-geral', dias: [3, 5], horas: [...MANHA, ...TARDE] },
  { nome: 'Drª. Sofia Vianna', crm: 'CRM/SP 100103', especialidadeId: 'clinico-geral', dias: [2, 6], horas: MANHA },
  { nome: 'Drª. Beatriz Almeida', crm: 'CRM/SP 100201', especialidadeId: 'pediatria', dias: [1, 3, 5], horas: MANHA },
  { nome: 'Dr. Rafael Costa', crm: 'CRM/SP 100202', especialidadeId: 'pediatria', dias: [2, 4], horas: TARDE },
  { nome: 'Dr. Marcos Tavares', crm: 'CRM/SP 100301', especialidadeId: 'cardiologia', dias: [1, 4], horas: [...MANHA, ...TARDE] },
  { nome: 'Drª. Juliana Prado', crm: 'CRO/SP 100401', especialidadeId: 'odontologia', dias: [1, 2, 3], horas: TARDE },
  { nome: 'Dr. Felipe Andrade', crm: 'CRP/SP 100501', especialidadeId: 'psicologia', dias: [2, 4], horas: [...MANHA, ...TARDE] },
  { nome: 'Drª. Camila Duarte', crm: 'CRM/SP 100601', especialidadeId: 'ginecologia', dias: [3, 5], horas: MANHA },
  { nome: 'Dr. Paulo Mendes', crm: 'CRM/SP 100701', especialidadeId: 'geriatria', dias: [1, 5], horas: TARDE },
  { nome: 'Drª. Renata Lopes', crm: 'CRM/SP 100801', especialidadeId: 'oncologia', dias: [2, 3], horas: MANHA },
];

/** Popula médicos e agendas apenas na primeira vez que o banco é aberto. */
export async function seedDatabase(db: SQLiteDatabase) {
  const existente = await db.getFirstAsync<{ total: number }>(
    'SELECT COUNT(*) AS total FROM medicos;'
  );
  if (existente && existente.total > 0) return;

  await db.withTransactionAsync(async () => {
    for (const medico of MEDICOS) {
      const { lastInsertRowId } = await db.runAsync(
        'INSERT INTO medicos (nome, crm, especialidade_id) VALUES (?, ?, ?);',
        [medico.nome, medico.crm, medico.especialidadeId]
      );
      for (const dia of medico.dias) {
        for (const hora of medico.horas) {
          await db.runAsync(
            'INSERT INTO agenda_semanal (medico_id, dia_semana, hora) VALUES (?, ?, ?);',
            [lastInsertRowId, dia, hora]
          );
        }
      }
    }
  });
}
