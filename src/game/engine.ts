import { Tile, GridSize, Direction, GameState, LevelDefinition } from './types';

// Helper to get all cells occupied by a tile
export function getOccupiedCells(tile: Tile): { r: number; c: number }[] {
  const cells = [];
  if (tile.direction === 'UP' || tile.direction === 'DOWN') {
    for (let i = 0; i < tile.span; i++) {
      cells.push({ r: tile.row + i, c: tile.col });
    }
  } else {
    for (let i = 0; i < tile.span; i++) {
      cells.push({ r: tile.row, c: tile.col + i });
    }
  }
  return cells;
}

export function canTileExit(tile: Tile, allTiles: Tile[], gridSize: GridSize): boolean {
  // A cell is blocked if it's occupied by any OTHER tile
  const occupiedByOthers = new Set<string>();
  for (const t of allTiles) {
    if (t.id === tile.id) continue;
    const cells = getOccupiedCells(t);
    for (const cell of cells) {
      occupiedByOthers.add(`${cell.r},${cell.c}`);
    }
  }

  // Check path from the tile's leading edge to the board edge
  if (tile.direction === 'UP') {
    for (let r = tile.row - 1; r >= 0; r--) {
      if (occupiedByOthers.has(`${r},${tile.col}`)) return false;
    }
  } else if (tile.direction === 'DOWN') {
    const bottomEdge = tile.row + tile.span - 1;
    for (let r = bottomEdge + 1; r < gridSize.rows; r++) {
      if (occupiedByOthers.has(`${r},${tile.col}`)) return false;
    }
  } else if (tile.direction === 'LEFT') {
    for (let c = tile.col - 1; c >= 0; c--) {
      if (occupiedByOthers.has(`${tile.row},${c}`)) return false;
    }
  } else if (tile.direction === 'RIGHT') {
    const rightEdge = tile.col + tile.span - 1;
    for (let c = rightEdge + 1; c < gridSize.cols; c++) {
      if (occupiedByOthers.has(`${tile.row},${c}`)) return false;
    }
  }

  return true;
}

export function removeTile(state: GameState, tileId: string, gridSize: GridSize): { newState: GameState; action: 'success' | 'blocked' } {
  const tileIndex = state.tiles.findIndex(t => t.id === tileId);
  if (tileIndex === -1) return { newState: state, action: 'blocked' };
  
  const tile = state.tiles[tileIndex];
  
  if (canTileExit(tile, state.tiles, gridSize)) {
    const newTiles = [...state.tiles];
    newTiles.splice(tileIndex, 1);
    
    let newStatus = state.status;
    if (newTiles.length === 0) {
      newStatus = 'WON';
    }
    
    return {
      newState: {
        ...state,
        tiles: newTiles,
        status: newStatus,
      },
      action: 'success'
    };
  } else {
    const newHearts = Math.max(0, state.remainingHearts - 1);
    let newStatus = state.status;
    if (newHearts === 0) {
      newStatus = 'LOST';
    }
    
    return {
      newState: {
        ...state,
        remainingHearts: newHearts,
        status: newStatus,
      },
      action: 'blocked'
    };
  }
}

export function findHintableTile(state: GameState, gridSize: GridSize): Tile | null {
  for (const tile of state.tiles) {
    if (canTileExit(tile, state.tiles, gridSize)) {
      return tile;
    }
  }
  return null;
}

export function isLevelWon(state: GameState): boolean {
  return state.status === 'WON' || state.tiles.length === 0;
}

export function isLevelLost(state: GameState): boolean {
  return state.status === 'LOST' || (state.remainingHearts <= 0 && state.tiles.length > 0);
}

export function calculateStars(state: GameState, level: LevelDefinition): 0 | 1 | 2 | 3 {
  if (!isLevelWon(state)) return 0;
  
  const heartsLost = level.maxHearts - state.remainingHearts;
  
  if (heartsLost === 0) return 3;
  if (heartsLost === 1) return 2;
  return 1;
}
