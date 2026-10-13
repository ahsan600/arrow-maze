import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { useTheme } from '../../theme/ThemeContext';

interface StarsDisplayProps {
  stars: number; // 0, 1, 2, 3
  size?: number;
  animate?: boolean; // Whether to animate reveal
}

const Star = ({ active, delay, size, animate, isMiddle }: { active: boolean; delay: number; size: number; animate: boolean; isMiddle?: boolean }) => {
  const { theme } = useTheme();
  const scale = useSharedValue(animate ? 0 : 1);
  
  useEffect(() => {
    if (animate) {
      scale.value = withDelay(delay, withSpring(1, { damping: 12, stiffness: 300 }));
    }
  }, [delay, scale, animate]);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  // Default colors that work well with the minimal theme
  const fillColor = active ? '#fbbf24' : theme.disabledState;

  return (
    <Animated.View style={[style, { marginHorizontal: 4, transform: [{ translateY: isMiddle ? -12 : 0 }, { scale: scale.value }] }]}>
      <Svg width={size} height={size} viewBox="0 0 24 24" fill={fillColor}>
        <Path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
      </Svg>
    </Animated.View>
  );
};

export const StarsDisplay: React.FC<StarsDisplayProps> = ({ stars, size = 32, animate = false }) => {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
      {[0, 1, 2].map((i) => (
        <Star key={i} active={i < stars} delay={animate ? i * 200 : 0} size={size} animate={animate} isMiddle={i === 1} />
      ))}
    </View>
  );
};
