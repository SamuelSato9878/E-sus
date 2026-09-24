import { useState } from 'react';

/** Navegação mês a mês, sem permitir voltar para antes do mês atual. */
export function useCalendario(dataInicial: Date = new Date()) {
  const [inicio] = useState(() => ({ ano: dataInicial.getFullYear(), mes: dataInicial.getMonth() }));
  const [atual, setAtual] = useState(inicio);

  const podeVoltar = atual.ano > inicio.ano || (atual.ano === inicio.ano && atual.mes > inicio.mes);

  function avancar() {
    setAtual(({ ano, mes }) => (mes === 11 ? { ano: ano + 1, mes: 0 } : { ano, mes: mes + 1 }));
  }

  function voltar() {
    if (!podeVoltar) return;
    setAtual(({ ano, mes }) => (mes === 0 ? { ano: ano - 1, mes: 11 } : { ano, mes: mes - 1 }));
  }

  return { ano: atual.ano, mes: atual.mes, podeVoltar, avancar, voltar };
}
