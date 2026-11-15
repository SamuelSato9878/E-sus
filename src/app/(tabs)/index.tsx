import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useBottomTabBarHeight } from 'expo-router/tabs';
import { useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import HomeHeader from '../../components/HomeHeader';
import SearchBar from '../../components/SearchBar';
import SpecialtyButton from '../../components/SpecialtyButton';
import { useSessao } from '../../context/SessaoContext';
import { SPECIALTIES, type Specialty } from '../../data/specialties';
import { useAsyncData } from '../../hooks/useAsyncData';
import { listarEspecialidades } from '../../services/pacienteApi';
import { nomeDeExibicao } from '../../utils/usuario';

export default function Home() {
  const insets = useSafeAreaInsets();
  // A tab bar fica por cima do conteúdo; o fim da lista precisa passar dela.
  const alturaTabBar = useBottomTabBarHeight();
  const { usuario } = useSessao();
  const nome = nomeDeExibicao(usuario);
  const [busca, setBusca] = useState('');
  const { data: catalogo, loading, error } = useAsyncData(listarEspecialidades, []);
  const especialidades = (catalogo ?? []).map((item) => {
    const local = SPECIALTIES.find((s) => s.label.toLocaleLowerCase('pt-BR') === item.name.toLocaleLowerCase('pt-BR'));
    return { id: String(item.id), label: item.name, icon: local?.icon ?? SPECIALTIES[0].icon };
  });

  const termo = busca.trim().toLowerCase();
  const especialidadesFiltradas = termo ? especialidades.filter((s) => s.label.toLowerCase().includes(termo)) : especialidades;

  function handleSelectSpecialty(s: Specialty) {
    router.push({ pathname: '/especialidade/[id]', params: { id: s.id } });
  }

  return (
    <LinearGradient
      colors={['#5FD3F0', '#1CA8DB']}
      start={{ x: 0.2, y: 0 }}
      end={{ x: 0.8, y: 1 }}
      style={styles.container}
    >
      <FlatList
        data={loading || error ? [] : especialidadesFiltradas}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={[
          styles.listContent,
          { paddingTop: insets.top + 16, paddingBottom: alturaTabBar + 24 },
        ]}
        ListHeaderComponent={
          <View style={styles.headerArea}>
            <HomeHeader nome={nome} onPressPerfil={() => router.navigate('/perfil')} />
            <View style={styles.searchSpacer} />
            <SearchBar value={busca} onChangeText={setBusca} />
            <View style={styles.gridSpacer} />
            {loading && <ActivityIndicator color="#fff" />}
            {!!error && <Text style={styles.estado}>Não foi possível carregar o catálogo. Verifique a conexão e tente novamente.</Text>}
          </View>
        }
        renderItem={({ item }) => (
          <SpecialtyButton specialty={item} onPress={handleSelectSpecialty} />
        )}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  listContent: {
    paddingHorizontal: 20,
  },
  headerArea: {
    marginBottom: 4,
  },
  searchSpacer: { height: 18 },
  gridSpacer: { height: 18 },
  row: {
    gap: 16,
    marginBottom: 16,
  },
  estado: { color: '#fff', textAlign: 'center', marginTop: 12 },
});
