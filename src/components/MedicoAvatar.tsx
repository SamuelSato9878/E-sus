import Ionicons from '@expo/vector-icons/Ionicons';
import { Image, StyleSheet, View } from 'react-native';

type Props = {
  fotoUrl: string | null;
  size?: number;
};

/** Foto redonda do médico; sem foto cadastrada, mostra um ícone genérico. */
export default function MedicoAvatar({ fotoUrl, size = 100 }: Props) {
  const circulo = { width: size, height: size, borderRadius: size / 2 };

  return (
    <View style={[styles.container, circulo]}>
      {fotoUrl ? (
        <Image source={{ uri: fotoUrl }} style={circulo} />
      ) : (
        <Ionicons name="person" size={size * 0.55} color="#9DB3C8" />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
});
