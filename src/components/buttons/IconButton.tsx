import React, { useCallback } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { colors } from '../../theme/colors';

interface IconButtonProps {
  onPress: () => void;
  icon: React.ReactNode;
  disabled?: boolean;
  accessibilityLabel: string;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const IconButton: React.FC<IconButtonProps> = React.memo(({
  onPress,
  icon,
  disabled = false,
  accessibilityLabel,
}) => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.9);
    opacity.value = withTiming(0.7, { duration: 100 });
  }, [scale, opacity]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1);
    opacity.value = withTiming(1, { duration: 100 });
  }, [scale, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: disabled ? 0.5 : opacity.value,
  }));

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      style={[styles.button, animatedStyle]}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      {icon}
    </AnimatedPressable>
  );
});

const styles = StyleSheet.create({
  button: {
    width: 48,
    height: 48,
    backgroundColor: colors.board,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
});
