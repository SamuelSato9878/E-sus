import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import ScreenHeader from '../../components/ScreenHeader';
import { useAsyncData } from '../../hooks/useAsyncData';
import { mensagemDeErro } from '../../services/api';
import { buscarConsulta, cancelarConsulta } from '../../services/pacienteApi';

export default function ConsultaDetalhe() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const appointmentId = Number(id);
  const { data, loading, error, recarregar } = useAsyncData(() => buscarConsulta(appointmentId), [appointmentId]);
  const [busy, setBusy] = useState(false);

  function cancelar() {
    Alert.alert('Cancelar consulta', 'Deseja cancelar esta consulta?', [
      { text: 'Voltar', style: 'cancel' },
      { text: 'Cancelar consulta', style: 'destructive', onPress: () => { void (async () => {
        setBusy(true);
        try { await cancelarConsulta(appointmentId); recarregar(); }
        catch (cause) { Alert.alert('Não foi possível cancelar', mensagemDeErro(cause)); }
        finally { setBusy(false); }
      })(); } },
    ]);
  }

  return <View style={styles.container}><ScreenHeader titulo="Detalhes da consulta" />
    {loading ? <ActivityIndicator style={styles.center} color="#1CA8DB" /> : error || !data ? <Text style={styles.center}>{error ?? 'Consulta não encontrada.'}</Text> : <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.title}>{data.service_name}</Text><Text style={styles.detail}>Profissional: {data.professional_name}</Text>
      <Text style={styles.detail}>Início: {new Date(data.start_at).toLocaleString('pt-BR', { dateStyle: 'full', timeStyle: 'short', timeZone: 'America/Sao_Paulo' })}</Text>
      <Text style={styles.detail}>Término: {new Date(data.end_at).toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit' })}</Text>
      <Text style={styles.status}>Status: {data.status}</Text>
      {data.status === 'SCHEDULED' && <View style={styles.actions}>
        <Pressable disabled={busy} style={styles.cancel} onPress={cancelar}><Text style={styles.cancelText}>{busy ? 'Cancelando…' : 'Cancelar'}</Text></Pressable>
        <Pressable style={styles.reschedule} onPress={() => router.push({ pathname: '/agenda/[medicoId]', params: { medicoId: String(data.professional_id), serviceId: String(data.service_id), appointmentId: String(data.id) } })}><Text style={styles.rescheduleText}>Remarcar</Text></Pressable>
      </View>}
      <Text style={styles.section}>Histórico de alterações</Text>
      {data.history.map((entry) => <View key={entry.id} style={styles.history}><Text style={styles.detail}>{entry.action} · {new Date(entry.created_at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</Text>{entry.reason && <Text style={styles.detail}>Motivo: {entry.reason}</Text>}</View>)}
    </ScrollView>}
  </View>;
}

const styles = StyleSheet.create({ container: { flex: 1, backgroundColor: '#fff' }, content: { padding: 20, gap: 12 }, center: { margin: 30, textAlign: 'center', color: '#536579' }, title: { fontSize: 22, fontWeight: '700', color: '#17212B' }, detail: { color: '#536579', lineHeight: 22 }, status: { color: '#087B55', fontWeight: '700', marginTop: 8 }, actions: { flexDirection: 'row', gap: 12, marginTop: 12 }, cancel: { padding: 12 }, cancelText: { color: '#B3261E', fontWeight: '700' }, reschedule: { padding: 12, borderRadius: 8, backgroundColor: '#1CA8DB' }, rescheduleText: { color: '#fff', fontWeight: '700' }, section: { marginTop: 24, fontSize: 18, fontWeight: '700', color: '#17212B' }, history: { padding: 12, borderLeftWidth: 3, borderColor: '#B8E8F7' } });
