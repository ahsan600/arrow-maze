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
import Svg, { Path } from 'react-native-svg';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { IconButton } from '../../components/ui/IconButton';
import { colors } from '../../theme/colors';
import { getProgress, setProgress } from '../../storage/gameStorage';
import { PuzzleBoard } from '../../components/game/PuzzleBoard';
import { allLevels, getLevel } from '../../game/levels';
import {
  generateLevelData,
  getAnimalNameForLevel,
} from '../../game/levels/LevelGenerator';
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

  const loadLevel = useCallback(async () => {
    // Find the requested level, or default to level 1 if not found
    const targetLevelId = levelId > 0 ? levelId : 1;
    let levelDef = getLevel(targetLevelId);

    // We clone the arrows to prevent mutating the original level definition
    // and automatically extend 1-cell arrows to have a tail
    const arrows = levelDef.arrows.map(a => {
      let newCells = [...a.cells.map(c => ({ ...c }))];
      if (newCells.length === 1) {
        const head = newCells[0];
        let tail = { ...head };
        if (a.direction === 'UP') tail.r += 1;
        else if (a.direction === 'DOWN') tail.r -= 1;
        else if (a.direction === 'LEFT') tail.c += 1;
        else if (a.direction === 'RIGHT') tail.c -= 1;

        // Arrow piece expects cells to be ordered from tail to head
        newCells = [tail, head];
      }
      return {
        ...a,
        cells: newCells,
      };
    });

    // Calculate bounding box for dynamic grid
    let minR = Infinity,
      maxR = -Infinity;
    let minC = Infinity,
      maxC = -Infinity;

    arrows.forEach(a => {
      a.cells.forEach(c => {
        if (c.r < minR) minR = c.r;
        if (c.r > maxR) maxR = c.r;
        if (c.c < minC) minC = c.c;
        if (c.c > maxC) maxC = c.c;
      });
    });

    if (minR === Infinity) {
      minR = 0;
      maxR = 3;
      minC = 0;
      maxC = 3; // Fallback
    }

    const normalizedArrows = arrows.map(a => ({
      ...a,
      cells: a.cells.map(c => ({
        r: c.r - minR,
        c: c.c - minC,
      })),
    }));

    const dynamicGridSize = {
      rows: maxR - minR + 1,
      cols: maxC - minC + 1,
    };

    setPuzzleState({
      gridSize: dynamicGridSize,
      arrows: normalizedArrows,
    });
    setDrops(levelDef.maxHearts || 3);
    setFailedAttempts(0);
    setHintsUsed(0);
    setHintArrowId(null);

    const p = await getProgress();
    setProgressState(p);
    setShowInGameTutorial(!p.tutorialCompleted && levelId <= 3);
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
          iconColor="#0F172A"
          style={styles.headerCircleBtn}
          size={24}
        />

        <View style={styles.levelHeaderCenter}>
          <Text style={styles.levelTitleText}>Level {levelId}</Text>
          <View style={styles.levelStatsPill}>
            <Text style={styles.levelStatsText}>
              Failed: {failedAttempts} • Hints: {hintsUsed}
            </Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          <SettingsButton
            onPress={() => setShowSettingsModal(true)}
            size={44}
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
        <PuzzleBoard
          state={puzzleState}
          onStateChange={handleStateChange}
          disabled={isLevelComplete(puzzleState) || drops === 0}
          onArrowBlocked={handleArrowBlocked}
          onArrowFailed={() => setFailedAttempts(f => f + 1)}
          showInGameTutorial={showInGameTutorial}
          hintArrowId={hintArrowId}
        />
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

      {/* Bottom Floating Badge resting above wooden dock */}
      <View style={styles.bottomDockContainer}>
        <View style={styles.bottomDockPill}>
          <Text style={styles.bottomDockText}>CHALLENGE ACTIVE</Text>
        </View>
      </View>

      <Modal visible={showCompleteModal} position="center">
        <View
          style={{
            alignItems: 'center',
            position: 'relative',
            marginTop: 24,
            paddingBottom: 8,
          }}
        >
          <View
            style={{
              position: 'absolute',
              top: -80,
              zIndex: 10,
              transform: [{ scale: 1.25 }],
            }}
          >
            <StarsDisplay stars={earnedStars} size={52} animate={true} />
          </View>

          <Text
            style={{
              fontSize: 30,
              fontWeight: '900',
              color: theme.primaryText,
              marginTop: 40,
              marginBottom: 24,
            }}
          >
            Well Done!
          </Text>

          <View
            style={{
              width: '100%',
              backgroundColor: theme.cardBackground,
              borderRadius: 24,
              padding: 20,
              marginBottom: 16,
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
                  fontSize: 16,
                }}
              >
                Difficulty
              </Text>
              <Text
                style={{
                  color: theme.primaryText,
                  fontWeight: 'bold',
                  fontSize: 16,
                }}
              >
                Normal
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
                  fontSize: 16,
                }}
              >
                Score
              </Text>
              <Text
                style={{
                  color: theme.primaryText,
                  fontWeight: 'bold',
                  fontSize: 16,
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
                  fontSize: 16,
                }}
              >
                Today's Levels
              </Text>
              <Text
                style={{
                  color: theme.primaryText,
                  fontWeight: 'bold',
                  fontSize: 16,
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
              }}
            >
              <Text style={{ color: theme.secondaryText, fontWeight: 'bold' }}>
                🎯 {puzzleState.arrows.length}
              </Text>
              <View
                style={{ width: 1, height: 16, backgroundColor: theme.border }}
              />
              <Text style={{ color: theme.secondaryText, fontWeight: 'bold' }}>
                ❌ {failedAttempts}
              </Text>
              <View
                style={{ width: 1, height: 16, backgroundColor: theme.border }}
              />
              <Text style={{ color: theme.secondaryText, fontWeight: 'bold' }}>
                💡 {hintsUsed}
              </Text>
            </View>
          </View>

          <Button
            title="Next Level"
            variant="primary"
            style={{ width: '100%', marginTop: 8 }}
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
              gap: 16,
              width: '100%',
              marginTop: 16,
            }}
          >
            <Button
              title="Replay"
              variant="secondary"
              style={{
                flex: 1,
                backgroundColor: theme.cardBackground,
                borderWidth: 1,
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
                borderWidth: 1,
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
        <View style={{ paddingVertical: 16 }}>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 24,
            }}
          >
            <Text
              style={{
                fontSize: 24,
                fontWeight: 'bold',
                color: theme.primaryText,
              }}
            >
              Paused
            </Text>
            <IconButton
              icon="close"
              onPress={() => setShowSettingsModal(false)}
              iconColor={theme.primaryText}
              size={28}
            />
          </View>

          <View
            style={{
              backgroundColor: theme.cardBackground,
              borderRadius: 16,
              padding: 16,
              marginBottom: 24,
              borderWidth: 1,
              borderColor: theme.border,
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 20,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ fontSize: 20, marginRight: 12 }}>🔊</Text>
                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: '500',
                    color: theme.primaryText,
                  }}
                >
                  Sound
                </Text>
              </View>
              <Switch
                value={progress?.soundEnabled ?? true}
                onValueChange={val => toggleSetting('soundEnabled', val)}
                trackColor={{
                  false: theme.disabledState,
                  true: theme.primaryText,
                }}
                thumbColor={theme.appBackground}
              />
            </View>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ fontSize: 20, marginRight: 12 }}>📳</Text>
                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: '500',
                    color: theme.primaryText,
                  }}
                >
                  Vibration
                </Text>
              </View>
              <Switch
                value={progress?.hapticsEnabled ?? true}
                onValueChange={val => toggleSetting('hapticsEnabled', val)}
                trackColor={{
                  false: theme.disabledState,
                  true: theme.primaryText,
                }}
                thumbColor={theme.appBackground}
              />
            </View>
          </View>

          <View
            style={{
              backgroundColor: theme.cardBackground,
              borderRadius: 16,
              padding: 16,
              marginBottom: 24,
              borderWidth: 1,
              borderColor: theme.border,
            }}
          >
            <TouchableOpacity
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
              onPress={handleTogglePalette}
              activeOpacity={0.7}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ fontSize: 20, marginRight: 16 }}>🎨</Text>
                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: '500',
                    color: theme.primaryText,
                  }}
                >
                  Color Palette
                </Text>
              </View>
              <Text
                style={{
                  color: theme.primaryText,
                  fontSize: 24,
                  fontWeight: '300',
                  transform: [{ rotate: showPalette ? '90deg' : '0deg' }],
                }}
              >
                ›
              </Text>
            </TouchableOpacity>

            {showPalette && (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginTop: 16,
                  paddingTop: 16,
                  borderTopWidth: 1,
                  borderTopColor: theme.divider,
                  justifyContent: 'space-around',
                }}
              >
                <View style={{ alignItems: 'center', gap: 8 }}>
                  <TouchableOpacity
                    onPress={() => toggleTheme('dark')}
                    style={{
                      width: 64,
                      height: 80,
                      borderRadius: 8,
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderWidth: 2,
                      borderColor:
                        mode === 'dark' ? theme.primaryText : 'transparent',
                      backgroundColor: '#000000',
                      shadowColor: '#000',
                      shadowOpacity: 0.1,
                      shadowRadius: 4,
                      elevation: 2,
                    }}
                  />
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: '500',
                      color: theme.primaryText,
                      marginTop: 8,
                    }}
                  >
                    Dark Mode
                  </Text>
                </View>

                <View
                  style={{
                    width: 1,
                    height: 40,
                    backgroundColor: theme.divider,
                  }}
                />

                <View style={{ alignItems: 'center', gap: 8 }}>
                  <TouchableOpacity
                    onPress={() => toggleTheme('white')}
                    style={{
                      width: 64,
                      height: 80,
                      borderRadius: 8,
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderWidth: 2,
                      borderColor:
                        mode === 'white' ? theme.primaryText : 'transparent',
                      backgroundColor: '#ffffff',
                      shadowColor: '#000',
                      shadowOpacity: 0.1,
                      shadowRadius: 4,
                      elevation: 2,
                    }}
                  />
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: '500',
                      color: theme.primaryText,
                      marginTop: 8,
                    }}
                  >
                    White Mode
                  </Text>
                </View>
              </View>
            )}
          </View>

          <Button
            title="Restart"
            variant="primary"
            onPress={() => {
              setShowSettingsModal(false);
              loadLevel();
            }}
            fullWidth
          />
        </View>
      </Modal>

      <Modal visible={showFailModal} position="center">
        <View
          style={{
            alignItems: 'center',
            position: 'relative',
            marginTop: 24,
            paddingBottom: 8,
          }}
        >
          <View style={{ position: 'absolute', top: -70, zIndex: 10 }}>
            <WaterDrop size={64} empty={true} />
          </View>

          <Text
            style={{
              fontSize: 36,
              fontWeight: '900',
              color: theme.error,
              marginTop: 16,
              marginBottom: 8,
              letterSpacing: -1,
            }}
          >
            Oh no!
          </Text>
          <Text
            style={{
              fontSize: 14,
              fontWeight: '500',
              color: theme.mutedText,
              marginBottom: 32,
              textTransform: 'uppercase',
              letterSpacing: 2,
              textAlign: 'center',
            }}
          >
            Out of drops
          </Text>

          <View style={{ width: '100%', gap: 16 }}>
            <Button
              title="Try Again"
              variant="danger"
              style={{ width: '100%' }}
              onPress={() => {
                setShowFailModal(false);
                setTimeout(() => handleRetry(), 300);
              }}
            />
            <Button
              title="Give Up"
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
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
  levelHeaderCenter: {
    alignItems: 'center',
  },
  levelTitleText: {
    fontSize: 27,
    fontWeight: '900',
    color: '#FFFFFF',
    textShadowColor: '#1E3A8A',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 2,
    letterSpacing: 0.5,
  },
  levelStatsPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 10,
    marginTop: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  levelStatsText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
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
  bottomDockContainer: {
    alignItems: 'center',
    paddingBottom: 14,
    width: '100%',
  },
  bottomDockPill: {
    backgroundColor: 'rgba(15, 23, 42, 0.82)',
    paddingHorizontal: 20,
    paddingVertical: 6.5,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  bottomDockText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 12,
    letterSpacing: 2,
  },
});
