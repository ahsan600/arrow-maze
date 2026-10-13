export interface CellCoord {
  r: number;
  c: number;
}

export interface MazeEdge {
  from: CellCoord;
  to: CellCoord;
  isOneWay?: boolean;
}

export interface MazeLevel {
  gridSize: { rows: number; cols: number };
  start: CellCoord;
  end: CellCoord;
  edges: MazeEdge[];
}

export interface MazeState {
  level: MazeLevel;
  tracedPath: CellCoord[];
}

export const isSameCell = (a: CellCoord, b: CellCoord) =>
  a.r === b.r && a.c === b.c;

/* ------------------------------------------------------------------ */
/* Edge lookup: O(E) scan per move  ->  O(1) Set lookup                */
/* ------------------------------------------------------------------ */

interface CompiledMaze {
  rows: number;
  cols: number;
  total: number;
  edges: Set<number>; // directed edges: from * total + to (two-way edges stored both ways)
}

const compiled = new WeakMap<MazeLevel, CompiledMaze>();

const cellIndex = (m: { rows: number; cols: number }, p: CellCoord): number =>
  p.r >= 0 && p.r < m.rows && p.c >= 0 && p.c < m.cols
    ? p.r * m.cols + p.c
    : -1;

function compile(level: MazeLevel): CompiledMaze {
  let m = compiled.get(level);
  if (m) return m;
  const { rows, cols } = level.gridSize;
  m = { rows, cols, total: rows * cols, edges: new Set<number>() };
  for (const e of level.edges) {
    const a = cellIndex(m, e.from);
    const b = cellIndex(m, e.to);
    if (a < 0 || b < 0) continue;
    m.edges.add(a * m.total + b);
    if (!e.isOneWay) m.edges.add(b * m.total + a);
  }
  compiled.set(level, m);
  return m;
}

/** Call only if you mutate `level.edges` after the level has been played (e.g. a level editor). */
export const invalidateMazeCache = (level: MazeLevel) => {
  compiled.delete(level);
};

export const hasEdge = (
  level: MazeLevel,
  from: CellCoord,
  to: CellCoord,
): boolean => {
  const m = compile(level);
  const a = cellIndex(m, from);
  const b = cellIndex(m, to);
  return a >= 0 && b >= 0 && m.edges.has(a * m.total + b);
};

/* ------------------------------------------------------------------ */
/* Moves                                                               */
/* ------------------------------------------------------------------ */

/** Returns the SAME state object when nothing changes, so React can skip re-rendering. */
export const tryMove = (state: MazeState, nextCell: CellCoord): MazeState => {
  const { tracedPath: path, level } = state;
  const n = path.length;

  if (n === 0) {
    return isSameCell(nextCell, level.start)
      ? { ...state, tracedPath: [nextCell] }
      : state;
  }

  const last = path[n - 1];
  if (isSameCell(nextCell, last)) return state; // pointer still on the same cell (fires constantly while dragging)

  // Moving back onto the previous cell un-traces.
  if (n > 1 && isSameCell(nextCell, path[n - 2])) {
    return { ...state, tracedPath: path.slice(0, -1) };
  }

  // Reached the exit: stop extending (you can still back up).
  if (isSameCell(last, level.end)) return state;

  if (!hasEdge(level, last, nextCell)) return state;

  // No self-crossing.
  for (let i = 0; i < n; i++) if (isSameCell(path[i], nextCell)) return state;

  return { ...state, tracedPath: [...path, nextCell] };
};

export const isMazeComplete = (state: MazeState): boolean => {
  const n = state.tracedPath.length;
  return n > 0 && isSameCell(state.tracedPath[n - 1], state.level.end);
};
