import { router, type Href } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import PrimaryButton from '../../components/PrimaryButton';
import { useSessao } from '../../context/SessaoContext';

export default function Mais() {
  const { sair } = useSessao();
  const [saindo, setSaindo] = useState(false);
  async function handleSair() {
    setSaindo(true);
    try { await sair(); router.replace('/login'); }
    finally { setSaindo(false); }
  }
  return <SafeAreaView edges={['top']} style={styles.container}>
    <View style={styles.actions}>
      <PrimaryButton label="Notificações" onPress={() => router.push('/notificacoes' as Href)} />
      <PrimaryButton label="Meus dados" onPress={() => router.navigate('/perfil')} />
      <PrimaryButton label="Sair da conta" onPress={handleSair} loading={saindo} />
    </View>
  </SafeAreaView>;
}

const styles = StyleSheet.create({ container: { flex: 1, justifyContent: 'center', paddingHorizontal: 28, paddingBottom: 100 }, actions: { gap: 18 } });
