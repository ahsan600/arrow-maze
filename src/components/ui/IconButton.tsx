import React from 'react';
import { Pressable, PressableProps } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { useTheme } from '../../theme/ThemeContext';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export interface IconButtonProps extends PressableProps {
  icon: 'hint' | 'settings' | 'pause' | 'back' | 'close' | 'palette' | 'hex_settings' | 'grid';
  variant?: 'primary' | 'secondary' | 'ghost' | 'floating';
  className?: string;
  iconColor?: string;
  size?: number;
}

const ICONS = {
  hint: 'M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9-4.03-9-9-9zm0 14c-.55 0-1-.45-1-1v-2c0-.55.45-1 1-1s1 .45 1 1v2c0 .55-.45 1-1 1zm1-5h-2v-1.5c0-.83.67-1.5 1.5-1.5h.5c.55 0 1-.45 1-1s-.45-1-1-1-1 .45-1 1H9c0-1.66 1.34-3 3-3s3 1.34 3 3c0 1.1-.9 2-2 2v2z',
  settings: 'M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.06-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.73,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.06,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.43-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.49-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z',
  pause: 'M6 19h4V5H6v14zm8-14v14h4V5h-4z',
  back: 'M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z',
  close: 'M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z',
  palette: 'M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9c.83 0 1.5-.67 1.5-1.5 0-.39-.15-.74-.39-1.01-.23-.26-.38-.61-.38-.99 0-.83.67-1.5 1.5-1.5H16c2.76 0 5-2.24 5-5 0-4.42-4.03-8-9-8zm-5.5 9c-.83 0-1.5-.67-1.5-1.5S5.67 9 6.5 9 8 9.67 8 10.5 7.33 12 6.5 12zm3-4C8.67 8 8 7.33 8 6.5S8.67 5 9.5 5s1.5.67 1.5 1.5S10.33 8 9.5 8zm5 0c-.83 0-1.5-.67-1.5-1.5S13.67 5 14.5 5s1.5.67 1.5 1.5S15.33 8 14.5 8zm3 4c-.83 0-1.5-.67-1.5-1.5S16.67 9 17.5 9s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z',
  hex_settings: 'M 12 2 L 20.66 7 L 20.66 17 L 12 22 L 3.34 17 L 3.34 7 Z M 12 9 A 3 3 0 1 0 12 15 A 3 3 0 1 0 12 9 Z',
  grid: 'M4 4h4v4H4V4zm6 0h4v4h-4V4zm6 0h4v4h-4V4zM4 10h4v4H4v-4zm6 0h4v4h-4v-4zm6 0h4v4h-4v-4zM4 16h4v4H4v-4zm6 0h4v4h-4v-4zm6 0h4v4h-4v-4z'
};

export const IconButton: React.FC<IconButtonProps> = ({
  icon,
  variant = 'ghost',
  disabled,
  className = '',
  iconColor: customIconColor,
  size = 24,
  onPressIn,
  onPressOut,
  ...props
}) => {
  const { theme } = useTheme();
  const scale = useSharedValue(1);

  const handlePressIn = (e: any) => {
    scale.value = withSpring(0.9, { damping: 15, stiffness: 300 });
    if (onPressIn) onPressIn(e);
  };

  const handlePressOut = (e: any) => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
    if (onPressOut) onPressOut(e);
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  let bgColor = 'transparent';
  let shadowStyle = {};
  
  const defaultIconColor = disabled ? theme.disabledState : (variant === 'primary' ? theme.primaryButtonText : theme.primaryText);
  const finalIconColor = customIconColor || defaultIconColor;

  switch (variant) {
    case 'primary':
      bgColor = disabled ? theme.disabledState : theme.primaryButton;
      break;
    case 'secondary':
      bgColor = disabled ? theme.disabledState : theme.secondaryButton;
      break;
    case 'ghost':
      bgColor = 'transparent';
      break;
    case 'floating':
      bgColor = theme.cardBackground;
      shadowStyle = { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4, borderWidth: 1, borderColor: theme.border };
      break;
  }

  return (
    <Pressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      style={[
        {
          minWidth: 44,
          minHeight: 44,
          width: 44,
          height: 44,
          borderRadius: 22,
          backgroundColor: bgColor,
        },
        shadowStyle,
        props.style as any,
        {
          alignItems: 'center',
          justifyContent: 'center',
        },
      ]}
      className={className}
      {...props}
    >
      <Animated.View
        style={[
          animatedStyle,
          {
            width: size,
            height: size,
            alignItems: 'center',
            justifyContent: 'center',
          },
        ]}
      >
        <Svg width={size} height={size} viewBox="0 0 24 24" fill={finalIconColor}>
          <Path d={ICONS[icon]} />
        </Svg>
      </Animated.View>
    </Pressable>
  );
};
