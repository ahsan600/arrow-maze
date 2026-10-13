import { Level } from '../../types/game.types';

export const levels21_30: Level[] = [
  {
    id: 21,
    gridSize: { rows: 6, cols: 6 },
    arrows: [
      { id: '1', cells: [{r: 3, c: 3}, {r: 3, c: 4}], direction: 'RIGHT', color: '#8b5cf6', active: true, cleared: false },
      { id: '2', cells: [{r: 2, c: 1}, {r: 2, c: 2}, {r: 1, c: 2}], direction: 'UP', color: '#10b981', active: true, cleared: false },
      { id: '3', cells: [{r: 0, c: 2}, {r: 0, c: 1}, {r: 0, c: 0}, {r: 1, c: 0}], direction: 'DOWN', color: '#f97316', active: true, cleared: false },
      { id: '4', cells: [{r: 1, c: 4}, {r: 0, c: 4}, {r: 0, c: 3}], direction: 'LEFT', color: '#ef4444', active: true, cleared: false },
      { id: '5', cells: [{r: 4, c: 1}, {r: 4, c: 2}, {r: 3, c: 2}], direction: 'UP', color: '#14b8a6', active: true, cleared: false }
    ]
  },
  {
    id: 22,
    gridSize: { rows: 6, cols: 6 },
    arrows: [
      { id: '1', cells: [{r: 2, c: 2}, {r: 2, c: 3}], direction: 'RIGHT', color: '#14b8a6', active: true, cleared: false },
      { id: '2', cells: [{r: 1, c: 4}, {r: 1, c: 3}], direction: 'LEFT', color: '#8b5cf6', active: true, cleared: false },
      { id: '3', cells: [{r: 1, c: 2}, {r: 1, c: 1}], direction: 'LEFT', color: '#ec4899', active: true, cleared: false },
      { id: '4', cells: [{r: 0, c: 4}, {r: 0, c: 3}, {r: 0, c: 2}], direction: 'LEFT', color: '#10b981', active: true, cleared: false },
      { id: '5', cells: [{r: 0, c: 5}, {r: 1, c: 5}, {r: 2, c: 5}, {r: 3, c: 5}], direction: 'DOWN', color: '#f59e0b', active: true, cleared: false },
      { id: '6', cells: [{r: 3, c: 4}, {r: 2, c: 4}], direction: 'UP', color: '#ef4444', active: true, cleared: false }
    ]
  },
  {
    id: 23,
    gridSize: { rows: 6, cols: 6 },
    arrows: [
      { id: '1', cells: [{r: 4, c: 3}, {r: 4, c: 2}], direction: 'LEFT', color: '#ef4444', active: true, cleared: false },
      { id: '2', cells: [{r: 1, c: 2}, {r: 2, c: 2}], direction: 'DOWN', color: '#3b82f6', active: true, cleared: false },
      { id: '3', cells: [{r: 3, c: 3}, {r: 3, c: 4}], direction: 'RIGHT', color: '#ec4899', active: true, cleared: false },
      { id: '4', cells: [{r: 5, c: 3}, {r: 5, c: 2}], direction: 'LEFT', color: '#f97316', active: true, cleared: false },
      { id: '5', cells: [{r: 5, c: 1}, {r: 4, c: 1}, {r: 3, c: 1}, {r: 3, c: 2}], direction: 'RIGHT', color: '#f59e0b', active: true, cleared: false },
      { id: '6', cells: [{r: 4, c: 5}, {r: 4, c: 4}, {r: 5, c: 4}], direction: 'DOWN', color: '#10b981', active: true, cleared: false }
    ]
  },
  {
    id: 24,
    gridSize: { rows: 6, cols: 6 },
    arrows: [
      { id: '1', cells: [{r: 1, c: 3}, {r: 2, c: 3}, {r: 3, c: 3}, {r: 4, c: 3}], direction: 'DOWN', color: '#10b981', active: true, cleared: false },
      { id: '2', cells: [{r: 4, c: 4}, {r: 3, c: 4}], direction: 'UP', color: '#ef4444', active: true, cleared: false },
      { id: '3', cells: [{r: 1, c: 4}, {r: 2, c: 4}, {r: 2, c: 5}], direction: 'RIGHT', color: '#3b82f6', active: true, cleared: false },
      { id: '4', cells: [{r: 3, c: 5}, {r: 4, c: 5}, {r: 5, c: 5}], direction: 'DOWN', color: '#f97316', active: true, cleared: false },
      { id: '5', cells: [{r: 5, c: 2}, {r: 5, c: 3}, {r: 5, c: 4}], direction: 'RIGHT', color: '#f59e0b', active: true, cleared: false }
    ]
  },
  // Animal level: Crab
  {
    id: 25,
    gridSize: { rows: 6, cols: 11 },
    arrows: [
      { id: '1', cells: [{r: 2, c: 2}, {r: 1, c: 2}], direction: 'UP', color: '#f59e0b', active: true, cleared: false },
      { id: '2', cells: [{r: 2, c: 6}, {r: 3, c: 6}], direction: 'DOWN', color: '#ef4444', active: true, cleared: false },
      { id: '3', cells: [{r: 5, c: 7}, {r: 4, c: 7}, {r: 4, c: 8}], direction: 'RIGHT', color: '#ec4899', active: true, cleared: false },
      { id: '4', cells: [{r: 3, c: 9}, {r: 3, c: 8}], direction: 'LEFT', color: '#f59e0b', active: true, cleared: false },
      { id: '5', cells: [{r: 1, c: 8}, {r: 2, c: 8}, {r: 2, c: 7}], direction: 'LEFT', color: '#f97316', active: true, cleared: false },
      { id: '6', cells: [{r: 3, c: 1}, {r: 3, c: 2}, {r: 4, c: 2}], direction: 'DOWN', color: '#ec4899', active: true, cleared: false },
      { id: '7', cells: [{r: 5, c: 1}, {r: 4, c: 1}], direction: 'UP', color: '#ef4444', active: true, cleared: false },
      { id: '8', cells: [{r: 5, c: 9}, {r: 4, c: 9}], direction: 'UP', color: '#ef4444', active: true, cleared: false },
      { id: '9', cells: [{r: 4, c: 6}, {r: 4, c: 5}, {r: 5, c: 5}], direction: 'DOWN', color: '#f97316', active: true, cleared: false },
      { id: '10', cells: [{r: 2, c: 4}, {r: 2, c: 3}], direction: 'LEFT', color: '#f97316', active: true, cleared: false },
      { id: '11', cells: [{r: 3, c: 4}, {r: 3, c: 5}, {r: 2, c: 5}], direction: 'UP', color: '#ec4899', active: true, cleared: false },
      { id: '12', cells: [{r: 0, c: 1}, {r: 0, c: 0}, {r: 1, c: 0}], direction: 'DOWN', color: '#f59e0b', active: true, cleared: false },
      { id: '13', cells: [{r: 1, c: 10}, {r: 0, c: 10}, {r: 0, c: 9}], direction: 'LEFT', color: '#ec4899', active: true, cleared: false },
      { id: '14', cells: [{r: 5, c: 3}, {r: 4, c: 3}, {r: 4, c: 4}], direction: 'RIGHT', color: '#f59e0b', active: true, cleared: false }
    ]
  },
  {
    id: 26,
    gridSize: { rows: 6, cols: 6 },
    arrows: [
      { id: '1', cells: [{r: 3, c: 2}, {r: 3, c: 1}], direction: 'LEFT', color: '#ef4444', active: true, cleared: false },
      { id: '2', cells: [{r: 1, c: 1}, {r: 1, c: 2}], direction: 'RIGHT', color: '#ec4899', active: true, cleared: false },
      { id: '3', cells: [{r: 0, c: 4}, {r: 0, c: 3}], direction: 'LEFT', color: '#14b8a6', active: true, cleared: false },
      { id: '4', cells: [{r: 3, c: 0}, {r: 4, c: 0}], direction: 'DOWN', color: '#8b5cf6', active: true, cleared: false },
      { id: '5', cells: [{r: 0, c: 2}, {r: 0, c: 1}], direction: 'LEFT', color: '#f59e0b', active: true, cleared: false },
      { id: '6', cells: [{r: 0, c: 0}, {r: 1, c: 0}], direction: 'DOWN', color: '#f97316', active: true, cleared: false },
      { id: '7', cells: [{r: 2, c: 2}, {r: 2, c: 1}], direction: 'LEFT', color: '#3b82f6', active: true, cleared: false },
      { id: '8', cells: [{r: 2, c: 4}, {r: 2, c: 3}], direction: 'LEFT', color: '#10b981', active: true, cleared: false }
    ]
  },
  {
    id: 27,
    gridSize: { rows: 6, cols: 6 },
    arrows: [
      { id: '1', cells: [{r: 3, c: 2}, {r: 4, c: 2}, {r: 4, c: 3}], direction: 'RIGHT', color: '#f59e0b', active: true, cleared: false },
      { id: '2', cells: [{r: 3, c: 5}, {r: 4, c: 5}], direction: 'DOWN', color: '#ef4444', active: true, cleared: false },
      { id: '3', cells: [{r: 3, c: 4}, {r: 2, c: 4}, {r: 2, c: 5}], direction: 'RIGHT', color: '#3b82f6', active: true, cleared: false },
      { id: '4', cells: [{r: 2, c: 2}, {r: 2, c: 3}, {r: 3, c: 3}], direction: 'DOWN', color: '#10b981', active: true, cleared: false },
      { id: '5', cells: [{r: 5, c: 2}, {r: 5, c: 3}], direction: 'RIGHT', color: '#ec4899', active: true, cleared: false },
      { id: '6', cells: [{r: 4, c: 4}, {r: 5, c: 4}, {r: 5, c: 5}], direction: 'RIGHT', color: '#14b8a6', active: true, cleared: false }
    ]
  },
  {
    id: 28,
    gridSize: { rows: 7, cols: 7 },
    arrows: [
      { id: '1', cells: [{r: 3, c: 1}, {r: 4, c: 1}], direction: 'DOWN', color: '#f97316', active: true, cleared: false },
      { id: '2', cells: [{r: 5, c: 1}, {r: 6, c: 1}, {r: 6, c: 0}], direction: 'LEFT', color: '#3b82f6', active: true, cleared: false },
      { id: '3', cells: [{r: 4, c: 4}, {r: 4, c: 3}, {r: 5, c: 3}], direction: 'DOWN', color: '#14b8a6', active: true, cleared: false },
      { id: '4', cells: [{r: 5, c: 6}, {r: 5, c: 5}], direction: 'LEFT', color: '#f59e0b', active: true, cleared: false },
      { id: '5', cells: [{r: 6, c: 3}, {r: 6, c: 4}], direction: 'RIGHT', color: '#10b981', active: true, cleared: false },
      { id: '6', cells: [{r: 4, c: 2}, {r: 5, c: 2}, {r: 6, c: 2}], direction: 'DOWN', color: '#8b5cf6', active: true, cleared: false },
      { id: '7', cells: [{r: 6, c: 5}, {r: 6, c: 6}], direction: 'RIGHT', color: '#ef4444', active: true, cleared: false },
      { id: '8', cells: [{r: 5, c: 0}, {r: 4, c: 0}, {r: 3, c: 0}], direction: 'UP', color: '#ec4899', active: true, cleared: false },
      { id: '9', cells: [{r: 3, c: 5}, {r: 4, c: 5}], direction: 'DOWN', color: '#ef4444', active: true, cleared: false }
    ]
  },
  {
    id: 29,
    gridSize: { rows: 7, cols: 7 },
    arrows: [
      { id: '1', cells: [{r: 3, c: 1}, {r: 3, c: 2}, {r: 3, c: 3}, {r: 3, c: 4}], direction: 'RIGHT', color: '#8b5cf6', active: true, cleared: false },
      { id: '2', cells: [{r: 5, c: 6}, {r: 5, c: 5}], direction: 'LEFT', color: '#ef4444', active: true, cleared: false },
      { id: '3', cells: [{r: 6, c: 4}, {r: 6, c: 5}, {r: 6, c: 6}], direction: 'RIGHT', color: '#f97316', active: true, cleared: false },
      { id: '4', cells: [{r: 5, c: 4}, {r: 5, c: 3}, {r: 4, c: 3}, {r: 4, c: 4}], direction: 'RIGHT', color: '#f59e0b', active: true, cleared: false },
      { id: '5', cells: [{r: 6, c: 2}, {r: 6, c: 3}], direction: 'RIGHT', color: '#ec4899', active: true, cleared: false },
      { id: '6', cells: [{r: 3, c: 6}, {r: 4, c: 6}, {r: 4, c: 5}, {r: 3, c: 5}], direction: 'UP', color: '#14b8a6', active: true, cleared: false },
      { id: '7', cells: [{r: 1, c: 6}, {r: 2, c: 6}, {r: 2, c: 5}], direction: 'LEFT', color: '#3b82f6', active: true, cleared: false }
    ]
  },
  // Animal level: Whale
  {
    id: 30,
    gridSize: { rows: 6, cols: 12 },
    arrows: [
      { id: '1', cells: [{r: 3, c: 8}, {r: 3, c: 7}], direction: 'LEFT', color: '#10b981', active: true, cleared: false },
      { id: '2', cells: [{r: 2, c: 1}, {r: 2, c: 2}], direction: 'RIGHT', color: '#3b82f6', active: true, cleared: false },
      { id: '3', cells: [{r: 4, c: 6}, {r: 4, c: 5}, {r: 5, c: 5}], direction: 'DOWN', color: '#10b981', active: true, cleared: false },
      { id: '4', cells: [{r: 5, c: 6}, {r: 5, c: 7}, {r: 5, c: 8}], direction: 'RIGHT', color: '#3b82f6', active: true, cleared: false },
      { id: '5', cells: [{r: 2, c: 4}, {r: 2, c: 5}], direction: 'RIGHT', color: '#06b6d4', active: true, cleared: false },
      { id: '6', cells: [{r: 2, c: 7}, {r: 2, c: 8}], direction: 'RIGHT', color: '#06b6d4', active: true, cleared: false },
      { id: '7', cells: [{r: 3, c: 10}, {r: 3, c: 9}], direction: 'LEFT', color: '#06b6d4', active: true, cleared: false },
      { id: '8', cells: [{r: 3, c: 4}, {r: 4, c: 4}, {r: 5, c: 4}], direction: 'DOWN', color: '#8b5cf6', active: true, cleared: false },
      { id: '9', cells: [{r: 1, c: 2}, {r: 0, c: 2}], direction: 'UP', color: '#8b5cf6', active: true, cleared: false },
      { id: '10', cells: [{r: 4, c: 7}, {r: 4, c: 8}, {r: 4, c: 9}], direction: 'RIGHT', color: '#8b5cf6', active: true, cleared: false },
      { id: '11', cells: [{r: 1, c: 9}, {r: 2, c: 9}], direction: 'DOWN', color: '#3b82f6', active: true, cleared: false },
      { id: '12', cells: [{r: 2, c: 6}, {r: 3, c: 6}, {r: 3, c: 5}], direction: 'LEFT', color: '#3b82f6', active: true, cleared: false },
      { id: '13', cells: [{r: 3, c: 1}, {r: 4, c: 1}, {r: 4, c: 2}], direction: 'RIGHT', color: '#10b981', active: true, cleared: false },
      { id: '14', cells: [{r: 5, c: 2}, {r: 5, c: 3}], direction: 'RIGHT', color: '#06b6d4', active: true, cleared: false },
      { id: '15', cells: [{r: 4, c: 3}, {r: 3, c: 3}, {r: 2, c: 3}], direction: 'UP', color: '#8b5cf6', active: true, cleared: false },
      { id: '16', cells: [{r: 1, c: 11}, {r: 2, c: 11}], direction: 'DOWN', color: '#10b981', active: true, cleared: false }
    ]
  }
];
