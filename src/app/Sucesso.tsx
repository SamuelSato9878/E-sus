import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function Sucesso() {
  useEffect(() => {
    // Mostra a confirmação por um instante e segue para as abas (Início).
    const timeout = setTimeout(() => router.replace('/(tabs)'), 1500);
    return () => clearTimeout(timeout);
  }, []);

  return (
    <LinearGradient
      colors={['#5FD3F0', '#1CA8DB']}
      start={{ x: 0.2, y: 0 }}
      end={{ x: 0.8, y: 1 }}
      style={styles.container}
    >
      <View style={styles.iconCircle}>
        <Ionicons name="checkmark" size={40} color="#1CA8DB" />
      </View>
      <Text style={styles.title}>Entrando com sucesso!</Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  iconCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#3A4A5C',
    textAlign: 'center',
  },
});