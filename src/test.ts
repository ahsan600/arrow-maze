import { allLevels } from '../src/game/levels';
import { getSolutionOrder } from '../src/game/engine/PuzzleEngine';

const levelDef = allLevels.find(l => l.id === 7);
console.log("Level 7 arrows:", JSON.stringify(levelDef?.arrows));

// simulate normalization from GameScreen
const arrows = levelDef!.arrows.map(a => {
  let newCells = [...a.cells.map(c => ({...c}))];
  if (newCells.length === 1) {
    const head = newCells[0];
    let tail = { ...head };
    if (a.direction === 'UP') tail.r += 1;
    else if (a.direction === 'DOWN') tail.r -= 1;
    else if (a.direction === 'LEFT') tail.c += 1;
    else if (a.direction === 'RIGHT') tail.c -= 1;
    newCells = [tail, head];
  }
  return { ...a, cells: newCells };
});
let minR = Infinity, maxR = -Infinity;
let minC = Infinity, maxC = -Infinity;
arrows.forEach(a => {
  a.cells.forEach(c => {
    if (c.r < minR) minR = c.r;
    if (c.r > maxR) maxR = c.r;
    if (c.c < minC) minC = c.c;
    if (c.c > maxC) maxC = c.c;
  });
});
if (minR === Infinity) { minR = 0; maxR = 3; minC = 0; maxC = 3; }
const normalizedArrows = arrows.map(a => ({
  ...a,
  cells: a.cells.map(c => ({
    r: c.r - minR,
    c: c.c - minC
  }))
}));
const state: any = {
  gridSize: { rows: maxR - minR + 1, cols: maxC - minC + 1 },
  arrows: normalizedArrows
};
console.log("State:", JSON.stringify(state));
console.log("Order:", getSolutionOrder(state));
