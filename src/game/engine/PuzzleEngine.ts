import { Arrow, Direction } from '../../types/game.types';

export interface PuzzleState {
  gridSize: { rows: number; cols: number };
  arrows: Arrow[];
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const DELTA: Record<Direction, readonly [number, number]> = {
  UP: [-1, 0],
  DOWN: [1, 0],
  LEFT: [0, -1],
  RIGHT: [0, 1],
};

const NO_ARROWS: ReadonlySet<string> = new Set();

/** An arrow still on the board. */
const isLive = (a: Arrow): boolean => a.active && !a.cleared;

/** Outside the grid by more than one cell (the "fully left the screen" margin). */
const isOffBoard = (
  r: number,
  c: number,
  rows: number,
  cols: number,
): boolean => r < -1 || r >= rows + 1 || c < -1 || c >= cols + 1;

/** Numeric cell key (no string allocation); safe for negative off-board coords. */
const cellKey = (r: number, c: number): number =>
  (r + 32768) * 65536 + (c + 32768);

/**
 * One flat occupancy grid: cell -> index of the live arrow standing there (-1 = empty).
 * Built once per query batch instead of one Map<string,string> per arrow.
 */
function buildOccupancy(
  state: PuzzleState,
  moving: ReadonlySet<string> = NO_ARROWS,
): Int16Array {
  const { rows, cols } = state.gridSize;
  const grid = new Int16Array(rows * cols).fill(-1);
  const arrows = state.arrows;
  for (let i = 0; i < arrows.length; i++) {
    const a = arrows[i];
    if (!isLive(a)) continue;
    for (const { r, c } of a.cells) {
      if (r >= 0 && r < rows && c >= 0 && c < cols) grid[r * cols + c] = i;
    }
  }
  // An arrow that is already flying "owns" the lane in front of its head until it is gone,
  // so nobody else may start a move that would cross it.
  if (moving.size > 0) {
    for (let i = 0; i < arrows.length; i++) {
      const a = arrows[i];
      if (!isLive(a) || !moving.has(a.id)) continue;
      const head = a.cells[a.cells.length - 1];
      const [dr, dc] = DELTA[a.direction];
      let r = head.r + dr;
      let c = head.c + dc;
      while (r >= 0 && r < rows && c >= 0 && c < cols) {
        if (grid[r * cols + c] < 0) grid[r * cols + c] = i;
        r += dr;
        c += dc;
      }
    }
  }
  return grid;
}

function findBlocker(
  state: PuzzleState,
  grid: Int16Array,
  index: number,
  movingArrowIds: ReadonlySet<string>,
): number {
  const { rows, cols } = state.gridSize;
  const a = state.arrows[index];
  const head = a.cells[a.cells.length - 1]; // head is ALWAYS the last cell (same as stepArrow)
  const [dr, dc] = DELTA[a.direction];
  let r = head.r + dr;
  let c = head.c + dc;
  while (r >= 0 && r < rows && c >= 0 && c < cols) {
    const owner = grid[r * cols + c];
    if (owner >= 0 && owner !== index) {
      const blocker = state.arrows[owner];
      if (movingArrowIds.has(blocker.id) && blocker.direction === a.direction) {
        // Ignored: flying away from us in the exact same direction, so we can never catch it
      } else {
        return owner;
      }
    }
    r += dr;
    c += dc;
  }
  return -1;
}

const liveIndex = (state: PuzzleState, arrowId: string): number =>
  state.arrows.findIndex(a => a.id === arrowId && isLive(a));

/* ------------------------------------------------------------------ */
/* Public API (same names / signatures as before)                      */
/* ------------------------------------------------------------------ */

export function getBlockingArrow(
  state: PuzzleState,
  arrowId: string,
  movingArrowIds: ReadonlySet<string> = NO_ARROWS,
): string | null {
  const idx = liveIndex(state, arrowId);
  if (idx < 0) return null;
  const blocker = findBlocker(
    state,
    buildOccupancy(state, movingArrowIds),
    idx,
    movingArrowIds,
  );
  return blocker < 0 ? null : state.arrows[blocker].id;
}

export function canArrowExit(state: PuzzleState, arrowId: string): boolean {
  const idx = liveIndex(state, arrowId);
  // Missing / cleared arrows can't "exit" (previously they returned true).
  return idx >= 0 && findBlocker(state, buildOccupancy(state), idx, NO_ARROWS) < 0;
}

/**
 * THE tap check. Call it once when the player taps an arrow.
 *  - true  -> the whole flight is clear (other arrows' cells AND the lanes of arrows already flying):
 *             commit the move; it must never be cancelled or rolled back afterwards.
 *  - false -> reject the tap (shake / ignore) and DO NOT TOUCH any state: arrows that are
 *             already moving are completely unrelated to a rejected tap.
 */
export function canStartArrow(
  state: PuzzleState,
  arrowId: string,
  movingArrowIds: ReadonlySet<string> = NO_ARROWS,
): boolean {
  if (movingArrowIds.has(arrowId)) return false; // already flying
  const idx = liveIndex(state, arrowId);
  return (
    idx >= 0 &&
    findBlocker(state, buildOccupancy(state, movingArrowIds), idx, movingArrowIds) < 0
  );
}

/** All arrows that can be tapped right now. One grid build for the whole batch: O(cells + arrows * ray). */
export function getAvailableMoves(
  state: PuzzleState,
  movingArrowIds: ReadonlySet<string> = NO_ARROWS,
): string[] {
  const grid = buildOccupancy(state, movingArrowIds);
  const moves: string[] = [];
  for (let i = 0; i < state.arrows.length; i++) {
    const a = state.arrows[i];
    if (
      isLive(a) &&
      !movingArrowIds.has(a.id) &&
      findBlocker(state, grid, i, movingArrowIds) < 0
    )
      moves.push(a.id);
  }
  return moves;
}

/**
 * Can arrow `arrowId` advance one cell without colliding?
 * Tails (index 0) of arrows in `movingArrowIds` are ignored: they're being vacated this step.
 * NOTE: once canStartArrow() has accepted a tap, do NOT use this to cancel or roll back the flight;
 * the lane was reserved, so the flight cannot collide.
 * The old `visited` parameter was dead code (a fresh Set per call) and is gone.
 */
export function canStepArrow(
  state: PuzzleState,
  arrowId: string,
  movingArrowIds: ReadonlySet<string> = NO_ARROWS,
): boolean {
  const arrow = state.arrows.find(a => a.id === arrowId);
  if (!arrow || !isLive(arrow)) return false;

  const head = arrow.cells[arrow.cells.length - 1];
  const [dr, dc] = DELTA[arrow.direction];
  const nr = head.r + dr;
  const nc = head.c + dc;

  for (const other of state.arrows) {
    if (other.id === arrowId || !isLive(other)) continue;
    const cells = other.cells;
    for (let i = movingArrowIds.has(other.id) ? 1 : 0; i < cells.length; i++) {
      if (cells[i].r === nr && cells[i].c === nc) return false;
    }
  }
  return true;
}

export function stepArrow(state: PuzzleState, arrowId: string): PuzzleState {
  const idx = state.arrows.findIndex(a => a.id === arrowId);
  if (idx < 0) return state;
  const arrow = state.arrows[idx];
  if (!isLive(arrow)) return state;

  const { rows, cols } = state.gridSize;
  const head = arrow.cells[arrow.cells.length - 1];
  const [dr, dc] = DELTA[arrow.direction];

  // Snake movement: drop the tail, add one cell in front of the head.
  const n = arrow.cells.length;
  const newCells = new Array(n);
  for (let i = 1; i < n; i++) newCells[i - 1] = arrow.cells[i];
  newCells[n - 1] = { r: head.r + dr, c: head.c + dc };

  // Cleared only once EVERY cell is more than one cell outside the board.
  const cleared = newCells.every(p => isOffBoard(p.r, p.c, rows, cols));

  const arrows = state.arrows.slice(); // only one object replaced; the rest are shared
  arrows[idx] = { ...arrow, cells: newCells, cleared, active: !cleared };
  return { ...state, arrows };
}

export function isLevelComplete(state: PuzzleState): boolean {
  return state.arrows.every(a => a.cleared || !a.active);
}

/**
 * Whole flight path (current cells + every head position until it is blocked or gone).
 * Old version cloned the full state and rescanned every arrow on every step;
 * this one builds a flat occupancy grid once and walks the head in a tight loop.
 */
export function computeArrowFullPath(
  state: PuzzleState,
  arrowId: string,
  movingArrowIds: ReadonlySet<string> = NO_ARROWS,
): { r: number; c: number }[] {
  const arrow = state.arrows.find(a => a.id === arrowId);
  if (!arrow) return [];

  const path = arrow.cells.slice();
  if (!isLive(arrow)) return path;

  const { rows, cols } = state.gridSize;
  const n = arrow.cells.length;

  // In-board cells go in a flat grid; the rare off-board cells (arrows mid-exit) go in a tiny Set.
  const inBoard = new Uint8Array(rows * cols);
  const outside = new Set<number>();
  for (const other of state.arrows) {
    if (other.id === arrowId || !isLive(other)) continue;
    // Ignore flying arrows moving in the exact same direction; we will safely follow them out.
    if (movingArrowIds.has(other.id) && other.direction === arrow.direction) continue;

    for (
      let i = movingArrowIds.has(other.id) ? 1 : 0;
      i < other.cells.length;
      i++
    ) {
      const { r, c } = other.cells[i];
      if (r >= 0 && r < rows && c >= 0 && c < cols) inBoard[r * cols + c] = 1;
      else outside.add(cellKey(r, c));
    }
  }
  const isBlocked = (r: number, c: number): boolean =>
    r >= 0 && r < rows && c >= 0 && c < cols
      ? inBoard[r * cols + c] === 1
      : outside.size > 0 && outside.has(cellKey(r, c));

  // Number of off-board cells inside the arrow's current n-cell window.
  let offInWindow = 0;
  for (const p of arrow.cells)
    if (isOffBoard(p.r, p.c, rows, cols)) offInWindow++;

  const [dr, dc] = DELTA[arrow.direction];
  let r = arrow.cells[n - 1].r;
  let c = arrow.cells[n - 1].c;
  const maxSteps = rows + cols + 2 * n + 4; // safety net, never reached in practice

  for (let step = 0; step < maxSteps; step++) {
    r += dr;
    c += dc;
    if (isBlocked(r, c)) break;

    const leaving = path[path.length - n]; // cell that slides out of the window
    path.push({ r, c });
    if (isOffBoard(r, c, rows, cols)) offInWindow++;
    if (isOffBoard(leaving.r, leaving.c, rows, cols)) offInWindow--;
    if (offInWindow === n) break; // arrow fully cleared the board
  }
  return path;
}

/**
 * Hint / validator: an order in which every arrow can leave, or null if the board is deadlocked.
 * Greedy is exact here, because removing an arrow can never block another one.
 */
export function getSolutionOrder(state: PuzzleState): string[] | null {
  const arrows = state.arrows;
  const grid = buildOccupancy(state);
  const live = arrows.map(isLive);
  let remaining = live.filter(Boolean).length;
  const order: string[] = [];

  while (remaining > 0) {
    const free: number[] = [];
    for (let i = 0; i < arrows.length; i++)
      if (live[i] && findBlocker(state, grid, i, NO_ARROWS) < 0) free.push(i);
    if (free.length === 0) return null;

    for (const i of free) {
      live[i] = false;
      order.push(arrows[i].id);
      for (const { r, c } of arrows[i].cells) {
        const k = r * state.gridSize.cols + c;
        if (
          r >= 0 &&
          r < state.gridSize.rows &&
          c >= 0 &&
          c < state.gridSize.cols &&
          grid[k] === i
        )
          grid[k] = -1;
      }
    }
    remaining -= free.length;
  }
  return order;
}
