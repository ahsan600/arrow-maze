import { getLevel, validate, tierOf, TIERS } from './src/game/levels';

const testLevels = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 25, 50, 100, 250, 500, 1000, 10000];

console.log('Comprehensive Arrow Maze Verification:\n');
console.log('Lvl    | Tier           | Grid   | Arrows | Occupancy | Depth | Free | Solvable? | Time');
console.log('-------+----------------+--------+--------+-----------+-------+------+-----------+------');

for (const id of testLevels) {
  const t0 = Date.now();
  const level = getLevel(id);
  const v = validate({ rows: level.gridSize.rows, cols: level.gridSize.cols, arrows: level.arrows });
  const t1 = Date.now();
  const totalCells = level.gridSize.rows * level.gridSize.cols;
  const occupied = level.arrows.reduce((sum, a) => sum + a.cells.length, 0);
  const occupancy = ((occupied / totalCells) * 100).toFixed(1);

  console.log(
    `${String(id).padStart(6)} | ` +
    `${TIERS[tierOf(id)].padEnd(14)} | ` +
    `${String(level.gridSize.rows + 'x' + level.gridSize.cols).padEnd(6)} | ` +
    `${String(level.arrows.length).padStart(6)} | ` +
    `${occupancy.padStart(8)}% | ` +
    `${String(v.metrics?.depth || 0).padStart(5)} | ` +
    `${String(v.metrics?.free0 || 0).padStart(4)} | ` +
    `${(v.ok ? '    YES    ' : '    FAIL   ')} | ` +
    `${(t1 - t0).toFixed(0).padStart(4)}ms`
  );
}
