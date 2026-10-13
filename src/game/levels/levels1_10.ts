import { Level } from '../../types/game.types';

export const levels1_10: Level[] = [
  {
    id: 1,
    gridSize: { rows: 4, cols: 4 },
    arrows: [
      { id: '1', cells: [{r: 1, c: 0}, {r: 1, c: 1}], direction: 'RIGHT', color: '#f59e0b', active: true, cleared: false },
      { id: '2', cells: [{r: 0, c: 2}, {r: 1, c: 2}, {r: 1, c: 3}], direction: 'RIGHT', color: '#f97316', active: true, cleared: false }
    ]
  },
  {
    id: 2,
    gridSize: { rows: 4, cols: 4 },
    arrows: [
      { id: '1', cells: [{r: 3, c: 2}, {r: 3, c: 3}], direction: 'RIGHT', color: '#3b82f6', active: true, cleared: false },
      { id: '2', cells: [{r: 2, c: 0}, {r: 3, c: 0}, {r: 3, c: 1}], direction: 'RIGHT', color: '#ef4444', active: true, cleared: false }
    ]
  },
  {
    id: 3,
    gridSize: { rows: 4, cols: 4 },
    arrows: [
      { id: '1', cells: [{r: 1, c: 2}, {r: 1, c: 1}], direction: 'LEFT', color: '#8b5cf6', active: true, cleared: false },
      { id: '2', cells: [{r: 0, c: 1}, {r: 0, c: 0}, {r: 1, c: 0}], direction: 'DOWN', color: '#ec4899', active: true, cleared: false }
    ]
  },
  {
    id: 4,
    gridSize: { rows: 4, cols: 4 },
    arrows: [
      { id: '1', cells: [{r: 0, c: 2}, {r: 0, c: 3}, {r: 1, c: 3}], direction: 'DOWN', color: '#f97316', active: true, cleared: false },
      { id: '2', cells: [{r: 2, c: 1}, {r: 2, c: 2}, {r: 2, c: 3}], direction: 'RIGHT', color: '#14b8a6', active: true, cleared: false }
    ]
  },
  {
    id: 5,
    gridSize: { rows: 4, cols: 4 },
    arrows: [
      { id: '1', cells: [{r: 0, c: 1}, {r: 1, c: 1}], direction: 'DOWN', color: '#f97316', active: true, cleared: false },
      { id: '2', cells: [{r: 3, c: 1}, {r: 3, c: 0}], direction: 'LEFT', color: '#ec4899', active: true, cleared: false },
      { id: '3', cells: [{r: 1, c: 0}, {r: 2, c: 0}], direction: 'DOWN', color: '#10b981', active: true, cleared: false }
    ]
  },
  {
    id: 6,
    gridSize: { rows: 4, cols: 4 },
    arrows: [
      { id: '1', cells: [{r: 2, c: 0}, {r: 1, c: 0}], direction: 'UP', color: '#ec4899', active: true, cleared: false },
      { id: '2', cells: [{r: 2, c: 1}, {r: 3, c: 1}], direction: 'DOWN', color: '#f97316', active: true, cleared: false },
      { id: '3', cells: [{r: 0, c: 0}, {r: 0, c: 1}], direction: 'RIGHT', color: '#14b8a6', active: true, cleared: false }
    ]
  },
  {
    id: 7,
    gridSize: { rows: 5, cols: 5 },
    arrows: [
      { id: '1', cells: [{r: 3, c: 2}, {r: 3, c: 1}, {r: 2, c: 1}], direction: 'UP', color: '#f97316', active: true, cleared: false },
      { id: '2', cells: [{r: 4, c: 2}, {r: 4, c: 3}, {r: 4, c: 4}], direction: 'RIGHT', color: '#8b5cf6', active: true, cleared: false },
      { id: '3', cells: [{r: 3, c: 3}, {r: 2, c: 3}, {r: 2, c: 2}], direction: 'LEFT', color: '#f59e0b', active: true, cleared: false }
    ]
  },
  {
    id: 8,
    gridSize: { rows: 5, cols: 5 },
    arrows: [
      { id: '1', cells: [{r: 1, c: 1}, {r: 2, c: 1}, {r: 3, c: 1}], direction: 'DOWN', color: '#ef4444', active: true, cleared: false },
      { id: '2', cells: [{r: 3, c: 0}, {r: 4, c: 0}, {r: 4, c: 1}], direction: 'RIGHT', color: '#f97316', active: true, cleared: false },
      { id: '3', cells: [{r: 0, c: 0}, {r: 1, c: 0}, {r: 2, c: 0}], direction: 'DOWN', color: '#f59e0b', active: true, cleared: false }
    ]
  },
  {
    id: 9,
    gridSize: { rows: 5, cols: 5 },
    arrows: [
      { id: '1', cells: [{r: 3, c: 1}, {r: 2, c: 1}], direction: 'UP', color: '#8b5cf6', active: true, cleared: false },
      { id: '2', cells: [{r: 1, c: 0}, {r: 0, c: 0}], direction: 'UP', color: '#f59e0b', active: true, cleared: false },
      { id: '3', cells: [{r: 0, c: 3}, {r: 0, c: 2}, {r: 0, c: 1}], direction: 'LEFT', color: '#f97316', active: true, cleared: false },
      { id: '4', cells: [{r: 1, c: 2}, {r: 1, c: 1}], direction: 'LEFT', color: '#ef4444', active: true, cleared: false }
    ]
  },
  // Animal level: Fish
  {
    id: 10,
    gridSize: { rows: 5, cols: 8 },
    arrows: [
      { id: '1', cells: [{r: 4, c: 2}, {r: 3, c: 2}, {r: 3, c: 1}], direction: 'LEFT', color: '#06b6d4', active: true, cleared: false },
      { id: '2', cells: [{r: 3, c: 7}, {r: 2, c: 7}, {r: 1, c: 7}], direction: 'UP', color: '#f97316', active: true, cleared: false },
      { id: '3', cells: [{r: 1, c: 3}, {r: 1, c: 4}, {r: 1, c: 5}], direction: 'RIGHT', color: '#3b82f6', active: true, cleared: false },
      { id: '4', cells: [{r: 0, c: 2}, {r: 0, c: 3}, {r: 0, c: 4}], direction: 'RIGHT', color: '#06b6d4', active: true, cleared: false },
      { id: '5', cells: [{r: 3, c: 4}, {r: 3, c: 5}], direction: 'RIGHT', color: '#f97316', active: true, cleared: false },
      { id: '6', cells: [{r: 4, c: 4}, {r: 4, c: 3}], direction: 'LEFT', color: '#3b82f6', active: true, cleared: false },
      { id: '7', cells: [{r: 1, c: 1}, {r: 1, c: 2}], direction: 'RIGHT', color: '#fbbf24', active: true, cleared: false },
      { id: '8', cells: [{r: 2, c: 0}, {r: 2, c: 1}], direction: 'RIGHT', color: '#f97316', active: true, cleared: false },
      { id: '9', cells: [{r: 2, c: 5}, {r: 2, c: 6}], direction: 'RIGHT', color: '#06b6d4', active: true, cleared: false },
      { id: '10', cells: [{r: 3, c: 3}, {r: 2, c: 3}, {r: 2, c: 4}], direction: 'RIGHT', color: '#fbbf24', active: true, cleared: false }
    ]
  }
];
