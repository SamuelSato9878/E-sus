import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MedicoCard from '../../components/MedicoCard';
import ScreenHeader from '../../components/ScreenHeader';
import SpecialtyPicker from '../../components/SpecialtyPicker';
import { SPECIALTIES } from '../../data/specialties';
import type { Medico } from '../../db/medicos';
import { useMedicos } from '../../hooks/useMedicos';

export default function SelecionarMedico() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const especialidade = SPECIALTIES.find((s) => s.id === id) ?? SPECIALTIES[0];
  const { medicos, loading, error, recarregar } = useMedicos(especialidade.id);

  function abrirAgenda(medico: Medico) {
    router.push({ pathname: '/agenda/[medicoId]', params: { medicoId: String(medico.id) } });
  }

  return (
    <View style={styles.container}>
      <ScreenHeader titulo="Selecione o Médico" />

      <FlatList
        data={loading || error ? [] : medicos}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={[styles.lista, { paddingBottom: insets.bottom + 24 }]}
        ItemSeparatorComponent={() => <View style={styles.separador} />}
        ListHeaderComponent={
          <View style={styles.headerLista}>
            <SpecialtyPicker
              selecionada={especialidade}
              onChange={(s) => router.setParams({ id: s.id })}
            />
            <View style={styles.tituloLinha}>
              <Text style={styles.titulo}>MÉDICOS DISPONÍVEIS</Text>
              {/* Ainda não há critérios de filtro definidos; o botão é só visual por enquanto. */}
              <Pressable style={styles.filtros}>
                <Ionicons name="options-outline" size={18} color="#2FA8D8" />
                <Text style={styles.filtrosTexto}>filtros</Text>
              </Pressable>
            </View>
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator color="#2FBDE8" style={styles.estado} />
          ) : error ? (
            <Pressable onPress={recarregar} style={styles.estado}>
              <Text style={styles.estadoTexto}>{error} Toque para tentar de novo.</Text>
            </Pressable>
          ) : (
            <Text style={[styles.estado, styles.estadoTexto]}>
              Nenhum médico cadastrado para {especialidade.label}.
            </Text>
          )
        }
        renderItem={({ item }) => <MedicoCard medico={item} onPress={abrirAgenda} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  lista: { paddingHorizontal: 18, paddingTop: 10 },
  headerLista: { marginBottom: 20 },
  tituloLinha: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 44,
    paddingHorizontal: 10,
  },
  titulo: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111111',
  },
  filtros: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1.5,
    borderColor: '#2FA8D8',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  filtrosTexto: { fontSize: 15, color: '#2FA8D8' },
  separador: { height: 34 },
  estado: { marginTop: 40, alignItems: 'center' },
  estadoTexto: { textAlign: 'center', fontSize: 14, color: '#5B6B7F' },
});
