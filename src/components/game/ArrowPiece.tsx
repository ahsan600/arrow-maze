import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedProps,
  withTiming,
  useAnimatedReaction,
  runOnJS,
  makeMutable,
  SharedValue,
  withSequence,
} from 'react-native-reanimated';
import Svg, { Path, G, Rect, Line } from 'react-native-svg';
import { Arrow } from '../../types/game.types';
import { useTheme } from '../../theme/ThemeContext';

const AnimatedPath = Animated.createAnimatedComponent(Path);

export interface ArrowPieceProps {
  arrow: Arrow;
  fullPath: { r: number; c: number }[];
  cellSize: number;
  onPress: (id: string) => void;
  onLongPress?: (id: string) => void;
  disabled: boolean;
  animProgress: SharedValue<number>;
  shakeTrigger?: number;
  failed?: boolean;
  onStepReached?: (id: string, step: number) => void;
}

// ─── worklet helpers ──────────────────────────────────────────────────────────

function lerp(a: number, b: number, t: number): number {
  'worklet';
  return a + (b - a) * t;
}

/** Left facet of folded triangular arrow head */
function buildHeadLeftFacet(hx: number, hy: number, hs: number, direction: string): string {
  'worklet';
  const w = hs * 0.72;
  const h = hs * 0.85;
  if (direction === 'UP') return `M ${hx} ${hy - h} L ${hx - w} ${hy + h} L ${hx} ${hy + h * 0.4} Z`;
  if (direction === 'DOWN') return `M ${hx} ${hy + h} L ${hx - w} ${hy - h} L ${hx} ${hy - h * 0.4} Z`;
  if (direction === 'LEFT') return `M ${hx - h} ${hy} L ${hx + h} ${hy - w} L ${hx + h * 0.4} ${hy} Z`;
  return `M ${hx + h} ${hy} L ${hx - h} ${hy - w} L ${hx - h * 0.4} ${hy} Z`;
}

/** Right facet of folded triangular arrow head */
function buildHeadRightFacet(hx: number, hy: number, hs: number, direction: string): string {
  'worklet';
  const w = hs * 0.72;
  const h = hs * 0.85;
  if (direction === 'UP') return `M ${hx} ${hy - h} L ${hx + w} ${hy + h} L ${hx} ${hy + h * 0.4} Z`;
  if (direction === 'DOWN') return `M ${hx} ${hy + h} L ${hx + w} ${hy - h} L ${hx} ${hy - h * 0.4} Z`;
  if (direction === 'LEFT') return `M ${hx - h} ${hy} L ${hx + h} ${hy + w} L ${hx + h * 0.4} ${hy} Z`;
  return `M ${hx + h} ${hy} L ${hx - h} ${hy + w} L ${hx - h * 0.4} ${hy} Z`;
}

/** Diagonal crease line down center of head */
function buildHeadCreaseLine(hx: number, hy: number, hs: number, direction: string): string {
  'worklet';
  const h = hs * 0.85;
  if (direction === 'UP') return `M ${hx} ${hy - h} L ${hx} ${hy + h * 0.4}`;
  if (direction === 'DOWN') return `M ${hx} ${hy + h} L ${hx} ${hy - h * 0.4}`;
  if (direction === 'LEFT') return `M ${hx - h} ${hy} L ${hx + h * 0.4} ${hy}`;
  return `M ${hx + h} ${hy} L ${hx - h * 0.4} ${hy}`;
}

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
    const { theme, mode } = useTheme();
    const [showInkX, setShowInkX] = useState(false);

    // ── paper flutter shake animation ──────────────────────────────────────────
    const flutterX = useSharedValue(0);
    const flutterRotate = useSharedValue(0);

    useEffect(() => {
      if (shakeTrigger <= 0) return;
      const d = cellSize * 0.16;
      flutterX.value = withSequence(
        withTiming(d, { duration: 60 }),
        withTiming(-d, { duration: 60 }),
        withTiming(d * 0.5, { duration: 50 }),
        withTiming(-d * 0.5, { duration: 50 }),
        withTiming(0, { duration: 50 }),
      );
      flutterRotate.value = withSequence(
        withTiming(-4, { duration: 60 }),
        withTiming(4, { duration: 60 }),
        withTiming(-2, { duration: 50 }),
        withTiming(0, { duration: 50 }),
      );

      // Show red ink stamp "X" for 400ms
      setShowInkX(true);
      const timer = setTimeout(() => setShowInkX(false), 400);
      return () => clearTimeout(timer);
    }, [shakeTrigger, cellSize, flutterX, flutterRotate]);

    const flutterStyle = useAnimatedStyle(() => ({
      transform: [
        { translateX: flutterX.value },
        { rotate: `${flutterRotate.value}deg` },
      ],
    }));

    if (arrow.cells.length === 0) return null;

    // ── bounding box ──────────────────────────────────────────────────────────
    const minR = Math.min(...fullPath.map(c => c.r)) - 1;
    const minC = Math.min(...fullPath.map(c => c.c)) - 1;
    const maxR = Math.max(...fullPath.map(c => c.r)) + 1;
    const maxC = Math.max(...fullPath.map(c => c.c)) + 1;

    const svgLeft = minC * cellSize;
    const svgTop = minR * cellSize;
    const svgW = (maxC - minC + 1) * cellSize;
    const svgH = (maxR - minR + 1) * cellSize;
    const L = arrow.cells.length;

    const ptsSV = React.useRef(makeMutable(cellsToFlatPts(fullPath, minC, minR, cellSize))).current;
    const prevFullPath = React.useRef(fullPath);

    if (prevFullPath.current !== fullPath) {
      ptsSV.value = cellsToFlatPts(fullPath, minC, minR, cellSize);
      prevFullPath.current = fullPath;
    }

    const totalSteps = fullPath.length - L;

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

    const hs = cellSize * 0.30;
    const strokeWidth = Math.max(2, cellSize * 0.16);
    const dir = arrow.direction;
    const arrowBaseColor = failed ? theme.error : theme.arrow;
    const arrowCreaseShade = failed ? '#9E2C15' : theme.arrowCrease;
    const arrowHighlightColor = failed ? '#FF8C73' : theme.arrowHighlight;

    // ── animated body (main paper strip) ──────────────────────────────────────
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

    // ── animated shadow body (offset underneath) ──────────────────────────────
    const animatedShadowBodyProps = useAnimatedProps(() => {
      'worklet';
      const actualPoints = ptsSV.value.length / 2;
      const safeTotalSteps = actualPoints - L;

      if (safeTotalSteps <= 0 || ptsSV.value.length === 0) {
        if (ptsSV.value.length < 2) return { d: '' };
        let d = `M ${ptsSV.value[0].toFixed(1)} ${(ptsSV.value[1] + 2.5).toFixed(1)}`;
        for (let i = 2; i < Math.min(L * 2, ptsSV.value.length); i += 2) {
          d += ` L ${ptsSV.value[i].toFixed(1)} ${(ptsSV.value[i + 1] + 2.5).toFixed(1)}`;
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
      const iy = lerp(ptsSV.value[prevOffset + 1], ptsSV.value[currOffset + 1], fraction) + 2.5;
      let d = `M ${ix.toFixed(1)} ${iy.toFixed(1)}`;

      for (let i = 2; i < L * 2; i += 2) {
        const px = ptsSV.value[prevOffset + i];
        const py = ptsSV.value[prevOffset + i + 1] + 2.5;
        const cx = ptsSV.value[currOffset + i];
        const cy = ptsSV.value[currOffset + i + 1] + 2.5;
        d += ` L ${lerp(px, cx, fraction).toFixed(1)} ${lerp(py, cy, fraction).toFixed(1)}`;
      }
      return { d };
    });

    // ── animated head facets (Origami Left & Right folds) ─────────────────────
    const animatedHeadLeftProps = useAnimatedProps(() => {
      'worklet';
      const actualPoints = ptsSV.value.length / 2;
      const safeTotalSteps = actualPoints - L;

      if (safeTotalSteps <= 0 || ptsSV.value.length === 0) {
        if (ptsSV.value.length < 2) return { d: '' };
        const maxIdx = Math.min(L - 1, actualPoints - 1);
        return { d: buildHeadLeftFacet(ptsSV.value[maxIdx * 2], ptsSV.value[maxIdx * 2 + 1], hs, dir) };
      }

      const stepFloat = animProgress.value * safeTotalSteps;
      let stepIndex = Math.floor(stepFloat);
      if (stepIndex < 0) stepIndex = 0;
      let fraction = stepFloat - stepIndex;
      if (stepIndex >= safeTotalSteps) {
        stepIndex = safeTotalSteps - 1;
        fraction = 1.0;
      }

      const headIdx = (L - 1) * 2;
      const hx = lerp(ptsSV.value[stepIndex * 2 + headIdx], ptsSV.value[(stepIndex + 1) * 2 + headIdx], fraction);
      const hy = lerp(ptsSV.value[stepIndex * 2 + headIdx + 1], ptsSV.value[(stepIndex + 1) * 2 + headIdx + 1], fraction);
      return { d: buildHeadLeftFacet(hx, hy, hs, dir) };
    });

    const animatedHeadRightProps = useAnimatedProps(() => {
      'worklet';
      const actualPoints = ptsSV.value.length / 2;
      const safeTotalSteps = actualPoints - L;

      if (safeTotalSteps <= 0 || ptsSV.value.length === 0) {
        if (ptsSV.value.length < 2) return { d: '' };
        const maxIdx = Math.min(L - 1, actualPoints - 1);
        return { d: buildHeadRightFacet(ptsSV.value[maxIdx * 2], ptsSV.value[maxIdx * 2 + 1], hs, dir) };
      }

      const stepFloat = animProgress.value * safeTotalSteps;
      let stepIndex = Math.floor(stepFloat);
      if (stepIndex < 0) stepIndex = 0;
      let fraction = stepFloat - stepIndex;
      if (stepIndex >= safeTotalSteps) {
        stepIndex = safeTotalSteps - 1;
        fraction = 1.0;
      }

      const headIdx = (L - 1) * 2;
      const hx = lerp(ptsSV.value[stepIndex * 2 + headIdx], ptsSV.value[(stepIndex + 1) * 2 + headIdx], fraction);
      const hy = lerp(ptsSV.value[stepIndex * 2 + headIdx + 1], ptsSV.value[(stepIndex + 1) * 2 + headIdx + 1], fraction);
      return { d: buildHeadRightFacet(hx, hy, hs, dir) };
    });

    const animatedCreaseLineProps = useAnimatedProps(() => {
      'worklet';
      const actualPoints = ptsSV.value.length / 2;
      const safeTotalSteps = actualPoints - L;

      if (safeTotalSteps <= 0 || ptsSV.value.length === 0) {
        if (ptsSV.value.length < 2) return { d: '' };
        const maxIdx = Math.min(L - 1, actualPoints - 1);
        return { d: buildHeadCreaseLine(ptsSV.value[maxIdx * 2], ptsSV.value[maxIdx * 2 + 1], hs, dir) };
      }

      const stepFloat = animProgress.value * safeTotalSteps;
      let stepIndex = Math.floor(stepFloat);
      if (stepIndex < 0) stepIndex = 0;
      let fraction = stepFloat - stepIndex;
      if (stepIndex >= safeTotalSteps) {
        stepIndex = safeTotalSteps - 1;
        fraction = 1.0;
      }

      const headIdx = (L - 1) * 2;
      const hx = lerp(ptsSV.value[stepIndex * 2 + headIdx], ptsSV.value[(stepIndex + 1) * 2 + headIdx], fraction);
      const hy = lerp(ptsSV.value[stepIndex * 2 + headIdx + 1], ptsSV.value[(stepIndex + 1) * 2 + headIdx + 1], fraction);
      return { d: buildHeadCreaseLine(hx, hy, hs, dir) };
    });

    const headCell = arrow.cells[arrow.cells.length - 1];

    return (
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          { left: svgLeft, top: svgTop, width: svgW, height: svgH },
          flutterStyle,
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
          {/* Layer 1: Underneath paper drop shadow */}
          <AnimatedPath
            fill="none"
            stroke={theme.shadow}
            strokeWidth={strokeWidth + 2}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={0.35}
            animatedProps={animatedShadowBodyProps}
          />

          {/* Layer 2: Main folded paper body strip */}
          <AnimatedPath
            fill="none"
            stroke={arrowBaseColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            animatedProps={animatedBodyProps}
          />

          {/* Layer 3: Subtle lighter fold crease highlight on body strip */}
          <AnimatedPath
            fill="none"
            stroke={arrowHighlightColor}
            strokeWidth={Math.max(1, strokeWidth * 0.28)}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={0.5}
            animatedProps={animatedBodyProps}
          />

          {/* Layer 4: Folded triangle head — Left facet */}
          <AnimatedPath
            fill={arrowBaseColor}
            stroke={arrowBaseColor}
            strokeWidth={1}
            strokeLinejoin="round"
            animatedProps={animatedHeadLeftProps}
          />

          {/* Layer 5: Folded triangle head — Right facet (slightly shaded for 3D origami depth) */}
          <AnimatedPath
            fill={arrowCreaseShade}
            stroke={arrowCreaseShade}
            strokeWidth={1}
            strokeLinejoin="round"
            animatedProps={animatedHeadRightProps}
          />

          {/* Layer 6: Visible diagonal/center paper crease line on arrow head */}
          <AnimatedPath
            fill="none"
            stroke={mode === 'dark' ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.6)'}
            strokeWidth={1.2}
            strokeLinecap="round"
            animatedProps={animatedCreaseLineProps}
          />
        </Svg>

        {/* Red Ink "X" Stamp on blocked tap */}
        {showInkX && headCell && (
          <View
            style={[
              styles.inkStampContainer,
              {
                left: (headCell.c - minC) * cellSize + cellSize / 2 - 16,
                top: (headCell.r - minR) * cellSize + cellSize / 2 - 16,
              },
            ]}
            pointerEvents="none"
          >
            <Svg width={32} height={32} viewBox="0 0 32 32">
              <G opacity={0.9}>
                <Line x1="8" y1="8" x2="24" y2="24" stroke={theme.hanko} strokeWidth={3.5} strokeLinecap="round" />
                <Line x1="24" y1="8" x2="8" y2="24" stroke={theme.hanko} strokeWidth={3.5} strokeLinecap="round" />
              </G>
            </Svg>
          </View>
        )}

        {/* Tap targets */}
        {arrow.cells.map((cell, idx) => (
          <Pressable
            key={idx}
            onPress={() => !disabled && onPress(arrow.id)}
            onLongPress={() => !disabled && onLongPress && onLongPress(arrow.id)}
            delayLongPress={450}
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
      if (prev.arrow.cells[i].r !== next.arrow.cells[i].r || prev.arrow.cells[i].c !== next.arrow.cells[i].c)
        return false;
    }
    return true;
  },
);

const styles = StyleSheet.create({
  inkStampContainer: {
    position: 'absolute',
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 99,
  },
});
