import { level1 } from './src/game/levels/level1';
import { solveLevel } from './src/game/engine/solver';

const state = { gridSize: level1.gridSize, arrows: level1.arrows };
const result = solveLevel(state);

console.log('Solver Result:', result);
if (result) {
  console.log('Sequence length:', result.length);
}
