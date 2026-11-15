import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import PrimaryButton from '../components/PrimaryButton';
import ScreenHeader from '../components/ScreenHeader';
import { useAsyncData } from '../hooks/useAsyncData';
import { mensagemDeErro } from '../services/api';
import { criarConsulta, listarProfissionais, listarServicos, remarcarConsulta } from '../services/pacienteApi';

export default function ConfirmarConsulta() {
  const { medicoId, serviceId, data, hora, appointmentId } = useLocalSearchParams<{ medicoId: string; serviceId: string; data: string; hora: string; appointmentId?: string }>();
  const professionalId = Number(medicoId);
  const serviceNumericId = Number(serviceId);
  const { data: professionals } = useAsyncData(listarProfissionais, []);
  const { data: services } = useAsyncData(listarServicos, []);
  const professional = professionals?.find((item) => item.id === professionalId);
  const service = services?.find((item) => item.id === serviceNumericId);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const formattedDate = useMemo(() => new Date(`${data}T12:00:00`).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }), [data]);

  async function confirmar() {
    setLoading(true);
    setError('');
    try {
      const startAt = `${data}T${hora}:00-03:00`;
      const appointment = appointmentId
        ? await remarcarConsulta(Number(appointmentId), startAt)
        : await criarConsulta(professionalId, serviceNumericId, startAt);
      router.replace({ pathname: '/agendamento-enviado', params: { appointmentId: String(appointment.id), verificationCode: appointment.verification_code, professionalName: appointment.professional_name, serviceName: appointment.service_name, startAt: appointment.start_at, rescheduled: appointmentId ? 'true' : 'false' } });
    } catch (cause) {
      setError(mensagemDeErro(cause, 'Não foi possível criar a consulta. Atualize os horários e tente novamente.'));
    } finally {
      setLoading(false);
    }
  }

  return <View style={styles.container}>
    <ScreenHeader titulo="Confirme sua consulta" />
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <Text style={styles.caption}>SERVIÇO</Text><Text style={styles.name}>{service?.name ?? 'Carregando…'}</Text>
        <Text style={styles.caption}>PROFISSIONAL</Text><Text style={styles.name}>{professional?.name ?? 'Carregando…'}</Text>
        <Text style={styles.caption}>DATA E HORÁRIO</Text><Text style={styles.name}>{formattedDate}</Text><Text style={styles.time}>{hora}</Text>
        {service && <Text style={styles.detail}>{service.duration_minutes} minutos</Text>}
      </View>
      <Text style={styles.notice}>A disponibilidade será validada novamente ao confirmar. A consulta só estará marcada após a resposta de sucesso do sistema.</Text>
      {!!error && <Text style={styles.error}>{error}</Text>}
      <PrimaryButton label={appointmentId ? 'Confirmar remarcação' : 'Confirmar consulta'} onPress={confirmar} loading={loading} disabled={!professional || !service} />
      {loading && <ActivityIndicator style={styles.loader} color="#1CA8DB" />}
    </ScrollView>
  </View>;
}

const styles = StyleSheet.create({ container: { flex: 1, backgroundColor: '#fff' }, content: { padding: 20, gap: 18 }, card: { backgroundColor: '#F3F7F9', padding: 20, borderRadius: 12, gap: 8 }, caption: { fontSize: 12, fontWeight: '700', color: '#617387', marginTop: 10 }, name: { fontSize: 17, fontWeight: '700', color: '#17212B' }, time: { fontSize: 22, fontWeight: '700', color: '#0866A3' }, detail: { color: '#536579' }, notice: { color: '#536579', lineHeight: 21 }, error: { color: '#B3261E' }, loader: { marginTop: 8 } });
