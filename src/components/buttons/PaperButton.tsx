import React from 'react';
import { Text, Pressable, PressableProps, StyleSheet, StyleProp, ViewStyle, TextStyle, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import Svg, { Circle, Path } from 'react-native-svg';
import { useTheme } from '../../theme/ThemeContext';
import { radius as radiusTokens } from '../../theme/radius';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export interface PaperButtonProps extends PressableProps {
  title: string;
  subtitle?: string;
  variant?: 'primary' | 'secondary' | 'tag' | 'danger' | 'ghost';
  radiusSize?: 'sm' | 'md' | 'lg' | 'xl';
  fullWidth?: boolean;
  breathing?: boolean;
  icon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  subtitleStyle?: StyleProp<TextStyle>;
}

export const PaperButton: React.FC<PaperButtonProps> = ({
  title,
  subtitle,
  variant = 'primary',
  radiusSize = 'md',
  fullWidth = false,
  breathing = false,
  icon,
  disabled,
  onPressIn,
  onPressOut,
  style,
  textStyle,
  subtitleStyle,
  ...props
}) => {
  const { theme, mode } = useTheme();
  const translateY = useSharedValue(0);
  const shadowShrink = useSharedValue(0);
  const breatheScale = useSharedValue(1);

  React.useEffect(() => {
    if (breathing) {
      breatheScale.value = withRepeat(
        withSequence(
          withTiming(1.03, { duration: 900, easing: Easing.inOut(Easing.ease) }),
          withTiming(1.0, { duration: 900, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
        true,
      );
    } else {
      breatheScale.value = 1;
    }
  }, [breathing, breatheScale]);

  const handlePressIn = (e: any) => {
    translateY.value = withTiming(3, { duration: 75 });
    shadowShrink.value = withTiming(1, { duration: 75 });
    if (onPressIn) onPressIn(e);
  };

  const handlePressOut = (e: any) => {
    translateY.value = withTiming(0, { duration: 110 });
    shadowShrink.value = withTiming(0, { duration: 110 });
    if (onPressOut) onPressOut(e);
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: breatheScale.value },
      { translateY: translateY.value },
    ],
  }));

  const borderRadius = radiusTokens[radiusSize] ?? radiusTokens.md;

  let bgColor = theme.primaryButton;
  let txtColor = theme.primaryButtonText;
  let subColor = mode === 'dark' ? '#C3C0DC' : '#5B5975';
  let borderColor = theme.border;
  let bottomCreaseColor = theme.crease;

  if (variant === 'primary') {
    bgColor = disabled ? theme.disabledState : theme.primaryButton;
    txtColor = disabled ? theme.mutedText : theme.primaryButtonText;
    // High contrast for primary button subtitle matching background luminance
    subColor = disabled
      ? theme.mutedText
      : mode === 'dark'
      ? 'rgba(27, 26, 46, 0.82)'
      : 'rgba(255, 253, 248, 0.90)';
    borderColor = mode === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)';
    bottomCreaseColor = mode === 'dark' ? '#C28E25' : '#B83E1A';
  } else if (variant === 'secondary') {
    bgColor = disabled ? theme.disabledState : theme.surface;
    txtColor = disabled ? theme.mutedText : theme.primaryText;
    subColor = disabled ? theme.mutedText : theme.secondaryText;
    borderColor = theme.border;
    bottomCreaseColor = theme.crease;
  } else if (variant === 'tag') {
    bgColor = disabled ? theme.disabledState : (mode === 'dark' ? '#322E54' : '#F5EDDF');
    txtColor = disabled ? theme.mutedText : theme.primaryText;
    subColor = disabled ? theme.mutedText : theme.secondaryText;
    borderColor = theme.border;
    bottomCreaseColor = theme.crease;
  } else if (variant === 'danger') {
    bgColor = disabled ? theme.disabledState : theme.error;
    txtColor = '#FFFFFF';
    subColor = 'rgba(255, 255, 255, 0.90)';
    borderColor = 'transparent';
    bottomCreaseColor = mode === 'dark' ? '#C2563C' : '#9E2C15';
  } else if (variant === 'ghost') {
    bgColor = 'transparent';
    txtColor = disabled ? theme.mutedText : theme.primaryText;
    subColor = disabled ? theme.mutedText : theme.secondaryText;
    borderColor = 'transparent';
    bottomCreaseColor = 'transparent';
  }

  return (
    <AnimatedPressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      style={[
        styles.button,
        {
          backgroundColor: bgColor,
          borderRadius,
          borderWidth: variant === 'ghost' ? 0 : 1,
          borderColor,
          borderTopColor: variant === 'ghost' ? 'transparent' : theme.creaseHighlight,
          borderBottomWidth: variant === 'ghost' ? 0 : 3.5,
          borderBottomColor: bottomCreaseColor,
          width: fullWidth ? '100%' : undefined,
          shadowColor: theme.shadow,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: mode === 'dark' ? 0.35 : 0.18,
          shadowRadius: 8,
          elevation: variant === 'ghost' ? 0 : 4,
        },
        animatedStyle,
        style,
      ]}
      {...props}
    >
      {/* Tag eyelet circle for tag variant */}
      {variant === 'tag' && (
        <View style={styles.tagEyelet}>
          <Svg width={12} height={12} viewBox="0 0 12 12">
            <Circle cx={6} cy={6} r={5} fill={theme.appBackground} stroke={theme.border} strokeWidth={1} />
            <Circle cx={6} cy={6} r={2.5} fill={theme.crease} />
          </Svg>
        </View>
      )}

      {icon && <View style={styles.iconContainer}>{icon}</View>}

      <View style={styles.textContainer}>
        <Text style={[styles.title, { color: txtColor }, textStyle]}>{title}</Text>
        {subtitle && (
          <Text style={[styles.subtitle, { color: subColor }, subtitleStyle]}>
            {subtitle}
          </Text>
        )}
      </View>
    </AnimatedPressable>
  );
};

const styles = StyleSheet.create({
  button: {
    minHeight: 48,
    paddingHorizontal: 22,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
    letterSpacing: 1.0,
    textTransform: 'uppercase',
  },
  tagEyelet: {
    position: 'absolute',
    left: 8,
    top: '50%',
    marginTop: -6,
  },
});
