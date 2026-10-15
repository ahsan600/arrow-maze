import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import Svg, { Path, Circle, G, Line } from 'react-native-svg';

export interface TutorialPointerProps {
  targetX: number;
  targetY: number;
  theme: any;
  mode?: 'dark' | 'white';
}

/**
 * Handcrafted Vector Origami Pointer
 * Displays an animated pointing finger tapping the arrow with a pulsing touch ripple
 * and a floating "Tap an arrow" speech banner.
 */
export const TutorialPointer: React.FC<TutorialPointerProps> = ({
  targetX,
  targetY,
  theme,
  mode = 'white',
}) => {
  // Animated tap motion (moves up to tap the arrow and rebounds)
  const tapY = useSharedValue(0);
  const tapScale = useSharedValue(1);
  const rippleScale = useSharedValue(0.6);
  const rippleOpacity = useSharedValue(0.85);

  useEffect(() => {
    tapY.value = withRepeat(
      withSequence(
        withTiming(-10, { duration: 420, easing: Easing.bezier(0.25, 0.1, 0.25, 1) }),
        withTiming(0, { duration: 380, easing: Easing.bezier(0.25, 0.1, 0.25, 1) }),
        withTiming(0, { duration: 250 }),
      ),
      -1,
      false,
    );

    tapScale.value = withRepeat(
      withSequence(
        withTiming(1.08, { duration: 420 }),
        withTiming(0.95, { duration: 180 }),
        withTiming(1.0, { duration: 200 }),
        withTiming(1.0, { duration: 250 }),
      ),
      -1,
      false,
    );

    rippleScale.value = withRepeat(
      withSequence(
        withTiming(0.6, { duration: 200 }),
        withTiming(2.2, { duration: 700, easing: Easing.out(Easing.quad) }),
        withTiming(0.6, { duration: 150 }),
      ),
      -1,
      false,
    );

    rippleOpacity.value = withRepeat(
      withSequence(
        withTiming(0.85, { duration: 200 }),
        withTiming(0, { duration: 700, easing: Easing.out(Easing.quad) }),
        withTiming(0, { duration: 150 }),
      ),
      -1,
      false,
    );
  }, [tapY, tapScale, rippleScale, rippleOpacity]);

  const animatedHandStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: tapY.value },
      { scale: tapScale.value },
    ],
  }));

  const animatedRippleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: rippleScale.value }],
    opacity: rippleOpacity.value,
  }));

  const handFill = mode === 'dark' ? '#F59E0B' : '#FBBF24';
  const handStroke = mode === 'dark' ? '#92400E' : '#78350F';
  const creaseColor = mode === 'dark' ? '#B45309' : '#8C4A26';

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* Tooltip Badge: "Tap an arrow" */}
      <View
        style={[
          styles.tooltipBadge,
          {
            left: Math.max(6, targetX - 70),
            top: Math.max(4, targetY - 52),
            backgroundColor: theme.primary,
            shadowColor: theme.shadow,
          },
        ]}
      >
        <Text style={[styles.tooltipText, { color: theme.primaryButtonText }]}>
          Tap an arrow
        </Text>
        {/* Downward triangle pointer on the tooltip */}
        <View style={[styles.tooltipTail, { borderTopColor: theme.primary }]} />
      </View>

      {/* Pulsing Touch Ripple at the fingertip */}
      <Animated.View
        style={[
          styles.rippleContainer,
          {
            left: targetX - 20,
            top: targetY - 4,
          },
          animatedRippleStyle,
        ]}
      >
        <Svg width={40} height={40} viewBox="0 0 40 40">
          <Circle
            cx={20}
            cy={20}
            r={16}
            fill="none"
            stroke={theme.primary}
            strokeWidth={2.5}
            strokeDasharray="4 3"
          />
        </Svg>
      </Animated.View>

      {/* Vector Pointing Hand (Full silhouette, never clipped) */}
      <Animated.View
        style={[
          styles.handContainer,
          {
            left: targetX - 28,
            top: targetY + 2,
          },
          animatedHandStyle,
        ]}
      >
        <Svg width={56} height={64} viewBox="0 0 32 36">
          {/* Subtle drop shadow outline for depth */}
          <Path
            d="M 14 14 L 14 5 A 2 2 0 0 1 18 5 L 18 10.5 A 1.8 1.8 0 0 1 21.5 10.5 L 21.5 12 A 1.8 1.8 0 0 1 25 12 L 25 14 A 1.8 1.8 0 0 1 28 14 L 28 18 C 28 23 25 27 20 27 L 17 27 C 13.5 27 11 25 10 22.5 L 8.5 18.5 C 8 17.3 8.7 16 10 16 C 10.7 16 11.3 16.5 11.7 17.3 L 14 20 Z"
            fill="rgba(0, 0, 0, 0.18)"
            transform="translate(1, 2)"
          />

          {/* Main Hand Silhouette */}
          <Path
            d="M 14 14 L 14 5 A 2 2 0 0 1 18 5 L 18 10.5 A 1.8 1.8 0 0 1 21.5 10.5 L 21.5 12 A 1.8 1.8 0 0 1 24.8 12 L 24.8 14 A 1.8 1.8 0 0 1 28 14 L 28 18 C 28 23 25 27 20 27 L 17 27 C 13.5 27 11 25 10 22.5 L 8.5 18.5 C 8 17.3 8.7 16 10 16 C 10.7 16 11.3 16.5 11.7 17.3 L 14 20 Z"
            fill={handFill}
            stroke={handStroke}
            strokeWidth={1.4}
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {/* Finger separation creases */}
          <Path
            d="M 18 10.5 L 18 17"
            stroke={creaseColor}
            strokeWidth={1.2}
            strokeLinecap="round"
          />
          <Path
            d="M 21.5 12 L 21.5 17.5"
            stroke={creaseColor}
            strokeWidth={1.2}
            strokeLinecap="round"
          />
          <Path
            d="M 24.8 14 L 24.8 18"
            stroke={creaseColor}
            strokeWidth={1.2}
            strokeLinecap="round"
          />

          {/* Thumb joint fold */}
          <Path
            d="M 11.7 17.3 C 12.8 18.5 14.5 19.5 16.5 19.5"
            stroke={creaseColor}
            strokeWidth={1.2}
            strokeLinecap="round"
          />

          {/* Paper origami center highlight crease on index finger */}
          <Line
            x1="16"
            y1="5.5"
            x2="16"
            y2="13.5"
            stroke="rgba(255, 255, 255, 0.75)"
            strokeWidth={1.1}
            strokeLinecap="round"
          />

          {/* Small touch dot at the fingertip */}
          <Circle cx="16" cy="5" r="1.5" fill="rgba(255, 255, 255, 0.9)" />
        </Svg>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  tooltipBadge: {
    position: 'absolute',
    width: 140,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 6,
    zIndex: 110,
  },
  tooltipText: {
    fontWeight: '800',
    fontSize: 14,
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  tooltipTail: {
    position: 'absolute',
    bottom: -6,
    left: '50%',
    marginLeft: -6,
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 6,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  rippleContainer: {
    position: 'absolute',
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 95,
  },
  handContainer: {
    position: 'absolute',
    width: 56,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
});
