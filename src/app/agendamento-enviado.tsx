import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function AgendamentoEnviado() {
  const insets = useSafeAreaInsets();
  const { appointmentId, verificationCode, professionalName, serviceName, startAt, rescheduled } = useLocalSearchParams<{ appointmentId: string; verificationCode?: string; professionalName: string; serviceName: string; startAt: string; rescheduled?: string }>();
  const dateTime = startAt ? new Date(startAt).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short', timeZone: 'America/Sao_Paulo' }) : '';

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom + 20 }]}>
      <View style={styles.centro}>
        <View style={styles.iconCircle}>
          <Ionicons name="checkmark-sharp" size={80} color="#7ED957" />
        </View>
        <Text style={styles.titulo}>{rescheduled === 'true' ? 'CONSULTA REMARCADA!' : 'CONSULTA CONFIRMADA!'}</Text>
        <Text style={styles.subtitulo}>{serviceName}{'\n'}{professionalName}{'\n'}{dateTime}{appointmentId ? `\nProtocolo #${appointmentId}` : ''}</Text>
        {!!verificationCode && <View style={styles.codigoContainer}>
          <Text style={styles.codigoLegenda}>CÓDIGO DE VERIFICAÇÃO</Text>
          <Text selectable style={styles.codigo}>{verificationCode}</Text>
          <Text style={styles.codigoAjuda}>Apresente este código na unidade de saúde.</Text>
        </View>}
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
  codigoContainer: {
    marginTop: 24,
    paddingHorizontal: 22,
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    alignItems: 'center',
  },
  codigoLegenda: { fontSize: 11, fontWeight: '700', color: '#FFFFFF', letterSpacing: 1 },
  codigo: { marginTop: 6, fontSize: 28, fontWeight: '800', color: '#FFFFFF', letterSpacing: 3 },
  codigoAjuda: { marginTop: 6, fontSize: 12, color: '#FFFFFF', textAlign: 'center' },
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
