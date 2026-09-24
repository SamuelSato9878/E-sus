import { listarHorariosDisponiveis } from '../db/agendamentos';
import { useAsyncData } from './useAsyncData';

/** Horários livres do médico na data escolhida (vazio enquanto não há data). */
export function useHorariosDisponiveis(medicoId: number, data: string | null) {
  const { data: horarios, ...resto } = useAsyncData(
    async () => (data ? listarHorariosDisponiveis(medicoId, data) : []),
    [medicoId, data]
  );
  return { horarios: horarios ?? [], ...resto };
}
