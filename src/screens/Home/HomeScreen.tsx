import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { GameLogo } from '../../components/icons/GameLogo';
import { LevelProgressCard } from '../../components/cards/LevelProgressCard';
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
      {/* Top HUD Bar: Stars Counter Pill & Theme/Level Seals */}
      <View style={styles.topBar}>
        {/* Star Counter Pill */}
        <View style={styles.paperPill}>
          <OrigamiStar active={true} size={22} fillColor="#F59E0B" />
          <View style={{ marginLeft: 6 }}>
            <Text style={styles.starCountText}>{totalStars || 128}</Text>
            <Text style={styles.starPillLabel}>STARS</Text>
          </View>
        </View>

        {/* Right Badges: Scalloped Level Stamp + Theme Toggle Seal */}
        <View style={styles.topRightRow}>
          {/* Active Level Scalloped Stamp Badge */}
          <View style={styles.scallopedBadge}>
            <Svg width={42} height={42} viewBox="0 0 44 44">
              <Path
                d="M 22 2 C 24 2 25 5 27 5 C 29 5 31 3 33 4 C 35 5 36 8 38 9 C 40 10 42 10 43 12 C 44 14 43 17 44 19 C 45 21 46 23 45 25 C 44 27 42 28 42 30 C 42 32 43 35 41 36 C 39 37 37 36 35 38 C 33 40 32 42 30 43 C 28 44 26 42 24 43 C 22 44 20 44 19 42 C 18 40 15 40 14 38 C 13 36 10 36 9 34 C 8 32 9 29 7 28 C 5 27 3 26 3 24 C 3 22 5 20 5 18 C 5 16 3 14 4 12 C 5 10 8 10 9 8 C 10 6 11 3 13 3 C 15 3 17 5 19 4 C 21 3 22 2 22 2 Z"
                fill={mode === 'dark' ? '#2A2744' : '#FFFFFF'}
                stroke="#EF4444"
                strokeWidth={2}
              />
            </Svg>
            <Text style={styles.hankoLevelNumber}>#{activeLevel}</Text>
          </View>

          {/* Day/Night Mode Switcher Seal */}
          <TouchableOpacity
            style={styles.themeToggleSeal}
            activeOpacity={0.75}
            onPress={() => setMode(mode === 'white' ? 'dark' : 'white')}
          >
            <Svg width={20} height={20} viewBox="0 0 24 24">
              <Circle cx={12} cy={12} r={5} fill="#F59E0B" />
              <Path
                d="M 12 2 L 12 4 M 12 20 L 12 22 M 2 12 L 4 12 M 20 12 L 22 12 M 4.93 4.93 L 6.34 6.34 M 17.66 17.66 L 19.07 19.07 M 4.93 19.07 L 6.34 17.66 M 17.66 6.34 L 19.07 4.93"
                stroke="#F59E0B"
                strokeWidth={2}
                strokeLinecap="round"
              />
            </Svg>
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Content Area: Grouping Logo, Card, and Play Button */}
      <View style={styles.mainContentArea}>
        {/* Brand Logo Header */}
        <View style={styles.logoContainer}>
          <GameLogo horizontal={true} />
        </View>

        {/* Centerpiece: Level Showcase Card */}
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

        {/* Main Play Action Button */}
        <View style={styles.playButtonWrapper}>
          <TouchableOpacity
            activeOpacity={0.88}
            onPress={handlePlay}
            style={styles.mainPlayBtn}
          >
            <Svg width={28} height={28} viewBox="0 0 24 24" style={{ marginRight: 12 }}>
              <Path d="M 8 5 L 19 12 L 8 19 Z" fill="#FFFFFF" />
            </Svg>
            <View style={{ alignItems: 'flex-start' }}>
              <Text style={styles.mainPlayBtnTitle}>PLAY</Text>
              <Text style={styles.mainPlayBtnSubtitle}>LEVEL {activeLevel}</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Secondary Actions: Bottom Capsule Pill Buttons */}
      <View style={styles.tagButtonsRow}>
        <TouchableOpacity
          style={styles.tagBtn}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('LevelSelect')}
        >
          <Svg width={18} height={18} viewBox="0 0 16 16">
            <Rect x="1" y="1" width="6" height="6" rx="1.5" fill="#1E1B4B" />
            <Rect x="9" y="1" width="6" height="6" rx="1.5" fill="#1E1B4B" />
            <Rect x="1" y="9" width="6" height="6" rx="1.5" fill="#1E1B4B" />
            <Rect x="9" y="9" width="6" height="6" rx="1.5" fill="#1E1B4B" />
          </Svg>
          <Text style={styles.tagBtnText}>Levels</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tagBtn}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('HowToPlay')}
        >
          <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
            <Path
              d="M 4 19.5 A 2.5 2.5 0 0 1 6.5 17 H 20 M 4 19.5 A 2.5 2.5 0 0 0 6.5 22 H 20 V 2 H 6.5 A 2.5 2.5 0 0 0 4 4.5 Z"
              stroke="#1E1B4B"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
          <Text style={styles.tagBtnText}>Guide</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tagBtn}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('Settings')}
        >
          <Svg width={18} height={18} viewBox="0 0 24 24" fill="#1E1B4B">
            <Path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.06-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.73,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.06,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.43-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.49-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z" />
          </Svg>
          <Text style={styles.tagBtnText}>Settings</Text>
        </TouchableOpacity>
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
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#EEF2FF',
  },
  starCountText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#1E1B4B',
    lineHeight: 18,
  },
  starPillLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#8A8798',
    letterSpacing: 0.8,
  },
  topRightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  scallopedBadge: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  hankoLevelNumber: {
    position: 'absolute',
    fontSize: 14,
    fontWeight: '900',
    color: '#EF4444',
  },
  themeToggleSeal: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
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
    marginBottom: 6,
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
    marginTop: 14,
    zIndex: 10,
  },
  mainPlayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF4B3A',
    borderRadius: 36,
    paddingVertical: 14,
    paddingHorizontal: 36,
    width: '92%',
  },
  mainPlayBtnTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
    lineHeight: 26,
  },
  mainPlayBtnSubtitle: {
    fontSize: 12,
    fontWeight: '800',
    color: 'rgba(255, 255, 255, 0.9)',
    letterSpacing: 1.2,
  },
  tagButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 4,
  },
  tagBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: '#EEF2FF',
    paddingVertical: 12,
    marginHorizontal: 4,
  },
  tagBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1E1B4B',
  },
});
