import React, { useState, useCallback, useRef, useEffect, memo } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
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
  runOnJS,
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
import { TutorialPointer } from './TutorialPointer';
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

interface GridBackgroundProps {
  rows: number;
  cols: number;
  cellSize: number;
  dotColor?: string;
  pad?: number;
}

/**
 * GridBackground renders the dot matrix directly inside the zoomable board,
 * so dots stay perfectly anchored behind every arrow vertex and zoom with the board.
 */
const GridBackground = memo(function GridBackground({
  rows,
  cols,
  cellSize,
  dotColor = 'rgba(43, 45, 91, 0.20)',
  pad = 6,
}: GridBackgroundProps) {
  const totalCols = cols + pad * 2;
  const totalRows = rows + pad * 2;
  const width = totalCols * cellSize;
  const height = totalRows * cellSize;
  const left = -pad * cellSize;
  const top = -pad * cellSize;
  const dotRadius = Math.max(1.5, Math.round(cellSize * 0.04));

  const dots: { cx: number; cy: number; key: string }[] = [];
  for (let r = 0; r < totalRows; r++) {
    for (let c = 0; c < totalCols; c++) {
      dots.push({
        cx: c * cellSize + cellSize / 2,
        cy: r * cellSize + cellSize / 2,
        key: `${r}_${c}`,
      });
    }
  }

  return (
    <View
      style={{
        position: 'absolute',
        left,
        top,
        width,
        height,
      }}
      pointerEvents="none"
    >
      <Svg width={width} height={height}>
        {dots.map(d => (
          <Circle
            key={d.key}
            cx={d.cx}
            cy={d.cy}
            r={dotRadius}
            fill={dotColor}
          />
        ))}
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

  // Stable callbacks
  const onStateChangeRef = useRef(onStateChange);
  const onArrowBlockedRef = useRef(onArrowBlocked);
  const onArrowFailedRef = useRef(onArrowFailed);
  onStateChangeRef.current = onStateChange;
  onArrowBlockedRef.current = onArrowBlocked;
  onArrowFailedRef.current = onArrowFailed;

  // Adaptive Cell Sizing:
  // Maintain readable minimum cell size (40px) so arrows remain crisp & easy to tap,
  // and scale the camera zoom to fit large boards smoothly.
  const screenWidth = Dimensions.get('window').width;
  const screenHeight = Dimensions.get('window').height;
  const boardPadding = 32;
  const availableWidth = screenWidth - boardPadding;
  const availableHeight = screenHeight * 0.56;
  const maxRows = state.gridSize.rows;
  const maxCols = state.gridSize.cols;

  const MIN_CELL_SIZE = 40;
  const MAX_CELL_SIZE = 76;
  const naturalCellSize = Math.floor(
    Math.min(availableWidth / maxCols, availableHeight / maxRows, MAX_CELL_SIZE),
  );
  const cellSize = Math.max(MIN_CELL_SIZE, naturalCellSize);
  const boardWidth = maxCols * cellSize;
  const boardHeight = maxRows * cellSize;

  // Auto-fit scale to frame the entire board on screen
  const fitScale = Math.min(
    availableWidth / boardWidth,
    availableHeight / boardHeight,
    1.0,
  );

  const minScale = Math.max(0.15, fitScale * 0.72);
  const maxScale = Math.max(3.5, 1.3 / fitScale);

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

  // Gestures for zoom (stationary board, no pan/drag)
  const boardScale = useSharedValue(fitScale);
  const savedScale = useSharedValue(fitScale);

  // Unmount cleanup: cancel any remaining animations when switching levels or restarting
  useEffect(() => {
    return () => {
      movingRef.current.forEach(arrowId => {
        const sv = animProgressMap.current[arrowId];
        if (sv) cancelAnimation(sv);
      });
      movingRef.current.clear();
    };
  }, []);

  // Keep stateRef in sync with latest props without cancelling ongoing animations or resetting zoom
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // Update scale if layout/fitScale changes
  useEffect(() => {
    boardScale.value = fitScale;
    savedScale.value = fitScale;
  }, [fitScale, boardScale, savedScale]);

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
      const totalSteps = fullPath.length - L;
      const safeStep = Math.min(stepIndex, totalSteps);
      const cells = fullPath.slice(safeStep, safeStep + L);
      if (cells.length < L) return;

      const isCleared = cells.every(
        c => c.r < 0 || c.r >= rows || c.c < 0 || c.c >= cols,
      );
      const finished = isCleared || safeStep >= totalSteps;

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

  const handleAnimationComplete = useCallback(
    (arrowId: string, totalSteps: number) => {
      if (movingRef.current.has(arrowId)) {
        handleStepReached(arrowId, totalSteps);
      }
    },
    [handleStepReached],
  );

  // Start arrow flying
  const startArrow = useCallback(
    (arrowId: string, totalSteps: number) => {
      if (!animProgressMap.current[arrowId]) {
        animProgressMap.current[arrowId] = makeMutable(0);
      }
      const sv = animProgressMap.current[arrowId];
      movingRef.current.add(arrowId);
      setMovingArrows(new Set(movingRef.current));
      cancelAnimation(sv);
      sv.value = 0;
      sv.value = withTiming(
        1,
        {
          duration: totalSteps * TICK_MS,
          easing: Easing.linear,
        },
        isFinished => {
          if (isFinished) {
            runOnJS(handleAnimationComplete)(arrowId, totalSteps);
          }
        },
      );
    },
    [handleAnimationComplete],
  );

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

  // Pinch-to-zoom only (board remains locked in center, drag is disabled)
  const pinchGesture = Gesture.Pinch()
    .onUpdate(e => {
      boardScale.value = Math.max(minScale, Math.min(savedScale.value * e.scale, maxScale));
    })
    .onEnd(() => {
      savedScale.value = boardScale.value;
    });

  const boardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: boardScale.value }],
  }));

  // Zoom control buttons for large levels
  const handleZoomIn = useCallback(() => {
    const next = Math.min(boardScale.value * 1.35, maxScale);
    boardScale.value = withTiming(next, { duration: 200 });
    savedScale.value = next;
  }, [maxScale, boardScale, savedScale]);

  const handleZoomOut = useCallback(() => {
    const next = Math.max(boardScale.value / 1.35, minScale);
    boardScale.value = withTiming(next, { duration: 200 });
    savedScale.value = next;
  }, [minScale, boardScale, savedScale]);

  const handleZoomReset = useCallback(() => {
    boardScale.value = withTiming(fitScale, { duration: 250 });
    savedScale.value = fitScale;
  }, [fitScale, boardScale, savedScale]);

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
    <View style={styles.outerContainer}>
      <GestureDetector gesture={pinchGesture}>
        <Animated.View
          style={[{ width: boardWidth, height: boardHeight }, boardAnimatedStyle]}
        >
          <View
            style={[
              styles.board,
              {
                width: boardWidth,
                height: boardHeight,
                backgroundColor: 'transparent',
              },
            ]}
          >
            {/* Grid dots rendered inside zoomable board so they stay locked behind arrows */}
            <GridBackground
              rows={maxRows}
              cols={maxCols}
              cellSize={cellSize}
              dotColor={mode === 'dark' ? 'rgba(255, 255, 255, 0.22)' : 'rgba(43, 45, 91, 0.20)'}
              pad={6}
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
                  disabled={disabled || movingArrows.has(arrow.id)}
                  animProgress={animProgressMap.current[arrow.id] ?? staticProgress}
                  shakeTrigger={shakeTriggers[arrow.id] || 0}
                  failed={!!failedIds[arrow.id]}
                  onStepReached={handleStepReached}
                />
              ))}

            {/* Running Stitch Trajectory Preview */}
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
            {showInGameTutorial && tutorialArrow && targetCell && movingArrows.size === 0 && (
              <TutorialPointer
                targetX={targetCell.c * cellSize + cellSize / 2}
                targetY={targetCell.r * cellSize + cellSize / 2}
                theme={theme}
                mode={mode}
              />
            )}
          </View>
        </Animated.View>
      </GestureDetector>

      {/* Floating Paper Craft Zoom HUD for large levels */}
      {fitScale < 0.95 && (
        <View style={styles.zoomControlBar} pointerEvents="box-none">
          <TouchableOpacity
            style={[
              styles.zoomBtn,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
            onPress={handleZoomIn}
            activeOpacity={0.75}
          >
            <Text style={[styles.zoomBtnText, { color: theme.primaryText }]}>＋</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.zoomBtn,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
            onPress={handleZoomOut}
            activeOpacity={0.75}
          >
            <Text style={[styles.zoomBtnText, { color: theme.primaryText }]}>－</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.zoomFitBtn, { backgroundColor: theme.primary }]}
            onPress={handleZoomReset}
            activeOpacity={0.75}
          >
            <Text style={[styles.zoomFitBtnText, { color: theme.primaryButtonText }]}>
              FIT
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    width: '100%',
    height: '100%',
  },
  board: {
    position: 'relative',
    overflow: 'visible',
    borderRadius: 0,
    borderWidth: 0,
  },
  topCrease: {
    display: 'none',
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
  zoomControlBar: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    zIndex: 160,
  },
  zoomBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 4,
  },
  zoomBtnText: {
    fontSize: 19,
    fontWeight: '800',
    lineHeight: 22,
  },
  zoomFitBtn: {
    paddingHorizontal: 12,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  zoomFitBtnText: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});
