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

export const getNextIncompleteLevel = (
  progress: GameProgress | null,
  totalLevels: number = 1000000,
): number => {
  if (!progress) return 1;
  const completed = new Set(progress.completedLevels || []);
  let candidate = 1;
  while (completed.has(candidate) && candidate < totalLevels) {
    candidate++;
  }
  return candidate;
};
