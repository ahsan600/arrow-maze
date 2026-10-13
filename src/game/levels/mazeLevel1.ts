import { MazeLevel } from '../engine/MazeEngine';

export const mazeLevel1: MazeLevel = {
  gridSize: { rows: 5, cols: 5 },
  start: { r: 0, c: 0 },
  end: { r: 4, c: 4 },
  edges: [
    { from: { r: 0, c: 0 }, to: { r: 0, c: 1 }, isOneWay: true },
    { from: { r: 0, c: 1 }, to: { r: 0, c: 2 } },
    { from: { r: 0, c: 2 }, to: { r: 0, c: 3 } },
    { from: { r: 0, c: 3 }, to: { r: 1, c: 3 } },
    { from: { r: 1, c: 3 }, to: { r: 1, c: 2 } },
    { from: { r: 1, c: 2 }, to: { r: 1, c: 1 } },
    { from: { r: 1, c: 1 }, to: { r: 2, c: 1 }, isOneWay: true },
    { from: { r: 2, c: 1 }, to: { r: 3, c: 1 } },
    { from: { r: 3, c: 1 }, to: { r: 3, c: 2 } },
    { from: { r: 3, c: 2 }, to: { r: 3, c: 3 } },
    { from: { r: 3, c: 3 }, to: { r: 2, c: 3 } },
    { from: { r: 2, c: 3 }, to: { r: 2, c: 4 } },
    { from: { r: 2, c: 4 }, to: { r: 3, c: 4 } },
    { from: { r: 3, c: 4 }, to: { r: 4, c: 4 } },
    
    // dead ends to make it a maze
    { from: { r: 0, c: 3 }, to: { r: 0, c: 4 } },
    { from: { r: 1, c: 1 }, to: { r: 1, c: 0 } },
    { from: { r: 2, c: 1 }, to: { r: 2, c: 2 } },
    { from: { r: 3, c: 1 }, to: { r: 4, c: 1 } },
    { from: { r: 4, c: 1 }, to: { r: 4, c: 2 } },
  ]
};
