import { LinearGradient } from 'expo-linear-gradient';
import { useEffect } from 'react';
import { Dimensions, Image, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');
const CIRCLE_SIZE = width * 0.62;

type Props = {
  /** Chamado quando a animação de entrada termina (útil para navegar em seguida) */
  onReady?: () => void;
};

/**
 * Um dot animado individual usado no indicador de "carregando".
 * Recebe um delay para escalonar a animação entre os 3 dots.
 */
function Dot({ delay }: { delay: number }) {
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 400, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.3, { duration: 400, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      )
    );
  }, [delay, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return <Animated.View style={[styles.dot, animatedStyle]} />;
}

export default function SplashScreen({ onReady }: Props) {
  const circleScale = useSharedValue(0.9);
  const circleOpacity = useSharedValue(0);
  const logoOpacity = useSharedValue(0);
  const logoScale = useSharedValue(0.85);

  useEffect(() => {
    // Círculo translúcido "respira" suavemente ao surgir
    circleOpacity.value = withTiming(1, { duration: 500 });
    circleScale.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 900, easing: Easing.out(Easing.ease) }),
        withTiming(1.04, { duration: 900, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    // Logo entra com leve fade + scale
    logoOpacity.value = withDelay(200, withTiming(1, { duration: 500 }));
    logoScale.value = withDelay(
      200,
      withTiming(1, { duration: 500, easing: Easing.out(Easing.back(1.2)) })
    );

    if (onReady) {
      const timeout = setTimeout(onReady, 2200);
      return () => clearTimeout(timeout);
    }
  }, []);

  const circleStyle = useAnimatedStyle(() => ({
    opacity: circleOpacity.value,
    transform: [{ scale: circleScale.value }],
  }));

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));

  return (
    <LinearGradient
      colors={['#3FC1E9', '#1CA8DB']}
      start={{ x: 0.2, y: 0 }}
      end={{ x: 0.8, y: 1 }}
      style={styles.container}
    >
      <Animated.View style={[styles.circle, circleStyle]} />

      <Animated.View style={[styles.logoWrapper, logoStyle]}>
        <Image
          source={require('../../assets/images/icon.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </Animated.View>

      <View style={styles.dotsContainer}>
        <Dot delay={0} />
        <Dot delay={150} />
        <Dot delay={300} />
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circle: {
    position: 'absolute',
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  logoWrapper: {
    width: CIRCLE_SIZE * 0.55,
    height: CIRCLE_SIZE * 0.55,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  dotsContainer: {
    position: 'absolute',
    bottom: '18%',
    flexDirection: 'row',
    gap: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
  },
});