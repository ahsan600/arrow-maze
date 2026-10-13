const fs = require('fs');
const path = require('path');

function getOccupiedCells(tile) {
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

function intersects(tile, cellsSet) {
  const cells = getOccupiedCells(tile);
  for (const cell of cells) {
    if (cellsSet.has(`${cell.r},${cell.c}`)) return true;
  }
  return false;
}

function isValidPlacement(tile, rows, cols) {
  if (tile.row < 0 || tile.col < 0) return false;
  if (tile.direction === 'UP' || tile.direction === 'DOWN') {
    if (tile.row + tile.span > rows) return false;
    if (tile.col >= cols) return false;
  } else {
    if (tile.col + tile.span > cols) return false;
    if (tile.row >= rows) return false;
  }
  return true;
}

// Generate a random level by reverse-solving:
// Start with empty board, repeatedly "un-slide" a tile from the edge into the board.
function generateLevel(id, rows, cols, numTiles, allowMultiSpan = false) {
  const tiles = [];
  const cellsSet = new Set();
  const dirs = ['UP', 'DOWN', 'LEFT', 'RIGHT'];

  let attempts = 0;
  while (tiles.length < numTiles && attempts < 1000) {
    attempts++;
    const direction = dirs[Math.floor(Math.random() * dirs.length)];
    const span = allowMultiSpan ? Math.floor(Math.random() * 3) + 1 : 1; // 1 to 3
    
    // Pick a destination line (row or col depending on direction)
    // If UP, it came from TOP, so it moves UP to exit. Reverse: it comes from TOP and moves DOWN to its spot.
    // It can stop anywhere as long as the path from 0 to row is clear.
    let r, c;
    if (direction === 'UP') {
      c = Math.floor(Math.random() * cols);
      r = Math.floor(Math.random() * (rows - span + 1));
    } else if (direction === 'DOWN') {
      c = Math.floor(Math.random() * cols);
      r = Math.floor(Math.random() * (rows - span + 1));
    } else if (direction === 'LEFT') {
      r = Math.floor(Math.random() * rows);
      c = Math.floor(Math.random() * (cols - span + 1));
    } else if (direction === 'RIGHT') {
      r = Math.floor(Math.random() * rows);
      c = Math.floor(Math.random() * (cols - span + 1));
    }

    const testTile = { id: `t${tiles.length + 1}`, row: r, col: c, span, direction };
    
    if (!isValidPlacement(testTile, rows, cols)) continue;
    if (intersects(testTile, cellsSet)) continue;

    // Check if the path to the edge is clear (reverse of canTileExit)
    // Wait, since we are building backwards, if the path to the edge is clear right NOW, 
    // it means it could have been the LAST tile to be removed.
    // If we only place tiles where the path is clear, we guarantee solvability.
    let isPathClear = true;
    if (direction === 'UP') {
      for (let i = r - 1; i >= 0; i--) if (cellsSet.has(`${i},${c}`)) isPathClear = false;
    } else if (direction === 'DOWN') {
      const bottomEdge = r + span - 1;
      for (let i = bottomEdge + 1; i < rows; i++) if (cellsSet.has(`${i},${c}`)) isPathClear = false;
    } else if (direction === 'LEFT') {
      for (let i = c - 1; i >= 0; i--) if (cellsSet.has(`${r},${i}`)) isPathClear = false;
    } else if (direction === 'RIGHT') {
      const rightEdge = c + span - 1;
      for (let i = rightEdge + 1; i < cols; i++) if (cellsSet.has(`${r},${i}`)) isPathClear = false;
    }

    if (isPathClear) {
      tiles.push(testTile);
      const cells = getOccupiedCells(testTile);
      for (const cell of cells) cellsSet.add(`${cell.r},${cell.c}`);
    }
  }

  // Shuffle the tiles so their IDs don't perfectly reveal the solution order
  for (let i = tiles.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [tiles[i], tiles[j]] = [tiles[j], tiles[i]];
  }

  // Re-assign IDs
  tiles.forEach((t, i) => { t.id = `tile_${i + 1}`; });

  return {
    id,
    gridSize: { rows, cols },
    tiles,
    maxHearts: 3
  };
}

const levels = [];
for (let i = 1; i <= 100; i++) {
  let rows, cols, numTiles, allowMultiSpan;
  if (i <= 10) {
    rows = 4; cols = 4; numTiles = 4 + Math.floor(i / 2); allowMultiSpan = false;
  } else if (i <= 30) {
    rows = 5; cols = 5; numTiles = 8 + Math.floor((i - 10) / 2); allowMultiSpan = true;
  } else if (i <= 60) {
    rows = 6; cols = 6; numTiles = 15 + Math.floor((i - 30) / 2); allowMultiSpan = true;
  } else if (i <= 90) {
    rows = 7; cols = 7; numTiles = 25 + Math.floor((i - 60) / 2); allowMultiSpan = true;
  } else {
    rows = 8; cols = 8; numTiles = 40 + Math.floor((i - 90)); allowMultiSpan = true;
  }
  
  // limit numTiles to board area
  numTiles = Math.min(numTiles, Math.floor(rows * cols * 0.8));

  const level = generateLevel(i.toString(), rows, cols, numTiles, allowMultiSpan);
  levels.push(level);
}

const fileContent = `import { LevelDefinition } from '../types';

export const LEVELS: LevelDefinition[] = ${JSON.stringify(levels, null, 2)};
`;

fs.writeFileSync(path.join(__dirname, 'index.ts'), fileContent);
console.log('Successfully generated 100 levels!');
