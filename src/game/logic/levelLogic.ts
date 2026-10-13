import { GameProgress } from '../../types/game.types';

export const isLevelUnlocked = (levelId: number, progress: GameProgress | null): boolean => {
  if (!progress) return false;
  if (levelId === 1) return true;
  return progress.completedLevels.includes(levelId - 1);
};

export const isLevelCompleted = (levelId: number, progress: GameProgress | null): boolean => {
  if (!progress) return false;
  return progress.completedLevels.includes(levelId);
};

export const getNextIncompleteLevel = (progress: GameProgress | null, totalLevels: number = 10000): number => {
  if (!progress) return 1;
  const completed = new Set(progress.completedLevels || []);
  for (let i = 1; i <= totalLevels; i++) {
    if (!completed.has(i)) {
      return i;
    }
  }
  return Math.min(totalLevels, Math.max(1, progress.currentLevel || totalLevels));
};
