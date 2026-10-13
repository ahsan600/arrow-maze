import React from 'react';
import { Text, Pressable, PressableProps } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useTheme } from '../../theme/ThemeContext';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export interface ButtonProps extends PressableProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'ghost' | 'accent' | 'danger';
  className?: string;
  textClassName?: string;
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  variant = 'primary',
  disabled,
  className = '',
  textClassName = '',
  fullWidth = false,
  onPressIn,
  onPressOut,
  style: propStyle,
  ...props
}) => {
  const { theme } = useTheme();
  const scale = useSharedValue(1);

  const handlePressIn = (e: any) => {
    scale.value = withSpring(0.95, { damping: 15, stiffness: 300 });
    if (onPressIn) onPressIn(e);
  };

  const handlePressOut = (e: any) => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
    if (onPressOut) onPressOut(e);
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  let bgColor = theme.primaryButton;
  let txtColor = theme.primaryButtonText;
  let borderColor = 'transparent';
  let borderWidth = 0;

  switch (variant) {
    case 'primary':
      bgColor = disabled ? theme.disabledState : theme.primaryButton;
      txtColor = disabled ? theme.mutedText : theme.primaryButtonText;
      break;
    case 'secondary':
      bgColor = disabled ? theme.disabledState : theme.secondaryButton;
      txtColor = disabled ? theme.mutedText : theme.secondaryButtonText;
      borderColor = theme.primaryText;
      borderWidth = 2;
      break;
    case 'ghost':
      bgColor = 'transparent';
      txtColor = disabled ? theme.mutedText : theme.primaryText;
      break;
    case 'accent':
      bgColor = disabled ? theme.disabledState : theme.success;
      txtColor = '#ffffff';
      break;
    case 'danger':
      bgColor = disabled ? theme.disabledState : theme.error;
      txtColor = '#ffffff';
      break;
  }

  return (
    <AnimatedPressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      style={[
        {
          minHeight: 44,
          paddingHorizontal: 24,
          paddingVertical: 12,
          borderRadius: 16,
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          backgroundColor: bgColor,
          borderColor,
          borderWidth,
          width: fullWidth ? '100%' : undefined,
        },
        animatedStyle,
        propStyle as any
      ]}
      className={className}
      {...props}
    >
      <Text style={{ fontSize: 16, fontWeight: '600', color: txtColor }} className={textClassName}>{title}</Text>
    </AnimatedPressable>
  );
};
