import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type Props = {
  provider: 'facebook' | 'google';
  onPress?: () => void;
};

const CONFIG = {
  facebook: { icon: 'logo-facebook' as const, color: '#1877F2', label: 'Facebook' },
  google: { icon: 'logo-google' as const, color: '#EA4335', label: 'Google' },
};

export default function SocialButton({ provider, onPress }: Props) {
  const { icon, color, label } = CONFIG[provider];

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
    >
      <View style={styles.content}>
        <Ionicons name={icon} size={18} color={color} />
        <Text style={styles.label}>{label}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingVertical: 12,
    shadowColor: '#0B3B52',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  pressed: {
    opacity: 0.85,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3A4A5C',
  },
});