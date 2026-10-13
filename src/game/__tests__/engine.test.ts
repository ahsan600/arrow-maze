import { canTileExit, removeTile, findHintableTile, calculateStars } from '../engine';
import { Tile, GridSize, GameState, LevelDefinition } from '../types';

describe('Game Engine', () => {
  describe('canTileExit', () => {
    const gridSize: GridSize = { rows: 5, cols: 5 };

    it('single-cell arrow with clear path', () => {
      const tile: Tile = { id: '1', row: 2, col: 2, span: 1, direction: 'UP' };
      const allTiles = [tile];
      expect(canTileExit(tile, allTiles, gridSize)).toBe(true);
    });

    it('single-cell arrow with blocked path', () => {
      const tile: Tile = { id: '1', row: 2, col: 2, span: 1, direction: 'UP' };
      const blocker: Tile = { id: '2', row: 1, col: 2, span: 1, direction: 'LEFT' };
      expect(canTileExit(tile, [tile, blocker], gridSize)).toBe(false);
    });

    it('multi-cell arrow clear path', () => {
      const tile: Tile = { id: '1', row: 2, col: 2, span: 2, direction: 'RIGHT' };
      // Occupies (2,2) and (2,3)
      expect(canTileExit(tile, [tile], gridSize)).toBe(true);
    });

    it('multi-cell arrow blocked path', () => {
      const tile: Tile = { id: '1', row: 2, col: 2, span: 2, direction: 'RIGHT' };
      // Occupies (2,2) and (2,3). Leading edge is col 3. Blocked if something is at (2,4)
      const blocker: Tile = { id: '2', row: 2, col: 4, span: 1, direction: 'UP' };
      expect(canTileExit(tile, [tile, blocker], gridSize)).toBe(false);
    });

    it('arrow already at the edge (clear)', () => {
      const tile: Tile = { id: '1', row: 0, col: 0, span: 1, direction: 'UP' };
      expect(canTileExit(tile, [tile], gridSize)).toBe(true);
      
      const rightTile: Tile = { id: '2', row: 4, col: 4, span: 1, direction: 'RIGHT' };
      expect(canTileExit(rightTile, [rightTile], gridSize)).toBe(true);
    });

    it('blocked by a multi-cell tile', () => {
      const tile: Tile = { id: '1', row: 3, col: 2, span: 1, direction: 'UP' };
      // blocker spans (1,0) to (1,4) - a long horizontal blocker
      const blocker: Tile = { id: '2', row: 1, col: 0, span: 5, direction: 'RIGHT' };
      expect(canTileExit(tile, [tile, blocker], gridSize)).toBe(false);
    });

    it('edge-of-grid boundary cases in all four directions', () => {
      const tUp: Tile = { id: 'u', row: 0, col: 2, span: 1, direction: 'UP' };
      const tDown: Tile = { id: 'd', row: 4, col: 2, span: 1, direction: 'DOWN' };
      const tLeft: Tile = { id: 'l', row: 2, col: 0, span: 1, direction: 'LEFT' };
      const tRight: Tile = { id: 'r', row: 2, col: 4, span: 1, direction: 'RIGHT' };
      
      const allTiles = [tUp, tDown, tLeft, tRight];
      
      expect(canTileExit(tUp, allTiles, gridSize)).toBe(true);
      expect(canTileExit(tDown, allTiles, gridSize)).toBe(true);
      expect(canTileExit(tLeft, allTiles, gridSize)).toBe(true);
      expect(canTileExit(tRight, allTiles, gridSize)).toBe(true);
    });
  });

  describe('removeTile', () => {
    const gridSize: GridSize = { rows: 5, cols: 5 };
    
    it('successfully removes a clear tile and checks win condition', () => {
      const tile: Tile = { id: '1', row: 0, col: 0, span: 1, direction: 'UP' };
      const state: GameState = { tiles: [tile], remainingHearts: 3, hintsUsed: 0, status: 'PLAYING' };
      
      const { newState, action } = removeTile(state, '1', gridSize);
      expect(action).toBe('success');
      expect(newState.tiles.length).toBe(0);
      expect(newState.status).toBe('WON');
    });

    it('decrements a heart when path is blocked', () => {
      const tile: Tile = { id: '1', row: 1, col: 0, span: 1, direction: 'UP' };
      const blocker: Tile = { id: '2', row: 0, col: 0, span: 1, direction: 'UP' };
      const state: GameState = { tiles: [tile, blocker], remainingHearts: 3, hintsUsed: 0, status: 'PLAYING' };
      
      const { newState, action } = removeTile(state, '1', gridSize);
      expect(action).toBe('blocked');
      expect(newState.tiles.length).toBe(2);
      expect(newState.remainingHearts).toBe(2);
      expect(newState.status).toBe('PLAYING');
    });

    it('triggers lost status when hearts reach 0', () => {
      const tile: Tile = { id: '1', row: 1, col: 0, span: 1, direction: 'UP' };
      const blocker: Tile = { id: '2', row: 0, col: 0, span: 1, direction: 'UP' };
      const state: GameState = { tiles: [tile, blocker], remainingHearts: 1, hintsUsed: 0, status: 'PLAYING' };
      
      const { newState, action } = removeTile(state, '1', gridSize);
      expect(action).toBe('blocked');
      expect(newState.remainingHearts).toBe(0);
      expect(newState.status).toBe('LOST');
    });
  });

  describe('findHintableTile', () => {
    const gridSize: GridSize = { rows: 5, cols: 5 };

    it('returns a safe tile if one exists', () => {
      const safeTile: Tile = { id: '1', row: 0, col: 0, span: 1, direction: 'UP' };
      const blockedTile: Tile = { id: '2', row: 1, col: 0, span: 1, direction: 'UP' };
      const state: GameState = { tiles: [safeTile, blockedTile], remainingHearts: 3, hintsUsed: 0, status: 'PLAYING' };
      
      const hint = findHintableTile(state, gridSize);
      expect(hint).toEqual(safeTile);
    });

    it('returns null if no safe tile exists', () => {
      const t1: Tile = { id: '1', row: 0, col: 0, span: 1, direction: 'DOWN' };
      const t2: Tile = { id: '2', row: 1, col: 0, span: 1, direction: 'UP' };
      const state: GameState = { tiles: [t1, t2], remainingHearts: 3, hintsUsed: 0, status: 'PLAYING' };
      
      const hint = findHintableTile(state, gridSize);
      expect(hint).toBeNull();
    });
  });

  describe('calculateStars', () => {
    const level: LevelDefinition = {
      id: 1,
      gridSize: { rows: 5, cols: 5 },
      tiles: [],
      maxHearts: 3
    };

    it('returns 3 stars for no hearts lost', () => {
      const state: GameState = { tiles: [], remainingHearts: 3, hintsUsed: 0, status: 'WON' };
      expect(calculateStars(state, level)).toBe(3);
    });

    it('returns 2 stars for 1 heart lost', () => {
      const state: GameState = { tiles: [], remainingHearts: 2, hintsUsed: 0, status: 'WON' };
      expect(calculateStars(state, level)).toBe(2);
    });

    it('returns 1 star for >1 hearts lost', () => {
      const state: GameState = { tiles: [], remainingHearts: 1, hintsUsed: 0, status: 'WON' };
      expect(calculateStars(state, level)).toBe(1);
    });

    it('returns 0 stars if not won', () => {
      const state: GameState = { tiles: [{ id: '1', row: 0, col: 0, span: 1, direction: 'UP' }], remainingHearts: 3, hintsUsed: 0, status: 'PLAYING' };
      expect(calculateStars(state, level)).toBe(0);
    });
  });
});
