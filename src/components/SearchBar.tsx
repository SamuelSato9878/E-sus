import React from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

type Props = {
  value: string;
  onChangeText: (text: string) => void;
  onSubmit?: () => void;
};

export default function SearchBar({ value, onChangeText, onSubmit }: Props) {
  return (
    <View style={styles.wrapper}>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        onSubmitEditing={onSubmit}
        placeholder="Buscar Especialidade ou Médico"
        placeholderTextColor="rgba(58, 74, 92, 0.55)"
        style={styles.input}
        returnKeyType="search"
      />
      <Ionicons name="search" size={18} color="rgba(58, 74, 92, 0.7)" />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingVertical: 12,
    gap: 8,
    shadowColor: '#0B3B52',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: '#3A4A5C',
  },
});
