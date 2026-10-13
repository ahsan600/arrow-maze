import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { IconButton } from '../../components/ui/IconButton';
import { LevelCard } from '../../components/ui/LevelCard';
import { ProgressBar } from '../../components/ui/ProgressBar';
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

export const LevelSelectScreen: React.FC = () => {
  const { theme } = useTheme();
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
    const maxLevel = Math.max(100, (progress?.currentLevel || 1) + 11);
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

  const completedCount = progress?.completedLevels.length || 0;

  const renderItem = useCallback(({ item: row, index: rowIndex }: { item: number[], index: number }) => {
    return (
      <View style={styles.listRow}>
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
                onPress={() => handleLevelPress(item)}
              />
            </View>
          );
        })}
      </View>
    );
  }, [progress, handleLevelPress]);

  if (!progress) {
    return (
      <ScreenContainer>
        <Text>Loading...</Text>
      </ScreenContainer>
    ); // Or a loading spinner
  }

  return (
    <ScreenContainer style={styles.container}>
      <View style={styles.header}>
        <IconButton
          icon="back"
          onPress={() => navigation.goBack()}
          className="mr-4"
          iconColor={theme.primaryText}
        />
        <Text style={{ fontSize: 30, fontWeight: 'bold', color: theme.primaryText }}>Levels</Text>
      </View>



      <FlatList
        key="level-rows-list"
        data={levels}
        keyExtractor={(_, index) => index.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        initialScrollIndex={progress?.currentLevel ? Math.max(0, Math.floor((progress.currentLevel - 1) / 4)) : 0}
        initialNumToRender={6}
        maxToRenderPerBatch={4}
        windowSize={5}
        getItemLayout={(data, index) => {
          const itemHeight = 112; // 96px card + 16px margin
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
    paddingHorizontal: 0, // Reset horizontal padding to allow full width for FlatList
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 24,
    paddingHorizontal: 24,
  },
  progressTextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressSection: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 48,
  },
  listRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  cardWrapper: {
    width: '25%', // 4 columns
    alignItems: 'center',
    marginBottom: 16,
  },
});
