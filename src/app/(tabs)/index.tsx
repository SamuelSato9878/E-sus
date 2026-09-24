import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import HomeHeader from '../../components/HomeHeader';
import SearchBar from '../../components/SearchBar';
import SpecialtyButton from '../../components/SpecialtyButton';
import { SPECIALTIES, type Specialty } from '../../data/specialties';

export default function Home() {
  const insets = useSafeAreaInsets();
  const [busca, setBusca] = useState('');

  const especialidadesFiltradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return SPECIALTIES;
    return SPECIALTIES.filter((s) => s.label.toLowerCase().includes(termo));
  }, [busca]);

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
        data={especialidadesFiltradas}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={[
          styles.listContent,
          { paddingTop: insets.top + 16 },
        ]}
        ListHeaderComponent={
          <View style={styles.headerArea}>
            <HomeHeader />
            <View style={styles.searchSpacer} />
            <SearchBar value={busca} onChangeText={setBusca} />
            <View style={styles.gridSpacer} />
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
    paddingBottom: 24,
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
});
