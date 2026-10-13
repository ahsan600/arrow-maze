import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

interface HeartsDisplayProps {
  current: number;
  max?: number;
}

const Heart = ({ active, didJustBreak }: { active: boolean; didJustBreak: boolean }) => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(active ? 1 : 0.2);

  useEffect(() => {
    if (didJustBreak) {
      scale.value = withSequence(
        withTiming(1.5, { duration: 150 }),
        withSpring(1, { damping: 10, stiffness: 400 })
      );
      opacity.value = withTiming(0.2, { duration: 300 });
    } else {
      opacity.value = active ? 1 : 0.2;
    }
  }, [active, didJustBreak, scale, opacity]);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={style} className="mx-1">
      <Svg width={24} height={24} viewBox="0 0 24 24" fill={active ? "#ef4444" : "#94a3b8"}>
        <Path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
      </Svg>
    </Animated.View>
  );
}

export const HeartsDisplay: React.FC<HeartsDisplayProps> = ({ current, max = 3 }) => {
  const prevRef = React.useRef(current);
  
  useEffect(() => {
    prevRef.current = current;
  }, [current]);

  return (
    <View className="flex-row items-center">
      {Array.from({ length: max }).map((_, i) => {
        const isActive = i < current;
        const didJustBreak = !isActive && i < prevRef.current;
        return <Heart key={i} active={isActive} didJustBreak={didJustBreak} />;
      })}
    </View>
  );
};
