import React from 'react';
import { Text, Pressable, View, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withRepeat,
  withSequence,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { useTheme } from '../../theme/ThemeContext';
import { PaperCard } from '../cards/PaperCard';
import { OrigamiStar } from './StarsDisplay';

export interface LevelCardProps {
  level: number;
  locked: boolean;
  completed: boolean;
  current: boolean;
  bestScore?: number;
  onPress: () => void;
  className?: string;
}

/** Paper clip lock icon for locked tiles */
const PaperClipLock = ({ color }: { color: string }) => (
  <Svg width={20} height={20} viewBox="0 0 24 24">
    <Path
      d="M 16 7 L 16 11 M 8 11 L 8 7 C 8 4.8 9.8 3 12 3 C 14.2 3 16 4.8 16 7 L 16 11 M 6 11 L 18 11 C 19.1 11 20 11.9 20 13 L 20 19 C 20 20.1 19.1 21 18 21 L 6 21 C 4.9 21 4 20.1 4 19 L 4 13 C 4 11.9 4.9 11 6 11 Z"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  </Svg>
);

/** Origami Paper Plane Icon for active/current tile */
const PaperPlaneIcon = ({ color }: { color: string }) => (
  <Svg width={16} height={16} viewBox="0 0 24 24">
    <Path
      d="M 2 12 L 22 2 L 12 22 L 10 14 Z M 10 14 L 22 2"
      fill={color}
      stroke={color}
      strokeWidth={1.5}
      strokeLinejoin="round"
    />
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
  const { theme, mode } = useTheme();
  const scale = useSharedValue(1);

  const isMilestone = level % 10 === 0;

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
    if (!locked) scale.value = withSpring(0.94, { damping: 15, stiffness: 300 });
  };

  const handlePressOut = () => {
    if (!locked) scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  // Card coloring
  let cardBg = theme.surface;
  let textColor = theme.primaryText;
  let borderColor = theme.border;

  if (locked) {
    cardBg = mode === 'dark' ? '#201E35' : '#ECE4D4';
    textColor = theme.mutedText;
  } else if (current) {
    cardBg = theme.primary; // vermilion / gold
    textColor = mode === 'dark' ? '#1B1A2E' : '#FFFDF8';
    borderColor = mode === 'dark' ? '#F6EFE4' : '#C23D17';
  } else if (completed) {
    cardBg = theme.surface;
    textColor = theme.primaryText;
  }

  const starCount = bestScore > 0 ? bestScore : 3;

  return (
    <Pressable
      onPress={locked ? undefined : onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={locked}
      style={styles.pressable}
    >
      <Animated.View style={[{ width: '100%', height: '100%' }, animatedStyle]}>
        <PaperCard
          dogEar={!locked}
          dogEarSize={16}
          radiusSize="md"
          flat={locked}
          style={[
            styles.card,
            {
              backgroundColor: cardBg,
              borderColor,
              borderBottomWidth: current ? 3.5 : 2,
              borderBottomColor: current ? (mode === 'dark' ? '#C28E25' : '#B83E1A') : theme.crease,
            },
          ]}
        >
          {/* Milestone paper ribbon badge */}
          {isMilestone && (
            <View style={styles.milestoneRibbon}>
              <Text style={styles.milestoneText}>★10</Text>
            </View>
          )}

          <View style={styles.innerContent}>
            {locked ? (
              <View style={styles.lockedContainer}>
                <PaperClipLock color={theme.mutedText} />
                <Text style={[styles.lockedNumber, { color: theme.mutedText }]}>{level}</Text>
              </View>
            ) : current ? (
              <View style={styles.currentContainer}>
                <View style={styles.planeWrapper}>
                  <PaperPlaneIcon color={textColor} />
                </View>
                <Text style={[styles.levelNumber, { color: textColor }]}>{level}</Text>
              </View>
            ) : (
              <View style={styles.completedContainer}>
                <Text style={[styles.levelNumber, { color: textColor }]}>{level}</Text>
                {completed && (
                  <View style={styles.starsRow}>
                    {[0, 1, 2].map(i => (
                      <OrigamiStar
                        key={i}
                        active={i < starCount}
                        size={12}
                        fillColor={theme.goldStar}
                        disabledColor={theme.disabledState}
                      />
                    ))}
                  </View>
                )}
              </View>
            )}
          </View>
        </PaperCard>
      </Animated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  pressable: {
    width: 76,
    height: 94,
    margin: 6,
  },
  card: {
    flex: 1,
    padding: 6,
  },
  innerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  milestoneRibbon: {
    position: 'absolute',
    top: 2,
    left: 4,
    backgroundColor: '#E4572E',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
    zIndex: 5,
  },
  milestoneText: {
    fontSize: 8,
    fontWeight: '900',
    color: '#FFFDF8',
  },
  lockedContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  lockedNumber: {
    fontSize: 16,
    fontWeight: '700',
  },
  currentContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  planeWrapper: {
    marginBottom: 2,
  },
  completedContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelNumber: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    gap: 2,
  },
});
