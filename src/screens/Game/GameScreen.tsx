import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  LayoutAnimation,
} from 'react-native';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Svg, { Path, Line } from 'react-native-svg';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { IconButton } from '../../components/ui/IconButton';
import { colors } from '../../theme/colors';
import { getProgress, setProgress } from '../../storage/gameStorage';
import { PuzzleBoard } from '../../components/game/PuzzleBoard';
import { getLevel, prefetchLevels, tierOf, TIERS } from '../../game/levels';
import {
  PuzzleState,
  isLevelComplete,
  getSolutionOrder,
} from '../../game/engine/PuzzleEngine';
import { GameProgress } from '../../types/game.types';
import { useTheme } from '../../theme/ThemeContext';
import { ThemeMode } from '../../theme/types';
import { WaterDrop } from '../../components/icons/WaterDrop';
import { Modal } from '../../components/ui/Modal';
import { StarsDisplay } from '../../components/ui/StarsDisplay';
import { Button } from '../../components/ui/Button';
import { SettingsButton } from '../../components/buttons/SettingsButton';

type RootStackParamList = {
  Home: undefined;
  LevelSelect: undefined;
  Game: { levelId: number };
};

type GameScreenRouteProp = RouteProp<RootStackParamList, 'Game'>;
type GameScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Game'
>;

export const GameScreen: React.FC = () => {
  const route = useRoute<GameScreenRouteProp>();
  const navigation = useNavigation<GameScreenNavigationProp>();
  const { levelId } = route.params || {};

  const [puzzleState, setPuzzleState] = useState<PuzzleState | null>(null);
  const [drops, setDrops] = useState<number>(3);
  const [showCompleteModal, setShowCompleteModal] = useState<boolean>(false);
  const [showFailModal, setShowFailModal] = useState<boolean>(false);
  const [earnedStars, setEarnedStars] = useState<number>(3);
  const [showInGameTutorial, setShowInGameTutorial] = useState<boolean>(false);

  const { theme, mode, setMode } = useTheme();
  const [progress, setProgressState] = useState<GameProgress | null>(null);
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  const [showPalette, setShowPalette] = useState<boolean>(false);

  const [failedAttempts, setFailedAttempts] = useState<number>(0);
  const [hintsUsed, setHintsUsed] = useState<number>(0);
  const [hintArrowId, setHintArrowId] = useState<string | null>(null);
  const [sessionKey, setSessionKey] = useState<number>(0);

  const loadLevel = useCallback(async () => {
    // Find the requested level, or default to level 1 if not found
    const targetLevelId = levelId > 0 ? levelId : 1;
    const levelDef = getLevel(targetLevelId);

    // Pre-fetch the next batch of levels in the background for instant play
    prefetchLevels(targetLevelId + 1, 10).catch(() => {});

    // Ensure arrow cells are properly cloned
    const arrows = levelDef.arrows.map(a => {
      let newCells = [...a.cells.map(c => ({ ...c }))];
      if (newCells.length === 1) {
        const head = newCells[0];
        let tail = { ...head };
        if (a.direction === 'UP') tail.r += 1;
        else if (a.direction === 'DOWN') tail.r -= 1;
        else if (a.direction === 'LEFT') tail.c += 1;
        else if (a.direction === 'RIGHT') tail.c -= 1;
        newCells = [tail, head];
      }
      return {
        ...a,
        cells: newCells,
      };
    });

    setPuzzleState({
      gridSize: levelDef.gridSize,
      arrows,
    });
    setDrops(levelDef.maxHearts || 3);
    setFailedAttempts(0);
    setHintsUsed(0);
    setHintArrowId(null);
    setSessionKey(k => k + 1);

    const p = await getProgress();
    setProgressState(p);
    setShowInGameTutorial(!p.tutorialCompleted && targetLevelId <= 3);
  }, [levelId]);

  const toggleSetting = useCallback(
    async (key: 'soundEnabled' | 'hapticsEnabled', value: boolean) => {
      if (progress) {
        const newProgress = { ...progress, [key]: value };
        setProgressState(newProgress);
        await setProgress(newProgress);
      }
    },
    [progress],
  );

  const toggleTheme = useCallback(
    async (newMode: ThemeMode) => {
      if (progress) {
        const newProgress = { ...progress, theme: newMode };
        setProgressState(newProgress);
        setMode(newMode);
        await setProgress(newProgress);
      }
    },
    [progress, setMode],
  );

  const handleTogglePalette = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setShowPalette(!showPalette);
  };

  useEffect(() => {
    loadLevel();
  }, [loadLevel]);

  useEffect(() => {
    if (drops === 0 && puzzleState && !isLevelComplete(puzzleState)) {
      const timer = setTimeout(() => {
        setShowFailModal(true);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [drops, puzzleState]);

  const handleRetry = useCallback(() => {
    setShowFailModal(false);
    setSessionKey(k => k + 1);
    loadLevel();
  }, [loadLevel]);

  const handleStateChange = useCallback(
    async (newState: PuzzleState) => {
      setPuzzleState(newState);

      if (isLevelComplete(newState)) {
        try {
          const progress = await getProgress();
          if (!progress.completedLevels.includes(levelId)) {
            progress.completedLevels.push(levelId);
          }

          const nextLevel = levelId + 1;
          if (nextLevel > progress.currentLevel) {
            progress.currentLevel = nextLevel;
          }

          if (levelId >= 3 && !progress.tutorialCompleted) {
            progress.tutorialCompleted = true;
            setShowInGameTutorial(false);
          }

          const today = new Date().toISOString().split('T')[0];
          if (progress.dailyPlayedDate !== today) {
            progress.dailyPlayedDate = today;
            progress.dailyPlayedCount = 1;
          } else {
            progress.dailyPlayedCount = (progress.dailyPlayedCount || 0) + 1;
          }

          const targetLevelId = levelId > 0 ? levelId : 1;
          let levelDef = getLevel(targetLevelId);
          const maxHearts = levelDef.maxHearts || 3;
          const lostDrops = maxHearts - drops;
          let stars = 3;
          if (lostDrops === 1) stars = 2;
          if (lostDrops >= 2) stars = 1;

          setEarnedStars(stars);

          if (!progress.bestScores) {
            progress.bestScores = {};
          }
          const currentBest = progress.bestScores[levelId] || 0;
          if (stars > currentBest) {
            progress.bestScores[levelId] = stars;
          }

          await setProgress(progress);
          setProgressState(progress);

          // Show modal after brief delay to show empty board
          setTimeout(() => {
            setShowCompleteModal(true);
          }, 800);
        } catch (e) {
          console.error(e);
        }
      }
    },
    [levelId, drops],
  );

  const handleArrowBlocked = useCallback((arrowId: string) => {
    setDrops(prev => Math.max(0, prev - 1));
  }, []);

  if (!puzzleState) return null;

  return (
    <ScreenContainer
      useBackgroundImage={true}
      overlayOpacity={0.15}
      style={styles.container}
    >
      {/* Top Header */}
      <View style={styles.header}>
        <IconButton
          icon="back"
          onPress={() => navigation.goBack()}
          iconColor={theme.primaryText}
          style={[styles.headerCircleBtn, { backgroundColor: theme.cardBackground }]}
          size={24}
        />

        <View style={styles.levelHeaderCenter}>
          <Text style={[styles.levelTitleText, { color: theme.primaryText }]}>Level {levelId}</Text>
          <View
            style={[
              styles.levelStatsPill,
              {
                backgroundColor:
                  mode === 'dark'
                    ? 'rgba(255, 255, 255, 0.08)'
                    : 'rgba(43, 45, 91, 0.06)',
                borderColor: theme.crease,
              },
            ]}
          >
            <Text style={[styles.levelStatsText, { color: theme.secondaryText }]}>
              Failed: {failedAttempts} • Hints: {hintsUsed}
            </Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          <IconButton
            icon="settings"
            onPress={() => setShowSettingsModal(true)}
            iconColor={theme.primaryText}
            style={[styles.headerCircleBtn, { backgroundColor: theme.cardBackground }]}
            size={24}
          />
        </View>
      </View>

      {/* Life/Drops HUD Indicator */}
      <View style={styles.hudRow}>
        <View style={styles.dropsPill}>
          <View style={styles.dropsList}>
            {Array.from({ length: 3 }).map((_, i) => (
              <WaterDrop key={i} size={22} empty={i >= drops} />
            ))}
          </View>
          <Text style={styles.dropsText}>{drops}/3</Text>
        </View>
      </View>

      {/* Game Board */}
      <View style={styles.boardContainer}>
        {puzzleState && (
          <PuzzleBoard
            key={`board-${levelId}-${sessionKey}`}
            state={puzzleState}
            onStateChange={handleStateChange}
            disabled={isLevelComplete(puzzleState) || drops === 0}
            onArrowBlocked={handleArrowBlocked}
            onArrowFailed={() => setFailedAttempts(f => f + 1)}
            showInGameTutorial={showInGameTutorial}
            hintArrowId={hintArrowId}
          />
        )}
      </View>

      {/* Floating Action Controls: Hint & Restart */}
      <View style={styles.floatingActions}>
        <TouchableOpacity
          style={styles.hintButton}
          activeOpacity={0.8}
          onPress={() => {
            if (!puzzleState) return;
            const order = getSolutionOrder(puzzleState);
            if (order && order.length > 0) {
              if (hintArrowId !== order[0]) {
                setHintsUsed(h => h + 1);
                setHintArrowId(order[0]);
              }
            }
          }}
        >
          <Svg width={22} height={22} viewBox="0 0 24 24" fill="#D97706">
            <Path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9-4.03-9-9-9zm0 14c-.55 0-1-.45-1-1v-2c0-.55.45-1 1-1s1 .45 1 1v2c0 .55-.45 1-1 1zm1-5h-2v-1.5c0-.83.67-1.5 1.5-1.5h.5c.55 0 1-.45 1-1s-.45-1-1-1-1 .45-1 1H9c0-1.66 1.34-3 3-3s3 1.34 3 3c0 1.1-.9 2-2 2v2z" />
          </Svg>
          <Text style={styles.hintButtonText}>Hint</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.retryButton}
          activeOpacity={0.8}
          onPress={loadLevel}
        >
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="#334155">
            <Path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" />
          </Svg>
          <Text style={styles.retryButtonText}>Restart</Text>
        </TouchableOpacity>
      </View>


      <Modal visible={showCompleteModal} position="center">
        <View
          style={{
            alignItems: 'center',
            paddingVertical: 8,
          }}
        >
          {/* Animated Gold Stars Trophy Showcase */}
          <View
            style={{
              alignItems: 'center',
              justifyContent: 'center',
              paddingVertical: 8,
              marginBottom: 4,
            }}
          >
            <StarsDisplay stars={earnedStars} size={48} animate={true} />
          </View>

          <Text
            style={{
              fontSize: 28,
              fontWeight: '900',
              color: theme.primaryText,
              letterSpacing: -0.5,
              textAlign: 'center',
              marginBottom: 4,
            }}
          >
            Well Done!
          </Text>

          <Text
            style={{
              fontSize: 14,
              fontWeight: '500',
              color: theme.secondaryText,
              textAlign: 'center',
              marginBottom: 18,
            }}
          >
            Level {levelId || 1} Cleared Successfully
          </Text>

          <View
            style={{
              width: '100%',
              backgroundColor: theme.cardBackground,
              borderRadius: 22,
              padding: 18,
              marginBottom: 18,
              borderWidth: 1,
              borderColor: theme.border,
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                marginBottom: 12,
              }}
            >
              <Text
                style={{
                  color: theme.mutedText,
                  fontWeight: '500',
                  fontSize: 15,
                }}
              >
                Difficulty
              </Text>
              <Text
                style={{
                  color: theme.primaryText,
                  fontWeight: 'bold',
                  fontSize: 15,
                }}
              >
                {TIERS[tierOf(levelId)] || 'Very Hard'}
              </Text>
            </View>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                marginBottom: 12,
              }}
            >
              <Text
                style={{
                  color: theme.mutedText,
                  fontWeight: '500',
                  fontSize: 15,
                }}
              >
                Score
              </Text>
              <Text
                style={{
                  color: theme.primaryText,
                  fontWeight: 'bold',
                  fontSize: 15,
                }}
              >
                {1000 + drops * 100}
              </Text>
            </View>
            <View
              style={{ flexDirection: 'row', justifyContent: 'space-between' }}
            >
              <Text
                style={{
                  color: theme.mutedText,
                  fontWeight: '500',
                  fontSize: 15,
                }}
              >
                Today's Levels
              </Text>
              <Text
                style={{
                  color: theme.primaryText,
                  fontWeight: 'bold',
                  fontSize: 15,
                }}
              >
                {progress?.dailyPlayedCount || 1}
              </Text>
            </View>

            <View
              style={{
                width: '100%',
                flexDirection: 'row',
                justifyContent: 'space-around',
                alignItems: 'center',
                backgroundColor: theme.appBackground,
                borderRadius: 16,
                paddingVertical: 12,
                marginTop: 16,
                borderWidth: 1,
                borderColor: theme.border,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Svg width={16} height={16} viewBox="0 0 24 24" fill={theme.primaryText}>
                  <Path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm0-14c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z" />
                </Svg>
                <Text style={{ color: theme.primaryText, fontWeight: '800', fontSize: 14 }}>
                  {puzzleState.arrows.length}
                </Text>
              </View>

              <View style={{ width: 1, height: 16, backgroundColor: theme.border }} />

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Svg width={16} height={16} viewBox="0 0 24 24" fill={theme.error}>
                  <Path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                </Svg>
                <Text style={{ color: theme.error, fontWeight: '800', fontSize: 14 }}>
                  {failedAttempts}
                </Text>
              </View>

              <View style={{ width: 1, height: 16, backgroundColor: theme.border }} />

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Svg width={16} height={16} viewBox="0 0 24 24" fill="#D97706">
                  <Path d="M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7z" />
                </Svg>
                <Text style={{ color: '#D97706', fontWeight: '800', fontSize: 14 }}>
                  {hintsUsed}
                </Text>
              </View>
            </View>
          </View>

          <Button
            title="Next Level"
            variant="primary"
            style={{ width: '100%' }}
            onPress={() => {
              setShowCompleteModal(false);
              setTimeout(() => {
                navigation.replace('Game', { levelId: (levelId || 1) + 1 });
              }, 300);
            }}
          />

          <View
            style={{
              flexDirection: 'row',
              gap: 12,
              width: '100%',
              marginTop: 12,
            }}
          >
            <Button
              title="Replay"
              variant="secondary"
              style={{
                flex: 1,
                backgroundColor: theme.cardBackground,
                borderWidth: 1.5,
                borderColor: theme.border,
              }}
              onPress={() => {
                setShowCompleteModal(false);
                loadLevel();
              }}
            />
            <Button
              title="Menu"
              variant="secondary"
              style={{
                flex: 1,
                backgroundColor: theme.cardBackground,
                borderWidth: 1.5,
                borderColor: theme.border,
              }}
              onPress={() => {
                setShowCompleteModal(false);
                setTimeout(() => navigation.goBack(), 300);
              }}
            />
          </View>
        </View>
      </Modal>

      <Modal
        visible={showSettingsModal}
        position="center"
        onClose={() => setShowSettingsModal(false)}
      >
        <View style={{ paddingVertical: 8 }}>
          {/* Header */}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 20,
            }}
          >
            <Text
              style={{
                fontSize: 24,
                fontWeight: '900',
                color: theme.primaryText,
                letterSpacing: -0.5,
              }}
            >
              Paused
            </Text>
            <IconButton
              icon="close"
              onPress={() => setShowSettingsModal(false)}
              iconColor={theme.primaryText}
              size={24}
            />
          </View>

          {/* Unified Settings Card */}
          <View
            style={{
              backgroundColor: theme.cardBackground,
              borderRadius: 22,
              padding: 18,
              marginBottom: 20,
              borderWidth: 1,
              borderColor: theme.border,
            }}
          >
            {/* Sound Row */}
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 12,
                    backgroundColor: mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(43, 45, 91, 0.06)',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Svg width={20} height={20} viewBox="0 0 24 24" fill={theme.primaryText}>
                    <Path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
                  </Svg>
                </View>
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: '700',
                    color: theme.primaryText,
                  }}
                >
                  Sound Effects
                </Text>
              </View>
              <Switch
                value={progress?.soundEnabled ?? true}
                onValueChange={val => toggleSetting('soundEnabled', val)}
                trackColor={{
                  false: mode === 'dark' ? '#3B3860' : '#E2E8F0',
                  true: theme.primary,
                }}
                thumbColor="#FFFFFF"
              />
            </View>

            <View style={{ height: 1, backgroundColor: theme.divider, marginVertical: 14 }} />

            {/* Vibration Row */}
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 12,
                    backgroundColor: mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(43, 45, 91, 0.06)',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Svg width={20} height={20} viewBox="0 0 24 24" fill={theme.primaryText}>
                    <Path d="M0 15h2V9H0v6zm3 2h2V7H3v10zm19-8v6h2V9h-2zm-3 8h2V7h-2v10zM16.5 3h-9C6.67 3 6 3.67 6 4.5v15c0 .83.67 1.5 1.5 1.5h9c.83 0 1.5-.67 1.5-1.5v-15c0-.83-.67-1.5-1.5-1.5zM16 19H8V5h8v14z" />
                  </Svg>
                </View>
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: '700',
                    color: theme.primaryText,
                  }}
                >
                  Haptic Feedback
                </Text>
              </View>
              <Switch
                value={progress?.hapticsEnabled ?? true}
                onValueChange={val => toggleSetting('hapticsEnabled', val)}
                trackColor={{
                  false: mode === 'dark' ? '#3B3860' : '#E2E8F0',
                  true: theme.primary,
                }}
                thumbColor="#FFFFFF"
              />
            </View>

            <View style={{ height: 1, backgroundColor: theme.divider, marginVertical: 14 }} />

            {/* Theme Appearance Row */}
            <View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <View
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 12,
                    backgroundColor: mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(43, 45, 91, 0.06)',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Svg width={20} height={20} viewBox="0 0 24 24" fill={theme.primaryText}>
                    <Path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9c.83 0 1.5-.67 1.5-1.5 0-.39-.15-.74-.39-1.01-.23-.26-.38-.61-.38-.99 0-.83.67-1.5 1.5-1.5H16c2.76 0 5-2.24 5-5 0-4.42-4.03-8-9-8zm-5.5 9c-.83 0-1.5-.67-1.5-1.5S5.67 9 6.5 9 8 9.67 8 10.5 7.33 12 6.5 12zm3-4C8.67 8 8 7.33 8 6.5S8.67 5 9.5 5s1.5.67 1.5 1.5S10.33 8 9.5 8zm5 0c-.83 0-1.5-.67-1.5-1.5S13.67 5 14.5 5s1.5.67 1.5 1.5S15.33 8 14.5 8zm3 4c-.83 0-1.5-.67-1.5-1.5S16.67 9 17.5 9s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" />
                  </Svg>
                </View>
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: '700',
                    color: theme.primaryText,
                  }}
                >
                  Theme Style
                </Text>
              </View>

              {/* Dual Theme Selector Pills */}
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => toggleTheme('white')}
                  style={{
                    flex: 1,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    paddingVertical: 10,
                    borderRadius: 14,
                    backgroundColor: mode === 'white' ? (theme.primaryText === '#2B2D5B' ? '#F6EFE4' : '#FFFDF8') : 'transparent',
                    borderWidth: 2,
                    borderColor: mode === 'white' ? theme.primary : theme.border,
                  }}
                >
                  <View
                    style={{
                      width: 16,
                      height: 16,
                      borderRadius: 8,
                      backgroundColor: '#F6EFE4',
                      borderWidth: 1.5,
                      borderColor: '#D4C6B2',
                    }}
                  />
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: mode === 'white' ? '800' : '600',
                      color: mode === 'white' ? theme.primaryText : theme.mutedText,
                    }}
                  >
                    Washi Day
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => toggleTheme('dark')}
                  style={{
                    flex: 1,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    paddingVertical: 10,
                    borderRadius: 14,
                    backgroundColor: mode === 'dark' ? '#26243F' : 'transparent',
                    borderWidth: 2,
                    borderColor: mode === 'dark' ? theme.primary : theme.border,
                  }}
                >
                  <View
                    style={{
                      width: 16,
                      height: 16,
                      borderRadius: 8,
                      backgroundColor: '#1B1A2E',
                      borderWidth: 1.5,
                      borderColor: '#4A4675',
                    }}
                  />
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: mode === 'dark' ? '800' : '600',
                      color: mode === 'dark' ? theme.primaryText : theme.mutedText,
                    }}
                  >
                    Night Kraft
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Action Buttons: Resume as primary, Restart & Menu as secondary */}
          <Button
            title="Resume"
            variant="primary"
            style={{ width: '100%' }}
            onPress={() => setShowSettingsModal(false)}
          />

          <View style={{ flexDirection: 'row', gap: 12, width: '100%', marginTop: 12 }}>
            <Button
              title="Restart"
              variant="secondary"
              style={{
                flex: 1,
                backgroundColor: theme.cardBackground,
                borderWidth: 1.5,
                borderColor: theme.border,
              }}
              onPress={() => {
                setShowSettingsModal(false);
                loadLevel();
              }}
            />
            <Button
              title="Menu"
              variant="secondary"
              style={{
                flex: 1,
                backgroundColor: theme.cardBackground,
                borderWidth: 1.5,
                borderColor: theme.border,
              }}
              onPress={() => {
                setShowSettingsModal(false);
                navigation.goBack();
              }}
            />
          </View>
        </View>
      </Modal>

      <Modal visible={showFailModal} position="center" onClose={() => setShowFailModal(false)}>
        <View style={{ alignItems: 'center', paddingVertical: 8 }}>
          {/* Hero Emblem Badge */}
          <View
            style={{
              width: 76,
              height: 76,
              borderRadius: 38,
              backgroundColor: mode === 'dark' ? 'rgba(228, 87, 46, 0.15)' : 'rgba(228, 87, 46, 0.08)',
              borderWidth: 2,
              borderColor: mode === 'dark' ? 'rgba(228, 87, 46, 0.35)' : 'rgba(228, 87, 46, 0.20)',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 16,
            }}
          >
            <Svg width={40} height={40} viewBox="0 0 24 24" fill="none">
              <Path
                d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"
                stroke={theme.error}
                strokeWidth={2.2}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill={mode === 'dark' ? 'rgba(228, 87, 46, 0.25)' : 'rgba(228, 87, 46, 0.15)'}
              />
              <Line
                x1="8"
                y1="16"
                x2="16"
                y2="8"
                stroke={theme.error}
                strokeWidth={2.2}
                strokeLinecap="round"
              />
            </Svg>
          </View>

          {/* Title & Subtitle */}
          <Text
            style={{
              fontSize: 28,
              fontWeight: '900',
              color: theme.primaryText,
              letterSpacing: -0.5,
              textAlign: 'center',
              marginBottom: 6,
            }}
          >
            Out of Drops!
          </Text>

          <Text
            style={{
              fontSize: 14,
              fontWeight: '500',
              color: theme.secondaryText,
              textAlign: 'center',
              lineHeight: 20,
              paddingHorizontal: 12,
              marginBottom: 20,
            }}
          >
            You used all 3 drops on this puzzle. Don't worry, every maze has a solution!
          </Text>

          {/* Progress / Stats Card */}
          <View
            style={{
              width: '100%',
              backgroundColor: theme.appBackground,
              borderRadius: 18,
              paddingVertical: 14,
              paddingHorizontal: 16,
              marginBottom: 20,
              flexDirection: 'row',
              justifyContent: 'space-around',
              alignItems: 'center',
              borderWidth: 1,
              borderColor: theme.border,
            }}
          >
            <View style={{ alignItems: 'center' }}>
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: '700',
                  color: theme.mutedText,
                  textTransform: 'uppercase',
                  letterSpacing: 1,
                }}
              >
                Level
              </Text>
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: '800',
                  color: theme.primaryText,
                  marginTop: 2,
                }}
              >
                {levelId || 1}
              </Text>
            </View>

            <View style={{ width: 1, height: 24, backgroundColor: theme.border }} />

            <View style={{ alignItems: 'center' }}>
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: '700',
                  color: theme.mutedText,
                  textTransform: 'uppercase',
                  letterSpacing: 1,
                }}
              >
                Remaining
              </Text>
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: '800',
                  color: theme.error,
                  marginTop: 2,
                }}
              >
                {puzzleState?.arrows.filter(a => a.active && !a.cleared).length || 0}
              </Text>
            </View>

            <View style={{ width: 1, height: 24, backgroundColor: theme.border }} />

            <View style={{ alignItems: 'center' }}>
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: '700',
                  color: theme.mutedText,
                  textTransform: 'uppercase',
                  letterSpacing: 1,
                }}
              >
                Hints
              </Text>
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: '800',
                  color: '#D97706',
                  marginTop: 2,
                }}
              >
                {hintsUsed}
              </Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={{ width: '100%', gap: 12 }}>
            <Button
              title="Try Again"
              variant="primary"
              style={{ width: '100%' }}
              onPress={() => {
                setShowFailModal(false);
                setTimeout(() => handleRetry(), 300);
              }}
            />
            <Button
              title="Menu"
              variant="secondary"
              style={{
                width: '100%',
                backgroundColor: theme.cardBackground,
                borderWidth: 1,
                borderColor: theme.border,
              }}
              onPress={() => {
                setShowFailModal(false);
                setTimeout(() => navigation.goBack(), 300);
              }}
            />
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 0,
    backgroundColor: 'transparent',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 4,
  },
  headerCircleBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  levelHeaderCenter: {
    alignItems: 'center',
  },
  levelTitleText: {
    fontSize: 25,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  levelStatsPill: {
    paddingHorizontal: 12,
    paddingVertical: 3,
    borderRadius: 12,
    marginTop: 3,
    borderWidth: 1,
  },
  levelStatsText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  hudRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    paddingHorizontal: 18,
    marginTop: 6,
    marginBottom: 6,
  },
  dropsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1.5,
    borderColor: '#BAE6FD',
  },
  dropsList: {
    flexDirection: 'row',
    gap: 4,
  },
  dropsText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0284C7',
  },
  boardContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  floatingActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 14,
    marginTop: 10,
    marginBottom: 10,
    zIndex: 10,
  },
  hintButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEF3C7',
    borderWidth: 2,
    borderColor: '#F59E0B',
    borderRadius: 22,
    paddingHorizontal: 20,
    paddingVertical: 9,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  hintButtonText: {
    color: '#B45309',
    fontSize: 14,
    fontWeight: '900',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 9,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  retryButtonText: {
    color: '#334155',
    fontSize: 14,
    fontWeight: '700',
  },
});
