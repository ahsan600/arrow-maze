import React from 'react';
import { Pressable, Image, ImageSourcePropType, StyleProp, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export interface ImageButtonProps {
  source: ImageSourcePropType;
  onPress: () => void;
  aspectRatio: number;
  width?: number | string;
  maxWidth?: number;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel: string;
}

export const ImageButton: React.FC<ImageButtonProps> = React.memo(({
  source,
  onPress,
  aspectRatio,
  width = '100%',
  maxWidth,
  style,
  accessibilityLabel,
}) => {
  const scale = useSharedValue(1);

  const handlePressIn = () => {
    scale.value = withSpring(0.94, { damping: 15, stiffness: 300 });
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
      accessibilityLabel={accessibilityLabel}
      style={[
        {
          width: width as any,
          maxWidth,
          aspectRatio,
          alignItems: 'center',
          justifyContent: 'center',
        },
        animatedStyle,
        style,
      ]}
    >
      <Image
        source={source}
        style={{ width: '100%', height: '100%' }}
        resizeMode="contain"
      />
    </AnimatedPressable>
  );
});
