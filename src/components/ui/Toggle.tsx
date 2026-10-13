import React, { useEffect } from 'react';
import { Pressable, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolateColor,
} from 'react-native-reanimated';

interface ToggleProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
}

export const Toggle: React.FC<ToggleProps> = ({ value, onValueChange, disabled = false }) => {
  const progress = useSharedValue(value ? 1 : 0);

  useEffect(() => {
    progress.value = withTiming(value ? 1 : 0, { duration: 200 });
  }, [value, progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: progress.value * 24 }],
  }));

  const bgStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      progress.value,
      [0, 1],
      ['#cbd5e1', '#3b82f6'] // slate-300 to blue-500
    ),
  }));

  return (
    <Pressable
      onPress={() => onValueChange(!value)}
      disabled={disabled}
      className={`w-14 h-8 rounded-full p-1 justify-center ${disabled ? 'opacity-50' : ''}`}
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
    >
      <Animated.View style={[bgStyle]} className="absolute inset-0 rounded-full" />
      <Animated.View style={[animatedStyle]} className="w-6 h-6 bg-white rounded-full shadow-sm" />
    </Pressable>
  );
};
