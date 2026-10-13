export type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

export interface Tile {
  id: string;
  row: number;
  col: number;
  span: number;
  direction: Direction;
}

export interface GridSize {
  rows: number;
  cols: number;
}

export interface LevelDefinition {
  id: number;
  gridSize: GridSize;
  tiles: Tile[];
  maxHearts: number;
}

export interface GameState {
  tiles: Tile[];
  remainingHearts: number;
  hintsUsed: number;
  status: 'PLAYING' | 'WON' | 'LOST';
}
