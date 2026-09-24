import { useState } from 'react';
import { criarAgendamento, type NovoAgendamento } from '../db/agendamentos';
import { cpfValido, somenteDigitos } from '../utils/cpf';

function validar(dados: NovoAgendamento): string | null {
  const nome = dados.nome.trim();
  if (nome.split(/\s+/).length < 2) return 'Informe seu nome completo.';
  if (!cpfValido(dados.cpf)) return 'CPF inválido.';
  return null;
}

/** Valida os dados do paciente e registra o agendamento. */
export function useCriarAgendamento() {
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function enviar(dados: NovoAgendamento): Promise<boolean> {
    const erroValidacao = validar(dados);
    if (erroValidacao) {
      setErro(erroValidacao);
      return false;
    }

    setErro(null);
    setEnviando(true);
    const resultado = await criarAgendamento({
      ...dados,
      nome: dados.nome.trim(),
      cpf: somenteDigitos(dados.cpf),
      motivo: dados.motivo?.trim() || undefined,
    });
    setEnviando(false);

    if (!resultado.success) {
      setErro(resultado.error);
      return false;
    }
    return true;
  }

  return { enviar, enviando, erro };
}
