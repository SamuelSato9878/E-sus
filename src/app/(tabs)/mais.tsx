import { router } from 'expo-router';
import { useBottomTabBarHeight } from 'expo-router/tabs';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import PrimaryButton from '../../components/PrimaryButton';
import { useSessao } from '../../context/SessaoContext';

// O restante desta tela ainda não foi desenhado; por enquanto ela só
// concentra a saída da conta (o mockup do Perfil não tem esse botão).
export default function Mais() {
  const { sair } = useSessao();
  const [saindo, setSaindo] = useState(false);
  const alturaTabBar = useBottomTabBarHeight();

  async function handleSair() {
    setSaindo(true);
    await sair();
    router.replace('/login');
  }

  return (
    <SafeAreaView edges={['top']} style={[styles.container, { paddingBottom: alturaTabBar }]}>
      <Text style={styles.text}>Mais opções em construção.</Text>
      <View style={styles.botao}>
        <PrimaryButton label="Sair da conta" onPress={handleSair} loading={saindo} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28 },
  text: { fontSize: 16, color: '#3A4A5C' },
  botao: { width: '100%', marginTop: 32 },
});
