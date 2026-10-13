import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { OrigamiCrane } from '../origami/OrigamiCrane';
import { StarsDisplay, OrigamiStar } from '../ui/StarsDisplay';

export interface LevelProgressCardProps {
  currentLevel: number;
  totalLevels?: number;
  bestStars?: number;
  stageName?: string;
  tierName?: string;
  shapeName?: string;
}

/**
 * Japanese Paper Craft Level Dossier Showcase Card
 * Features washi tape, an animated 3D origami crane centerpiece,
 * stage & chapter badges, star rating, and a milestone chapter progress bar.
 */
export const LevelProgressCard: React.FC<LevelProgressCardProps> = React.memo(({
  currentLevel,
  bestStars = 0,
  stageName = 'Beginner',
  tierName = 'Easy',
  shapeName = 'Silhouette',
}) => {
  const { theme, mode } = useTheme();

  // 50 levels per Chapter
  const chapterNumber = Math.floor((currentLevel - 1) / 50) + 1;
  const levelInChapter = ((currentLevel - 1) % 50) + 1;
  const chapterProgress = Math.max(0.04, Math.min(1, levelInChapter / 50));
  const percent = Math.round(chapterProgress * 100);

  const isDark = mode === 'dark';

  return (
    <View style={styles.wrapper}>
      {/* Main Layered Paper Craft Card */}
      <View
        style={[
          styles.card,
          {
            backgroundColor: theme.cardBackground,
            borderColor: theme.border,
            borderTopColor: theme.creaseHighlight,
            shadowColor: theme.shadow,
          },
        ]}
      >
        {/* Top Header Row with Stage & Tier Craft Chips */}
        <View style={styles.headerRow}>
          <View
            style={[
              styles.stageChip,
              {
                backgroundColor: isDark ? '#353257' : '#EFE7D8',
                borderColor: theme.border,
              },
            ]}
          >
            <Text style={[styles.stageChipText, { color: theme.primary }]}>
              {stageName.toUpperCase()} STAGE
            </Text>
          </View>

          <View
            style={[
              styles.tierChip,
              {
                backgroundColor: isDark ? 'rgba(242,177,52,0.15)' : 'rgba(228,87,46,0.12)',
                borderColor: isDark ? 'rgba(242,177,52,0.3)' : 'rgba(228,87,46,0.25)',
              },
            ]}
          >
            <Text
              style={[
                styles.tierChipText,
                { color: isDark ? theme.goldStar : theme.primary },
              ]}
            >
              {tierName.toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Centerpiece: Animated 3D Origami Crane Sculpture */}
        <View style={styles.craneContainer}>
          <OrigamiCrane size={105} />
        </View>

        {/* Title & Shape Silhouette Badge */}
        <View style={styles.titleContainer}>
          <Text style={[styles.levelTitle, { color: theme.primaryText }]}>
            Level {currentLevel}
          </Text>

          {shapeName ? (
            <View
              style={[
                styles.shapePill,
                {
                  backgroundColor: isDark ? '#2B2847' : '#F4ECE0',
                  borderColor: theme.border,
                },
              ]}
            >
              <Text style={[styles.shapePillText, { color: theme.secondaryText }]}>
                ✦ {shapeName.toUpperCase()} ✦
              </Text>
            </View>
          ) : null}

          {/* 3-Star Rating Preview */}
          <View style={styles.starsWrapper}>
            <StarsDisplay stars={bestStars} size={22} />
          </View>
        </View>

        {/* Chapter Milestone Progress Section */}
        <View style={styles.milestoneSection}>
          <View style={styles.milestoneLabels}>
            <Text style={[styles.milestoneTitle, { color: theme.secondaryText }]}>
              Chapter {chapterNumber} Progress
            </Text>
            <Text style={[styles.milestoneValue, { color: theme.primaryText }]}>
              {levelInChapter}/50 ({percent}%)
            </Text>
          </View>

          <View
            style={[
              styles.barTrack,
              { backgroundColor: isDark ? '#1C1A2E' : '#E8DFCE' },
            ]}
          >
            <View
              style={[
                styles.barFill,
                {
                  width: `${percent}%`,
                  backgroundColor: theme.primary,
                },
              ]}
            />
          </View>

          <View style={styles.milestoneFooter}>
            <Text style={[styles.milestoneSubtext, { color: theme.mutedText }]}>
              Next chapter unlocks at Level {chapterNumber * 50 + 1}
            </Text>
            <OrigamiStar active={percent >= 100} size={15} fillColor={theme.goldStar} />
          </View>
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    width: '100%',
    maxWidth: 360,
    marginVertical: 4,
    position: 'relative',
  },
  card: {
    width: '100%',
    borderRadius: 20,
    paddingTop: 16,
    paddingBottom: 14,
    paddingHorizontal: 18,
    borderWidth: 1.5,
    borderTopWidth: 2.5,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.16,
    shadowRadius: 10,
    elevation: 5,
    alignItems: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 4,
  },
  stageChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  stageChipText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  tierChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  tierChipText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  craneContainer: {
    marginVertical: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleContainer: {
    alignItems: 'center',
    width: '100%',
    marginBottom: 10,
  },
  levelTitle: {
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  shapePill: {
    marginTop: 4,
    paddingHorizontal: 12,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
  },
  shapePillText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  starsWrapper: {
    marginTop: 8,
  },
  milestoneSection: {
    width: '100%',
    marginTop: 4,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(128, 128, 128, 0.12)',
  },
  milestoneLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  milestoneTitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  milestoneValue: {
    fontSize: 12,
    fontWeight: '800',
  },
  barTrack: {
    width: '100%',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
  },
  milestoneFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  milestoneSubtext: {
    fontSize: 10,
    fontWeight: '600',
  },
});
