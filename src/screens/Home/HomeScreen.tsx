import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
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
import Svg, { Path, Circle, Rect, Line, G } from 'react-native-svg';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { GameLogo } from '../../components/icons/GameLogo';
import { LevelProgressCard } from '../../components/cards/LevelProgressCard';
import { PaperButton } from '../../components/buttons/PaperButton';
import { OrigamiStar } from '../../components/ui/StarsDisplay';
import { getProgress } from '../../storage/gameStorage';
import { GameProgress } from '../../types/game.types';
import { getNextIncompleteLevel } from '../../game/logic/levelLogic';
import { useTheme } from '../../theme/ThemeContext';
import { stageOf, tierOf, TIERS, shapeFor, prefetchLevels } from '../../game/levels/proceduralEngine';

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
 * 3 layered parallax paper hills, paper sun/moon, and slowly drifting origami planes.
 */
const LayeredPaperScenery = ({ mode, theme }: { mode: 'white' | 'dark'; theme: any }) => {
  const driftAnim = useSharedValue(0);

  React.useEffect(() => {
    driftAnim.value = withRepeat(
      withTiming(1, { duration: 22000, easing: Easing.linear }),
      -1,
      false,
    );
  }, [driftAnim]);

  // Plane drift
  const plane1Style = useAnimatedStyle(() => {
    const tx = interpolate(driftAnim.value, [0, 1], [-60, SCREEN_WIDTH + 60]);
    const ty = Math.sin(driftAnim.value * Math.PI * 2) * 6;
    return {
      transform: [{ translateX: tx }, { translateY: ty }],
    };
  });

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* Sun (Day) or Moon & Stars (Night) placed neatly in the high sky */}
      <View style={styles.celestialWrapper}>
        {mode === 'white' ? (
          <Svg width={58} height={58} viewBox="0 0 60 60">
            {/* Cut-out paper sun with ray teeth */}
            <Circle cx={30} cy={30} r={17} fill={theme.paperSun} />
            <Path
              d="M 30 4 L 30 9 M 30 51 L 30 56 M 4 30 L 9 30 M 51 30 L 56 30 M 12 12 L 15 15 M 45 45 L 48 48 M 12 48 L 15 45 M 45 15 L 48 12"
              stroke={theme.paperSun}
              strokeWidth={2.5}
              strokeLinecap="round"
            />
            {/* Sun center crease */}
            <Circle cx={30} cy={30} r={11} fill="rgba(255,255,255,0.3)" />
          </Svg>
        ) : (
          <Svg width={58} height={58} viewBox="0 0 60 60">
            {/* Paper crescent moon */}
            <Path
              d="M 38 10 C 26 12 17 22 19 35 C 20 45 28 52 39 50 C 28 51 18 42 18 31 C 18 19 27 12 38 10 Z"
              fill={theme.paperSun}
            />
            {/* Star punch-outs */}
            <Circle cx={10} cy={16} r={1.5} fill="#FFF" opacity={0.65} />
            <Circle cx={22} cy={8} r={1.8} fill="#FFF" opacity={0.75} />
            <Circle cx={48} cy={20} r={1.5} fill="#FFF" opacity={0.6} />
            <Circle cx={52} cy={38} r={1.8} fill="#FFF" opacity={0.7} />
          </Svg>
        )}
      </View>

      {/* Drifting Origami Plane */}
      <Animated.View style={[styles.driftingPlane, plane1Style]}>
        <Svg width={24} height={24} viewBox="0 0 24 24">
          <Path
            d="M 2 12 L 22 2 L 12 22 L 10 14 Z M 10 14 L 22 2"
            fill={mode === 'dark' ? '#F6EFE4' : '#FFFDF8'}
            stroke={theme.border}
            strokeWidth={1}
            opacity={0.65}
          />
        </Svg>
      </Animated.View>

      {/* Layered Paper Hills at bottom of screen */}
      <View style={styles.hillsContainer}>
        {/* Hill 1 (Back) */}
        <Svg width="100%" height={140} viewBox="0 0 400 140" preserveAspectRatio="none" style={styles.hillBack}>
          <Path d="M 0 140 L 0 45 Q 120 10 260 55 Q 340 85 400 35 L 400 140 Z" fill={theme.hill1} />
        </Svg>

        {/* Hill 2 (Middle with paper shadow) */}
        <Svg width="100%" height={115} viewBox="0 0 400 115" preserveAspectRatio="none" style={styles.hillMiddle}>
          <Path d="M 0 115 L 0 35 Q 140 75 280 25 Q 350 5 400 30 L 400 115 Z" fill={theme.hill2} />
          <Path d="M 0 35 Q 140 75 280 25 Q 350 5 400 30" stroke={theme.creaseHighlight} strokeWidth={1.5} fill="none" />
        </Svg>

        {/* Hill 3 (Front with paper shadow) */}
        <Svg width="100%" height={80} viewBox="0 0 400 80" preserveAspectRatio="none" style={styles.hillFront}>
          <Path d="M 0 80 L 0 30 Q 160 5 290 40 Q 360 60 400 25 L 400 80 Z" fill={theme.hill3} />
          <Path d="M 0 30 Q 160 5 290 40 Q 360 60 400 25" stroke={theme.creaseHighlight} strokeWidth={1.5} fill="none" />
        </Svg>
      </View>
    </View>
  );
};

export const HomeScreen: React.FC = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const { theme, mode, setMode } = useTheme();
  const [progress, setProgress] = useState<GameProgress | null>(null);

  const loadProgress = useCallback(async () => {
    const data = await getProgress();
    setProgress(data);
  }, []);

  const activeLevel = progress ? getNextIncompleteLevel(progress) : 1;

  useFocusEffect(
    useCallback(() => {
      loadProgress();
      prefetchLevels(activeLevel, 10).catch(() => {});
    }, [loadProgress, activeLevel]),
  );

  const handlePlay = useCallback(() => {
    if (progress) {
      const targetLevel = getNextIncompleteLevel(progress);
      navigation.navigate('Game', { levelId: targetLevel });
    }
  }, [progress, navigation]);

  // Metadata for current level
  const stage = stageOf(activeLevel);
  const tier = TIERS[tierOf(activeLevel)];
  const shape = shapeFor(activeLevel);
  const bestStars = progress?.bestScores?.[activeLevel] || 0;

  // Calculate total earned stars
  const totalStars = progress?.bestScores
    ? Object.values(progress.bestScores).reduce((a, b) => a + b, 0)
    : 0;

  return (
    <ScreenContainer style={styles.container}>
      {/* 3 Layered Paper Hills Scenery */}
      <LayeredPaperScenery mode={mode} theme={theme} />

      {/* Top HUD Bar: Stars Counter Pill & Theme/Level Hanko Seals */}
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
          <Text style={[styles.starPillLabel, { color: theme.mutedText }]}>
            STARS
          </Text>
        </View>

        {/* Right Badges: Level Hanko Stamp + Interactive Theme Toggle Seal */}
        <View style={styles.topRightRow}>
          {/* Active Level Hanko Stamp */}
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

          {/* Interactive Day/Night Mode Switcher Seal */}
          <TouchableOpacity
            style={[
              styles.themeToggleSeal,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
                shadowColor: theme.shadow,
              },
            ]}
            activeOpacity={0.75}
            onPress={() => setMode(mode === 'white' ? 'dark' : 'white')}
          >
            {mode === 'white' ? (
              <Svg width={18} height={18} viewBox="0 0 24 24">
                <Circle cx={12} cy={12} r={5} fill={theme.primary} />
                <Path
                  d="M 12 2 L 12 5 M 12 19 L 12 22 M 2 12 L 5 12 M 19 12 L 22 12 M 5 5 L 7.2 7.2 M 16.8 16.8 L 19 19 M 5 19 L 7.2 16.8 M 16.8 7.2 L 19 5"
                  stroke={theme.primary}
                  strokeWidth={2}
                  strokeLinecap="round"
                />
              </Svg>
            ) : (
              <Svg width={18} height={18} viewBox="0 0 24 24">
                <Path
                  d="M 21 12.79 A 9 9 0 1 1 11.21 3 A 7 7 0 0 0 21 12.79 Z"
                  fill={theme.primary}
                />
              </Svg>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Content Area: Grouping Logo, Card, and Play Button with tight spacing */}
      <View style={styles.mainContentArea}>
        {/* Brand Logo Header */}
        <View style={styles.logoContainer}>
          <GameLogo horizontal={true} />
        </View>

        {/* Interactive Centerpiece: Paper Craft Level Showcase Card */}
        <View style={styles.cardContainer}>
          <LevelProgressCard
            currentLevel={activeLevel}
            totalLevels={10000}
            bestStars={bestStars}
            stageName={stage.name}
            tierName={tier}
            shapeName={shape}
          />
        </View>

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
            textStyle={styles.mainPlayBtnTitle}
            subtitleStyle={styles.mainPlayBtnSubtitle}
          />
        </View>
      </View>

      {/* Secondary Actions: Paper Tag Buttons with Icons */}
      <View style={styles.tagButtonsRow}>
          <PaperButton
            title="Levels"
            variant="tag"
            radiusSize="sm"
            onPress={() => navigation.navigate('LevelSelect')}
            style={styles.tagBtn}
            icon={
              <Svg width={14} height={14} viewBox="0 0 16 16">
                <Rect x="1" y="1" width="6" height="6" rx="1.5" fill={theme.primary} />
                <Rect x="9" y="1" width="6" height="6" rx="1.5" fill={theme.primary} opacity={0.6} />
                <Rect x="1" y="9" width="6" height="6" rx="1.5" fill={theme.primary} opacity={0.6} />
                <Rect x="9" y="9" width="6" height="6" rx="1.5" fill={theme.primary} />
              </Svg>
            }
          />
          <PaperButton
            title="Guide"
            variant="tag"
            radiusSize="sm"
            onPress={() => navigation.navigate('HowToPlay')}
            style={styles.tagBtn}
            icon={
              <Svg width={14} height={14} viewBox="0 0 16 16">
                <Path
                  d="M 2 3 C 4 3 6 4 8 5 C 10 4 12 3 14 3 L 14 13 C 12 13 10 14 8 15 C 6 14 4 13 2 13 Z"
                  fill="none"
                  stroke={theme.primary}
                  strokeWidth={1.5}
                />
                <Line x1="8" y1="5" x2="8" y2="15" stroke={theme.primary} strokeWidth={1.5} />
              </Svg>
            }
          />
          <PaperButton
            title="Settings"
            variant="tag"
            radiusSize="sm"
            onPress={() => navigation.navigate('Settings')}
            style={styles.tagBtn}
            icon={
              <Svg width={14} height={14} viewBox="0 0 16 16">
                <Path
                  d="M 8 2 L 9.2 4 L 11.5 3.5 L 12 5.8 L 14.2 6.5 L 13.5 8.8 L 15 10.5 L 13 12 L 13.5 14.2 L 11.2 14 L 10 16 L 8 14.8 L 6 16 L 4.8 14 L 2.5 14.2 L 3 12 L 1 10.5 L 2.5 8.8 L 1.8 6.5 L 4 5.8 L 4.5 3.5 L 6.8 4 Z"
                  fill={theme.primary}
                  opacity={0.8}
                />
                <Circle cx="8" cy="9" r="2.5" fill={theme.surface} />
              </Svg>
            }
          />
        </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    justifyContent: 'space-between',
    paddingBottom: 20,
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 6,
    zIndex: 10,
  },
  paperPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
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
  starPillLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
  },
  topRightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  hankoStampBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  hankoLevelNumber: {
    fontSize: 12,
    fontWeight: '900',
  },
  themeToggleSeal: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.14,
    shadowRadius: 5,
    elevation: 2,
  },
  mainContentArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    zIndex: 10,
    paddingVertical: 2,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 4,
    zIndex: 10,
  },
  cardContainer: {
    alignItems: 'center',
    width: '100%',
    zIndex: 10,
  },
  playButtonWrapper: {
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 4,
    marginTop: 8,
    zIndex: 10,
  },
  mainPlayBtn: {
    minHeight: 62,
    paddingVertical: 12,
  },
  mainPlayBtnTitle: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  mainPlayBtnSubtitle: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  tagButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  tagBtn: {
    flex: 1,
    marginHorizontal: 3,
    minHeight: 44,
    paddingHorizontal: 8,
  },
  celestialWrapper: {
    position: 'absolute',
    top: 15,
    right: 14,
    opacity: 0.75,
  },
  driftingPlane: {
    position: 'absolute',
    top: 85,
    left: 0,
  },
  hillsContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 140,
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
