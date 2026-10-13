import { Level } from '../../types/game.types';

export const getLevel = (levelNumber: number): Level => {
  return {
    id: levelNumber,
    gridSize: { rows: 5, cols: 5 },
    arrows: [],
  };
};
