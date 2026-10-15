import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { IconButton } from '../../components/ui/IconButton';
import { LevelCard } from '../../components/ui/LevelCard';
import { getProgress } from '../../storage/gameStorage';
import { GameProgress } from '../../types/game.types';
import { isLevelUnlocked, isLevelCompleted } from '../../game/logic/levelLogic';
import { useTheme } from '../../theme/ThemeContext';

type RootStackParamList = {
  Home: undefined;
  LevelSelect: undefined;
  Game: { levelId: number };
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

/**
 * Folded Paper Banner Ribbon
 * Creates an origami ribbon effect with folded notched ends on left & right.
 */
const PaperBannerRibbon = ({ title, theme }: { title: string; theme: any }) => {
  return (
    <View style={styles.ribbonWrapper}>
      {/* Left ribbon tail */}
      <View style={styles.ribbonTailLeft}>
        <Svg width={24} height={42} viewBox="0 0 24 42">
          <Path d="M 24 0 L 0 0 L 12 21 L 0 42 L 24 42 Z" fill={theme.primary} opacity={0.8} />
          <Path d="M 24 42 L 24 34 L 16 42 Z" fill={theme.crease} />
        </Svg>
      </View>

      {/* Main center ribbon body */}
      <View
        style={[
          styles.ribbonBody,
          {
            backgroundColor: theme.primary,
            borderTopColor: theme.creaseHighlight,
            borderBottomColor: theme.crease,
            shadowColor: theme.shadow,
          },
        ]}
      >
        <Text style={[styles.ribbonText, { color: theme.primaryButtonText }]}>{title}</Text>
      </View>

      {/* Right ribbon tail */}
      <View style={styles.ribbonTailRight}>
        <Svg width={24} height={42} viewBox="0 0 24 42">
          <Path d="M 0 0 L 24 0 L 12 21 L 24 42 L 0 42 Z" fill={theme.primary} opacity={0.8} />
          <Path d="M 0 42 L 0 34 L 8 42 Z" fill={theme.crease} />
        </Svg>
      </View>
    </View>
  );
};

/** Staggered Row Item Component */
const StaggeredRow = memo(function StaggeredRow({
  row,
  rowIndex,
  progress,
  onPressLevel,
}: {
  row: number[];
  rowIndex: number;
  progress: GameProgress | null;
  onPressLevel: (id: number) => void;
}) {
  const animOpacity = useSharedValue(0);
  const animTranslateY = useSharedValue(18);

  React.useEffect(() => {
    const delay = Math.min(300, rowIndex * 30);
    animOpacity.value = withDelay(delay, withTiming(1, { duration: 350, easing: Easing.out(Easing.quad) }));
    animTranslateY.value = withDelay(delay, withTiming(0, { duration: 350, easing: Easing.out(Easing.quad) }));
  }, [rowIndex, animOpacity, animTranslateY]);

  const rowStyle = useAnimatedStyle(() => ({
    opacity: animOpacity.value,
    transform: [{ translateY: animTranslateY.value }],
  }));

  return (
    <Animated.View style={[styles.listRow, rowStyle]}>
      {row.map(item => {
        const isLocked = !isLevelUnlocked(item, progress);
        const isCompleted = isLevelCompleted(item, progress);
        const isCurrent = progress?.currentLevel === item;
        const bestScore = progress?.bestScores[item] || 0;

        return (
          <View key={item} style={styles.cardWrapper}>
            <LevelCard
              level={item}
              locked={isLocked}
              completed={isCompleted}
              current={isCurrent}
              bestScore={bestScore}
              onPress={() => onPressLevel(item)}
            />
          </View>
        );
      })}
    </Animated.View>
  );
});

import { memo } from 'react';

export const LevelSelectScreen: React.FC = () => {
  const { theme, mode } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const [progress, setProgress] = useState<GameProgress | null>(null);

  const loadProgress = useCallback(async () => {
    const data = await getProgress();
    setProgress(data);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadProgress();
    }, [loadProgress])
  );
  const levels = useMemo(() => {
    const current = progress?.currentLevel || 1;
    const maxLevel = Math.max(100, current + 15);
    const flatLevels = Array.from({ length: maxLevel }, (_, i) => i + 1);
    const rows: number[][] = [];
    for (let i = 0; i < flatLevels.length; i += 4) {
      rows.push(flatLevels.slice(i, i + 4));
    }
    return rows;
  }, [progress?.currentLevel]);

  const handleLevelPress = useCallback((levelId: number) => {
    navigation.navigate('Game', { levelId });
  }, [navigation]);

  const renderItem = useCallback(({ item: row, index: rowIndex }: { item: number[]; index: number }) => {
    return (
      <StaggeredRow
        row={row}
        rowIndex={rowIndex}
        progress={progress}
        onPressLevel={handleLevelPress}
      />
    );
  }, [progress, handleLevelPress]);

  return (
    <ScreenContainer style={styles.container}>
      {/* Sticky Paper Banner Ribbon Header */}
      <View style={styles.header}>
        <IconButton
          icon="back"
          onPress={() => navigation.goBack()}
          iconColor={theme.primaryText}
          style={[styles.backBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}
        />
        <PaperBannerRibbon title="LEVELS" theme={theme} />
        <View style={{ width: 44 }} />
      </View>

      {/* Grid of Paper Tiles */}
      <FlatList
        key="level-rows-list"
        data={levels}
        keyExtractor={(_, index) => index.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        initialScrollIndex={progress?.currentLevel ? Math.max(0, Math.floor((progress.currentLevel - 1) / 4)) : 0}
        initialNumToRender={8}
        maxToRenderPerBatch={4}
        windowSize={5}
        getItemLayout={(_, index) => {
          const itemHeight = 106;
          return {
            length: itemHeight,
            offset: itemHeight * index,
            index,
          };
        }}
      />
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    paddingBottom: 16,
    paddingHorizontal: 16,
    zIndex: 20,
  },
  backBtn: {
    borderRadius: 22,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
  ribbonWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ribbonTailLeft: {
    marginRight: -1,
  },
  ribbonTailRight: {
    marginLeft: -1,
  },
  ribbonBody: {
    paddingHorizontal: 28,
    paddingVertical: 8,
    borderRadius: 4,
    borderTopWidth: 1.5,
    borderBottomWidth: 3,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
    zIndex: 2,
  },
  ribbonText: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 2,
  },
  listContent: {
    paddingHorizontal: 12,
    paddingBottom: 48,
  },
  listRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
  },
  cardWrapper: {
    width: '25%',
    alignItems: 'center',
  },
});
