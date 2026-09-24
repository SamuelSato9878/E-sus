import { getDb } from './Database';

/**
 * Consultas de médicos no banco local. Quando o backend chegar, troque o
 * corpo destas funções por chamadas HTTP mantendo o mesmo retorno.
 */

export type Medico = {
  id: number;
  nome: string;
  crm: string;
  especialidadeId: string;
  fotoUrl: string | null;
};

type MedicoRow = {
  id: number;
  nome: string;
  crm: string;
  especialidade_id: string;
  foto_url: string | null;
};

function toMedico(row: MedicoRow): Medico {
  return {
    id: row.id,
    nome: row.nome,
    crm: row.crm,
    especialidadeId: row.especialidade_id,
    fotoUrl: row.foto_url,
  };
}

export async function listarMedicosPorEspecialidade(especialidadeId: string): Promise<Medico[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<MedicoRow>(
    'SELECT * FROM medicos WHERE especialidade_id = ? ORDER BY nome;',
    [especialidadeId]
  );
  return rows.map(toMedico);
}

export async function buscarMedico(id: number): Promise<Medico | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<MedicoRow>('SELECT * FROM medicos WHERE id = ?;', [id]);
  return row ? toMedico(row) : null;
}
