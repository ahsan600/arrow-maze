import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface LevelProgressCardProps {
  currentLevel: number;
  totalLevels?: number;
}

export const LevelProgressCard: React.FC<LevelProgressCardProps> = React.memo(({
  currentLevel,
  totalLevels = 100,
}) => {
  const progress = Math.max(0, Math.min(1, currentLevel / totalLevels));

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <Text style={styles.tagText}>CURRENT PUZZLE</Text>
        <View style={styles.percentPill}>
          <Text style={styles.percentText}>{Math.round(progress * 100)}%</Text>
        </View>
      </View>

      <Text style={styles.levelText}>
        Level {currentLevel}
      </Text>

      <View style={styles.barTrack}>
        <View style={[styles.barFill, { width: `${Math.max(5, Math.round(progress * 100))}%` }]} />
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    width: '84%',
    maxWidth: 335,
    alignSelf: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 26,
    paddingTop: 16,
    paddingBottom: 20,
    paddingHorizontal: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 6,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  tagText: {
    color: '#F97316',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  percentPill: {
    backgroundColor: '#FFEDD5',
    paddingHorizontal: 12,
    paddingVertical: 3.5,
    borderRadius: 14,
  },
  percentText: {
    color: '#EA580C',
    fontSize: 13,
    fontWeight: '800',
  },
  levelText: {
    fontSize: 34,
    fontWeight: '900',
    color: '#0F172A',
    textAlign: 'center',
    marginVertical: 4,
    letterSpacing: -0.5,
  },
  barTrack: {
    width: '100%',
    height: 8.5,
    backgroundColor: '#E2E8F0',
    borderRadius: 999,
    overflow: 'hidden',
    marginTop: 8,
  },
  barFill: {
    height: '100%',
    backgroundColor: '#F59E0B',
    borderRadius: 999,
  },
});


