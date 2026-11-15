import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import * as ExpoSplashScreen from 'expo-splash-screen';
import * as SQLite from 'expo-sqlite';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ActivityIndicator, Platform, StyleSheet, Text, View } from 'react-native';
import { SessaoProvider, useSessao } from '../context/SessaoContext';

// Mantém a splash NATIVA (a imagem estática do app.json) visível
// até que nossa splash em JS (components/SplashScreen.tsx) esteja pronta.
ExpoSplashScreen.preventAutoHideAsync();
let legacyCleanupPromise: Promise<void> | null = null;

function clearLegacyDatabaseOnce() {
  legacyCleanupPromise ??= (async () => {
    const migrationKey = '@e_sus/legacy_sqlite_cleared_v1';
    const alreadyCleared = Platform.OS === 'web'
      ? typeof localStorage !== 'undefined' && localStorage.getItem(migrationKey) === '1'
      : (await AsyncStorage.getItem(migrationKey)) === '1';
    if (alreadyCleared) return;
    await AsyncStorage.multiRemove(['@e_sus/access_token', '@e_sus/refresh_token']);
    const db = await SQLite.openDatabaseAsync('app.db');
    await db.execAsync('PRAGMA secure_delete = ON; PRAGMA foreign_keys = OFF;');
    const tables = await db.getAllAsync<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%';",
    );
    for (const { name } of tables) {
      const safeName = name.replace(/"/g, '""');
      await db.execAsync(`DELETE FROM "${safeName}";`);
    }
    await db.execAsync('VACUUM;');
    await db.closeAsync();
    await SQLite.deleteDatabaseAsync('app.db');
    if (Platform.OS === 'web') {
      if (typeof localStorage !== 'undefined') localStorage.setItem(migrationKey, '1');
    } else await AsyncStorage.setItem(migrationKey, '1');
  })();
  return legacyCleanupPromise;
}

export default function RootLayout() {
  const [legacyDataCleared, setLegacyDataCleared] = useState(false);
  const [cleanupError, setCleanupError] = useState(false);

  useEffect(() => {
    let active = true;
    void clearLegacyDatabaseOnce().then(() => {
      if (active) setLegacyDataCleared(true);
    }).catch((error) => {
      console.error('Falha ao limpar dados locais antigos:', error);
      legacyCleanupPromise = null;
      if (active) setCleanupError(true);
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (legacyDataCleared || cleanupError) void ExpoSplashScreen.hideAsync();
  }, [cleanupError, legacyDataCleared]);

  if (cleanupError) return <View style={styles.cleanup}><Text style={styles.cleanupText}>Não foi possível concluir a limpeza dos dados locais antigos. Toque em tentar novamente. Se o problema continuar, atualize o aplicativo.</Text><Text onPress={() => { setCleanupError(false); setLegacyDataCleared(false); void clearLegacyDatabaseOnce().then(() => setLegacyDataCleared(true)).catch((error) => { console.error('Falha ao limpar dados locais antigos:', error); legacyCleanupPromise = null; setCleanupError(true); }); }} style={styles.retry}>Tentar novamente</Text></View>;
  if (!legacyDataCleared) return <View style={styles.cleanup}><ActivityIndicator color="#1CA8DB" /></View>;

  return (
    <SessaoProvider>
      <RootNavigator />
    </SessaoProvider>
  );
}

const styles = StyleSheet.create({ cleanup: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 28 }, cleanupText: { textAlign: 'center', color: '#3A4A5C', lineHeight: 22 }, retry: { marginTop: 18, color: '#1CA8DB', fontWeight: '600' } });

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
        <Stack.Screen name="esqueci-senha" />
      </Stack.Protected>

      <Stack.Protected guard={logado}>
        <Stack.Screen name="perfil-paciente" />
      </Stack.Protected>

      <Stack.Protected guard={logado}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="consulta/[id]" />
        <Stack.Screen name="notificacoes" />
        <Stack.Screen name="especialidade/[id]" />
        <Stack.Screen name="agenda/[medicoId]" />
        <Stack.Screen name="confirmar-consulta" />
        {/* Sem gesto de voltar: depois de enviado, o caminho é "voltar para o início". */}
        <Stack.Screen name="agendamento-enviado" options={{ gestureEnabled: false }} />
      </Stack.Protected>
    </Stack>
  );
}
