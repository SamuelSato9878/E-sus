import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import SplashScreen from '../components/SplashScreen';
import { useSessao } from '../context/SessaoContext';

export default function Index() {
  const { usuario, carregando } = useSessao();
  const [animacaoPronta, setAnimacaoPronta] = useState(false);

  useEffect(() => {
    // Só sai da splash quando a animação terminou E a sessão salva já foi lida.
    if (!animacaoPronta || carregando) return;
    router.replace(usuario ? '/(tabs)' : '/login');
  }, [animacaoPronta, carregando, usuario]);

  return <SplashScreen onReady={() => setAnimacaoPronta(true)} />;
}
