import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import type { Specialty } from '../data/specialties';

type Props = {
  specialty: Specialty;
  onPress?: (specialty: Specialty) => void;
};

/**
 * Card de especialidade (ícone + nome) usado na grade da Home.
 * Sem `onPress`, o card fica apenas visual.
 */
export default function SpecialtyButton({ specialty, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress ? () => onPress(specialty) : undefined}
      style={({ pressed }) => [styles.card, pressed && onPress && styles.pressed]}
    >
      <View style={styles.iconCircle}>
        <Image source={specialty.icon} style={styles.icon} resizeMode="contain" />
      </View>
      <Text style={styles.label} numberOfLines={2}>
        {specialty.label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 8,
    alignItems: 'center',
    gap: 10,
    shadowColor: '#0B3B52',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  pressed: {
    opacity: 0.8,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#C9D3ED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    width: 34,
    height: 34,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2E3A46',
    textAlign: 'center',
  },
});