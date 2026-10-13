import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Rect } from 'react-native-svg';
import { useTheme } from '../../theme/ThemeContext';

interface LevelProgressCardProps {
  currentLevel: number;
  totalLevels?: number;
}

/**
 * Sticky-Note Paper Card
 * Tilted by -3deg like a sticky note on a craft board with washi tape at the top.
 */
export const LevelProgressCard: React.FC<LevelProgressCardProps> = React.memo(({
  currentLevel,
  totalLevels = 100,
}) => {
  const { theme, mode } = useTheme();
  const progress = Math.max(0, Math.min(1, currentLevel / totalLevels));

  return (
    <View style={styles.wrapper}>
      {/* Translucent washi tape holding note down */}
      <View style={styles.washiTape} pointerEvents="none">
        <Svg width={90} height={22} viewBox="0 0 90 22">
          <Rect
            x="0"
            y="0"
            width="90"
            height="22"
            fill={mode === 'dark' ? 'rgba(242, 177, 52, 0.45)' : 'rgba(242, 177, 52, 0.55)'}
            rx={2}
          />
        </Svg>
      </View>

      {/* The sticky note card */}
      <View
        style={[
          styles.stickyNote,
          {
            backgroundColor: theme.surface,
            borderColor: theme.border,
            borderTopColor: theme.creaseHighlight,
            shadowColor: theme.shadow,
          },
        ]}
      >
        <View style={styles.topRow}>
          <Text style={[styles.tagText, { color: theme.primary }]}>ACTIVE PUZZLE</Text>
          <View style={[styles.percentBadge, { backgroundColor: mode === 'dark' ? '#3B3860' : '#EDE5CF' }]}>
            <Text style={[styles.percentText, { color: theme.primaryText }]}>
              {Math.round(progress * 100)}%
            </Text>
          </View>
        </View>

        <Text style={[styles.levelTitle, { color: theme.primaryText }]}>
          Level {currentLevel}
        </Text>

        {/* Paper bar track with subtle inner fold */}
        <View style={[styles.barTrack, { backgroundColor: mode === 'dark' ? '#1B1A2E' : '#EAE1CF' }]}>
          <View
            style={[
              styles.barFill,
              {
                width: `${Math.max(6, Math.round(progress * 100))}%`,
                backgroundColor: theme.primary,
              },
            ]}
          />
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    width: '88%',
    maxWidth: 340,
    transform: [{ rotate: '-3deg' }],
    marginVertical: 12,
    position: 'relative',
  },
  washiTape: {
    position: 'absolute',
    top: -10,
    zIndex: 10,
  },
  stickyNote: {
    width: '100%',
    borderRadius: 14,
    paddingTop: 18,
    paddingBottom: 20,
    paddingHorizontal: 22,
    borderWidth: 1,
    borderTopWidth: 2,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 5,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  percentBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
  },
  percentText: {
    fontSize: 12,
    fontWeight: '700',
  },
  levelTitle: {
    fontSize: 32,
    fontWeight: '800',
    textAlign: 'center',
    marginVertical: 6,
    letterSpacing: 0.5,
  },
  barTrack: {
    width: '100%',
    height: 9,
    borderRadius: 6,
    overflow: 'hidden',
    marginTop: 8,
  },
  barFill: {
    height: '100%',
    borderRadius: 6,
  },
});
