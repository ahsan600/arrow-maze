import React, { useState, useCallback, useRef, useEffect, memo } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
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
import Svg, { Path, Circle, Line, Rect } from 'react-native-svg';

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

/**
 * Grid of Faint Paper Fold Lines
 * Renders dashed crease lines across grid rows and columns like folded origami paper.
 */
const GridBackground = memo(function GridBackground({
  rows,
  cols,
  cellSize,
  creaseColor,
  dotColor,
}: {
  rows: number;
  cols: number;
  cellSize: number;
  creaseColor: string;
  dotColor: string;
}) {
  const width = cols * cellSize;
  const height = rows * cellSize;

  return (
    <View style={styles.gridBackground}>
      <Svg width={width} height={height}>
        {/* Horizontal fold crease lines */}
        {Array.from({ length: rows + 1 }).map((_, r) => (
          <Line
            key={`h-${r}`}
            x1="0"
            y1={r * cellSize}
            x2={width}
            y2={r * cellSize}
            stroke={creaseColor}
            strokeWidth="1"
            strokeDasharray="4 4"
            opacity={0.65}
          />
        ))}

        {/* Vertical fold crease lines */}
        {Array.from({ length: cols + 1 }).map((_, c) => (
          <Line
            key={`v-${c}`}
            x1={c * cellSize}
            y1="0"
            x2={c * cellSize}
            y2={height}
            stroke={creaseColor}
            strokeWidth="1"
            strokeDasharray="4 4"
            opacity={0.65}
          />
        ))}

        {/* Intersection fold pinprick dots */}
        {Array.from({ length: rows }).map((_, r) =>
          Array.from({ length: cols }).map((_, c) => (
            <Circle
              key={`dot-${r}-${c}`}
              cx={c * cellSize + cellSize / 2}
              cy={r * cellSize + cellSize / 2}
              r={2.5}
              fill={dotColor}
              opacity={0.3}
            />
          ))
        )}
      </Svg>
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

  const visitedRef = useRef<Set<string>>(new Set());

  // ── Sync fresh state ─────────────────────────────────────────────────────────
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
      stateRef.current = state;
    }
  }, [state]);

  // ── Hint trajectory ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (hintArrowId && stateRef.current) {
      const cur = stateRef.current;
      const arrow = cur.arrows.find(a => a.id === hintArrowId);
      if (arrow && arrow.active && !arrow.cleared) {
        const fullPath = computeArrowFullPath(cur, hintArrowId, movingRef.current);
        const { rows, cols } = cur.gridSize;
        const n = arrow.cells.length;
        const isCleared = fullPath.slice(-n).every(c => c.r < 0 || c.r >= rows || c.c < 0 || c.c >= cols);

        let trajPath = fullPath.slice(n);
        if (!isCleared) {
          const lastCell = fullPath[fullPath.length - 1];
          let dr = 0, dc = 0;
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

  // ── Hint highlighter pulse ──────────────────────────────────────────────────
  const hintPulse = useSharedValue(1);
  useEffect(() => {
    if (hintArrowId) {
      hintPulse.value = withRepeat(
        withSequence(
          withTiming(1.1, { duration: 600, easing: Easing.inOut(Easing.ease) }),
          withTiming(1.0, { duration: 600, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
        true,
      );
    } else {
      hintPulse.value = 1;
    }
  }, [hintArrowId, hintPulse]);

  const hintStyle = useAnimatedStyle(() => ({
    transform: [{ scale: hintPulse.value }],
  }));

  // ── Dimensions ───────────────────────────────────────────────────────────────
  const screenWidth = Dimensions.get('window').width;
  const screenHeight = Dimensions.get('window').height;
  const boardPadding = 48;
  const availableWidth = screenWidth - boardPadding;
  const availableHeight = screenHeight * 0.6;
  const maxRows = state.gridSize.rows;
  const maxCols = state.gridSize.cols;
  const cellSize = Math.floor(Math.min(
    availableWidth / maxCols,
    availableHeight / maxRows,
    80,
  ));
  const boardWidth = maxCols * cellSize;
  const boardHeight = maxRows * cellSize;

  // ── Flight handlers ──────────────────────────────────────────────────────────
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

  const rejectTap = useCallback((arrowId: string) => {
    setFailedIds(prev => (prev[arrowId] ? prev : { ...prev, [arrowId]: true }));
    setShakeTriggers(prev => ({
      ...prev,
      [arrowId]: (prev[arrowId] || 0) + 1,
    }));
    onArrowBlockedRef.current?.(arrowId);
    onArrowFailedRef.current?.(arrowId);
  }, []);

  const handleArrowLongPress = useCallback((arrowId: string) => {
    if (disabled || movingRef.current.has(arrowId)) return;
    const cur = stateRef.current;
    const arrow = cur.arrows.find(a => a.id === arrowId);
    if (!arrow || !arrow.active || arrow.cleared) return;

    const fullPath = computeArrowFullPath(cur, arrowId, movingRef.current);
    const { rows, cols } = cur.gridSize;
    const n = arrow.cells.length;
    const isCleared = fullPath.slice(-n).every(c => c.r < 0 || c.r >= rows || c.c < 0 || c.c >= cols);

    let trajPath = fullPath.slice(n);
    if (!isCleared) {
      const lastCell = fullPath[fullPath.length - 1];
      let dr = 0, dc = 0;
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
  }, [disabled]);

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

      activePathsRef.current[arrowId] = fullPath;
      setActivePaths(prev => ({ ...prev, [arrowId]: fullPath }));
      startArrow(arrowId, totalSteps);
    },
    [disabled, startArrow, rejectTap],
  );

  // ── Zoom and Pan gestures ───────────────────────────────────────────────────
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

  // Find hinted arrow
  const hintedArrow = hintArrowId ? state.arrows.find(a => a.id === hintArrowId) : null;

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
              backgroundColor: theme.boardBackground,
              borderColor: theme.border,
              borderTopColor: theme.creaseHighlight,
              shadowColor: theme.shadow,
            },
          ]}
        >
          {/* Faint fold lines grid */}
          <GridBackground
            rows={maxRows}
            cols={maxCols}
            cellSize={cellSize}
            creaseColor={theme.crease}
            dotColor={theme.mutedText}
          />

          {/* Yellow highlighter-style glow for hinted arrow */}
          {hintedArrow && hintedArrow.active && !hintedArrow.cleared && (
            <Animated.View
              style={[
                styles.highlighterGlow,
                hintStyle,
                {
                  left: Math.min(...hintedArrow.cells.map(c => c.c)) * cellSize - 4,
                  top: Math.min(...hintedArrow.cells.map(c => c.r)) * cellSize - 4,
                  width:
                    (Math.max(...hintedArrow.cells.map(c => c.c)) -
                      Math.min(...hintedArrow.cells.map(c => c.c)) +
                      1) *
                      cellSize +
                    8,
                  height:
                    (Math.max(...hintedArrow.cells.map(c => c.r)) -
                      Math.min(...hintedArrow.cells.map(c => c.r)) +
                      1) *
                      cellSize +
                    8,
                  backgroundColor: mode === 'dark' ? 'rgba(242, 177, 52, 0.28)' : 'rgba(242, 177, 52, 0.35)',
                  borderColor: theme.warning,
                },
              ]}
              pointerEvents="none"
            />
          )}

          {/* Origami Paper Arrows */}
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

          {/* Trajectory stitch-like line (running sewing thread) */}
          <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
            {Object.entries(trajectories).map(([id, traj]) => {
              const arrow = state.arrows.find(a => a.id === id);
              if (!arrow || traj.path.length === 0) return null;

              const isFailed = failedIds[id];
              // Open path = matcha/teal, Blocked = vermilion/coral
              const color = isFailed || traj.blocked ? theme.error : theme.success;

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
                  {/* Sewing thread running stitch */}
                  <Path
                    d={`M ${startX} ${startY} L ${endX} ${endY}`}
                    stroke={color}
                    strokeWidth={3}
                    strokeDasharray="6 4"
                    strokeLinecap="round"
                    opacity={0.85}
                  />
                  {traj.path.map((cell, idx) => (
                    <Circle
                      key={`dot-${idx}`}
                      cx={cell.c * cellSize + cellSize / 2}
                      cy={cell.r * cellSize + cellSize / 2}
                      r={3}
                      fill={color}
                      opacity={0.9}
                    />
                  ))}
                </React.Fragment>
              );
            })}
          </Svg>
        </View>
      </Animated.View>
    </GestureDetector>
  );
};

const styles = StyleSheet.create({
  board: {
    position: 'relative',
    overflow: 'visible',
    borderRadius: 24,
    borderWidth: 1.5,
    borderTopWidth: 2,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 6,
  },
  gridBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 24,
    overflow: 'hidden',
  },
  highlighterGlow: {
    position: 'absolute',
    borderRadius: 14,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    zIndex: 5,
  },
});
