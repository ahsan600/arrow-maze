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
import Svg, { Path, Ellipse, G } from 'react-native-svg';
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
  const { mode } = useTheme();
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
  const width = size;
  const height = size * 0.85;

  return (
    <View style={[styles.container, { width, height: height + 24 }]}>
      {/* Dynamic Soft Drop Shadow */}
      <Animated.View style={[styles.shadowContainer, shadowStyle]}>
        <Svg width={width * 0.75} height={18} viewBox="0 0 100 18">
          <Ellipse cx="50" cy="9" rx="44" ry="6" fill={isDark ? 'rgba(0,0,0,0.3)' : 'rgba(99, 102, 241, 0.12)'} />
        </Svg>
      </Animated.View>

      {/* Floating Crane Origami Sculpture */}
      <Animated.View style={[styles.craneWrapper, craneStyle]}>
        <Svg width={width} height={height} viewBox="0 0 140 105">
          <G>
            {/* 1. Left Lower Wing Underfolds (Deep Indigo/Navy) */}
            <Path d="M 38 56 L 68 76 L 54 68 Z" fill="#1E3A8A" />
            <Path d="M 20 48 L 54 68 L 34 68 Z" fill="#2563EB" />

            {/* 2. Left Main Wing (Royal Blue & Cobalt) */}
            <Path d="M 68 54 L 6 42 L 50 64 Z" fill="#3B82F6" />
            <Path d="M 50 64 L 6 42 L 32 72 Z" fill="#1D4ED8" />

            {/* 3. Tall Upper Wing (Yellow & Gold) */}
            {/* Left facet of upper wing (Orange/Amber) */}
            <Path d="M 68 54 L 54 4 L 68 34 Z" fill="#F97316" />
            {/* Center-left facet */}
            <Path d="M 68 34 L 54 4 L 76 38 Z" fill="#F59E0B" />
            {/* Right facet of upper wing (Bright Golden Yellow) */}
            <Path d="M 76 38 L 54 4 L 88 48 Z" fill="#FBBF24" />

            {/* 4. Center Body Fold (Vibrant Red & Coral) */}
            <Path d="M 68 54 L 54 62 L 72 82 Z" fill="#EF4444" />
            <Path d="M 68 54 L 72 82 L 84 62 Z" fill="#DC2626" />

            {/* 5. Right Neck & Head (Golden Amber & Coral Red with dark beak) */}
            {/* Back neck fold */}
            <Path d="M 84 62 L 102 38 L 86 48 Z" fill="#F59E0B" />
            {/* Front neck fold */}
            <Path d="M 84 62 L 116 42 L 102 38 Z" fill="#FBBF24" />
            {/* Neck lower facet */}
            <Path d="M 84 62 L 96 74 L 116 42 Z" fill="#EA580C" />
            {/* Head fold */}
            <Path d="M 116 42 L 128 48 L 120 54 Z" fill="#EF4444" />
            {/* Beak / Tip */}
            <Path d="M 128 48 L 130 51 L 120 54 Z" fill="#1E3A8A" />

            {/* Subtle crease highlight */}
            <Path
              d="M 68 54 L 54 4 M 68 54 L 6 42 M 68 54 L 72 82"
              stroke="rgba(255, 255, 255, 0.45)"
              strokeWidth={1}
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
