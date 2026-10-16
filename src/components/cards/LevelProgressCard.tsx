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
          },
        ]}
      >
        {/* Top Header Row with Stage & Tier Craft Chips */}
        <View style={styles.headerRow}>
          <View
            style={[
              styles.stageChip,
              {
                backgroundColor: isDark ? 'rgba(99, 102, 241, 0.15)' : '#EEF2FF',
              },
            ]}
          >
            <Text style={[styles.stageChipText, { color: isDark ? '#A5B4FC' : '#4338CA' }]}>
              {stageName.toUpperCase()} STAGE
            </Text>
          </View>

          <View
            style={[
              styles.tierChip,
              {
                backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : '#FEE2E2',
              },
            ]}
          >
            <Text style={[styles.tierChipText, { color: isDark ? '#FCA5A5' : '#DC2626' }]}>
              {tierName.toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Centerpiece: Animated 3D Origami Crane Sculpture */}
        <View style={styles.craneContainer}>
          <OrigamiCrane size={155} />
        </View>

        {/* Title & Shape Silhouette Badge */}
        <View style={styles.titleContainer}>
          <Text style={[styles.levelTitle, { color: isDark ? '#FFFFFF' : '#1E1B4B' }]}>
            Level {currentLevel}
          </Text>

          {shapeName ? (
            <View
              style={[
                styles.shapePill,
                {
                  backgroundColor: isDark ? 'rgba(99, 102, 241, 0.15)' : '#EEF2FF',
                },
              ]}
            >
              <Text style={[styles.shapePillText, { color: isDark ? '#A5B4FC' : '#4338CA' }]}>
                ✦  {shapeName.toUpperCase()}  ✦
              </Text>
            </View>
          ) : null}

          {/* 3-Star Rating Preview */}
          <View style={styles.starsWrapper}>
            <StarsDisplay stars={bestStars || 3} size={24} />
          </View>
        </View>

        {/* Chapter Milestone Progress Section */}
        <View style={styles.milestoneSection}>
          <View style={styles.milestoneLabels}>
            <Text style={[styles.milestoneTitle, { color: isDark ? '#94A3B8' : '#64748B' }]}>
              Chapter {chapterNumber} Progress: {levelInChapter}/50 ({percent}%)
            </Text>
          </View>

          <View
            style={[
              styles.barTrack,
              { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#EEF2FF' },
            ]}
          >
            <View
              style={[
                styles.barFill,
                {
                  width: `${percent}%`,
                  backgroundColor: '#6366F1',
                },
              ]}
            />
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
    borderRadius: 28,
    paddingTop: 18,
    paddingBottom: 18,
    paddingHorizontal: 20,
    borderWidth: 1.5,
    borderColor: '#EEF2FF',
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
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 0,
  },
  stageChipText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  tierChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 0,
  },
  tierChipText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  craneContainer: {
    marginVertical: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleContainer: {
    alignItems: 'center',
    width: '100%',
    marginBottom: 8,
  },
  levelTitle: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  shapePill: {
    marginTop: 6,
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderRadius: 14,
    borderWidth: 0,
  },
  shapePillText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  starsWrapper: {
    marginTop: 8,
  },
  milestoneSection: {
    width: '100%',
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 0,
  },
  milestoneLabels: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  milestoneTitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.2,
    textAlign: 'center',
  },
  milestoneValue: {
    fontSize: 12,
    fontWeight: '800',
  },
  barTrack: {
    width: '100%',
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 5,
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
