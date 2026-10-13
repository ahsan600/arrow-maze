import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, LayoutAnimation } from 'react-native';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Svg, { Path, Rect, G } from 'react-native-svg';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { IconButton } from '../../components/ui/IconButton';
import { getProgress, setProgress } from '../../storage/gameStorage';
import { PuzzleBoard } from '../../components/game/PuzzleBoard';
import { allLevels } from '../../game/levels';
import { generateLevelData, getAnimalNameForLevel } from '../../game/levels/LevelGenerator';
import { PuzzleState, isLevelComplete, getSolutionOrder } from '../../game/engine/PuzzleEngine';
import { GameProgress } from '../../types/game.types';
import { useTheme } from '../../theme/ThemeContext';
import { ThemeMode } from '../../theme/types';
import { WaterDrop } from '../../components/icons/WaterDrop';
import { Modal } from '../../components/ui/Modal';
import { StarsDisplay } from '../../components/ui/StarsDisplay';
import { PaperButton } from '../../components/buttons/PaperButton';
import { PaperCard } from '../../components/cards/PaperCard';

type RootStackParamList = {
  Home: undefined;
  LevelSelect: undefined;
  Game: { levelId: number };
};

type GameScreenRouteProp = RouteProp<RootStackParamList, 'Game'>;
type GameScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Game'>;

/** Scattered Paper Confetti Bits for Win Certificate Modal */
const PaperConfetti = ({ theme }: { theme: any }) => (
  <View style={StyleSheet.absoluteFill} pointerEvents="none">
    <Svg width="100%" height="100%">
      <G opacity={0.85}>
        <Rect x="20" y="40" width="8" height="8" fill={theme.primary} transform="rotate(25 24 44)" />
        <Rect x="85" y="15" width="10" height="6" fill={theme.warning} transform="rotate(-35 90 18)" />
        <Rect x="160" y="30" width="7" height="9" fill={theme.success} transform="rotate(45 163 34)" />
        <Rect x="240" y="18" width="9" height="7" fill={theme.arrow} transform="rotate(15 244 21)" />
        <Rect x="290" y="45" width="8" height="8" fill={theme.primary} transform="rotate(-20 294 49)" />
        <Rect x="40" y="110" width="7" height="7" fill={theme.success} transform="rotate(60 43 113)" />
        <Rect x="270" y="105" width="8" height="6" fill={theme.warning} transform="rotate(-40 274 108)" />
      </G>
    </Svg>
  </View>
);

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
    const targetLevelId = levelId > 0 ? levelId : 1;
    let levelDef = allLevels.find(l => l.id === targetLevelId);
    if (!levelDef) {
      levelDef = generateLevelData(targetLevelId, getAnimalNameForLevel(targetLevelId));
    }

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

    let minR = Infinity, maxR = -Infinity;
    let minC = Infinity, maxC = -Infinity;

    arrows.forEach(a => {
      a.cells.forEach(c => {
        if (c.r < minR) minR = c.r;
        if (c.r > maxR) maxR = c.r;
        if (c.c < minC) minC = c.c;
        if (c.c > maxC) maxC = c.c;
      });
    });

    if (minR === Infinity) {
      minR = 0; maxR = 3; minC = 0; maxC = 3;
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

  const toggleSetting = useCallback(async (key: 'soundEnabled' | 'hapticsEnabled', value: boolean) => {
    if (progress) {
      const newProgress = { ...progress, [key]: value };
      setProgressState(newProgress);
      await setProgress(newProgress);
    }
  }, [progress]);

  const toggleTheme = useCallback(async (newMode: ThemeMode) => {
    if (progress) {
      const newProgress = { ...progress, theme: newMode };
      setProgressState(newProgress);
      setMode(newMode);
      await setProgress(newProgress);
    }
  }, [progress, setMode]);

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
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [drops, puzzleState]);

  const handleRetry = useCallback(() => {
    setShowFailModal(false);
    loadLevel();
  }, [loadLevel]);

  const handleStateChange = useCallback(async (newState: PuzzleState) => {
    setPuzzleState(newState);

    if (isLevelComplete(newState)) {
      try {
        const p = await getProgress();
        if (!p.completedLevels.includes(levelId)) {
          p.completedLevels.push(levelId);
        }

        const nextLevel = levelId + 1;
        if (nextLevel > p.currentLevel) {
          p.currentLevel = nextLevel;
        }

        if (levelId >= 3 && !p.tutorialCompleted) {
          p.tutorialCompleted = true;
          setShowInGameTutorial(false);
        }

        const today = new Date().toISOString().split('T')[0];
        if (p.dailyPlayedDate !== today) {
          p.dailyPlayedDate = today;
          p.dailyPlayedCount = 1;
        } else {
          p.dailyPlayedCount = (p.dailyPlayedCount || 0) + 1;
        }

        const targetLevelId = levelId > 0 ? levelId : 1;
        let levelDef = allLevels.find(l => l.id === targetLevelId);
        if (!levelDef) {
          levelDef = generateLevelData(targetLevelId, getAnimalNameForLevel(targetLevelId));
        }
        const maxHearts = levelDef.maxHearts || 3;
        const lostDrops = maxHearts - drops;
        let stars = 3;
        if (lostDrops === 1) stars = 2;
        if (lostDrops >= 2) stars = 1;

        setEarnedStars(stars);

        if (!p.bestScores) {
          p.bestScores = {};
        }
        const currentBest = p.bestScores[levelId] || 0;
        if (stars > currentBest) {
          p.bestScores[levelId] = stars;
        }

        await setProgress(p);
        setProgressState(p);

        setTimeout(() => {
          setShowCompleteModal(true);
        }, 700);
      } catch (e) {
        console.error(e);
      }
    }
  }, [levelId, drops]);

  const handleArrowBlocked = useCallback(() => {
    setDrops(prev => Math.max(0, prev - 1));
  }, []);

  if (!puzzleState) return null;

  const remainingArrows = puzzleState.arrows.filter(a => a.active && !a.cleared).length;

  return (
    <ScreenContainer style={styles.container}>
      {/* Top HUD */}
      <View style={styles.header}>
        {/* Back Button */}
        <IconButton
          icon="back"
          onPress={() => navigation.goBack()}
          iconColor={theme.primaryText}
          style={[styles.headerRoundBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}
          size={22}
        />

        {/* Level Tag Label with stitched border */}
        <View
          style={[
            styles.levelTag,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
              borderTopColor: theme.creaseHighlight,
              shadowColor: theme.shadow,
            },
          ]}
        >
          <Text style={[styles.levelTagText, { color: theme.primaryText }]}>
            LEVEL {levelId}
          </Text>
        </View>

        {/* Pause/Settings Round Paper Button */}
        <TouchableOpacity
          onPress={() => setShowSettingsModal(true)}
          style={[
            styles.headerRoundBtn,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
              shadowColor: theme.shadow,
            },
          ]}
          activeOpacity={0.8}
        >
          <Svg width={20} height={20} viewBox="0 0 24 24">
            <Path
              d="M 6 5 L 10 5 L 10 19 L 6 19 Z M 14 5 L 18 5 L 18 19 L 14 19 Z"
              fill={theme.primaryText}
            />
          </Svg>
        </TouchableOpacity>
      </View>

      {/* Hanko Ink Stamps Life Indicator & Remaining Arrows Strip */}
      <View style={styles.hudRow}>
        {/* 3 Hanko ink stamps */}
        <View
          style={[
            styles.hankoRow,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
              borderTopColor: theme.creaseHighlight,
              shadowColor: theme.shadow,
            },
          ]}
        >
          {Array.from({ length: 3 }).map((_, i) => (
            <WaterDrop key={i} size={24} empty={i >= drops} />
          ))}
        </View>

        {/* Remaining arrows paper strip indicator */}
        <View
          style={[
            styles.progressStrip,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
              borderTopColor: theme.creaseHighlight,
              shadowColor: theme.shadow,
            },
          ]}
        >
          <Text style={[styles.progressStripText, { color: theme.secondaryText }]}>
            REMAINING: <Text style={{ color: theme.primary, fontWeight: '900' }}>{remainingArrows}</Text>
          </Text>
        </View>
      </View>

      {/* Main Origami Board */}
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

      {/* Floating Action Controls: Hint & Restart (Paper Buttons) */}
      <View style={styles.floatingActions}>
        <PaperButton
          title="Hint"
          variant="secondary"
          radiusSize="lg"
          icon={
            <Svg width={18} height={18} viewBox="0 0 24 24">
              <Path
                d="M 12 2 C 8.1 2 5 5.1 5 9 C 5 11.4 6.2 13.5 8 14.7 L 8 18 C 8 18.6 8.4 19 9 19 L 15 19 C 15.6 19 16 18.6 16 18 L 16 14.7 C 17.8 13.5 19 11.4 19 9 C 19 5.1 15.9 2 12 2 Z M 10 21 C 10 21.6 10.4 22 11 22 L 13 22 C 13.6 22 14 21.6 14 21 L 10 21 Z"
                fill={theme.warning}
              />
            </Svg>
          }
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
          style={styles.actionPaperBtn}
        />

        <PaperButton
          title="Restart"
          variant="secondary"
          radiusSize="lg"
          icon={
            <Svg width={18} height={18} viewBox="0 0 24 24">
              <Path
                d="M 17.65 6.35 C 16.2 4.9 14.21 4 12 4 C 7.58 4 4.01 7.58 4.01 12 C 4.01 16.42 7.58 20 12 20 C 15.73 20 18.84 17.45 19.73 14 L 17.65 14 C 16.83 16.33 14.61 18 12 18 C 8.69 18 6 15.31 6 12 C 6 8.69 8.69 6 12 6 C 13.66 6 15.14 6.69 16.22 7.78 L 13 11 L 20 11 L 20 4 Z"
                fill={theme.primaryText}
              />
            </Svg>
          }
          onPress={loadLevel}
          style={styles.actionPaperBtn}
        />
      </View>

      {/* Win Modal: Unfolding Paper Certificate */}
      <Modal visible={showCompleteModal} position="center">
        <View style={styles.modalContent}>
          {/* Confetti bits */}
          <PaperConfetti theme={theme} />

          {/* Stars flying in */}
          <View style={styles.starsWrapper}>
            <StarsDisplay stars={earnedStars} size={48} animate={true} />
          </View>

          <Text style={[styles.certificateHeading, { color: theme.primaryText }]}>
            LEVEL SOLVED!
          </Text>
          <Text style={[styles.certificateSub, { color: theme.mutedText }]}>
            ORIGAMI CERTIFICATE OF MASTERY
          </Text>

          {/* Certificate score paper card */}
          <PaperCard radiusSize="md" style={styles.scoreDetailsCard}>
            <View style={styles.statRow}>
              <Text style={[styles.statLabel, { color: theme.mutedText }]}>Hanko Lives</Text>
              <Text style={[styles.statValue, { color: theme.primaryText }]}>{drops} / 3</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: theme.divider }]} />
            <View style={styles.statRow}>
              <Text style={[styles.statLabel, { color: theme.mutedText }]}>Hints Used</Text>
              <Text style={[styles.statValue, { color: theme.primaryText }]}>{hintsUsed}</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: theme.divider }]} />
            <View style={styles.statRow}>
              <Text style={[styles.statLabel, { color: theme.mutedText }]}>Mastery Score</Text>
              <Text style={[styles.statValue, { color: theme.primary, fontWeight: '900' }]}>
                {1000 + drops * 150} PTS
              </Text>
            </View>
          </PaperCard>

          <PaperButton
            title="Next Level"
            variant="primary"
            radiusSize="md"
            fullWidth
            onPress={() => {
              setShowCompleteModal(false);
              setTimeout(() => {
                navigation.replace('Game', { levelId: (levelId || 1) + 1 });
              }, 250);
            }}
            style={{ marginTop: 14 }}
          />

          <View style={styles.modalButtonsRow}>
            <PaperButton
              title="Replay"
              variant="secondary"
              radiusSize="md"
              style={{ flex: 1 }}
              onPress={() => {
                setShowCompleteModal(false);
                loadLevel();
              }}
            />
            <PaperButton
              title="Menu"
              variant="secondary"
              radiusSize="md"
              style={{ flex: 1 }}
              onPress={() => {
                setShowCompleteModal(false);
                navigation.goBack();
              }}
            />
          </View>
        </View>
      </Modal>

      {/* Fail Modal: Crumpled-Edge Paper Card (No harsh red) */}
      <Modal visible={showFailModal} position="center">
        <View style={styles.modalContent}>
          {/* Broken Hanko Seal */}
          <View style={styles.failHankoWrapper}>
            <WaterDrop size={56} empty={true} />
          </View>

          <Text style={[styles.failHeading, { color: theme.primaryText }]}>
            Out of Hanko Stamps
          </Text>
          <Text style={[styles.failSub, { color: theme.mutedText }]}>
            A fold collision occurred. Unfold and try again!
          </Text>

          <PaperButton
            title="Try Again"
            variant="primary"
            radiusSize="md"
            fullWidth
            onPress={handleRetry}
            style={{ marginTop: 16 }}
          />

          <PaperButton
            title="Return to Menu"
            variant="secondary"
            radiusSize="md"
            fullWidth
            onPress={() => {
              setShowFailModal(false);
              navigation.goBack();
            }}
            style={{ marginTop: 10 }}
          />
        </View>
      </Modal>

      {/* Paused Settings Notebook Modal */}
      <Modal visible={showSettingsModal} position="center" onClose={() => setShowSettingsModal(false)}>
        <View style={{ paddingVertical: 12 }}>
          <View style={styles.pauseHeader}>
            <Text style={[styles.pauseTitle, { color: theme.primaryText }]}>Game Paused</Text>
            <IconButton icon="close" onPress={() => setShowSettingsModal(false)} iconColor={theme.primaryText} size={24} />
          </View>

          <PaperCard radiusSize="md" style={styles.settingsGroupCard}>
            <View style={styles.switchRow}>
              <Text style={[styles.switchLabel, { color: theme.primaryText }]}>Sound Effects</Text>
              <Switch
                value={progress?.soundEnabled ?? true}
                onValueChange={val => toggleSetting('soundEnabled', val)}
                trackColor={{ false: theme.disabledState, true: theme.primary }}
                thumbColor={theme.surface}
              />
            </View>
            <View style={[styles.statDivider, { backgroundColor: theme.divider }]} />
            <View style={styles.switchRow}>
              <Text style={[styles.switchLabel, { color: theme.primaryText }]}>Haptic Feedback</Text>
              <Switch
                value={progress?.hapticsEnabled ?? true}
                onValueChange={val => toggleSetting('hapticsEnabled', val)}
                trackColor={{ false: theme.disabledState, true: theme.primary }}
                thumbColor={theme.surface}
              />
            </View>
          </PaperCard>

          {/* Theme Switch: Sun/Moon Cut-Out */}
          <PaperCard radiusSize="md" style={[styles.settingsGroupCard, { marginTop: 12 }]}>
            <TouchableOpacity style={styles.switchRow} onPress={handleTogglePalette} activeOpacity={0.7}>
              <Text style={[styles.switchLabel, { color: theme.primaryText }]}>
                Theme: {mode === 'white' ? 'Washi Day' : 'Night Kraft'}
              </Text>
              <Text style={{ color: theme.primaryText, fontSize: 18 }}>›</Text>
            </TouchableOpacity>

            {showPalette && (
              <View style={styles.themeOptionsRow}>
                <TouchableOpacity
                  onPress={() => toggleTheme('white')}
                  style={[
                    styles.themeTile,
                    {
                      backgroundColor: '#FFFDF8',
                      borderColor: mode === 'white' ? theme.primary : '#E6DEC8',
                    },
                  ]}
                >
                  <Text style={{ fontSize: 12, fontWeight: '700', color: '#2B2D5B' }}>Washi Day</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => toggleTheme('dark')}
                  style={[
                    styles.themeTile,
                    {
                      backgroundColor: '#26243F',
                      borderColor: mode === 'dark' ? theme.primary : '#353257',
                    },
                  ]}
                >
                  <Text style={{ fontSize: 12, fontWeight: '700', color: '#F6EFE4' }}>Night Kraft</Text>
                </TouchableOpacity>
              </View>
            )}
          </PaperCard>

          <PaperButton
            title="Resume"
            variant="primary"
            radiusSize="md"
            fullWidth
            onPress={() => setShowSettingsModal(false)}
            style={{ marginTop: 16 }}
          />
        </View>
      </Modal>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 4,
    zIndex: 10,
  },
  headerRoundBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.14,
    shadowRadius: 6,
    elevation: 3,
  },
  levelTag: {
    paddingHorizontal: 18,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderTopWidth: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 5,
    elevation: 3,
  },
  levelTagText: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  hudRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    marginVertical: 6,
    zIndex: 10,
  },
  hankoRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 1,
    borderTopWidth: 1.5,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  progressStrip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderTopWidth: 1.5,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  progressStripText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
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
    paddingHorizontal: 16,
    marginVertical: 10,
    zIndex: 10,
  },
  actionPaperBtn: {
    flex: 1,
    maxWidth: 160,
    minHeight: 46,
  },
  modalContent: {
    alignItems: 'center',
    paddingVertical: 12,
    position: 'relative',
  },
  starsWrapper: {
    marginBottom: 12,
  },
  certificateHeading: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 1,
  },
  certificateSub: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2,
    marginTop: 4,
    marginBottom: 16,
  },
  scoreDetailsCard: {
    width: '100%',
    padding: 16,
    marginBottom: 10,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  statLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  statValue: {
    fontSize: 14,
    fontWeight: '800',
  },
  statDivider: {
    height: 1,
    marginVertical: 6,
  },
  modalButtonsRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    marginTop: 10,
  },
  failHankoWrapper: {
    marginVertical: 8,
  },
  failHeading: {
    fontSize: 22,
    fontWeight: '800',
    marginTop: 8,
  },
  failSub: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 4,
    marginHorizontal: 16,
    lineHeight: 18,
  },
  pauseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  pauseTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
  settingsGroupCard: {
    padding: 14,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  switchLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  themeOptionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.06)',
  },
  themeTile: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
  },
});
