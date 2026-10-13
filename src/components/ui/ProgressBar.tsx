import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '../../theme/ThemeContext';

interface ProgressBarProps {
  progress: number; // 0 to 1
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ progress, className = '' }) => {
  const { theme } = useTheme();
  const animatedProgress = useSharedValue(progress);

  useEffect(() => {
    animatedProgress.value = withTiming(progress, { duration: 500 });
  }, [progress, animatedProgress]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: `${animatedProgress.value * 100}%`,
  }));

  return (
    <View style={[{ height: 8, backgroundColor: theme.disabledState, borderRadius: 9999, overflow: 'hidden' }]} className={className}>
      <Animated.View
        style={[{ height: '100%', backgroundColor: theme.primaryText, borderRadius: 9999 }, animatedStyle]}
      />
    </View>
  );
};
