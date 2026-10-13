export type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
export type Cell = { r: number; c: number };
export type GridSize = { rows: number; cols: number };

export interface Arrow {
  id: string;
  cells: Cell[];
  direction: Direction;
  color: string;
  active: boolean;
  cleared: boolean;
  failed?: boolean;
}

export interface Level {
  id: number;
  gridSize: { rows: number; cols: number };
  arrows: Arrow[];
  difficulty?: number;
  solution?: Direction[];
  maxHearts?: number;
}

export interface GameProgress {
  currentLevel: number;
  completedLevels: number[];
  bestScores: Record<number, number>;
  soundEnabled: boolean;
  hapticsEnabled: boolean;
  tutorialCompleted?: boolean;
  theme?: 'white' | 'dark';
  dailyPlayedDate?: string;
  dailyPlayedCount?: number;
}

export interface GameSettings {
  soundEnabled: boolean;
  hapticsEnabled: boolean;
}
