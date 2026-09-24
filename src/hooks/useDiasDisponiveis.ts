import { listarDiasDisponiveis } from '../db/agendamentos';
import { useAsyncData } from './useAsyncData';

/** Datas ('YYYY-MM-DD') do mês que ainda têm horário livre com o médico. */
export function useDiasDisponiveis(medicoId: number, ano: number, mes: number) {
  const { data, ...resto } = useAsyncData(
    () => listarDiasDisponiveis(medicoId, ano, mes),
    [medicoId, ano, mes]
  );
  return { dias: data ?? [], ...resto };
}
