import { router, type Href } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useBottomTabBarHeight } from 'expo-router/tabs';
import { useAsyncData } from '../../hooks/useAsyncData';
import { cancelarConsulta, listarConsultas } from '../../services/pacienteApi';
import { mensagemDeErro } from '../../services/api';

function dataHora(value: string) { return new Date(value).toLocaleString('pt-BR', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'America/Sao_Paulo' }); }

export default function Agendamentos() {
  const [history, setHistory] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);
  const tabBarHeight = useBottomTabBarHeight();
  const { data, loading, error, recarregar } = useAsyncData(() => listarConsultas(history), [String(history)]);

  function confirmCancel(id: number) {
    Alert.alert('Cancelar consulta', 'Deseja cancelar esta consulta?', [
      { text: 'Voltar', style: 'cancel' },
      { text: 'Cancelar consulta', style: 'destructive', onPress: () => { void (async () => {
        setBusyId(id);
        try { await cancelarConsulta(id); recarregar(); }
        catch (cause) { Alert.alert('Não foi possível cancelar', mensagemDeErro(cause)); }
        finally { setBusyId(null); }
      })(); } },
    ]);
  }

  return <View style={styles.container}>
    <Text style={styles.title}>Minhas consultas</Text>
    <View style={styles.tabs}>
      <Pressable onPress={() => setHistory(false)} style={[styles.tab, !history && styles.active]}><Text style={[styles.tabText, !history && styles.activeText]}>Próximas</Text></Pressable>
      <Pressable onPress={() => setHistory(true)} style={[styles.tab, history && styles.active]}><Text style={[styles.tabText, history && styles.activeText]}>Histórico</Text></Pressable>
    </View>
    {loading ? <ActivityIndicator style={styles.loading} color="#1CA8DB" /> : error ? <Pressable onPress={recarregar}><Text style={styles.empty}>{error} Toque para tentar novamente.</Text></Pressable> : <FlatList
      data={data ?? []}
      keyExtractor={(item) => String(item.id)}
      contentContainerStyle={[styles.list, { paddingBottom: tabBarHeight + 24 }]}
      ListEmptyComponent={<Text style={styles.empty}>{history ? 'Seu histórico está vazio.' : 'Você ainda não tem consultas agendadas.'}</Text>}
      renderItem={({ item }) => <View style={styles.card}>
        <Pressable onPress={() => router.push({ pathname: '/consulta/[id]', params: { id: String(item.id) } } as unknown as Href)}>
          <View style={styles.row}><Text style={styles.service}>{item.service_name}</Text><Text style={[styles.status, item.status === 'SCHEDULED' && styles.scheduled]}>{item.status === 'SCHEDULED' ? 'AGENDADO' : item.status}</Text></View>
          <Text style={styles.detail}>{item.professional_name}</Text>
          <Text style={styles.date}>{dataHora(item.start_at)}</Text>
        </Pressable>
        {item.status === 'SCHEDULED' && <Pressable disabled={busyId === item.id} onPress={() => confirmCancel(item.id)} style={styles.cancel}><Text style={styles.cancelText}>{busyId === item.id ? 'Cancelando…' : 'Cancelar consulta'}</Text></Pressable>}
      </View>}
    />}
  </View>;
}

const styles = StyleSheet.create({ container: { flex: 1, backgroundColor: '#F7FAFC', paddingTop: 20 }, title: { fontSize: 24, fontWeight: '700', color: '#17212B', paddingHorizontal: 20, paddingBottom: 18 }, tabs: { flexDirection: 'row', marginHorizontal: 20, marginBottom: 12, borderBottomWidth: 1, borderColor: '#D8E0E8' }, tab: { paddingVertical: 12, paddingHorizontal: 18 }, active: { borderBottomWidth: 3, borderColor: '#1CA8DB' }, tabText: { color: '#536579' }, activeText: { color: '#0866A3', fontWeight: '700' }, loading: { marginTop: 32 }, list: { padding: 16, gap: 12 }, card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, gap: 7, elevation: 1 }, row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 }, service: { flex: 1, fontSize: 17, fontWeight: '700', color: '#17212B' }, status: { fontSize: 11, color: '#786B52' }, scheduled: { color: '#087B55' }, detail: { color: '#536579' }, date: { color: '#0866A3', fontWeight: '600', marginTop: 4 }, cancel: { alignSelf: 'flex-start', paddingVertical: 8, paddingHorizontal: 10, marginTop: 4 }, cancelText: { color: '#B3261E', fontWeight: '700' }, empty: { textAlign: 'center', color: '#536579', margin: 28 } });
