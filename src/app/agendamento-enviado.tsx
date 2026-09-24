import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function AgendamentoEnviado() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom + 20 }]}>
      <View style={styles.centro}>
        <View style={styles.iconCircle}>
          <Ionicons name="checkmark-sharp" size={80} color="#7ED957" />
        </View>
        <Text style={styles.titulo}>AGENDAMENTO{'\n'}ENVIADO!</Text>
        <Text style={styles.subtitulo}>aguarde a confirmação na{'\n'}sua conversa</Text>
      </View>

      <Pressable
        onPress={() => router.dismissTo('/(tabs)')}
        style={({ pressed }) => [styles.botao, pressed && styles.botaoPressed]}
      >
        <Text style={styles.botaoTexto}>voltar para o início</Text>
      </Pressable>

      <Image
        source={require('../../assets/images/icon.png')}
        style={styles.logo}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#7ED957',
    paddingHorizontal: 54,
  },
  centro: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircle: {
    width: 126,
    height: 126,
    borderRadius: 63,
    backgroundColor: '#F2F2F2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 36,
  },
  titulo: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  subtitulo: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    marginTop: 22,
  },
  botao: {
    backgroundColor: '#FFFFFF',
    borderTopRightRadius: 14,
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 14,
    paddingVertical: 8,
    alignItems: 'center',
    marginBottom: 30,
  },
  botaoPressed: { opacity: 0.85 },
  botaoTexto: { fontSize: 15, color: '#111111' },
  logo: {
    alignSelf: 'flex-end',
    marginRight: -34,
    width: 38,
    height: 38,
  },
});
