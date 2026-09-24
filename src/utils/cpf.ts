export function somenteDigitos(texto: string): string {
  return texto.replace(/\D/g, '');
}

/** Aplica a máscara 000.000.000-00 enquanto o usuário digita. */
export function formatarCpf(texto: string): string {
  const d = somenteDigitos(texto).slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

/** Valida os dois dígitos verificadores do CPF. */
export function cpfValido(cpf: string): boolean {
  const d = somenteDigitos(cpf);
  if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false;

  const digitoVerificador = (base: string) => {
    let soma = 0;
    for (let i = 0; i < base.length; i++) {
      soma += Number(base[i]) * (base.length + 1 - i);
    }
    const resto = (soma * 10) % 11;
    return resto === 10 ? 0 : resto;
  };

  const primeiro = digitoVerificador(d.slice(0, 9));
  const segundo = digitoVerificador(d.slice(0, 10));
  return primeiro === Number(d[9]) && segundo === Number(d[10]);
}
