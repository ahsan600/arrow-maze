import React, { useCallback } from 'react';
import { Text, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '../../theme/ThemeContext';

interface PrimaryButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const PrimaryButton: React.FC<PrimaryButtonProps> = React.memo(({
  title,
  onPress,
  disabled = false,
  loading = false,
  fullWidth = false,
}) => {
  const { theme } = useTheme();
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.95);
    opacity.value = withTiming(0.8, { duration: 100 });
  }, [scale, opacity]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1);
    opacity.value = withTiming(1, { duration: 100 });
  }, [scale, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: disabled ? 0.6 : opacity.value,
  }));

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
      style={[{ borderRadius: 16, alignItems: 'center', justifyContent: 'center', height: 64, backgroundColor: theme.primaryButton, width: fullWidth ? '100%' : undefined, paddingHorizontal: fullWidth ? 0 : 48, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, elevation: 2, borderWidth: 1, borderColor: theme.border }, animatedStyle]}
      accessibilityRole="button"
      accessibilityLabel={title}
    >
      {loading ? (
        <ActivityIndicator color={theme.primaryButtonText} />
      ) : (
        <Text style={{ color: theme.primaryButtonText, fontWeight: 'bold', fontSize: 20, letterSpacing: 1 }}>
          {title}
        </Text>
      )}
    </AnimatedPressable>
  );
});

const styles = StyleSheet.create({});
