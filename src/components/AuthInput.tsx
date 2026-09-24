import { StyleSheet, TextInput, TextInputProps, View } from 'react-native';

type Props = TextInputProps & {
  label: string;
};

/**
 * Input com label como placeholder e apenas uma linha inferior,
 * seguindo o estilo das telas de "bem vindo!" e "Entrar".
 */
export default function AuthInput({ label, style, ...rest }: Props) {
  return (
    <View style={styles.wrapper}>
      <TextInput
        placeholder={label}
        placeholderTextColor="rgba(58, 74, 92, 0.55)"
        style={[styles.input, style]}
        autoCapitalize="none"
        {...rest}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(58, 74, 92, 0.35)',
    marginBottom: 22,
  },
  input: {
    paddingVertical: 8,
    fontSize: 15,
    color: '#3A4A5C',
  },
});