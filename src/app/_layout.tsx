import { useEffect } from 'react';
import { Stack } from 'expo-router';
import * as ExpoSplashScreen from 'expo-splash-screen';
import { SessaoProvider, useSessao } from '../context/SessaoContext';

// Mantém a splash NATIVA (a imagem estática do app.json) visível
// até que nossa splash em JS (components/SplashScreen.tsx) esteja pronta.
ExpoSplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useEffect(() => {
    // Esconde a splash nativa assim que o primeiro frame do JS renderizar,
    // dando lugar à nossa splash animada (rota "index").
    ExpoSplashScreen.hideAsync();
  }, []);

  return (
    <SessaoProvider>
      <RootNavigator />
    </SessaoProvider>
  );
}

function RootNavigator() {
  const { usuario } = useSessao();
  const logado = usuario !== null;

  // Rotas fora de um Stack.Protected ficam sempre acessíveis (só a splash).
  // Se o guard de uma tela aberta virar false (ex.: ao sair), o router
  // redireciona sozinho para a primeira tela disponível.
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />

      <Stack.Protected guard={!logado}>
        <Stack.Screen name="login" />
        <Stack.Screen name="cadastro" />
      </Stack.Protected>

      <Stack.Protected guard={logado}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="especialidade/[id]" />
        <Stack.Screen name="agenda/[medicoId]" />
        <Stack.Screen name="confirmar-consulta" />
        {/* Sem gesto de voltar: depois de enviado, o caminho é "voltar para o início". */}
        <Stack.Screen name="agendamento-enviado" options={{ gestureEnabled: false }} />
      </Stack.Protected>
    </Stack>
  );
}
