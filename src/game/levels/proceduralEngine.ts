// Arrow Puzzle engine: deterministic procedural levels, solver, validator, game rules, level manager.
// Rules: an arrow is a path of cells; the LAST cell is the head and the
// direction is the direction of the last segment. Tapping an arrow slides it out along the straight ray
// from its head to the board edge. If any other arrow occupies a cell on that ray, it is blocked.
// Rays never change until something is removed => a level is solvable iff the blocking graph is acyclic.

import { Level, Arrow, Direction, Cell, GridSize } from '../../types/game.types';
import encodedLevelsData from './levels_10000.json';

export const VERSION = 1;
export const TOTAL_STORED_LEVELS = (encodedLevelsData as string[]).length;

const D: Record<Direction, [number, number]> = {
  UP: [-1, 0],
  DOWN: [1, 0],
  LEFT: [0, -1],
  RIGHT: [0, 1],
};
const NAMES = Object.keys(D) as Direction[];
const dirName = (dr: number, dc: number): Direction =>
  dr < 0 ? 'UP' : dr > 0 ? 'DOWN' : dc < 0 ? 'LEFT' : 'RIGHT';

export const PALETTE = [
  '#f59e0b',
  '#f97316',
  '#3b82f6',
  '#ef4444',
  '#8b5cf6',
  '#ec4899',
  '#14b8a6',
  '#10b981',
  '#06b6d4',
  '#fbbf24',
];

// ---------- deterministic RNG ----------
export function h32(...xs: (string | number)[]): number {
  let h = 2166136261 >>> 0;
  for (const x of xs) {
    const s = String(x);
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    h ^= 0x9e37;
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function rng(a: number): () => number {
  let seed = a | 0;
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const shuffle = <T>(arr: T[], r: () => number): T[] => {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

// ---------- shape library (data driven: add entries to extend) ----------
export const GEO: Record<
  string,
  { f: (x: number, y: number) => number | boolean; fr: number; asp?: number }
> = {
  square: { f: () => 1, fr: 1 },
  rectangle: { f: () => 1, fr: 1, asp: 1.6 },
  circle: { f: (x, y) => x * x + y * y <= 1, fr: 0.785 },
  ring: {
    f: (x, y) => {
      const r = x * x + y * y;
      return r <= 1 && r >= 0.22;
    },
    fr: 0.6,
  },
  triangle: { f: (x, y) => Math.abs(x) <= (y + 1) / 2, fr: 0.5 },
  diamond: { f: (x, y) => Math.abs(x) + Math.abs(y) <= 1, fr: 0.5 },
  hexagon: {
    f: (x, y) =>
      Math.abs(y) <= 0.87 && Math.abs(x) * 0.87 + Math.abs(y) * 0.5 <= 0.87,
    fr: 0.75,
  },
  star: {
    f: (x, y) => {
      const a = Math.atan2(y, x) + Math.PI / 2,
        t = (((a * 5) / (2 * Math.PI)) % 1 + 1) % 1;
      return Math.hypot(x, y) <= 0.38 + 0.62 * Math.abs(t - 0.5) * 2;
    },
    fr: 0.4,
  },
  spiral: {
    f: (x, y) => {
      const r = Math.hypot(x, y),
        t = (((r * 2.4 - Math.atan2(y, x) / (2 * Math.PI)) % 1 + 1) % 1);
      return r <= 1 && t < 0.58;
    },
    fr: 0.45,
  },
  cross: { f: (x, y) => Math.abs(x) < 0.36 || Math.abs(y) < 0.36, fr: 0.6 },
  heart: {
    f: (x, y) => {
      const X = x * 1.15,
        Y = -y * 1.15 + 0.15;
      return (X * X + Y * Y - 1) ** 3 - X * X * Y ** 3 <= 0;
    },
    fr: 0.6,
  },
  moon: {
    f: (x, y) => x * x + y * y <= 1 && (x - 0.45) ** 2 + y * y > 0.55,
    fr: 0.45,
  },
};

// '#' = filled. Starter silhouettes; scaled 1x-4x with nearest neighbour so outlines stay recognisable.
export const ART: Record<string, string[]> = {
  cat: [
    '##.......##',
    '###.....###',
    '###########',
    '###########',
    '##.#####.##',
    '###########',
    '###########',
    '.#########.',
    '..#######..',
  ],
  fish: [
    '...####......',
    '.########..#.',
    '##.##########',
    '.########..#.',
    '...####......',
  ],
  rabbit: [
    '.##...##.',
    '.##...##.',
    '.##...##.',
    '.#######.',
    '#########',
    '##.###.##',
    '#########',
    '.#######.',
    '..#####..',
  ],
  tree: [
    '....#....',
    '...###...',
    '..#####..',
    '...###...',
    '..#####..',
    '.#######.',
    '#########',
    '...###...',
    '...###...',
  ],
  house: [
    '....##....',
    '...####...',
    '..######..',
    '.########.',
    '##########',
    '##.####.##',
    '##.####.##',
    '##########',
    '####..####',
    '####..####',
  ],
  rocket: [
    '...#...',
    '..###..',
    '..###..',
    '.#####.',
    '.#####.',
    '.##.##.',
    '.#####.',
    '#######',
    '##.#.##',
    '#..#..#',
  ],
  butterfly: [
    '##.......##',
    '####.#.####',
    '#####.#####',
    '.####.####.',
    '#####.#####',
    '.###...###.',
    '..#.....#..',
  ],
  turtle: [
    '....###....',
    '.#########.',
    '###########',
    '###.###.###',
    '###########',
    '.#########.',
    '##.......##',
  ],
  castle: [
    '##.##.##.##',
    '###########',
    '.#########.',
    '.#########.',
    '.####.####.',
    '.###...###.',
    '.###...###.',
  ],
  car: [
    '...#####...',
    '..#######..',
    '###########',
    '###########',
    '.##.....##.',
  ],
  ship: [
    '.....#.....',
    '....###....',
    '...#####...',
    '..#######..',
    '.....#.....',
    '###########',
    '.#########.',
    '..#######..',
  ],
};

const artMask = (rows: string[]): number[][] =>
  rows.map(s => [...s].map(ch => (ch === '#' ? 1 : 0)));
const raster = (
  f: (x: number, y: number) => number | boolean,
  R: number,
  C: number,
): number[][] =>
  Array.from({ length: R }, (_, r) =>
    Array.from({ length: C }, (_, c) =>
      f(((c + 0.5) / C) * 2 - 1, ((r + 0.5) / R) * 2 - 1) ? 1 : 0,
    ),
  );
const scaleMask = (m: number[][], k: number): number[][] =>
  m.flatMap(row => Array(k).fill(row.flatMap(v => Array(k).fill(v))));
const mirrorMask = (m: number[][]): number[][] =>
  m.map(r => [...r].reverse());
const rotMask = (m: number[][]): number[][] =>
  m[0].map((_, c) => m.map(r => r[c]).reverse());

function mazeMask(R: number, C: number, r: () => number): number[][] {
  const m = Array.from({ length: R }, () => Array(C).fill(0)),
    st: [number, number][] = [[1, 1]];
  m[1][1] = 1;
  while (st.length) {
    const [y, x] = st[st.length - 1],
      nb = shuffle(
        [
          [-2, 0],
          [2, 0],
          [0, -2],
          [0, 2],
        ],
        r,
      ).filter(
        ([a, b]) =>
          y + a > 0 &&
          y + a < R - 1 &&
          x + b > 0 &&
          x + b < C - 1 &&
          !m[y + a][x + b],
      );
    if (!nb.length) {
      st.pop();
      continue;
    }
    const [a, b] = nb[0];
    m[y + a / 2][x + b / 2] = 1;
    m[y + a][x + b] = 1;
    st.push([y + a, x + b]);
  }
  return m;
}

function blobMask(S: number, r: () => number): number[][] {
  let m = Array.from({ length: S }, () => {
    const h = Array.from({ length: Math.ceil(S / 2) }, () =>
      r() < 0.58 ? 1 : 0,
    );
    return [...h, ...[...h].reverse().slice(S % 2)];
  });
  for (let p = 0; p < 2; p++)
    m = m.map((row, y) =>
      row.map((_, x) => {
        let s = 0;
        for (let a = -1; a <= 1; a++)
          for (let b = -1; b <= 1; b++) s += (m[y + a] || [])[x + b] || 0;
        return s >= 5 ? 1 : 0;
      }),
    );
  return m;
}

export const SHAPE_NAMES = [
  ...Object.keys(GEO),
  ...Object.keys(ART),
  'maze',
  'blob',
];
const INTRO = [
  'square',
  'rectangle',
  'diamond',
  'triangle',
  'circle',
  'cross',
  'hexagon',
];
const count = (m: number[][]) =>
  m.reduce((s, r) => s + r.reduce((a, b) => a + b, 0), 0);

function makeMask(
  name: string,
  C: number,
  r: () => number,
): number[][] | null {
  let m: number[][] | null = null,
    art = false;
  if (GEO[name]) {
    const g = GEO[name],
      asp = g.asp || [1, 1.25, 0.8][Math.floor(r() * 3)];
    const R = Math.max(3, Math.round(Math.sqrt(C / g.fr / asp)));
    m = raster(g.f, R, Math.max(3, Math.round(R * asp)));
  } else if (ART[name]) {
    art = true;
    const base = artMask(ART[name]);
    const k = Math.min(
      4,
      Math.max(1, Math.round(Math.sqrt(C / count(base)))),
    );
    if (k === 1 && count(base) > C * 2.5) return null;
    m = scaleMask(base, k);
  } else if (name === 'maze') {
    const a = Math.max(2, Math.round(Math.sqrt(C / 0.55) / 2));
    m = mazeMask(
      2 * a + 1,
      2 * Math.max(2, Math.round(a * (0.8 + r() * 0.5))) + 1,
      r,
    );
  } else {
    m = blobMask(Math.max(4, Math.round(Math.sqrt(C / 0.55))), r);
  }
  if (!m) return null;
  if (r() < 0.5) m = mirrorMask(m);
  if (!art && r() < 0.5) m = rotMask(m);
  return m;
}

// ---------- difficulty schedule ----------
export const STAGES: [number, string][] = [
  [100, 'Beginner'],
  [500, 'Easy-Medium'],
  [1500, 'Medium'],
  [3000, 'Hard'],
  [5000, 'Very Hard'],
  [7500, 'Expert'],
  [9000, 'Extreme'],
  [10000, 'Master'],
];
export const TIERS = ['Easy', 'Hard', 'Very Hard', 'Brutal'];
const PATTERNS = [
  [0, 0, 0, 1, 0, 0, 1, 0, 0, 2],
  [0, 0, 1, 0, 0, 1, 0, 0, 1, 2],
  [0, 1, 0, 0, 1, 0, 0, 1, 0, 2],
  [0, 0, 1, 0, 0, 0, 1, 0, 1, 2],
  [0, 1, 0, 0, 0, 1, 0, 1, 0, 3],
  [0, 0, 0, 1, 0, 0, 2, 0, 1, 2],
];

export function tierOf(n: number): number {
  if (n <= 10) return PATTERNS[0][n - 1];
  const b = Math.floor((n - 1) / 10),
    pos = (n - 1) % 10,
    t =
      PATTERNS[Math.floor(rng(h32('pat', b))() * PATTERNS.length)][pos];
  return t === 3 && n < 1500 ? 2 : t;
}

export function stageOf(n: number): { i: number; name: string; fr: number } {
  let lo = 0;
  for (let i = 0; i < STAGES.length; i++) {
    const hi = STAGES[i][0];
    if (n <= hi)
      return { i, name: STAGES[i][1], fr: (n - lo - 1) / (hi - lo) };
    lo = hi;
  }
  return {
    i: 8,
    name: 'Endless',
    fr: Math.min(1, Math.log10(n / 10000) / 2),
  };
}

const TIER_E = [-0.4, 0.35, 0.8, 1.2],
  TIER_B = [-0.5, 0.2, 0.5, 0.8];

export function effort(n: number): number {
  const s = stageOf(n),
    base = s.i < 8 ? s.i + s.fr : 8 + 2 * s.fr;
  return Math.max(0, Math.min(10, base + TIER_E[tierOf(n)]));
}

const clamp = (x: number, a: number, b: number) =>
  Math.max(a, Math.min(b, x));

function paramsFor(n: number, e: number) {
  const tb = TIER_B[tierOf(n)],
    bias = clamp(-0.3 + 0.1 * e + tb, -1, 1);
  return {
    C: Math.min(900, 16 + 28 * e ** 1.35),
    fill: Math.min(0.8, 0.28 + 0.09 * e),
    minL: 2,
    maxL: Math.min(10, 3 + Math.floor(e * 0.8)),
    turn: Math.min(0.5, 0.2 + 0.04 * e),
    bias,
    K: 4 + Math.floor(Math.abs(bias) * 8),
    inward: clamp(0.2 + 0.08 * e, 0, 0.9),
  };
}

let permCache = new Map<number, string[]>();

export function shapeFor(n: number): string {
  if (n <= 30)
    return INTRO[Math.floor(rng(h32('intro', n))() * INTRO.length)];
  const P = SHAPE_NAMES.length,
    round = Math.floor((n - 31) / P),
    perm = (r: number) =>
      permCache.get(r) ||
      (permCache.set(
        r,
        shuffle([...SHAPE_NAMES], rng(h32('perm', VERSION, r))),
      ),
      permCache.get(r)!);
  let p = perm(round);
  const i = (n - 31) % P;
  if (i === 0 && round > 0) {
    const prev = perm(round - 1)[P - 1];
    if (p[0] === prev) {
      p = [...p];
      [p[0], p[1]] = [p[1], p[0]];
      permCache.set(round, p);
    }
  }
  return p[i];
}

// ---------- builder: guarantees an acyclic blocking graph by construction ----------
function build(mask: number[][], p: any, r: () => number) {
  const R = mask.length,
    C = mask[0].length,
    N = R * C,
    occ = new Int32Array(N).fill(-1),
    rayCnt = new Uint16Array(N),
    rayIds: number[][] = new Array(N),
    lvl: number[] = [],
    inPath = new Uint8Array(N);
  const dist = new Int16Array(N);
  for (let i = 0; i < N; i++) dist[i] = mask[(i / C) | 0][i % C] ? 999 : 0;
  for (let it = 0; it < 2; it++) {
    for (let y = 0; y < R; y++)
      for (let x = 0; x < C; x++) {
        const i = y * C + x;
        if (dist[i])
          dist[i] = Math.min(
            dist[i],
            (y ? dist[i - C] : 0) + 1,
            (x ? dist[i - 1] : 0) + 1,
          );
      }
    for (let y = R - 1; y >= 0; y--)
      for (let x = C - 1; x >= 0; x--) {
        const i = y * C + x;
        if (dist[i])
          dist[i] = Math.min(
            dist[i],
            (y < R - 1 ? dist[i + C] : 0) + 1,
            (x < C - 1 ? dist[i + 1] : 0) + 1,
          );
      }
  }
  const empt: number[] = [];
  for (let i = 0; i < N; i++) if (mask[(i / C) | 0][i % C]) empt.push(i);
  const total = empt.length,
    goal = Math.max(4, Math.round(total * p.fill));
  let covered = 0,
    fails = 0;
  const pick = () => {
    let best = -1;
    for (let t = 0; t < 6 && empt.length; t++) {
      const k = Math.floor(r() * empt.length),
        i = empt[k];
      if (occ[i] >= 0) {
        empt[k] = empt[empt.length - 1];
        empt.pop();
        t--;
        continue;
      }
      if (best < 0) best = i;
      else if (r() < Math.abs(p.bias)) {
        if ((rayCnt[i] - rayCnt[best]) * Math.sign(p.bias) > 0) best = i;
      } else if (r() < p.inward && dist[i] > dist[best]) best = i;
    }
    return best;
  };
  const free = (i: number, y: number, x: number) =>
    y >= 0 &&
    y < R &&
    x >= 0 &&
    x < C &&
    mask[y][x] &&
    occ[i] < 0 &&
    !inPath[i];
  const walk = (s: number) => {
    const L = p.minL + Math.floor(r() * (p.maxL - p.minL + 1)),
      path = [s];
    inPath[s] = 1;
    let d = NAMES[Math.floor(r() * 4)];
    while (path.length < L) {
      const c = path[path.length - 1],
        y = (c / C) | 0,
        x = c % C;
      let opts = NAMES.filter(n => {
        const [a, b] = D[n];
        return free(c + a * C + b, y + a, x + b);
      });
      if (!opts.length) break;
      if (!(opts.includes(d) && r() > p.turn))
        d = opts[Math.floor(r() * opts.length)];
      const [a, b] = D[d];
      path.push(c + a * C + b);
      inPath[c + a * C + b] = 1;
    }
    for (const c of path) inPath[c] = 0;
    return path.length >= 2 ? path : null;
  };
  const tryOrient = (path: number[]) => {
    const h = path[path.length - 1],
      q = path[path.length - 2],
      hy = (h / C) | 0,
      hx = h % C,
      dr = hy - ((q / C) | 0),
      dc = hx - (q % C),
      ray: number[] = [];
    for (const c of path) inPath[c] = 1;
    let ok = true;
    for (
      let y = hy + dr, x = hx + dc;
      y >= 0 && y < R && x >= 0 && x < C;
      y += dr, x += dc
    ) {
      const i = y * C + x;
      if (occ[i] >= 0 || inPath[i]) {
        ok = false;
        break;
      }
      ray.push(i);
    }
    for (const c of path) inPath[c] = 0;
    if (!ok) return null;
    let sc = 0,
      mx = 0;
    for (const c of path) {
      sc += rayCnt[c];
      if (rayIds[c])
        for (const a of rayIds[c]) mx = Math.max(mx, lvl[a] + 1);
    }
    return { path, dir: dirName(dr, dc), ray, sc: sc + 6 * mx };
  };
  const arrows: any[] = [];
  while (covered < goal && fails < 40 + total) {
    let best: any = null;
    for (let t = 0; t < p.K; t++) {
      const s = pick();
      if (s < 0) break;
      const path = walk(s);
      if (!path) continue;
      for (const o of [path, [...path].reverse()]) {
        const c = tryOrient(o);
        if (
          c &&
          (!best ||
            (p.bias >= 0 ? c.sc > best.sc : c.sc < best.sc) ||
            (c.sc === best.sc && r() < 0.3))
        )
          best = c;
      }
    }
    if (!best) {
      fails++;
      continue;
    }
    const id = arrows.length;
    lvl[id] = 0;
    for (const c of best.path) occ[c] = id;
    for (const c of best.ray) {
      rayCnt[c]++;
      (rayIds[c] ||= []).push(id);
    }
    const relax = (a: number, v: number) => {
      if (lvl[a] >= v) return;
      lvl[a] = v;
      for (const c of arrows[a].path)
        if (rayIds[c])
          for (const x of rayIds[c]) if (x !== a) relax(x, v + 1);
    };
    for (const c of best.path)
      if (rayIds[c])
        for (const a of rayIds[c]) if (a !== id) relax(a, 1);
    covered += best.path.length;
    arrows.push(best);
  }
  return shuffle(arrows, r).map((a, i) => ({
    id: String(i + 1),
    cells: a.path.map((c: number) => ({ r: (c / C) | 0, c: c % C })),
    direction: a.dir,
    color: '',
    active: true,
    cleared: false,
  }));
}

export function colorize(level: { rows: number; cols: number; arrows: Arrow[] }) {
  const { rows, cols, arrows } = level,
    g = new Map<number, number>();
  arrows.forEach((a, i) =>
    a.cells.forEach(c => g.set(c.r * cols + c.c, i)),
  );
  arrows.forEach((a, i) => {
    const used = new Set<string>();
    for (const c of a.cells)
      for (const [dr, dc] of Object.values(D)) {
        const j = g.get((c.r + dr) * cols + c.c + dc);
        if (j !== undefined && j < i) used.add(arrows[j].color);
      }
    a.color = PALETTE.find(p => !used.has(p)) || PALETTE[i % PALETTE.length];
  });
}

// ---------- analysis / solver ----------
export function blockersOf(
  level: { rows: number; cols: number },
  grid: Int32Array,
  a: Arrow,
): Set<number> {
  const { rows, cols } = level,
    h = a.cells[a.cells.length - 1],
    [dr, dc] = D[a.direction],
    out = new Set<number>();
  for (
    let y = h.r + dr, x = h.c + dc;
    y >= 0 && y < rows && x >= 0 && x < cols;
    y += dr, x += dc
  ) {
    const j = grid[y * cols + x];
    if (j >= 0) out.add(j);
  }
  return out;
}

export function analyze(level: { rows: number; cols: number; arrows: Arrow[] }) {
  const { rows, cols, arrows } = level,
    grid = new Int32Array(rows * cols).fill(-1);
  arrows.forEach((a, i) =>
    a.cells.forEach(c => {
      grid[c.r * cols + c.c] = i;
    }),
  );
  const blk = arrows.map(a => blockersOf(level, grid, a)),
    indeg = blk.map(s => s.size),
    users: number[][] = arrows.map(() => []);
  blk.forEach((s, i) => s.forEach(j => users[j].push(i)));
  let layer = indeg.map((d, i) => (d === 0 ? i : -1)).filter(i => i >= 0);
  const free0 = layer.length,
    layers: number[] = [],
    order: number[] = [];
  while (layer.length) {
    layers.push(layer.length);
    const nx: number[] = [];
    for (const i of layer) {
      order.push(i);
      for (const u of users[i]) if (--indeg[u] === 0) nx.push(u);
    }
    layer = nx;
  }
  const N = arrows.length,
    cells = arrows.reduce((s, a) => s + a.cells.length, 0),
    nb = blk.reduce((s, x) => s + x.size, 0);
  const m = {
    arrows: N,
    cells,
    free0,
    depth: layers.length,
    branching: +(N / Math.max(1, layers.length)).toFixed(2),
    avgLen: +(cells / N).toFixed(2),
    avgBlockers: +(nb / N).toFixed(2),
    maxBlockers: Math.max(0, ...blk.map(s => s.size)),
    solutionLength: N,
    score: 0,
  };
  m.score = Math.round(
    9 * Math.log(1 + N) +
      3.2 * m.depth +
      14 * (1 - free0 / Math.max(1, N)) +
      1.5 * m.avgLen +
      3 * m.avgBlockers,
  );
  return {
    solvable: order.length === N,
    order: order.map(i => arrows[i].id),
    metrics: m,
  };
}

export const solve = (level: Level) =>
  analyze({
    rows: level.gridSize.rows,
    cols: level.gridSize.cols,
    arrows: level.arrows,
  });

// ---------- validation ----------
export function validate(level: { rows: number; cols: number; arrows: Arrow[] }) {
  const err: string[] = [],
    { rows, cols, arrows } = level,
    seen = new Set<number>(),
    ids = new Set<string>();
  if (!(rows > 0 && cols > 0) || !arrows.length)
    err.push('empty/invalid board');
  for (const a of arrows) {
    if (ids.has(a.id)) err.push('dup id ' + a.id);
    ids.add(a.id);
    if (a.cells.length < 2) err.push(`arrow ${a.id} too short`);
    a.cells.forEach((c, i) => {
      if (c.r < 0 || c.r >= rows || c.c < 0 || c.c >= cols)
        err.push(`arrow ${a.id} out of bounds`);
      const k = c.r * cols + c.c;
      if (seen.has(k)) err.push(`overlap at ${c.r},${c.c}`);
      seen.add(k);
      if (
        i &&
        Math.abs(c.r - a.cells[i - 1].r) + Math.abs(c.c - a.cells[i - 1].c) !==
          1
      )
        err.push(`arrow ${a.id} not contiguous`);
    });
    const n = a.cells.length;
    if (
      n > 1 &&
      a.direction !==
        dirName(a.cells[n - 1].r - a.cells[n - 2].r, a.cells[n - 1].c - a.cells[n - 2].c)
    )
      err.push(`arrow ${a.id} direction != head segment`);
  }
  if (err.length) return { ok: false, errors: err };
  const an = analyze(level);
  if (!an.solvable)
    return {
      ok: false,
      errors: ['unsolvable (blocking cycle)'],
      metrics: an.metrics,
    };
  return { ok: true, errors: err, metrics: an.metrics, order: an.order };
}

// ---------- fingerprint ----------
export function fingerprint(level: { rows: number; cols: number; arrows: Arrow[] }) {
  const { rows, cols, arrows } = level;
  let best = '';
  for (let t = 0; t < 8; t++) {
    const sw = t & 4,
      fx = t & 1,
      fy = t & 2,
      R = sw ? cols : rows,
      C = sw ? rows : cols;
    const s = arrows
      .map(a =>
        a.cells
          .map(c => {
            let y = c.r,
              x = c.c;
            if (sw) [y, x] = [x, y];
            if (fy) y = R - 1 - y;
            if (fx) x = C - 1 - x;
            return y * C + x;
          })
          .join('.'),
      )
      .sort()
      .join(',');
    const f = R + 'x' + C + ':' + s;
    if (!best || f < best) best = f;
  }
  return (
    h32(best).toString(36) +
    h32(best, 'b').toString(36) +
    best.length.toString(36)
  );
}

export const EXPECT = [
  [0, 18],
  [1, 30],
  [2, 44],
  [3, 55],
  [4, 64],
  [5, 71],
  [6, 76],
  [7, 82],
  [8, 90],
  [9, 96],
  [10, 100],
];
export const expected = (e: number) => {
  const i = Math.min(EXPECT.length - 2, Math.floor(e));
  return EXPECT[i][1] + (EXPECT[i + 1][1] - EXPECT[i][1]) * (e - i);
};

// ---------- level generation ----------
const small = new Map<number, Level>(),
  smallFp = new Set<string>();
let smallFilled = 0;
const SMALL = 400;

export function generateLevel(n: number): Level {
  if (n <= SMALL && small.has(n)) return small.get(n)!;
  if (n <= SMALL) while (smallFilled < n - 1) generateLevel(++smallFilled);
  const e = effort(n),
    p = paramsFor(n, e),
    shape = shapeFor(n),
    tier = tierOf(n),
    st = stageOf(n);
  for (let attempt = 0; attempt < 60; attempt++) {
    const seed = h32(VERSION, n, attempt),
      r = rng(seed);
    let name = shape,
      mask = makeMask(name, p.C, r);
    if (!mask) {
      name = Object.keys(GEO)[(n * 5) % Object.keys(GEO).length];
      mask = makeMask(name, p.C, r);
    }
    if (!mask) continue;
    const rows = mask.length,
      cols = mask[0].length,
      arrows = build(mask, p, r);
    if (arrows.length < 2) continue;
    const levelObj = { rows, cols, arrows };
    const v = validate(levelObj);
    if (!v.ok || !v.metrics) continue;
    const cov = v.metrics.cells / count(mask);
    if (cov < p.fill * 0.8 && attempt < 40) continue;
    if (attempt < 30 && v.metrics.score < expected(e) * 0.55) continue;
    const fp = fingerprint(levelObj);
    if (n <= SMALL && smallFp.has(fp)) continue;
    colorize(levelObj);

    const level: Level = {
      id: n,
      gridSize: { rows, cols },
      arrows,
    };

    if (n <= SMALL) {
      small.set(n, level);
      smallFp.add(fp);
      smallFilled = Math.max(smallFilled, n);
    }
    return level;
  }
  throw new Error('could not generate level ' + n);
}

// ---------- compact storage ----------
export const encodeLevel = (l: { rows: number; cols: number; arrows: Arrow[] }) =>
  `${l.rows}x${l.cols}:` +
  l.arrows
    .map(a => a.cells.map(c => c.r * l.cols + c.c).join('.'))
    .join(',');

export function decodeLevel(s: string, id: number = 0): Level {
  const [dim, body] = s.split(':');
  const [rows, cols] = dim.split('x').map(Number);
  const arrows: Arrow[] = body.split(',').map((t, i) => {
    const cells: Cell[] = t.split('.').map(Number).map(k => ({
      r: (k / cols) | 0,
      c: k % cols,
    }));
    const n = cells.length;
    return {
      id: String(i + 1),
      cells,
      direction: dirName(
        cells[n - 1].r - cells[n - 2].r,
        cells[n - 1].c - cells[n - 2].c,
      ),
      color: '',
      active: true,
      cleared: false,
    };
  });
  const l = { rows, cols, arrows };
  colorize(l);
  return {
    id,
    gridSize: { rows, cols },
    arrows,
  };
}

// ---------- In-Memory Cache & Level Fetcher ----------
const levelCache = new Map<number, Level>();

/**
 * Retrieve any level from 1 to 10,000 (from pre-generated JSON storage),
 * or dynamically generated beyond 10,000.
 */
export function getLevel(id: number): Level {
  if (levelCache.has(id)) {
    return levelCache.get(id)!;
  }

  let level: Level;
  const encodedList = encodedLevelsData as string[];
  if (id >= 1 && id <= encodedList.length) {
    level = decodeLevel(encodedList[id - 1], id);
  } else {
    level = generateLevel(id);
  }

  levelCache.set(id, level);
  if (levelCache.size > 200) {
    const oldestKey = levelCache.keys().next().value;
    if (oldestKey !== undefined) levelCache.delete(oldestKey);
  }

  return level;
}

// ---------- Level Manager ----------
export class LevelManager {
  cache: Map<number, Level>;
  cacheSize: number;
  key: string;
  mem: Record<string, string>;
  storage: any;
  progress: { unlocked: number; done: Record<number, { best: number }> };

  constructor({
    storage = null,
    cacheSize = 64,
    key = 'arrow-puzzle:v' + VERSION,
  }: { storage?: any; cacheSize?: number; key?: string } = {}) {
    this.cache = new Map();
    this.cacheSize = cacheSize;
    this.key = key;
    this.mem = {};
    this.storage = storage;
    this.progress = { unlocked: 1, done: {} };
    try {
      const s = this._get();
      if (s) this.progress = JSON.parse(s);
    } catch (_) {}
  }
  _get() {
    return this.storage ? this.storage.getItem(this.key) : this.mem[this.key];
  }
  _set(v: string) {
    try {
      this.storage ? this.storage.setItem(this.key, v) : (this.mem[this.key] = v);
    } catch (_) {}
  }
  get(n: number): Level {
    return getLevel(n);
  }
  async prefetch(from: number, count = 5) {
    for (let i = 0; i < count; i++) {
      this.get(from + i);
      await new Promise<void>(r => setTimeout(() => r(), 0));
    }
  }
  isUnlocked(n: number) {
    return n <= this.progress.unlocked;
  }
  complete(n: number, moves = 0) {
    const o = this.progress.done[n];
    this.progress.done[n] = { best: o ? Math.min(o.best, moves) : moves };
    if (n >= this.progress.unlocked) this.progress.unlocked = n + 1;
    this._set(JSON.stringify(this.progress));
  }
  reset() {
    this.progress = { unlocked: 1, done: {} };
    this._set(JSON.stringify(this.progress));
  }
}
