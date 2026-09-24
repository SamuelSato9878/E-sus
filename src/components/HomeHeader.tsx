import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

type Props = {
  /**
   * Nome do usuário logado. Por enquanto não há integração com o backend/
   * autenticação real, então isso deve vir de onde a sessão do usuário for
   * guardada mais pra frente (contexto de auth, etc). Enquanto isso, cai no
   * placeholder "[nome]" igual ao mockup.
   */
  nome?: string;
  onPressPerfil?: () => void;
};

export default function HomeHeader({ nome = '[nome]', onPressPerfil }: Props) {
  return (
    <View style={styles.row}>
      <Text style={styles.greeting}>Olá, {nome}</Text>
      <Pressable onPress={onPressPerfil} style={styles.avatar}>
        <Ionicons name="person" size={20} color="#FFFFFF" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  greeting: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
