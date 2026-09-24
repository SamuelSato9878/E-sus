import { listarMedicosPorEspecialidade } from '../db/medicos';
import { useAsyncData } from './useAsyncData';

export function useMedicos(especialidadeId: string) {
  const { data, ...resto } = useAsyncData(
    () => listarMedicosPorEspecialidade(especialidadeId),
    [especialidadeId]
  );
  return { medicos: data ?? [], ...resto };
}
