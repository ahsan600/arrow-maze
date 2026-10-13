import { Level } from '../../types/game.types';

export const level1: Level = {
  id: 1,
  gridSize: { rows: 6, cols: 6 },
  arrows: [
    {
      id: 'arrow-1',
      cells: [{r: 2, c: 2}, {r: 2, c: 3}], // Tail c:2, Head c:3 (RIGHT)
      direction: 'RIGHT',
      color: '#ef4444',
      active: true,
      cleared: false,
    },
    {
      id: 'arrow-2',
      cells: [{r: 3, c: 4}, {r: 2, c: 4}, {r: 1, c: 4}], // Tail r:3, Head r:1 (UP)
      direction: 'UP',
      color: '#3b82f6',
      active: true,
      cleared: false,
    },
    {
      id: 'arrow-3',
      cells: [{r: 0, c: 4}], // Single cell
      direction: 'LEFT',
      color: '#10b981',
      active: true,
      cleared: false,
    },
    {
      id: 'arrow-4',
      cells: [{r: 4, c: 2}, {r: 4, c: 1}], // Tail c:2, Head c:1 (LEFT)
      direction: 'LEFT',
      color: '#f59e0b',
      active: true,
      cleared: false,
    }
  ]
};
