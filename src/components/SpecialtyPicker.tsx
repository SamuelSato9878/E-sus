import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { SPECIALTIES, type Specialty } from '../data/specialties';

type Props = {
  selecionada: Specialty;
  onChange: (especialidade: Specialty) => void;
};

/** Seletor de especialidade que abre uma lista logo abaixo. */
export default function SpecialtyPicker({ selecionada, onChange }: Props) {
  const [aberto, setAberto] = useState(false);

  function selecionar(especialidade: Specialty) {
    setAberto(false);
    if (especialidade.id !== selecionada.id) onChange(especialidade);
  }

  return (
    <View style={styles.container}>
      <Pressable style={styles.linha} onPress={() => setAberto((v) => !v)}>
        <Opcao especialidade={selecionada} />
        <Ionicons name={aberto ? 'chevron-up' : 'chevron-down'} size={20} color="#111111" />
      </Pressable>

      {aberto &&
        SPECIALTIES.filter((s) => s.id !== selecionada.id).map((s) => (
          <Pressable
            key={s.id}
            style={({ pressed }) => [styles.linha, styles.item, pressed && styles.pressed]}
            onPress={() => selecionar(s)}
          >
            <Opcao especialidade={s} />
          </Pressable>
        ))}
    </View>
  );
}

function Opcao({ especialidade }: { especialidade: Specialty }) {
  return (
    <View style={styles.opcao}>
      <View style={styles.iconCircle}>
        <Image source={especialidade.icon} style={styles.icon} resizeMode="contain" />
      </View>
      <Text style={styles.label}>{especialidade.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D2D2D2',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  linha: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 6,
  },
  item: {
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
  },
  pressed: { backgroundColor: '#F2F6FA' },
  opcao: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#C9D3ED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: { width: 18, height: 18 },
  label: { fontSize: 16, color: '#111111' },
});
