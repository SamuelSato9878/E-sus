import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/** Barra azul com botão de voltar usada no fluxo de agendamento. */
export default function ScreenHeader({ titulo }: { titulo: string }) {
  const insets = useSafeAreaInsets();

  function voltar() {
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)');
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top + 12 }]}>
      <Pressable onPress={voltar} hitSlop={12} style={styles.lado}>
        <Ionicons name="chevron-back" size={28} color="#FFFFFF" />
      </Pressable>
      <Text style={styles.titulo} numberOfLines={1}>
        {titulo}
      </Text>
      <View style={styles.lado} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2FBDE8',
    paddingHorizontal: 12,
    paddingBottom: 14,
  },
  lado: { width: 36 },
  titulo: {
    flex: 1,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
