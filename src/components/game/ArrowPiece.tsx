/**
 * ArrowPiece — thin, clean, snake-like arrow.
 *
 * New Architecture (Continuous Path Interpolation)
 * ───────────────────────────────────────────────
 * • `PuzzleBoard` pre-computes the arrow's entire path and passes `fullPath`.
 * • `animProgress` goes from 0 to 1 over the ENTIRE path length.
 * • The SVG bounding box is computed ONCE from the `fullPath` and completely frozen.
 * • A worklet interpolates the arrow dynamically along `fullPath` as a sliding window.
 * • `useAnimatedReaction` triggers `onStepReached` in JS land to update collision state
 *   at exact cell boundaries without interrupting the UI thread animation.
 */

import React, { useEffect, useRef } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedProps,
  withTiming,
  useAnimatedReaction,
  runOnJS,
  makeMutable,
  SharedValue,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { Arrow } from '../../types/game.types';
import { useTheme } from '../../theme/ThemeContext';

const AnimatedPath = Animated.createAnimatedComponent(Path);

export interface ArrowPieceProps {
  arrow: Arrow;
  /** Flattened sequence of cells from tail's start to head's final destination */
  fullPath: { r: number; c: number }[];
  cellSize: number;
  onPress: (id: string) => void;
  onLongPress?: (id: string) => void;
  disabled: boolean;
  /** 0→1 over the entire path */
  animProgress: SharedValue<number>;
  shakeTrigger?: number;
  failed?: boolean;
  onStepReached?: (id: string, step: number) => void;
}

// ─── worklet helpers (run on UI thread) ──────────────────────────────────────

function lerp(a: number, b: number, t: number): number {
  'worklet';
  return a + (b - a) * t;
}

function buildHeadPath(hx: number, hy: number, hs: number, direction: string): string {
  'worklet';
  const w = hs * 0.7; // Head width
  const h = hs * 0.8; // Head length
  if (direction === 'UP')
    return `M ${hx - w} ${hy + h} L ${hx} ${hy - h} L ${hx + w} ${hy + h} Z`;
  if (direction === 'DOWN')
    return `M ${hx - w} ${hy - h} L ${hx} ${hy + h} L ${hx + w} ${hy - h} Z`;
  if (direction === 'LEFT')
    return `M ${hx + h} ${hy - w} L ${hx - h} ${hy} L ${hx + h} ${hy + w} Z`;
  return `M ${hx - h} ${hy - w} L ${hx + h} ${hy} L ${hx - h} ${hy + w} Z`;
}

// JS-thread helper to flatten cells
function cellsToFlatPts(
  cells: { r: number; c: number }[],
  oC: number,
  oR: number,
  cs: number,
): number[] {
  const half = cs / 2;
  const pts: number[] = [];
  for (const c of cells) {
    pts.push((c.c - oC) * cs + half, (c.r - oR) * cs + half);
  }
  return pts;
}

// ─── component ────────────────────────────────────────────────────────────────

export const ArrowPiece: React.FC<ArrowPieceProps> = React.memo(
  ({
    arrow,
    fullPath,
    cellSize,
    onPress,
    onLongPress,
    disabled,
    animProgress,
    shakeTrigger = 0,
    failed = false,
    onStepReached,
  }) => {
    const { theme } = useTheme();

    // ── shake animation ───────────────────────────────────────────────────────
    const shakeX = useSharedValue(0);
    const shakeY = useSharedValue(0);

    useEffect(() => {
      if (shakeTrigger <= 0) return;
      const d = cellSize * 0.18;
      const horiz = arrow.direction === 'LEFT' || arrow.direction === 'RIGHT';
      const sv = horiz ? shakeX : shakeY;
      sv.value = withTiming(d, { duration: 50 }, () => {
        sv.value = withTiming(-d, { duration: 50 }, () => {
          sv.value = withTiming(0, { duration: 50 });
        });
      });
    }, [shakeTrigger, arrow.direction, shakeX, shakeY, cellSize]);

    const shakeStyle = useAnimatedStyle(() => ({
      transform: [{ translateX: shakeX.value }, { translateY: shakeY.value }],
    }));

    if (arrow.cells.length === 0) return null;

    // ── bounding box (frozen over the full path) ──────────────────────────────
    const minR = Math.min(...fullPath.map(c => c.r)) - 1;
    const minC = Math.min(...fullPath.map(c => c.c)) - 1;
    const maxR = Math.max(...fullPath.map(c => c.r)) + 1;
    const maxC = Math.max(...fullPath.map(c => c.c)) + 1;

    const svgLeft = minC * cellSize;
    const svgTop = minR * cellSize;
    const svgW = (maxC - minC + 1) * cellSize;
    const svgH = (maxR - minR + 1) * cellSize;
    const half = cellSize / 2;
    const L = arrow.cells.length; // Length of the snake

    // ── shared values for UI-thread interpolation ─────────────────────────────
    const prevFullPath = useRef(fullPath);
    const ptsSV = useRef(makeMutable(cellsToFlatPts(fullPath, minC, minR, cellSize))).current;

    // React cleanly to path changes (update synchronously without useEffect delay)
    if (prevFullPath.current !== fullPath) {
      ptsSV.value = cellsToFlatPts(fullPath, minC, minR, cellSize);
      prevFullPath.current = fullPath;
    }

    const totalSteps = fullPath.length - L;

    // ── trigger JS state updates at cell boundaries ───────────────────────────
    useAnimatedReaction(
      () => {
        let step = Math.floor(animProgress.value * totalSteps);
        if (step >= totalSteps && totalSteps > 0) step = totalSteps;
        return step;
      },
      (currentStep, previousStep) => {
        if (currentStep !== previousStep && previousStep !== null && currentStep > 0) {
          if (onStepReached) runOnJS(onStepReached)(arrow.id, currentStep);
        }
      },
      [totalSteps, arrow.id, onStepReached],
    );

    const hs = cellSize * 0.28;
    const strokeWidth = Math.max(1.5, cellSize * 0.14);
    const dir = arrow.direction;
    const arrowColor = failed ? theme.error : (theme.arrow || theme.primaryText);

    // ── animated body (interpolated natively) ─────────────────────────────────
    const animatedBodyProps = useAnimatedProps(() => {
      'worklet';
      const actualPoints = ptsSV.value.length / 2;
      const safeTotalSteps = actualPoints - L;

      if (safeTotalSteps <= 0 || ptsSV.value.length === 0) {
        if (ptsSV.value.length < 2) return { d: '' };
        let d = `M ${ptsSV.value[0].toFixed(1)} ${ptsSV.value[1].toFixed(1)}`;
        for (let i = 2; i < Math.min(L * 2, ptsSV.value.length); i += 2) {
          d += ` L ${ptsSV.value[i].toFixed(1)} ${ptsSV.value[i + 1].toFixed(1)}`;
        }
        return { d };
      }

      const stepFloat = animProgress.value * safeTotalSteps;
      let stepIndex = Math.floor(stepFloat);
      if (stepIndex < 0) stepIndex = 0;
      let fraction = stepFloat - stepIndex;
      if (stepIndex >= safeTotalSteps) {
        stepIndex = safeTotalSteps - 1;
        fraction = 1.0;
      }

      const prevOffset = stepIndex * 2;
      const currOffset = (stepIndex + 1) * 2;

      const ix = lerp(ptsSV.value[prevOffset], ptsSV.value[currOffset], fraction);
      const iy = lerp(ptsSV.value[prevOffset + 1], ptsSV.value[currOffset + 1], fraction);
      let d = `M ${ix.toFixed(1)} ${iy.toFixed(1)}`;

      for (let i = 2; i < L * 2; i += 2) {
        const px = ptsSV.value[prevOffset + i];
        const py = ptsSV.value[prevOffset + i + 1];
        const cx = ptsSV.value[currOffset + i];
        const cy = ptsSV.value[currOffset + i + 1];
        d += ` L ${lerp(px, cx, fraction).toFixed(1)} ${lerp(py, cy, fraction).toFixed(1)}`;
      }
      return { d };
    });

    // ── animated arrowhead ────────────────────────────────────────────────────
    const animatedHeadProps = useAnimatedProps(() => {
      'worklet';
      const actualPoints = ptsSV.value.length / 2;
      const safeTotalSteps = actualPoints - L;

      if (safeTotalSteps <= 0 || ptsSV.value.length === 0) {
        if (ptsSV.value.length < 2) return { d: '' };
        const maxIdx = Math.min(L - 1, actualPoints - 1);
        const hx = ptsSV.value[maxIdx * 2];
        const hy = ptsSV.value[maxIdx * 2 + 1];
        return { d: buildHeadPath(hx, hy, hs, dir) };
      }

      const stepFloat = animProgress.value * safeTotalSteps;
      let stepIndex = Math.floor(stepFloat);
      if (stepIndex < 0) stepIndex = 0;
      let fraction = stepFloat - stepIndex;
      if (stepIndex >= safeTotalSteps) {
        stepIndex = safeTotalSteps - 1;
        fraction = 1.0;
      }

      const prevOffset = stepIndex * 2;
      const currOffset = (stepIndex + 1) * 2;
      const headIdx = (L - 1) * 2;

      const px = ptsSV.value[prevOffset + headIdx];
      const py = ptsSV.value[prevOffset + headIdx + 1];
      const cx = ptsSV.value[currOffset + headIdx];
      const cy = ptsSV.value[currOffset + headIdx + 1];

      const hx = lerp(px, cx, fraction);
      const hy = lerp(py, cy, fraction);
      return { d: buildHeadPath(hx, hy, hs, dir) };
    });

    return (
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          // Bounding box is frozen via render consts, no layout shift risk
          { left: svgLeft, top: svgTop, width: svgW, height: svgH },
          shakeStyle,
        ]}
        pointerEvents="box-none"
      >
        <Svg
          width="100%"
          height="100%"
          viewBox={`0 0 ${svgW} ${svgH}`}
          preserveAspectRatio="none"
          pointerEvents="none"
        >
          {/* Rounded body */}
          <AnimatedPath
            fill="none"
            stroke={arrowColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            animatedProps={animatedBodyProps}
          />
          {/* Rounded arrowhead */}
          <AnimatedPath
            fill={arrowColor}
            stroke={arrowColor}
            strokeWidth={strokeWidth * 0.4}
            strokeLinejoin="round"
            animatedProps={animatedHeadProps}
          />
        </Svg>

        {/* Tap targets — placed on original cells, since arrow doesn't respond mid-flight */}
        {arrow.cells.map((cell, idx) => (
          <Pressable
            key={idx}
            onPress={() => !disabled && onPress(arrow.id)}
            onLongPress={() => !disabled && onLongPress && onLongPress(arrow.id)}
            delayLongPress={500}
            style={{
              position: 'absolute',
              left: (cell.c - minC) * cellSize,
              top: (cell.r - minR) * cellSize,
              width: cellSize,
              height: cellSize,
            }}
          />
        ))}
      </Animated.View>
    );
  },
  (prev, next) => {
    if (prev.arrow.id !== next.arrow.id) return false;
    if (prev.arrow.failed !== next.arrow.failed) return false;
    if (prev.shakeTrigger !== next.shakeTrigger) return false;
    if (prev.cellSize !== next.cellSize) return false;
    if (prev.animProgress !== next.animProgress) return false;
    if (prev.fullPath !== next.fullPath) return false;
    if (prev.arrow.cells.length !== next.arrow.cells.length) return false;
    for (let i = 0; i < prev.arrow.cells.length; i++) {
      if (prev.arrow.cells[i].r !== next.arrow.cells[i].r || prev.arrow.cells[i].c !== next.arrow.cells[i].c) return false;
    }
    return true;
  }
);
