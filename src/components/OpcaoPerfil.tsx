import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type Props = {
  label: string;
  /** Ícone já renderizado (qualquer família do @expo/vector-icons). */
  icone: ReactNode;
  /** Texto menor em duas linhas, para rótulos longos como "Meus Agendamentos". */
  compacto?: boolean;
  onPress?: () => void;
};

/**
 * Card quadrado (ícone em círculo + rótulo) da grade da tela de Perfil.
 * Sem `onPress`, o card fica apenas visual.
 */
export default function OpcaoPerfil({ label, icone, compacto, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [styles.card, pressed && onPress && styles.pressed]}
    >
      <View style={styles.circulo}>{icone}</View>
      <Text style={[styles.label, compacto && styles.labelCompacto]} numberOfLines={2}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 86,
    height: 86,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: 4,
    shadowColor: '#000000',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 2,
    elevation: 5,
  },
  pressed: {
    opacity: 0.8,
  },
  circulo: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#A5BEDC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#000000',
    textAlign: 'center',
  },
  labelCompacto: {
    fontSize: 9,
    lineHeight: 11,
  },
});
