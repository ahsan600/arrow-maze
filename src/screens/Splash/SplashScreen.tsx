import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withRepeat,
  withSequence,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { useTheme } from '../../theme/ThemeContext';
import { getProgress } from '../../storage/gameStorage';
import { OrigamiCrane } from '../../components/origami/OrigamiCrane';

type RootStackParamList = {
  Splash: undefined;
  Home: undefined;
};

type SplashScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Splash'>;

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

/**
 * Modern Clean Origami Splash Screen
 * Features:
 * - Pure white background with soft lavender organic corner wave accents
 * - Bold Arrow Amaze emblem and typography with "Think • Follow • Solve" tagline
 * - Vibrantly faceted 3D Origami Crane with floating breathing animation & sparkle stars
 * - 4-dot step loading indicator with coral-red active dot
 */
export const SplashScreen: React.FC = () => {
  const navigation = useNavigation<SplashScreenNavigationProp>();
  const { mode } = useTheme();

  // Animations
  const contentFade = useSharedValue(0);
  const craneScale = useSharedValue(0.85);
  const screenFade = useSharedValue(1);

  useEffect(() => {
    // 1. Content gentle entrance
    contentFade.value = withTiming(1, { duration: 800, easing: Easing.out(Easing.quad) });
    craneScale.value = withTiming(1, { duration: 900, easing: Easing.out(Easing.back(1.2)) });

    // 2. Hydrate & navigate
    const init = async () => {
      await Promise.all([
        new Promise<void>(resolve => setTimeout(() => resolve(), 2200)),
        getProgress(),
      ]);

      screenFade.value = withTiming(0, { duration: 350 });
      setTimeout(() => {
        navigation.replace('Home');
      }, 350);
    };

    init();
  }, [contentFade, craneScale, screenFade, navigation]);

  const contentAnimatedStyle = useAnimatedStyle(() => ({
    opacity: contentFade.value,
    transform: [{ translateY: interpolate(contentFade.value, [0, 1], [20, 0]) }],
  }));

  const craneAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: craneScale.value }],
  }));

  const screenAnimatedStyle = useAnimatedStyle(() => ({
    opacity: screenFade.value,
  }));

  const isDark = mode === 'dark';
  const bgColor = isDark ? '#1E1B4B' : '#FFFFFF';

  return (
    <Animated.View style={[styles.container, { backgroundColor: bgColor }, screenAnimatedStyle]}>
      {/* Top-Left Soft Lavender Organic Wave Accent */}
      <View style={styles.topLeftWave} pointerEvents="none">
        <Svg width={180} height={200} viewBox="0 0 180 200">
          <Path
            d="M 0 0 L 160 0 C 130 60 70 90 60 140 C 50 180 20 190 0 200 Z"
            fill={isDark ? 'rgba(99, 102, 241, 0.12)' : 'rgba(224, 231, 255, 0.45)'}
          />
          <Path
            d="M 0 0 L 120 0 C 90 50 40 70 30 110 C 20 140 10 150 0 160 Z"
            fill={isDark ? 'rgba(99, 102, 241, 0.18)' : 'rgba(238, 242, 255, 0.6)'}
          />
        </Svg>
      </View>

      {/* Bottom-Right Soft Lavender Organic Wave Accent */}
      <View style={styles.bottomRightWave} pointerEvents="none">
        <Svg width={200} height={200} viewBox="0 0 200 200">
          <Path
            d="M 200 200 L 200 60 C 150 70 120 120 70 140 C 30 155 10 180 0 200 Z"
            fill={isDark ? 'rgba(99, 102, 241, 0.12)' : 'rgba(224, 231, 255, 0.35)'}
          />
          <Path
            d="M 200 200 L 200 110 C 160 120 135 150 95 170 C 65 185 40 195 0 200 Z"
            fill="none"
            stroke={isDark ? 'rgba(99, 102, 241, 0.25)' : 'rgba(199, 210, 254, 0.6)'}
            strokeWidth={1.5}
          />
        </Svg>
      </View>

      {/* Main Content Area */}
      <Animated.View style={[styles.mainContent, contentAnimatedStyle]}>
        {/* Brand Header Section */}
        <View style={styles.brandSection}>
          {/* Folded Geometric Origami Arrow Emblem (Enlarged) */}
          <View style={styles.emblemContainer}>
            <Svg width={92} height={92} viewBox="0 0 64 64">
              {/* Top-left indigo chevron wing */}
              <Path d="M 46 8 L 16 26 L 28 34 L 58 16 Z" fill="#4F46E5" />
              {/* Bottom-left dark navy chevron wing */}
              <Path d="M 28 34 L 16 26 L 30 50 L 38 42 Z" fill="#1E1B4B" />
              {/* Forward right-pointing coral red triangle */}
              <Path d="M 24 22 L 58 38 L 24 54 Z" fill="#FF4B3A" />
            </Svg>
          </View>

          {/* Large Bold Brand Title (Enlarged) */}
          <Text style={[styles.titleLineOne, { color: isDark ? '#FFFFFF' : '#1E1B4B' }]}>
            ARROW
          </Text>
          <Text style={styles.titleLineTwo}>
            AMAZE
          </Text>

          {/* Subtitle / Tagline (Enlarged) */}
          <Text style={[styles.tagline, { color: isDark ? '#94A3B8' : '#64748B' }]}>
            Think • Follow • Solve
          </Text>
        </View>

        {/* Centerpiece: Enlarged Multi-Color Faceted Origami Crane with Sparkle Stars */}
        <Animated.View style={[styles.craneSection, craneAnimatedStyle]}>
          {/* Left Sparkle Star */}
          <Svg width={32} height={32} viewBox="0 0 24 24" style={styles.leftSparkle}>
            <Path
              d="M 12 0 C 12 7 17 12 24 12 C 17 12 12 17 12 24 C 12 17 7 12 0 12 C 7 12 12 7 12 0 Z"
              fill={isDark ? '#818CF8' : '#C7D2FE'}
            />
          </Svg>

          {/* Animated 3D Faceted Origami Crane (Enlarged to 270) */}
          <OrigamiCrane size={270} />

          {/* Right Sparkle Star */}
          <Svg width={24} height={24} viewBox="0 0 24 24" style={styles.rightSparkle}>
            <Path
              d="M 12 0 C 12 7 17 12 24 12 C 17 12 12 17 12 24 C 12 17 7 12 0 12 C 7 12 12 7 12 0 Z"
              fill={isDark ? '#818CF8' : '#C7D2FE'}
            />
          </Svg>
        </Animated.View>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topLeftWave: {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 1,
  },
  bottomRightWave: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    zIndex: 1,
  },
  mainContent: {
    alignItems: 'center',
    justifyContent: 'space-evenly',
    height: '84%',
    zIndex: 10,
    width: '100%',
    paddingVertical: 20,
  },
  brandSection: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emblemContainer: {
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleLineOne: {
    fontSize: 44,
    fontWeight: '900',
    letterSpacing: 2.5,
    lineHeight: 48,
    textAlign: 'center',
  },
  titleLineTwo: {
    fontSize: 44,
    fontWeight: '900',
    color: '#FF4B3A',
    letterSpacing: 2.5,
    lineHeight: 48,
    textAlign: 'center',
  },
  tagline: {
    fontSize: 19,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginTop: 12,
    textAlign: 'center',
  },
  craneSection: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    width: 330,
    height: 270,
  },
  leftSparkle: {
    position: 'absolute',
    top: 8,
    left: 0,
    zIndex: 5,
  },
  rightSparkle: {
    position: 'absolute',
    top: 14,
    right: 0,
    zIndex: 5,
  },
});


