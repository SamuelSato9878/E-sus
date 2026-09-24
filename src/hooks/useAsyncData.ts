import { useCallback, useEffect, useState } from 'react';

type Resultado<T> = {
  chave: string;
  data: T | null;
  error: string | null;
};

/**
 * Base dos hooks de dados: executa `carregar` sempre que `deps` mudar e
 * expõe data/loading/erro. `deps` deve conter apenas valores simples
 * (string, número, null), pois vira a chave da requisição.
 *
 * Respostas de requisições já descartadas (ex.: usuário trocou de mês
 * antes da anterior terminar) são ignoradas.
 */
export function useAsyncData<T>(carregar: () => Promise<T>, deps: (string | number | null)[]) {
  const [versao, setVersao] = useState(0);
  const [resultado, setResultado] = useState<Resultado<T> | null>(null);
  const chave = JSON.stringify([...deps, versao]);

  useEffect(() => {
    let ativo = true;

    carregar()
      .then((data) => {
        if (ativo) setResultado({ chave, data, error: null });
      })
      .catch((e) => {
        console.warn(e);
        if (ativo) setResultado({ chave, data: null, error: 'Não foi possível carregar os dados.' });
      });

    return () => {
      ativo = false;
    };
    // `carregar` é recriada a cada render; quem controla a recarga é a `chave`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chave]);

  const recarregar = useCallback(() => setVersao((v) => v + 1), []);

  return {
    data: resultado?.data ?? null,
    loading: resultado?.chave !== chave,
    error: resultado?.chave === chave ? resultado.error : null,
    recarregar,
  };
}
