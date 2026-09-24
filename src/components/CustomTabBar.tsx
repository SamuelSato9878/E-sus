import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import type { BottomTabBarProps } from 'expo-router/tabs';

const ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  index: 'home',
  agendamentos: 'calendar',
  perfil: 'person',
  mais: 'menu',
};

const LABELS: Record<string, string> = {
  index: 'Início',
  agendamentos: 'Agendamentos',
  perfil: 'Perfil',
  mais: 'Mais',
};

/**
 * Tab bar customizada (amarela, cantos arredondados em cima) pra bater com
 * o mockup. Os botões "Agendamentos", "Perfil" e "Mais" já navegam pra suas
 * rotas — só o CONTEÚDO dessas telas ainda não foi desenvolvido, então elas
 * podem estar vazias/placeholder por enquanto.
 */
export default function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 14) }]}>
      {state.routes.map((route, index) => {
        const focused = state.index === index;
        const icon = ICONS[route.name] ?? 'ellipse';
        const label = LABELS[route.name] ?? route.name;

        function handlePress() {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!focused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        }

        return (
          <Pressable key={route.key} onPress={handlePress} style={styles.tab}>
            <Ionicons name={icon} size={22} color={focused ? '#1F3B6E' : '#2E3A46'} />
            <Text style={[styles.label, focused && styles.labelFocused]}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#FDC63A',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 14,
    paddingHorizontal: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: '#2E3A46',
  },
  labelFocused: {
    color: '#1F3B6E',
  },
});
