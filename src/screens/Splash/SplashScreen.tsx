import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import Svg, { Path, G, Rect } from 'react-native-svg';
import { useTheme } from '../../theme/ThemeContext';
import { getProgress } from '../../storage/gameStorage';

type RootStackParamList = {
  Splash: undefined;
  Home: undefined;
};

type SplashScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Splash'>;

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/**
 * Paper Craft Origami Splash Screen
 * 1. Sheet folds through 3 progressive origami steps into the arrow logo.
 * 2. An origami paper plane glides across the screen in a swooping curve.
 * 3. Cut-out paper logo text fades in.
 * 4. A torn-paper progress bar hydrates progress before navigating to Home.
 */
export const SplashScreen: React.FC = () => {
  const navigation = useNavigation<SplashScreenNavigationProp>();
  const { theme, mode } = useTheme();

  // Animation values
  const foldProgress = useSharedValue(0);     // 0 -> 1 (3 folds)
  const planeProgress = useSharedValue(0);    // 0 -> 1 (paper plane glide)
  const logoOpacity = useSharedValue(0);      // 0 -> 1
  const tornProgress = useSharedValue(0);     // 0 -> 1
  const screenOpacity = useSharedValue(1);    // fade out

  useEffect(() => {
    // 1. Fold animation over 1200ms
    foldProgress.value = withTiming(1, {
      duration: 1200,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    });

    // 2. Paper plane glide starting at 900ms
    planeProgress.value = withDelay(
      800,
      withTiming(1, {
        duration: 1000,
        easing: Easing.out(Easing.quad),
      }),
    );

    // 3. Logo text reveal at 1000ms
    logoOpacity.value = withDelay(900, withTiming(1, { duration: 600 }));

    // 4. Hydration & progress strip
    tornProgress.value = withTiming(1, { duration: 1800 });

    const init = async () => {
      await Promise.all([
        new Promise<void>(resolve => setTimeout(() => resolve(), 2000)), // minimum 1.8s
        getProgress(),
      ]);

      screenOpacity.value = withTiming(0, { duration: 300 });
      setTimeout(() => {
        navigation.replace('Home');
      }, 300);
    };

    init();
  }, [foldProgress, planeProgress, logoOpacity, tornProgress, screenOpacity, navigation]);

  // Paper plane flight curve
  const planeStyle = useAnimatedStyle(() => {
    const p = planeProgress.value;
    const tx = interpolate(p, [0, 1], [-80, SCREEN_WIDTH + 80]);
    const ty = interpolate(p, [0, 0.5, 1], [180, -40, -120]);
    const rot = interpolate(p, [0, 0.4, 1], [-15, -28, -20]);
    const op = interpolate(p, [0, 0.1, 0.85, 1], [0, 1, 1, 0]);

    return {
      transform: [
        { translateX: tx },
        { translateY: ty },
        { rotate: `${rot}deg` },
      ],
      opacity: op,
    };
  });

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ translateY: interpolate(logoOpacity.value, [0, 1], [15, 0]) }],
  }));

  const screenStyle = useAnimatedStyle(() => ({
    opacity: screenOpacity.value,
  }));

  const tornBarStyle = useAnimatedStyle(() => ({
    width: `${tornProgress.value * 100}%`,
  }));

  return (
    <Animated.View style={[styles.container, { backgroundColor: theme.appBackground }, screenStyle]}>
      {/* Gliding Origami Paper Plane */}
      <Animated.View style={[styles.glidingPlane, planeStyle]}>
        <Svg width={48} height={48} viewBox="0 0 32 32">
          {/* 3D Paper Plane with Left/Right fold facets */}
          <G>
            <Path d="M 28 4 L 4 18 L 14 20 Z" fill={mode === 'dark' ? '#F6EFE4' : '#FFFDF8'} />
            <Path d="M 28 4 L 14 20 L 20 28 Z" fill={mode === 'dark' ? '#D4CCBE' : '#E6DEC8'} />
            <Path d="M 14 20 L 17 24 L 20 22 Z" fill={theme.crease} />
            <Path d="M 28 4 L 14 20" stroke={theme.border} strokeWidth={1} />
          </G>
        </Svg>
      </Animated.View>

      {/* Main Origami Crest Card */}
      <View
        style={[
          styles.origamiCard,
          {
            backgroundColor: theme.surface,
            borderColor: theme.border,
            borderTopColor: theme.creaseHighlight,
            shadowColor: theme.shadow,
          },
        ]}
      >
        <Svg width={88} height={88} viewBox="0 0 40 40">
          <G>
            {/* Fold 1 & 2: Base stem origami folds */}
            <Path d="M 15 17 L 20 14 L 20 34 L 15 34 Z" fill={theme.arrow} />
            <Path d="M 20 14 L 25 17 L 25 34 L 20 34 Z" fill={theme.arrowCrease} />

            {/* Fold 3: Head wings */}
            <Path d="M 20 5 L 6 18 L 20 14 Z" fill={theme.primary} />
            <Path
              d="M 20 5 L 34 18 L 20 14 Z"
              fill={mode === 'dark' ? '#E59D1A' : '#C23D17'}
            />

            {/* Sharp center fold crease line */}
            <Path d="M 20 5 L 20 34" stroke="rgba(255,255,255,0.4)" strokeWidth={1.2} />
          </G>
        </Svg>
      </View>

      {/* Layered Cut-Out Typography */}
      <Animated.View style={[styles.textBlock, logoStyle]}>
        <View style={styles.cutoutStack}>
          {/* Shadow layer */}
          <Text style={[styles.title, styles.titleShadow, { color: theme.shadow }]}>
            Arrow Amaze Go
          </Text>
          {/* Top paper layer */}
          <Text style={[styles.title, { color: theme.primaryText }]}>
            Arrow Amaze Go
          </Text>
        </View>
        <Text style={[styles.subTitle, { color: theme.mutedText }]}>
          HANDCRAFTED ORIGAMI PUZZLE
        </Text>
      </Animated.View>

      {/* Torn-Paper Progress Strip */}
      <View style={styles.tornStripContainer}>
        <View
          style={[
            styles.tornTrack,
            {
              backgroundColor: mode === 'dark' ? '#26243F' : '#E6DEC8',
              borderColor: theme.border,
            },
          ]}
        >
          <Animated.View
            style={[
              styles.tornFill,
              { backgroundColor: theme.primary },
              tornBarStyle,
            ]}
          >
            {/* Torn zigzag paper edge at head of progress */}
            <Svg width={12} height={8} viewBox="0 0 12 8" style={styles.tornEdgeSvg}>
              <Path d="M 0 0 L 6 8 L 12 0 Z" fill={theme.primary} />
            </Svg>
          </Animated.View>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  glidingPlane: {
    position: 'absolute',
    top: '36%',
    left: 0,
    zIndex: 20,
  },
  origamiCard: {
    width: 120,
    height: 120,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderTopWidth: 2,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 6,
    marginBottom: 24,
  },
  textBlock: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  cutoutStack: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleShadow: {
    position: 'absolute',
    top: 2.5,
    left: 1.5,
  },
  title: {
    fontSize: 30,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  subTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2,
    marginTop: 8,
  },
  tornStripContainer: {
    position: 'absolute',
    bottom: 48,
    width: '65%',
    maxWidth: 240,
    alignItems: 'center',
  },
  tornTrack: {
    width: '100%',
    height: 8,
    borderRadius: 4,
    borderWidth: 1,
    overflow: 'hidden',
  },
  tornFill: {
    height: '100%',
    position: 'relative',
    borderRadius: 3,
  },
  tornEdgeSvg: {
    position: 'absolute',
    right: -4,
    top: 0,
  },
});
