import { buscarMedico } from '../db/medicos';
import { useAsyncData } from './useAsyncData';

export function useMedico(id: number) {
  const { data, ...resto } = useAsyncData(() => buscarMedico(id), [id]);
  return { medico: data, ...resto };
}
