import React from 'react';
import { Pressable, Image, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface SettingsButtonProps {
  onPress: () => void;
  size?: number;
}

export const SettingsButton: React.FC<SettingsButtonProps> = React.memo(({ onPress, size = 48 }) => {
  const scale = useSharedValue(1);

  const handlePressIn = () => {
    scale.value = withSpring(0.9, { damping: 15, stiffness: 300 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      accessibilityRole="button"
      accessibilityLabel="Settings"
      style={[{ width: size, height: size }, animatedStyle]}
    >
      <Image
        source={require('../../assets/settingButton.png')}
        style={styles.image}
        resizeMode="contain"
      />
    </AnimatedPressable>
  );
});

const styles = StyleSheet.create({
  image: {
    width: '100%',
    height: '100%',
  },
});

