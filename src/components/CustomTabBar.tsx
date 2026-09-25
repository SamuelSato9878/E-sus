import Ionicons from '@expo/vector-icons/Ionicons';
import { BottomTabBarHeightCallbackContext, type BottomTabBarProps } from 'expo-router/tabs';
import { use, useState } from 'react';
import { Pressable, StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

type IconName = keyof typeof Ionicons.glyphMap;

const TABS: Record<string, { label: string; icon: IconName; iconAtivo: IconName }> = {
  index: { label: 'Início', icon: 'home-outline', iconAtivo: 'home' },
  agendamentos: { label: 'Agendamentos', icon: 'calendar-clear-outline', iconAtivo: 'calendar-clear' },
  perfil: { label: 'Perfil', icon: 'person-outline', iconAtivo: 'person' },
  mais: { label: 'Mais', icon: 'menu', iconAtivo: 'menu' },
};

const AMARELO = '#FABC07';
const AZUL_ATIVO = '#0866FF';
const PRETO = '#000000';

/** Largura e altura da curva do canto superior direito. */
const CURVA_LARGURA = 64;
const CURVA_ALTURA = 42;

/**
 * Tab bar customizada conforme o mockup: amarela, com o canto esquerdo reto,
 * uma curva só no canto direito e um traço decorativo embaixo de "Mais".
 *
 * Ela fica posicionada por cima do conteúdo (absolute) para que a tela
 * apareça atrás da curva. A altura é informada ao navigator, então as telas
 * podem usar `useBottomTabBarHeight()` para não ficar escondidas atrás dela.
 */
export default function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const informarAltura = use(BottomTabBarHeightCallbackContext);
  const [tamanho, setTamanho] = useState<{ largura: number; altura: number } | null>(null);

  function handleLayout(e: LayoutChangeEvent) {
    const { width, height } = e.nativeEvent.layout;
    setTamanho({ largura: width, altura: height });
    informarAltura?.(height);
  }

  return (
    <View
      onLayout={handleLayout}
      style={[styles.container, { paddingBottom: Math.max(insets.bottom, 14) }]}
    >
      {tamanho && <FundoCurvo {...tamanho} />}

      {state.routes.map((route, index) => {
        const focused = state.index === index;
        const tab = TABS[route.name];
        const cor = focused ? AZUL_ATIVO : PRETO;

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
          <Pressable
            key={route.key}
            onPress={handlePress}
            style={styles.tab}
            accessibilityRole="tab"
            accessibilityState={{ selected: focused }}
          >
            <Ionicons
              name={(focused ? tab?.iconAtivo : tab?.icon) ?? 'ellipse'}
              size={30}
              color={cor}
            />
            <Text style={[styles.label, { color: cor }, focused && styles.labelAtivo]}>
              {tab?.label ?? route.name}
            </Text>
          </Pressable>
        );
      })}

      <Traco />
    </View>
  );
}

function FundoCurvo({ largura, altura }: { largura: number; altura: number }) {
  const inicioCurva = largura - CURVA_LARGURA;
  const d =
    `M0 0 H${inicioCurva} ` +
    `C${largura - 45} 0 ${largura - 8} ${CURVA_ALTURA * 0.52} ${largura} ${CURVA_ALTURA} ` +
    `V${altura} H0 Z`;

  return (
    <Svg width={largura} height={altura} style={StyleSheet.absoluteFill} pointerEvents="none">
      <Path d={d} fill={AMARELO} />
    </Svg>
  );
}

/** Traço tipo pincel embaixo de "Mais" (só decorativo). */
function Traco() {
  return (
    <View style={styles.traco} pointerEvents="none">
      <Svg width="100%" height="100%" viewBox="0 0 390 75">
        <Path
          d="M5 70 C30 56 60 47 110 45 C170 44 240 57 290 58 C320 58 340 46 355 31 C362 22 364 10 370 5 C376 0 384 6 381 18 C377 32 368 46 350 55 C330 64 305 67 285 66 C240 64 170 47 110 47 C60 47 25 60 5 72 Z"
          fill={PRETO}
        />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    paddingTop: 16,
    // Mais espaço à direita para as abas não encostarem na curva.
    paddingLeft: 22,
    paddingRight: 42,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  label: {
    fontSize: 12,
    lineHeight: 14,
  },
  labelAtivo: {
    fontWeight: '700',
  },
  traco: {
    position: 'absolute',
    top: 52,
    right: 22,
    width: 107,
    height: 21,
  },
});
