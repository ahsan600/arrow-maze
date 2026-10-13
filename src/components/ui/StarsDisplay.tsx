import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
} from 'react-native-reanimated';
import Svg, { Path, G } from 'react-native-svg';
import { useTheme } from '../../theme/ThemeContext';

interface StarsDisplayProps {
  stars: number; // 0, 1, 2, 3
  size?: number;
  animate?: boolean; // Whether to animate reveal
}

/**
 * 3D Faceted Origami Paper Star
 * Hand-folded paper star with light & dark geometric crease facets.
 */
export const OrigamiStar = ({
  active,
  size = 24,
  fillColor,
  shadeColor,
  disabledColor,
}: {
  active: boolean;
  size?: number;
  fillColor?: string;
  shadeColor?: string;
  disabledColor?: string;
}) => {
  const primaryGold = fillColor || '#F2B134';
  const shadedGold = shadeColor || '#D69520';
  const inactive = disabledColor || '#D9D2C3';
  const inactiveShade = '#C7BFB0';

  const light = active ? primaryGold : inactive;
  const dark = active ? shadedGold : inactiveShade;

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {/* 5-pointed origami star with faceted triangular folds originating from center (12, 12) */}
      <G>
        {/* Top point */}
        <Path d="M 12 12 L 12 2 L 14.5 9 Z" fill={light} />
        <Path d="M 12 12 L 12 2 L 9.5 9 Z" fill={dark} />

        {/* Top-right point */}
        <Path d="M 12 12 L 22 9 L 16 14 Z" fill={light} />
        <Path d="M 12 12 L 22 9 L 14.5 9 Z" fill={dark} />

        {/* Bottom-right point */}
        <Path d="M 12 12 L 18 21 L 12 17.5 Z" fill={light} />
        <Path d="M 12 12 L 18 21 L 16 14 Z" fill={dark} />

        {/* Bottom-left point */}
        <Path d="M 12 12 L 6 21 L 8 14 Z" fill={light} />
        <Path d="M 12 12 L 6 21 L 12 17.5 Z" fill={dark} />

        {/* Top-left point */}
        <Path d="M 12 12 L 2 9 L 9.5 9 Z" fill={light} />
        <Path d="M 12 12 L 2 9 L 8 14 Z" fill={dark} />
      </G>
    </Svg>
  );
};

const AnimatedStarItem = ({
  active,
  delay,
  size,
  animate,
  isMiddle,
}: {
  active: boolean;
  delay: number;
  size: number;
  animate: boolean;
  isMiddle?: boolean;
}) => {
  const { theme, mode } = useTheme();
  const scale = useSharedValue(animate ? 0 : 1);

  useEffect(() => {
    if (animate) {
      scale.value = withDelay(delay, withSpring(1, { damping: 12, stiffness: 260 }));
    }
  }, [delay, scale, animate]);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const disabledColor = mode === 'dark' ? '#3B3860' : '#D9D2C3';
  const disabledShade = mode === 'dark' ? '#2F2C4E' : '#C7BFB0';

  return (
    <Animated.View
      style={[
        style,
        {
          marginHorizontal: 3,
          transform: [{ translateY: isMiddle ? -8 : 0 }, { scale: scale.value }],
        },
      ]}
    >
      <OrigamiStar
        active={active}
        size={size}
        fillColor={theme.goldStar}
        shadeColor={mode === 'dark' ? '#D69520' : '#DC9A22'}
        disabledColor={disabledColor}
      />
    </Animated.View>
  );
};

export const StarsDisplay: React.FC<StarsDisplayProps> = ({
  stars,
  size = 28,
  animate = false,
}) => {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
      {[0, 1, 2].map(i => (
        <AnimatedStarItem
          key={i}
          active={i < stars}
          delay={animate ? i * 180 : 0}
          size={size}
          animate={animate}
          isMiddle={i === 1}
        />
      ))}
    </View>
  );
};
