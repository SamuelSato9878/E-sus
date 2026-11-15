import { router, useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import ScreenHeader from '../../components/ScreenHeader';
import { useAsyncData } from '../../hooks/useAsyncData';
import { listarEspecialidades, listarProfissionais, listarServicos } from '../../services/pacienteApi';

export default function ServicosEspecialidade() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const specialtyId = Number(id);
  const { data: specialties } = useAsyncData(listarEspecialidades, []);
  const { data: services, loading, error } = useAsyncData(listarServicos, []);
  const { data: professionals } = useAsyncData(listarProfissionais, []);
  const specialty = specialties?.find((item) => item.id === specialtyId);
  const items = useMemo(() => (services ?? []).filter((item) => item.specialty_id === specialtyId && item.is_active), [services, specialtyId]);

  return (
    <View style={styles.container}>
      <ScreenHeader titulo={specialty?.name ?? 'Serviços disponíveis'} />
      {loading ? <ActivityIndicator style={styles.center} color="#1CA8DB" /> : error ? <Text style={styles.center}>Não foi possível carregar os serviços. Verifique sua conexão.</Text> : (
        <FlatList
          data={items}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.center}>Não há serviços ativos nesta especialidade.</Text>}
          renderItem={({ item }) => {
            const providers = (professionals ?? []).filter((person) => person.is_active && item.professional_ids.includes(person.id));
            return <View style={styles.card}>
              <Text style={styles.name}>{item.name}</Text>
              {!!item.description && <Text style={styles.detail}>{item.description}</Text>}
              <Text style={styles.detail}>Duração: {item.duration_minutes} min</Text>
              <Text style={styles.subtitle}>Profissionais disponíveis</Text>
              {providers.length ? providers.map((person) => <Pressable key={person.id} style={styles.person} onPress={() => router.push({ pathname: '/agenda/[medicoId]', params: { medicoId: String(person.id), serviceId: String(item.id) } })}>
                <Text style={styles.personName}>{person.name}</Text><Text style={styles.detail}>{person.council_type} {person.council_state} {person.council_number}</Text>
              </Pressable>) : <Text style={styles.detail}>Nenhum profissional habilitado no momento.</Text>}
            </View>;
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({ container: { flex: 1, backgroundColor: '#fff' }, list: { padding: 18, gap: 14 }, center: { textAlign: 'center', margin: 24, color: '#536579' }, card: { backgroundColor: '#F5F8FA', borderRadius: 12, padding: 16, gap: 8 }, name: { fontSize: 18, fontWeight: '700', color: '#17212B' }, detail: { color: '#536579', fontSize: 14 }, subtitle: { fontWeight: '700', color: '#17212B', marginTop: 8 }, person: { padding: 12, borderRadius: 8, backgroundColor: '#E4F5FB', marginTop: 4 }, personName: { color: '#0866A3', fontWeight: '700' } });
