import React from 'react';
import { Text, Pressable, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withRepeat,
  withSequence,
} from 'react-native-reanimated';
import { StarsDisplay } from './StarsDisplay';
import Svg, { Path } from 'react-native-svg';
import { useTheme } from '../../theme/ThemeContext';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface LevelCardProps {
  level: number;
  locked: boolean;
  completed: boolean;
  current: boolean;
  bestScore?: number;
  onPress: () => void;
  className?: string;
}

const LockIcon = () => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="#94a3b8">
    <Path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM9 6c0-1.66 1.34-3 3-3s3 1.34 3 3v2H9V6zm9 14H6V10h12v10zm-6-3c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2z"/>
  </Svg>
);

const CheckIcon = () => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M20 6L9 17l-5-5" />
  </Svg>
);

export const LevelCard: React.FC<LevelCardProps> = ({
  level,
  locked,
  completed,
  current,
  bestScore = 0,
  onPress,
}) => {
  const { theme } = useTheme();
  const scale = useSharedValue(1);

  React.useEffect(() => {
    if (current) {
      scale.value = withRepeat(
        withSequence(
          withSpring(1.05, { damping: 10, stiffness: 200 }),
          withSpring(1, { damping: 10, stiffness: 200 })
        ),
        -1,
        true
      );
    } else {
      scale.value = withSpring(1);
    }
  }, [current, scale]);

  const handlePressIn = () => {
    if (!locked && !current) scale.value = withSpring(0.95, { damping: 15, stiffness: 300 });
  };

  const handlePressOut = () => {
    if (!locked && !current) scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  let bgColor = theme.cardBackground;
  let txtColor = theme.primaryText;
  let borderColor = theme.border;
  let borderWidth = 1;
  let opacity = 1;
  let extraStyles: any = {};

  if (locked) {
    bgColor = 'transparent';
    borderColor = theme.border;
    opacity = 0.5;
  } else if (current) {
    bgColor = theme.primaryText;
    txtColor = theme.appBackground;
    borderColor = theme.primaryText;
    borderWidth = 1;
    extraStyles = {
      shadowColor: theme.primaryText,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 8,
      elevation: 6,
      borderBottomWidth: 4,
    };
  } else if (completed) {
    bgColor = theme.cardBackground;
    borderColor = theme.border;
    borderWidth = 1;
    extraStyles = {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 4,
      elevation: 2,
      borderBottomWidth: 3,
    };
  }

  const isPerfect = completed && bestScore === 3;

  return (
    <Pressable
      onPress={locked ? undefined : onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={locked}
      style={{
        width: 80,
        height: 96,
        borderRadius: 20,
        padding: 8,
        margin: 8,
        backgroundColor: bgColor,
        borderColor,
        borderWidth,
        opacity,
        ...extraStyles,
      }}
    >
      <Animated.View style={[animatedStyle, { flex: 1, alignItems: 'center', justifyContent: 'center' }]}>
        {locked ? (
          <LockIcon />
        ) : (
          <>
            <Text style={{ fontSize: 26, fontWeight: current ? '900' : '800', marginBottom: completed ? 8 : 0, color: txtColor, letterSpacing: -0.5 }}>{level}</Text>
            {completed ? (
              <StarsDisplay stars={bestScore > 0 ? bestScore : 3} size={12} />
            ) : null}
          </>
        )}
      </Animated.View>
    </Pressable>
  );
};
