import { useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import ScreenHeader from '../components/ScreenHeader';
import { useAsyncData } from '../hooks/useAsyncData';
import { listarNotificacoes, marcarNotificacaoLida } from '../services/pacienteApi';
import { mensagemDeErro } from '../services/api';

export default function Notificacoes() {
  const [onlyUnread, setOnlyUnread] = useState(false);
  const [errorAction, setErrorAction] = useState('');
  const { data, loading, error, recarregar } = useAsyncData(() => listarNotificacoes(onlyUnread), [String(onlyUnread)]);
  async function markRead(id: number) {
    setErrorAction('');
    try { await marcarNotificacaoLida(id); recarregar(); }
    catch (error) { setErrorAction(mensagemDeErro(error)); }
  }

  return <View style={styles.container}><ScreenHeader titulo="Notificações" />
    <Pressable style={styles.filter} onPress={() => setOnlyUnread((value) => !value)}><Text style={styles.filterText}>{onlyUnread ? 'Exibindo não lidas · mostrar todas' : 'Exibindo todas · filtrar não lidas'}</Text></Pressable>
    {!!errorAction && <Text style={styles.error}>{errorAction}</Text>}
    {loading ? <ActivityIndicator style={styles.loading} color="#1CA8DB" /> : error ? <Text style={styles.empty}>{error}</Text> : <FlatList data={data ?? []} keyExtractor={(item) => String(item.id)} contentContainerStyle={styles.list} ListEmptyComponent={<Text style={styles.empty}>Nenhuma notificação para mostrar.</Text>} renderItem={({ item }) => <View style={[styles.card, !item.read_at && styles.unread]}>
      <Text style={styles.title}>{item.title}</Text><Text style={styles.body}>{item.body}</Text><Text style={styles.date}>{new Date(item.available_at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</Text>
      {!item.read_at && <Pressable onPress={() => markRead(item.id)} style={styles.action}><Text style={styles.actionText}>Marcar como lida</Text></Pressable>}
    </View>} />}
    <Text style={styles.footnote}>As notificações aparecem no aplicativo quando ficam disponíveis. Alertas push ainda não estão habilitados.</Text>
  </View>;
}

const styles = StyleSheet.create({ container: { flex: 1, backgroundColor: '#F7FAFC' }, filter: { padding: 14, alignItems: 'center' }, filterText: { color: '#0866A3', fontWeight: '600' }, loading: { marginTop: 30 }, list: { padding: 16, gap: 12 }, card: { backgroundColor: '#fff', borderRadius: 10, padding: 16, gap: 8 }, unread: { borderLeftWidth: 4, borderLeftColor: '#1CA8DB' }, title: { fontSize: 17, fontWeight: '700', color: '#17212B' }, body: { color: '#536579', lineHeight: 21 }, date: { color: '#8292A5', fontSize: 12 }, action: { alignSelf: 'flex-start', paddingVertical: 8 }, actionText: { color: '#0866A3', fontWeight: '700' }, error: { color: '#B3261E', textAlign: 'center' }, empty: { textAlign: 'center', color: '#536579', margin: 24 }, footnote: { fontSize: 12, color: '#8292A5', textAlign: 'center', padding: 14 } });
