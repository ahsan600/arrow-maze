import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import Svg, { Path, G } from 'react-native-svg';
import { useTheme } from '../../theme/ThemeContext';

interface GameLogoProps {
  horizontal?: boolean;
}

/**
 * Origami Paper Craft Logo
 * Features a 3D folded paper arrow crest and layered paper cut-out typography.
 */
export const GameLogo: React.FC<GameLogoProps> = React.memo(({ horizontal = false }) => {
  const { theme, mode } = useTheme();
  const floatY = useSharedValue(0);

  React.useEffect(() => {
    floatY.value = withRepeat(
      withSequence(
        withTiming(-4, { duration: 1400, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 1400, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      true,
    );
  }, [floatY]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: floatY.value }],
  }));

  // Folded origami arrow badge
  const renderOrigamiArrowBadge = (size: number) => {
    return (
      <View
        style={[
          styles.badgeCard,
          {
            width: size,
            height: size,
            backgroundColor: theme.surface,
            borderColor: theme.border,
            borderTopColor: theme.creaseHighlight,
            shadowColor: theme.shadow,
          },
        ]}
      >
        <Svg width={size * 0.65} height={size * 0.65} viewBox="0 0 32 32">
          {/* Folded paper arrow in origami faceted triangles */}
          <G>
            {/* Arrow Stem: Left & Right fold facets */}
            <Path d="M 12 14 L 16 12 L 16 28 L 12 28 Z" fill={theme.arrow} />
            <Path d="M 16 12 L 20 14 L 20 28 L 16 28 Z" fill={theme.arrowCrease} />

            {/* Arrow Head: Left Wing & Right Wing */}
            <Path d="M 16 4 L 5 15 L 16 12 Z" fill={theme.primary} />
            <Path
              d="M 16 4 L 27 15 L 16 12 Z"
              fill={mode === 'dark' ? '#E59D1A' : '#C23D17'}
            />

            {/* Center Fold Crease Line */}
            <Path d="M 16 4 L 16 28" stroke="rgba(255,255,255,0.4)" strokeWidth={1} />
          </G>
        </Svg>
      </View>
    );
  };

  if (horizontal) {
    return (
      <View style={styles.horizontalRow}>
        <Animated.View style={[animatedStyle, { marginRight: 14 }]}>
          <Svg width={54} height={54} viewBox="0 0 64 64">
            {/* Top-left indigo chevron wing */}
            <Path d="M 46 8 L 16 26 L 28 34 L 58 16 Z" fill="#4F46E5" />
            {/* Bottom-left dark navy chevron wing */}
            <Path d="M 28 34 L 16 26 L 30 50 L 38 42 Z" fill="#1E1B4B" />
            {/* Forward right-pointing coral red triangle */}
            <Path d="M 24 22 L 58 38 L 24 54 Z" fill="#FF4B3A" />
          </Svg>
        </Animated.View>
        <View style={{ justifyContent: 'center' }}>
          <Text
            style={{
              fontSize: 26,
              fontWeight: '900',
              color: mode === 'dark' ? '#FFFFFF' : '#1E1B4B',
              letterSpacing: 1.5,
              lineHeight: 27,
            }}
          >
            ARROW
          </Text>
          <Text
            style={{
              fontSize: 26,
              fontWeight: '900',
              color: '#FF4B3A',
              letterSpacing: 1.5,
              lineHeight: 27,
            }}
          >
            AMAZE
          </Text>
        </View>
      </View>
    );
  }


  return (
    <View style={styles.verticalContainer}>
      <Animated.View style={[animatedStyle, { marginBottom: 16 }]}>
        {renderOrigamiArrowBadge(74)}
      </Animated.View>

      <View style={styles.cutoutTextLayer}>
        {/* Layered cut-out paper typography with offset shadow */}
        <Text style={[styles.cutoutBase, styles.largeTitle, { color: theme.shadow }]}>
          ARROW <Text style={{ color: theme.shadow }}>AMAZE</Text>
        </Text>
        <Text style={[styles.cutoutFront, styles.largeTitle, { color: theme.primaryText }]}>
          ARROW <Text style={{ color: theme.primary }}>AMAZE</Text>
        </Text>
      </View>

      {/* Small paper sub-stamp: "GO" */}
      <View
        style={[
          styles.goStampPill,
          {
            backgroundColor: theme.surface,
            borderColor: theme.primary,
          },
        ]}
      >
        <Text style={[styles.goStampText, { color: theme.primary }]}>ORIGAMI EDITION</Text>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  verticalContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 24,
  },
  horizontalRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badgeCard: {
    borderRadius: 16,
    borderWidth: 1.5,
    borderTopWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 4,
  },
  cutoutTextLayer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cutoutBase: {
    position: 'absolute',
    top: 2,
    left: 1.5,
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  cutoutFront: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  largeTitle: {
    fontSize: 34,
    letterSpacing: 2,
  },
  goStampPill: {
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1.5,
    borderStyle: 'dashed',
  },
  goStampText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
});
