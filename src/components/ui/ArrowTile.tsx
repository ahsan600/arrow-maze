import React, { useEffect, useCallback } from 'react';
import { View, Pressable } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  withSequence,
  withRepeat,
} from 'react-native-reanimated';
import { Direction } from '../../game/types';
import { useTheme } from '../../theme/ThemeContext';

interface ArrowTileProps {
  id: string;
  direction: Direction;
  span: number;
  cellSize: number;
  isHighlighted?: boolean;
  onPress: (id: string) => void;
  isRemoving?: boolean;
  removalDistance?: number;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const ArrowTile: React.FC<ArrowTileProps> = React.memo(({
  id,
  direction,
  span,
  cellSize,
  isHighlighted = false,
  onPress,
  isRemoving = false,
  removalDistance = 1000,
}) => {
  const { theme } = useTheme();
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  const getRotation = () => {
    switch (direction) {
      case 'UP': return '0deg';
      case 'RIGHT': return '90deg';
      case 'DOWN': return '180deg';
      case 'LEFT': return '-90deg';
    }
  };

  const getWidth = () => {
    return (direction === 'LEFT' || direction === 'RIGHT') ? (cellSize * span) : cellSize;
  };

  const getHeight = () => {
    return (direction === 'UP' || direction === 'DOWN') ? (cellSize * span) : cellSize;
  };

  useEffect(() => {
    if (isRemoving) {
      const exitConfig = { duration: 300 };
      switch (direction) {
        case 'UP':
          translateY.value = withTiming(-removalDistance, exitConfig);
          break;
        case 'DOWN':
          translateY.value = withTiming(removalDistance, exitConfig);
          break;
        case 'LEFT':
          translateX.value = withTiming(-removalDistance, exitConfig);
          break;
        case 'RIGHT':
          translateX.value = withTiming(removalDistance, exitConfig);
          break;
      }
      opacity.value = withTiming(0, exitConfig);
    }
  }, [isRemoving, direction, removalDistance, translateX, translateY, opacity]);

  const handlePressIn = useCallback(() => {
    if (!isRemoving) scale.value = withSpring(0.9, { damping: 15, stiffness: 300 });
  }, [scale, isRemoving]);

  const handlePressOut = useCallback(() => {
    if (!isRemoving) scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  }, [scale, isRemoving]);

  const handlePress = useCallback(() => {
    if (!isRemoving) onPress(id);
  }, [onPress, id, isRemoving]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value }
    ],
    opacity: opacity.value,
  }));

  const highlightScale = useSharedValue(1);
  useEffect(() => {
    if (isHighlighted) {
      highlightScale.value = withRepeat(
        withSequence(
          withTiming(1.05, { duration: 500 }),
          withTiming(1, { duration: 500 })
        ),
        -1,
        true
      );
    } else {
      highlightScale.value = 1;
    }
  }, [isHighlighted, highlightScale]);

  const highlightStyle = useAnimatedStyle(() => ({
    transform: [{ scale: highlightScale.value }],
    opacity: isHighlighted ? 1 : 0,
  }));

  const tileBodyStyle = {
    backgroundColor: isHighlighted ? theme.success : theme.primaryButton,
  };

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[{ width: getWidth(), height: getHeight(), padding: 4 }, animatedStyle]}
    >
      <Animated.View style={[{ position: 'absolute', top: 4, left: 4, right: 4, bottom: 4, borderRadius: 12, backgroundColor: theme.appBackground }, highlightStyle]} />
      
      <View style={[{ flex: 1, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }, tileBodyStyle]}>
        <Svg width="24" height="24" viewBox="0 0 24 24" fill={theme.primaryButtonText} style={{ transform: [{ rotate: getRotation() }] }}>
          <Path d="M12 4l-8 8h6v8h4v-8h6z" />
        </Svg>
      </View>
    </AnimatedPressable>
  );
});
