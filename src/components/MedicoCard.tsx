import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SPECIALTIES } from '../data/specialties';
import type { Medico } from '../db/medicos';
import MedicoAvatar from './MedicoAvatar';

type Props = {
  medico: Medico;
  onPress: (medico: Medico) => void;
};

export default function MedicoCard({ medico, onPress }: Props) {
  const especialidade = SPECIALTIES.find((s) => s.id === medico.especialidadeId);

  return (
    <Pressable
      onPress={() => onPress(medico)}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <MedicoAvatar fotoUrl={medico.fotoUrl} />
      <View style={styles.info}>
        <Text style={styles.nome} numberOfLines={2}>
          {medico.nome}
        </Text>
        <Text style={styles.detalhe}>CRM: {medico.crm}</Text>
        <Text style={styles.detalhe}>
          ESPECIALIZAÇÃO: {especialidade?.label.toUpperCase() ?? medico.especialidadeId}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#D2D2D2',
    borderRadius: 4,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  pressed: { opacity: 0.8 },
  info: { flex: 1 },
  nome: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111111',
    marginBottom: 14,
  },
  detalhe: {
    fontSize: 11,
    color: '#222222',
  },
});
