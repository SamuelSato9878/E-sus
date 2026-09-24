import { useEffect } from 'react';
import { Stack } from 'expo-router';
import * as ExpoSplashScreen from 'expo-splash-screen';

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
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      {/* Sem gesto de voltar: depois de enviado, o caminho é "voltar para o início". */}
      <Stack.Screen name="agendamento-enviado" options={{ gestureEnabled: false }} />
    </Stack>
  );
}