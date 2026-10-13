import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { useTheme } from '../../theme/ThemeContext';

interface GameLogoProps {
  horizontal?: boolean;
}

export const GameLogo: React.FC<GameLogoProps> = React.memo(({ horizontal = false }) => {
  const { theme } = useTheme();
  const translateY = useSharedValue(0);

  React.useEffect(() => {
    translateY.value = withRepeat(
      withSequence(
        withTiming(-3, { duration: 1200 }),
        withTiming(0, { duration: 1200 })
      ),
      -1,
      true
    );
  }, [translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  if (horizontal) {
    return (
      <View style={styles.horizontalContainer}>
        <Animated.View style={[styles.badgeWrapper, animatedStyle]}>
          <View style={styles.diamondBadge}>
            <Svg width={20} height={20} viewBox="0 0 24 24" style={styles.badgeSvg}>
              <Path
                d="M 5 6 L 19 6 L 19 20"
                stroke="#FFFFFF"
                strokeWidth={4.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            </Svg>
          </View>
        </Animated.View>
        <Text style={styles.horizontalText}>
          ARROW<Text style={styles.mazeText}>MAZE</Text>
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.badgeWrapper, animatedStyle, { marginBottom: 16 }]}>
        <View style={[styles.diamondBadge, { width: 64, height: 64, borderRadius: 18, borderWidth: 3 }]}>
          <Svg width={32} height={32} viewBox="0 0 24 24" style={styles.badgeSvg}>
            <Path
              d="M 5 6 L 19 6 L 19 20"
              stroke="#FFFFFF"
              strokeWidth={4.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </Svg>
        </View>
      </Animated.View>
      <Text style={{ fontSize: 32, fontWeight: '900', letterSpacing: -0.5, color: theme.primaryText }}>
        ARROW<Text style={{ color: '#FACC15' }}>MAZE</Text>
      </Text>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 32,
  },
  horizontalContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badgeWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  diamondBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
    borderColor: '#F59E0B',
    backgroundColor: '#0F172A',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 5,
    transform: [{ rotate: '45deg' }],
  },
  badgeSvg: {
    transform: [{ rotate: '-45deg' }],
  },
  horizontalText: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 0.5,
    color: '#FFFFFF',
    textShadowColor: '#1E3A8A',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 2,
    includeFontPadding: false,
  },
  mazeText: {
    color: '#FFD000',
  },
});

