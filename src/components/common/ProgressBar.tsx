import React from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { useTheme } from '../../theme/ThemeContext';

interface ProgressBarProps {
  progress: number;
  height?: number;
}

export const ProgressBar: React.FC<ProgressBarProps> = React.memo(({
  progress,
  height = 8,
}) => {
  const { theme } = useTheme();
  const safeProgress = Math.max(0, Math.min(1, progress));
  
  const animatedStyle = useAnimatedStyle(() => {
    return {
      width: withTiming(`${safeProgress * 100}%`, { duration: 500 }),
    };
  });

  return (
    <View 
      style={{ width: '100%', backgroundColor: theme.disabledState, overflow: 'hidden', borderRadius: 9999, height }}
    >
      <Animated.View 
        style={[{ height: '100%', backgroundColor: theme.primaryText, borderRadius: 9999 }, animatedStyle]}
      />
    </View>
  );
});

const styles = StyleSheet.create({});
