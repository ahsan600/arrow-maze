import React from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import Svg, { Path, Ellipse, G, Defs, LinearGradient, Stop } from 'react-native-svg';
import { useTheme } from '../../theme/ThemeContext';

interface OrigamiCraneProps {
  size?: number;
}

/**
 * Animated 3D Paper Craft Origami Crane (Orizuru 折鶴)
 * Features faceted geometric paper folds, ambient paper lighting,
 * and a floating breathing animation with dynamic drop-shadow.
 */
export const OrigamiCrane: React.FC<OrigamiCraneProps> = React.memo(({ size = 110 }) => {
  const { theme, mode } = useTheme();
  const floatAnim = useSharedValue(0);

  React.useEffect(() => {
    floatAnim.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1800, easing: Easing.inOut(Easing.quad) }),
        withTiming(0, { duration: 1800, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
      true,
    );
  }, [floatAnim]);

  const craneStyle = useAnimatedStyle(() => {
    const translateY = interpolate(floatAnim.value, [0, 1], [0, -8]);
    const rotate = interpolate(floatAnim.value, [0, 1], [-1.5, 2]);
    return {
      transform: [{ translateY }, { rotate: `${rotate}deg` }],
    };
  });

  const shadowStyle = useAnimatedStyle(() => {
    const scale = interpolate(floatAnim.value, [0, 1], [1, 0.85]);
    const opacity = interpolate(floatAnim.value, [0, 1], [0.35, 0.2]);
    return {
      transform: [{ scale }],
      opacity,
    };
  });

  const isDark = mode === 'dark';

  // Facet palette tailored to theme
  const primaryWing = theme.primary;
  const wingFoldLight = isDark ? '#FFC453' : '#F27048';
  const wingFoldDark = isDark ? '#D8961D' : '#BF3812';
  const bodyLight = isDark ? '#F6EFE4' : '#FFFDF8';
  const bodyDark = isDark ? '#D5CDBC' : '#E8DFCE';
  const neckColor = isDark ? '#F2B134' : '#E4572E';
  const tailColor = isDark ? '#E5A52A' : '#CF431B';

  const width = size;
  const height = size * 0.75;

  return (
    <View style={[styles.container, { width, height: height + 24 }]}>
      {/* Dynamic Paper Drop Shadow */}
      <Animated.View style={[styles.shadowContainer, shadowStyle]}>
        <Svg width={width * 0.7} height={18} viewBox="0 0 100 18">
          <Ellipse cx="50" cy="9" rx="42" ry="7" fill={theme.shadow} />
        </Svg>
      </Animated.View>

      {/* Floating Crane Origami Sculpture */}
      <Animated.View style={[styles.craneWrapper, craneStyle]}>
        <Svg width={width} height={height} viewBox="0 0 140 105">
          <Defs>
            <LinearGradient id="wingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor={wingFoldLight} />
              <Stop offset="100%" stopColor={primaryWing} />
            </LinearGradient>
            <LinearGradient id="bodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor={bodyLight} />
              <Stop offset="100%" stopColor={bodyDark} />
            </LinearGradient>
          </Defs>

          <G>
            {/* Back Wing Upper Facet */}
            <Path
              d="M 70 54 L 126 12 L 86 50 Z"
              fill={wingFoldDark}
              opacity={0.85}
            />
            {/* Back Wing Lower Facet */}
            <Path
              d="M 86 50 L 126 12 L 102 62 Z"
              fill={wingFoldDark}
              opacity={0.65}
            />

            {/* Origami Tail */}
            <Path
              d="M 88 52 L 122 42 L 82 66 Z"
              fill={tailColor}
              opacity={0.9}
            />

            {/* Center Body - Left Diamond Facet */}
            <Path
              d="M 70 54 L 46 50 L 68 84 Z"
              fill="url(#bodyGrad)"
            />
            {/* Center Body - Right Diamond Facet */}
            <Path
              d="M 70 54 L 92 50 L 68 84 Z"
              fill={bodyDark}
            />

            {/* Neck Fold */}
            <Path
              d="M 46 50 L 22 28 L 38 60 Z"
              fill={neckColor}
            />
            {/* Beak / Head fold */}
            <Path
              d="M 22 28 L 10 32 L 24 38 Z"
              fill={wingFoldDark}
            />

            {/* Front Wing - Main Lift Facet */}
            <Path
              d="M 70 54 L 20 8 L 52 50 Z"
              fill="url(#wingGrad)"
            />
            {/* Front Wing - Under Crease Fold */}
            <Path
              d="M 52 50 L 20 8 L 38 62 Z"
              fill={wingFoldLight}
            />

            {/* Crisp 1px Paper Crease Accent Lines */}
            <Path
              d="M 70 54 L 20 8 M 70 54 L 126 12 M 70 54 L 68 84 M 46 50 L 22 28"
              stroke="rgba(255, 255, 255, 0.45)"
              strokeWidth={1}
              fill="none"
            />
            <Path
              d="M 88 52 L 122 42 M 22 28 L 10 32"
              stroke="rgba(0, 0, 0, 0.15)"
              strokeWidth={0.8}
              fill="none"
            />
          </G>
        </Svg>
      </Animated.View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  craneWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  shadowContainer: {
    position: 'absolute',
    bottom: 2,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
});
