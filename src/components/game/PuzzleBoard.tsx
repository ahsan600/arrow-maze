import React, { useState, useCallback, useRef, useEffect, memo } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import {
  useSharedValue,
  withTiming,
  withSequence,
  Easing,
  cancelAnimation,
  makeMutable,
  useAnimatedStyle,
  withRepeat,
} from 'react-native-reanimated';
import Animated from 'react-native-reanimated';
import {
  PuzzleState,
  canStartArrow,
  computeArrowFullPath,
  getSolutionOrder,
} from '../../game/engine/PuzzleEngine';
import { ArrowPiece } from './ArrowPiece';
import { useTheme } from '../../theme/ThemeContext';
import Svg, { Path, Circle, Line } from 'react-native-svg';

const TICK_MS = 25;

type Cell = { r: number; c: number };

export interface PuzzleBoardProps {
  state: PuzzleState;
  onStateChange: (newState: PuzzleState) => void;
  disabled?: boolean;
  onArrowBlocked?: (arrowId: string) => void;
  onArrowFailed?: (arrowId: string) => void;
  showInGameTutorial?: boolean;
  hintArrowId?: string | null;
}

/* Origami Board Grid — Memoized faint dashed fold lines and craft dots */
const GridBackground = memo(function GridBackground({
  rows,
  cols,
  cellSize,
  visited,
  creaseColor,
  idleDotColor,
  visitedDotColor,
}: {
  rows: number;
  cols: number;
  cellSize: number;
  visited: Set<string>;
  creaseColor: string;
  idleDotColor: string;
  visitedDotColor: string;
}) {
  const w = cols * cellSize;
  const h = rows * cellSize;

  return (
    <View style={styles.gridBackground}>
      {/* Faint fold lines on origami board */}
      <Svg width={w} height={h} style={StyleSheet.absoluteFill}>
        {Array.from({ length: cols + 1 }).map((_, i) => (
          <Line
            key={`col-${i}`}
            x1={i * cellSize}
            y1={0}
            x2={i * cellSize}
            y2={h}
            stroke={creaseColor}
            strokeWidth={0.7}
            strokeDasharray="2 4"
          />
        ))}
        {Array.from({ length: rows + 1 }).map((_, i) => (
          <Line
            key={`row-${i}`}
            x1={0}
            y1={i * cellSize}
            x2={w}
            y2={i * cellSize}
            stroke={creaseColor}
            strokeWidth={0.7}
            strokeDasharray="2 4"
          />
        ))}
      </Svg>

      {/* Grid dots at intersections */}
      {Array.from({ length: rows }).map((_, r) => (
        <View key={r} style={{ flexDirection: 'row', height: cellSize, width: w }}>
          {Array.from({ length: cols }).map((_, c) => {
            const isVisited = visited.has(`${r},${c}`);
            return (
              <View
                key={c}
                style={[styles.gridCell, { width: cellSize, height: cellSize }]}
              >
                <View
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: isVisited ? visitedDotColor : idleDotColor,
                  }}
                />
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
});

export const PuzzleBoard: React.FC<PuzzleBoardProps> = ({
  state,
  onStateChange,
  disabled = false,
  onArrowBlocked,
  onArrowFailed,
  showInGameTutorial = false,
  hintArrowId = null,
}) => {
  const { theme, mode } = useTheme();

  // Stable callbacks
  const onStateChangeRef = useRef(onStateChange);
  const onArrowBlockedRef = useRef(onArrowBlocked);
  const onArrowFailedRef = useRef(onArrowFailed);
  onStateChangeRef.current = onStateChange;
  onArrowBlockedRef.current = onArrowBlocked;
  onArrowFailedRef.current = onArrowFailed;

  const [movingArrows, setMovingArrows] = useState<Set<string>>(new Set());
  const [shakeTriggers, setShakeTriggers] = useState<Record<string, number>>({});
  const [failedIds, setFailedIds] = useState<Record<string, boolean>>({});
  const [activePaths, setActivePaths] = useState<Record<string, Cell[]>>({});
  const [trajectories, setTrajectories] = useState<
    Record<string, { path: Cell[]; blocked: boolean; isHint: boolean }>
  >({});

  const movingRef = useRef<Set<string>>(new Set());
  const stateRef = useRef(state);
  const activePathsRef = useRef<Record<string, Cell[]>>({});
  const animProgressMap = useRef<
    Record<string, ReturnType<typeof makeMutable<number>>>
  >({});

  // Visited dots
  const visitedRef = useRef<Set<string>>(new Set());
  const [visitedCells, setVisitedCells] = useState<Set<string>>(new Set());

  const markVisited = useCallback(
    (cells: Cell[], rows: number, cols: number) => {
      let added = false;
      for (const c of cells) {
        if (c.r >= 0 && c.r < rows && c.c >= 0 && c.c < cols) {
          const k = `${c.r},${c.c}`;
          if (!visitedRef.current.has(k)) {
            visitedRef.current.add(k);
            added = true;
          }
        }
      }
      if (added) setVisitedCells(new Set(visitedRef.current));
    },
    [],
  );

  useEffect(() => {
    for (const a of state.arrows)
      markVisited(a.cells, state.gridSize.rows, state.gridSize.cols);
  }, [state, markVisited]);

  // Sync state ref
  useEffect(() => {
    if (state !== stateRef.current) {
      movingRef.current.forEach(arrowId => {
        const sv = animProgressMap.current[arrowId];
        if (sv) cancelAnimation(sv);
      });
      movingRef.current.clear();
      setMovingArrows(new Set());
      setActivePaths({});
      activePathsRef.current = {};
      setFailedIds({});
      setShakeTriggers({});
      setTrajectories({});
      visitedRef.current.clear();
      setVisitedCells(new Set());
      stateRef.current = state;
    }
  }, [state]);

  // Hint trajectory
  useEffect(() => {
    if (hintArrowId && stateRef.current) {
      const cur = stateRef.current;
      const arrow = cur.arrows.find(a => a.id === hintArrowId);
      if (arrow && arrow.active && !arrow.cleared) {
        const fullPath = computeArrowFullPath(cur, hintArrowId, movingRef.current);
        const { rows, cols } = cur.gridSize;
        const n = arrow.cells.length;
        const isCleared = fullPath.slice(-n).every(
          c => c.r < 0 || c.r >= rows || c.c < 0 || c.c >= cols,
        );

        let trajPath = fullPath.slice(n);
        if (!isCleared) {
          const lastCell = fullPath[fullPath.length - 1];
          let dr = 0,
            dc = 0;
          if (arrow.direction === 'UP') dr = -1;
          else if (arrow.direction === 'DOWN') dr = 1;
          else if (arrow.direction === 'LEFT') dc = -1;
          else if (arrow.direction === 'RIGHT') dc = 1;
          trajPath.push({ r: lastCell.r + dr, c: lastCell.c + dc });
        }

        setTrajectories(prev => ({
          ...prev,
          [hintArrowId]: { path: trajPath, blocked: !isCleared, isHint: true },
        }));
      }
    }
  }, [hintArrowId]);

  const staticProgress = useSharedValue(1);

  // Tutorial animation
  const handScale = useSharedValue(1);
  useEffect(() => {
    if (showInGameTutorial) {
      handScale.value = withRepeat(
        withSequence(
          withTiming(1.2, { duration: 500 }),
          withTiming(1, { duration: 500 }),
        ),
        -1,
        true,
      );
    }
  }, [showInGameTutorial, handScale]);
  const handStyle = useAnimatedStyle(() => ({
    transform: [{ scale: handScale.value }],
  }));

  // Cell sizing
  const screenWidth = Dimensions.get('window').width;
  const screenHeight = Dimensions.get('window').height;
  const boardPadding = 40;
  const availableWidth = screenWidth - boardPadding;
  const availableHeight = screenHeight * 0.58;
  const maxRows = state.gridSize.rows;
  const maxCols = state.gridSize.cols;
  const cellSize = Math.floor(
    Math.min(availableWidth / maxCols, availableHeight / maxRows, 80),
  );
  const boardWidth = maxCols * cellSize;
  const boardHeight = maxRows * cellSize;

  // Stop arrow
  const stopArrow = useCallback((arrowId: string) => {
    movingRef.current.delete(arrowId);
    delete activePathsRef.current[arrowId];
    setMovingArrows(new Set(movingRef.current));
    setActivePaths(prev => {
      if (!(arrowId in prev)) return prev;
      const next = { ...prev };
      delete next[arrowId];
      return next;
    });
  }, []);

  // UI thread step reached callback
  const handleStepReached = useCallback(
    (arrowId: string, stepIndex: number) => {
      const fullPath = activePathsRef.current[arrowId];
      if (!fullPath) return;

      const cur = stateRef.current;
      const arrow = cur.arrows.find(a => a.id === arrowId);
      if (!arrow) return;

      const L = arrow.cells.length;
      const { rows, cols } = cur.gridSize;
      const cells = fullPath.slice(stepIndex, stepIndex + L);
      if (cells.length < L) return;

      const isCleared = cells.every(
        c => c.r < 0 || c.r >= rows || c.c < 0 || c.c >= cols,
      );
      const totalSteps = fullPath.length - L;
      const finished = isCleared || stepIndex >= totalSteps;

      const next: PuzzleState = {
        ...cur,
        arrows: cur.arrows.map(a =>
          a.id === arrowId
            ? { ...a, cells, cleared: isCleared, active: !isCleared }
            : a,
        ),
      };
      stateRef.current = next;

      if (finished) {
        onStateChangeRef.current(next);
        stopArrow(arrowId);
      }
    },
    [stopArrow],
  );

  // Start arrow flying
  const startArrow = useCallback((arrowId: string, totalSteps: number) => {
    if (!animProgressMap.current[arrowId]) {
      animProgressMap.current[arrowId] = makeMutable(0);
    }
    const sv = animProgressMap.current[arrowId];
    movingRef.current.add(arrowId);
    setMovingArrows(new Set(movingRef.current));
    cancelAnimation(sv);
    sv.value = 0;
    sv.value = withTiming(1, {
      duration: totalSteps * TICK_MS,
      easing: Easing.linear,
    });
  }, []);

  // Reject tap
  const rejectTap = useCallback((arrowId: string) => {
    setFailedIds(prev => (prev[arrowId] ? prev : { ...prev, [arrowId]: true }));
    setShakeTriggers(prev => ({
      ...prev,
      [arrowId]: (prev[arrowId] || 0) + 1,
    }));
    onArrowBlockedRef.current?.(arrowId);
    onArrowFailedRef.current?.(arrowId);
  }, []);

  // User input
  const handleArrowLongPress = useCallback(
    (arrowId: string) => {
      if (disabled || movingRef.current.has(arrowId)) return;
      const cur = stateRef.current;
      const arrow = cur.arrows.find(a => a.id === arrowId);
      if (!arrow || !arrow.active || arrow.cleared) return;

      const fullPath = computeArrowFullPath(cur, arrowId, movingRef.current);
      const { rows, cols } = cur.gridSize;
      const n = arrow.cells.length;
      const isCleared = fullPath.slice(-n).every(
        c => c.r < 0 || c.r >= rows || c.c < 0 || c.c >= cols,
      );

      let trajPath = fullPath.slice(n);
      if (!isCleared) {
        const lastCell = fullPath[fullPath.length - 1];
        let dr = 0,
          dc = 0;
        if (arrow.direction === 'UP') dr = -1;
        else if (arrow.direction === 'DOWN') dr = 1;
        else if (arrow.direction === 'LEFT') dc = -1;
        else if (arrow.direction === 'RIGHT') dc = 1;
        trajPath.push({ r: lastCell.r + dr, c: lastCell.c + dc });
      }

      setTrajectories(prev => ({
        ...prev,
        [arrowId]: { path: trajPath, blocked: !isCleared, isHint: false },
      }));
    },
    [disabled],
  );

  const handleArrowPress = useCallback(
    (arrowId: string) => {
      if (disabled || movingRef.current.has(arrowId)) return;

      const cur = stateRef.current;
      const arrow = cur.arrows.find(a => a.id === arrowId);
      if (!arrow || !arrow.active || arrow.cleared) return;

      if (!canStartArrow(cur, arrowId, movingRef.current)) {
        rejectTap(arrowId);
        return;
      }

      const fullPath = computeArrowFullPath(cur, arrowId, movingRef.current);
      const totalSteps = fullPath.length - arrow.cells.length;
      if (totalSteps <= 0) {
        rejectTap(arrowId);
        return;
      }

      setFailedIds(prev => {
        if (!prev[arrowId]) return prev;
        const next = { ...prev };
        delete next[arrowId];
        return next;
      });

      setTrajectories(prev => {
        if (!prev[arrowId]) return prev;
        const next = { ...prev };
        delete next[arrowId];
        return next;
      });

      markVisited(fullPath, cur.gridSize.rows, cur.gridSize.cols);
      activePathsRef.current[arrowId] = fullPath;
      setActivePaths(prev => ({ ...prev, [arrowId]: fullPath }));
      startArrow(arrowId, totalSteps);
    },
    [disabled, startArrow, rejectTap, markVisited],
  );

  // Gestures for zoom & pan
  const boardScale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  const pinchGesture = Gesture.Pinch()
    .onUpdate(e => {
      boardScale.value = Math.max(0.5, Math.min(savedScale.value * e.scale, 5));
    })
    .onEnd(() => {
      savedScale.value = boardScale.value;
    });

  const panGesture = Gesture.Pan()
    .minDistance(10)
    .onUpdate(e => {
      translateX.value = savedTranslateX.value + e.translationX;
      translateY.value = savedTranslateY.value + e.translationY;
    })
    .onEnd(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    });

  const composedGesture = Gesture.Simultaneous(pinchGesture, panGesture);

  const boardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: boardScale.value },
    ],
  }));

  const solutionOrder = showInGameTutorial ? getSolutionOrder(state) : null;
  const bestTutorialArrowId =
    solutionOrder && solutionOrder.length > 0 ? solutionOrder[0] : null;
  const tutorialArrow = bestTutorialArrowId
    ? state.arrows.find(a => a.id === bestTutorialArrowId && a.active && !a.cleared)
    : (showInGameTutorial
        ? state.arrows.find(a => a.active && !a.cleared && canStartArrow(state, a.id))
        : null);

  const targetCell = tutorialArrow
    ? (tutorialArrow.cells[Math.floor(tutorialArrow.cells.length / 2)] || tutorialArrow.cells[0])
    : null;

  return (
    <GestureDetector gesture={composedGesture}>
      <Animated.View
        style={[{ width: boardWidth, height: boardHeight }, boardAnimatedStyle]}
      >
        <View
          style={[
            styles.board,
            {
              width: boardWidth,
              height: boardHeight,
              backgroundColor: theme.board,
              borderColor: theme.crease,
              shadowColor: theme.shadow,
            },
          ]}
        >
          {/* 1px crease highlight line on top edge */}
          <View style={[styles.topCrease, { backgroundColor: theme.creaseHighlight }]} />

          <GridBackground
            rows={maxRows}
            cols={maxCols}
            cellSize={cellSize}
            visited={visitedCells}
            creaseColor={mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : theme.crease}
            idleDotColor={theme.gridDotIdle || (mode === 'dark' ? 'rgba(246, 239, 228, 0.40)' : 'rgba(43, 45, 91, 0.22)')}
            visitedDotColor={theme.gridDotVisited || (mode === 'dark' ? 'rgba(246, 239, 228, 0.18)' : 'rgba(43, 45, 91, 0.10)')}
          />

          {state.arrows
            .filter(a => a.active && !a.cleared)
            .map(arrow => (
              <ArrowPiece
                key={arrow.id}
                arrow={arrow}
                fullPath={activePaths[arrow.id] || arrow.cells}
                cellSize={cellSize}
                onPress={handleArrowPress}
                onLongPress={handleArrowLongPress}
                disabled={disabled}
                animProgress={animProgressMap.current[arrow.id] ?? staticProgress}
                shakeTrigger={shakeTriggers[arrow.id] || 0}
                failed={!!failedIds[arrow.id]}
                onStepReached={handleStepReached}
              />
            ))}

          {/* Running Stitch Trajectory Preview (sewing thread: open = matcha/teal, blocked = vermilion/coral) */}
          <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
            {Object.entries(trajectories).map(([id, traj]) => {
              const arrow = state.arrows.find(a => a.id === id);
              if (!arrow || traj.path.length === 0) return null;

              const isFailed = failedIds[id];
              const color = isFailed || traj.blocked ? theme.primary : theme.success;

              const head = arrow.cells[arrow.cells.length - 1];
              const startX = head.c * cellSize + cellSize / 2;
              const startY = head.r * cellSize + cellSize / 2;

              const lastCell = traj.path[traj.path.length - 1];
              let endX = lastCell.c * cellSize + cellSize / 2;
              let endY = lastCell.r * cellSize + cellSize / 2;

              if (!traj.blocked) {
                if (arrow.direction === 'UP') endY = -2000;
                else if (arrow.direction === 'DOWN') endY = 2000;
                else if (arrow.direction === 'LEFT') endX = -2000;
                else if (arrow.direction === 'RIGHT') endX = 2000;
              }

              return (
                <React.Fragment key={`traj-${id}`}>
                  <Path
                    d={`M ${startX} ${startY} L ${endX} ${endY}`}
                    stroke={color}
                    strokeWidth={3.5}
                    strokeDasharray="5 4"
                    strokeLinecap="round"
                    opacity={0.8}
                  />
                  {traj.path.map((cell, idx) => (
                    <Circle
                      key={`dot-${idx}`}
                      cx={cell.c * cellSize + cellSize / 2}
                      cy={cell.r * cellSize + cellSize / 2}
                      r={3.5}
                      fill={color}
                      opacity={0.85}
                    />
                  ))}
                </React.Fragment>
              );
            })}
          </Svg>

          {/* Tutorial indicator */}
          {tutorialArrow && targetCell && movingArrows.size === 0 && (
            <Animated.View
              style={[
                {
                  position: 'absolute',
                  left: targetCell.c * cellSize + cellSize / 2 - 24,
                  top: targetCell.r * cellSize + cellSize / 2 - 24,
                  width: 48,
                  height: 48,
                  justifyContent: 'center',
                  alignItems: 'center',
                  zIndex: 100,
                  pointerEvents: 'none',
                },
                handStyle,
              ]}
            >
              <View
                style={{
                  position: 'absolute',
                  top: -50,
                  backgroundColor: theme.primary,
                  paddingHorizontal: 14,
                  paddingVertical: 6,
                  borderRadius: 10,
                  shadowColor: theme.shadow,
                  shadowOpacity: 0.25,
                  shadowRadius: 4,
                  elevation: 3,
                  width: 140,
                  alignItems: 'center',
                }}
              >
                <Text
                  style={{
                    color: theme.primaryButtonText,
                    fontWeight: '800',
                    fontSize: 14,
                    textAlign: 'center',
                  }}
                >
                  Tap an arrow
                </Text>
              </View>
              <Text style={{ fontSize: 44, marginTop: 36, marginLeft: 16 }}>👆</Text>
            </Animated.View>
          )}
        </View>
      </Animated.View>
    </GestureDetector>
  );
};

const styles = StyleSheet.create({
  board: {
    position: 'relative',
    overflow: 'visible',
    borderRadius: 20,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 4,
  },
  topCrease: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1.5,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    zIndex: 10,
  },
  gridBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 20,
    overflow: 'hidden',
  },
  gridCell: { justifyContent: 'center', alignItems: 'center' },
});
