import { StyleSheet, Text } from 'react-native';

export default function ErrorText({ children }: { children?: string | null }) {
  if (!children) return null;
  return <Text style={styles.text}>{children}</Text>;
}

const styles = StyleSheet.create({
  text: {
    color: '#B3261E',
    fontSize: 12,
    marginTop: -14,
    marginBottom: 16,
  },
});