import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Placeholder: essa tela ainda não foi desenhada/definida.
// Deixei a rota funcionando (o botão "Agendamentos" da tab bar já navega
// pra cá) só pra não quebrar a navegação enquanto o conteúdo não existe.
export default function Agendamentos() {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.text}>Agendamentos (em construção)</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  text: { fontSize: 16, color: '#3A4A5C' },
});
