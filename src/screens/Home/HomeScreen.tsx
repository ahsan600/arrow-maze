import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import Svg, { Path, Circle, G } from 'react-native-svg';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { GameLogo } from '../../components/icons/GameLogo';
import { LevelProgressCard } from '../../components/cards/LevelProgressCard';
import { PaperButton } from '../../components/buttons/PaperButton';
import { OrigamiStar } from '../../components/ui/StarsDisplay';
import { getProgress } from '../../storage/gameStorage';
import { GameProgress } from '../../types/game.types';
import { getNextIncompleteLevel } from '../../game/logic/levelLogic';
import { useTheme } from '../../theme/ThemeContext';

type RootStackParamList = {
  Home: undefined;
  LevelSelect: undefined;
  Game: { levelId: number };
  Settings: undefined;
  HowToPlay: undefined;
};

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/**
 * Paper Craft Layered Background
 * 3 layered parallax paper hills, paper sun/moon, and slowly drifting origami planes & cranes.
 */
const LayeredPaperScenery = ({ mode, theme }: { mode: 'white' | 'dark'; theme: any }) => {
  const driftAnim = useSharedValue(0);

  React.useEffect(() => {
    driftAnim.value = withRepeat(
      withTiming(1, { duration: 18000, easing: Easing.linear }),
      -1,
      false,
    );
  }, [driftAnim]);

  // Plane 1 drift
  const plane1Style = useAnimatedStyle(() => {
    const tx = interpolate(driftAnim.value, [0, 1], [-60, SCREEN_WIDTH + 60]);
    const ty = Math.sin(driftAnim.value * Math.PI * 2) * 8;
    return {
      transform: [{ translateX: tx }, { translateY: ty }],
    };
  });

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* Sun (Day) or Moon & Stars (Night) */}
      <View style={styles.celestialWrapper}>
        {mode === 'white' ? (
          <Svg width={74} height={74} viewBox="0 0 74 74">
            {/* Cut-out paper sun with ray teeth */}
            <Circle cx={37} cy={37} r={22} fill={theme.paperSun} />
            <Path
              d="M 37 4 L 37 10 M 37 64 L 37 70 M 4 37 L 10 37 M 64 37 L 70 37 M 14 14 L 18 18 M 56 56 L 60 60 M 14 60 L 18 56 M 56 18 L 60 14"
              stroke={theme.paperSun}
              strokeWidth={3}
              strokeLinecap="round"
            />
            {/* Sun center crease */}
            <Circle cx={37} cy={37} r={14} fill="rgba(255,255,255,0.25)" />
          </Svg>
        ) : (
          <Svg width={74} height={74} viewBox="0 0 74 74">
            {/* Paper crescent moon */}
            <Path
              d="M 44 14 C 30 16 20 28 22 42 C 24 54 34 62 46 60 C 34 62 22 52 22 38 C 22 24 32 16 44 14 Z"
              fill={theme.paperSun}
            />
            {/* Star punch-outs */}
            <Circle cx={12} cy={22} r={1.5} fill="#FFF" opacity={0.7} />
            <Circle cx={28} cy={12} r={2} fill="#FFF" opacity={0.8} />
            <Circle cx={58} cy={28} r={1.5} fill="#FFF" opacity={0.6} />
            <Circle cx={64} cy={48} r={2} fill="#FFF" opacity={0.75} />
          </Svg>
        )}
      </View>

      {/* Drifting Origami Plane */}
      <Animated.View style={[styles.driftingPlane, plane1Style]}>
        <Svg width={28} height={28} viewBox="0 0 24 24">
          <Path
            d="M 2 12 L 22 2 L 12 22 L 10 14 Z M 10 14 L 22 2"
            fill={mode === 'dark' ? '#F6EFE4' : '#FFFDF8'}
            stroke={theme.border}
            strokeWidth={1}
            opacity={0.75}
          />
        </Svg>
      </Animated.View>

      {/* Layered Paper Hills at bottom of screen */}
      <View style={styles.hillsContainer}>
        {/* Hill 1 (Back) */}
        <Svg width="100%" height={160} viewBox="0 0 400 160" preserveAspectRatio="none" style={styles.hillBack}>
          <Path d="M 0 160 L 0 50 Q 120 10 260 60 Q 340 90 400 40 L 400 160 Z" fill={theme.hill1} />
        </Svg>

        {/* Hill 2 (Middle with paper shadow) */}
        <Svg width="100%" height={130} viewBox="0 0 400 130" preserveAspectRatio="none" style={styles.hillMiddle}>
          <Path d="M 0 130 L 0 40 Q 140 85 280 30 Q 350 5 400 35 L 400 130 Z" fill={theme.hill2} />
          {/* Top crease highlight */}
          <Path d="M 0 40 Q 140 85 280 30 Q 350 5 400 35" stroke={theme.creaseHighlight} strokeWidth={1.5} fill="none" />
        </Svg>

        {/* Hill 3 (Front with paper shadow) */}
        <Svg width="100%" height={90} viewBox="0 0 400 90" preserveAspectRatio="none" style={styles.hillFront}>
          <Path d="M 0 90 L 0 35 Q 160 5 290 45 Q 360 65 400 30 L 400 90 Z" fill={theme.hill3} />
          <Path d="M 0 35 Q 160 5 290 45 Q 360 65 400 30" stroke={theme.creaseHighlight} strokeWidth={1.5} fill="none" />
        </Svg>
      </View>
    </View>
  );
};

export const HomeScreen: React.FC = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const { theme, mode } = useTheme();
  const [progress, setProgress] = useState<GameProgress | null>(null);

  const loadProgress = useCallback(async () => {
    const data = await getProgress();
    setProgress(data);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadProgress();
    }, [loadProgress]),
  );

  const handlePlay = useCallback(() => {
    if (progress) {
      const targetLevel = getNextIncompleteLevel(progress, 100);
      navigation.navigate('Game', { levelId: targetLevel });
    }
  }, [progress, navigation]);

  const activeLevel = progress ? getNextIncompleteLevel(progress, 100) : 1;

  // Calculate total earned stars
  const totalStars = progress?.bestScores
    ? Object.values(progress.bestScores).reduce((a, b) => a + b, 0)
    : 0;

  return (
    <ScreenContainer style={styles.container}>
      {/* 3 Layered Paper Hills Scenery */}
      <LayeredPaperScenery mode={mode} theme={theme} />

      {/* Top Bar: Stars Hanko Badge & Current Level Stamp */}
      <View style={styles.topBar}>
        {/* Origami Star Counter Badge */}
        <View
          style={[
            styles.paperPill,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
              borderTopColor: theme.creaseHighlight,
              shadowColor: theme.shadow,
            },
          ]}
        >
          <OrigamiStar active={true} size={18} fillColor={theme.goldStar} />
          <Text style={[styles.starCountText, { color: theme.primaryText }]}>
            {totalStars}
          </Text>
        </View>

        {/* Round Hanko Paper Stamp Badge */}
        <View
          style={[
            styles.hankoStampBadge,
            {
              backgroundColor: theme.surface,
              borderColor: theme.primary,
              shadowColor: theme.shadow,
            },
          ]}
        >
          <Text style={[styles.hankoLevelNumber, { color: theme.primary }]}>
            #{activeLevel}
          </Text>
        </View>
      </View>

      {/* Brand Logo */}
      <View style={styles.logoContainer}>
        <GameLogo horizontal={true} />
      </View>

      {/* Active Puzzle Sticky Note Card */}
      <View style={styles.cardContainer}>
        <LevelProgressCard currentLevel={activeLevel} totalLevels={100} />
      </View>

      <View style={{ flex: 1 }} />

      {/* Main Play Action Button (Breathing animation) */}
      <View style={styles.playButtonWrapper}>
        <PaperButton
          title="PLAY"
          subtitle={`LEVEL ${activeLevel}`}
          variant="primary"
          radiusSize="xl"
          breathing={true}
          fullWidth
          onPress={handlePlay}
          style={styles.mainPlayBtn}
        />
      </View>

      {/* Secondary Actions: Paper Tag Buttons on Strings */}
      <View style={styles.tagButtonsRow}>
        <PaperButton
          title="Levels"
          variant="tag"
          radiusSize="sm"
          onPress={() => navigation.navigate('LevelSelect')}
          style={styles.tagBtn}
        />
        <PaperButton
          title="Guide"
          variant="tag"
          radiusSize="sm"
          onPress={() => navigation.navigate('HowToPlay')}
          style={styles.tagBtn}
        />
        <PaperButton
          title="Settings"
          variant="tag"
          radiusSize="sm"
          onPress={() => navigation.navigate('Settings')}
          style={styles.tagBtn}
        />
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    justifyContent: 'space-between',
    paddingBottom: 24,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    zIndex: 10,
  },
  paperPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderTopWidth: 2,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.16,
    shadowRadius: 6,
    elevation: 3,
  },
  starCountText: {
    fontSize: 14,
    fontWeight: '800',
  },
  hankoStampBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.14,
    shadowRadius: 6,
    elevation: 3,
  },
  hankoLevelNumber: {
    fontSize: 13,
    fontWeight: '900',
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 8,
    zIndex: 10,
  },
  cardContainer: {
    alignItems: 'center',
    marginTop: 10,
    zIndex: 10,
  },
  playButtonWrapper: {
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 8,
    marginBottom: 14,
    zIndex: 10,
  },
  mainPlayBtn: {
    minHeight: 58,
  },
  tagButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 4,
    zIndex: 10,
  },
  tagBtn: {
    flex: 1,
    marginHorizontal: 4,
    minHeight: 46,
    paddingHorizontal: 12,
  },
  celestialWrapper: {
    position: 'absolute',
    top: 50,
    right: 20,
    opacity: 0.9,
  },
  driftingPlane: {
    position: 'absolute',
    top: 130,
    left: 0,
  },
  hillsContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 180,
  },
  hillBack: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  hillMiddle: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  hillFront: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
});
