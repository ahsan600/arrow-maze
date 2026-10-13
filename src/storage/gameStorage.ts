import AsyncStorage from '@react-native-async-storage/async-storage';
import { GameProgress } from '../types/game.types';

const PROGRESS_KEY = '@arrow_amaze_progress';

const DEFAULT_PROGRESS: GameProgress = {
  currentLevel: 1,
  completedLevels: [],
  bestScores: {},
  soundEnabled: true,
  hapticsEnabled: true,
  tutorialCompleted: false,
  theme: 'white',
};

export const getProgress = async (): Promise<GameProgress> => {
  try {
    const jsonValue = await AsyncStorage.getItem(PROGRESS_KEY);
    if (jsonValue != null) {
      const parsed = JSON.parse(jsonValue) as GameProgress;
      
      // Safety checks
      if (typeof parsed.currentLevel !== 'number' || parsed.currentLevel < 1) {
        parsed.currentLevel = 1;
      }

      // Default to white theme if not set or if fresh user with legacy default
      if (!parsed.theme || (parsed.theme === 'dark' && (!parsed.completedLevels || parsed.completedLevels.length === 0))) {
        parsed.theme = 'white';
      }

      return {
        ...DEFAULT_PROGRESS,
        ...parsed,
      };
    }
  } catch (e) {
    console.error('Error reading progress', e);
  }
  return DEFAULT_PROGRESS;
};

export const setProgress = async (progress: GameProgress): Promise<void> => {
  try {
    const jsonValue = JSON.stringify(progress);
    await AsyncStorage.setItem(PROGRESS_KEY, jsonValue);
  } catch (e) {
    console.error('Error saving progress', e);
  }
};

export const getCurrentLevel = async (): Promise<number> => {
  const progress = await getProgress();
  return progress.currentLevel;
};

export const setCurrentLevel = async (level: number): Promise<void> => {
  const progress = await getProgress();
  const safeLevel = Math.max(1, level);
  await setProgress({ ...progress, currentLevel: safeLevel });
};

export const resetProgress = async (): Promise<void> => {
  await setProgress(DEFAULT_PROGRESS);
};
