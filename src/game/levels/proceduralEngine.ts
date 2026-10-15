/**
 * Arrow Maze — Procedural Level Generation & Solver Engine
 *
 * Unlimited, deterministic, high-difficulty procedural level generation.
 * - Levels 1–3: Tutorial levels (Levels 1–3 ONLY).
 * - Level 4+: IMMEDIATE MASSIVE DIFFICULTY JUMP to Very Hard! (50–100+ arrows).
 * - Continuous monotonic scaling through Very Hard, Extreme, Insane,
 *   Brutal, Ultra Brutal, Nightmare, and Endless Extreme.
 * - Full board occupancy (85%–96%) with zero empty margins.
 * - Reverse unpeeling algorithm guaranteeing 100% acyclic, solvable puzzles.
 * - Solvability validation pipeline with difficulty rejection floors.
 * - In-memory LRU caching & runtime batch generation.
 */

import { Level, Arrow, Direction, Cell, GridSize } from '../../types/game.types';

export const VERSION = 2;
export const TOTAL_STORED_LEVELS = 1000000; // Unlimited procedural levels

export const PALETTE = [
  '#ef4444', // Vermilion / Coral Red
  '#3b82f6', // Cobalt Blue
  '#10b981', // Matcha / Emerald Green
  '#f59e0b', // Amber / Ochre
  '#8b5cf6', // Lavender / Violet
  '#ec4899', // Sakura Pink
  '#14b8a6', // Teal / Turquoise
  '#f97316', // Persimmon Orange
  '#06b6d4', // Cyan
  '#84cc16', // Wasabi / Lime
];

const DIRS: Record<Direction, { name: Direction; dr: number; dc: number }> = {
  UP: { name: 'UP', dr: -1, dc: 0 },
  DOWN: { name: 'DOWN', dr: 1, dc: 0 },
  LEFT: { name: 'LEFT', dr: 0, dc: -1 },
  RIGHT: { name: 'RIGHT', dr: 0, dc: 1 },
};
const DIR_LIST = [DIRS.UP, DIRS.DOWN, DIRS.LEFT, DIRS.RIGHT];

// ─────────────────────────────────────────────────────────────────────────────
// Deterministic Hashing & PRNG (32-bit Mulberry32 & FNV-1a)
// ─────────────────────────────────────────────────────────────────────────────

export function h32(...args: (string | number)[]): number {
  let h = 2166136261 >>> 0;
  for (const arg of args) {
    const s = String(arg);
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
  }
  return h >>> 0;
}

export function rng(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = Math.imul(t ^ (t >>> 15), t | 1);
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Board Sizing & Tier Progression Parameters
// ─────────────────────────────────────────────────────────────────────────────

export const TIERS = [
  'Tutorial',
  'Very Hard',
  'Extreme',
  'Insane',
  'Brutal',
  'Ultra Brutal',
  'Nightmare',
  'Endless Extreme',
];

export function tierOf(n: number): number {
  if (n <= 3) return 0; // Tutorial (Levels 1–3 ONLY)
  if (n <= 10) return 1; // Very Hard (Immediate jump at Level 4!)
  if (n <= 25) return 2; // Extreme
  if (n <= 50) return 3; // Insane
  if (n <= 100) return 4; // Brutal
  if (n <= 250) return 5; // Ultra Brutal
  if (n <= 500) return 6; // Nightmare
  return 7; // Endless Extreme
}

export function stageOf(n: number): { i: number; name: string; fr: number } {
  const tierIndex = tierOf(n);
  const tierNames = [
    'Tutorial',
    'Very Hard',
    'Extreme',
    'Insane',
    'Brutal',
    'Ultra Brutal',
    'Nightmare',
    'Endless Extreme',
  ];
  return {
    i: tierIndex,
    name: tierNames[tierIndex],
    fr: n <= 500 ? (n % 50) / 50 : 1.0,
  };
}

const MAZE_THEMES = [
  'Dense Labyrinth',
  'Full Matrix',
  'Corridor Mesh',
  'Arrow Nexus',
  'Vortex Grid',
  'Hyper Lattice',
  'Circuit Weave',
  'Crossroad Maze',
  'Origami Fold',
  'Interlocking Grid',
];

export function shapeFor(n: number): string {
  if (n <= 3) return `Tutorial ${n}`;
  const idx = h32('theme', n) % MAZE_THEMES.length;
  return MAZE_THEMES[idx];
}

export function getBoardSize(level: number): GridSize {
  if (level === 1) return { rows: 3, cols: 3 };
  if (level === 2) return { rows: 3, cols: 4 };
  if (level === 3) return { rows: 4, cols: 4 };

  // LEVEL 4: IMMEDIATE MASSIVE JUMP TO VERY HARD (50-100+ arrows!)
  let base: number;
  if (level <= 10) {
    // 16 to 20 grid -> 256 to 400 cells -> ~55 to 105 arrows
    base = 16 + Math.floor((level - 4) * 0.6); // 16..19
  } else if (level <= 25) {
    // 20 to 25 grid -> 400 to 625 cells -> ~95 to 160 arrows
    base = 20 + Math.floor((level - 11) * 0.36); // 20..25
  } else if (level <= 50) {
    // 26 to 31 grid -> 676 to 961 cells -> ~150 to 235 arrows
    base = 26 + Math.floor((level - 26) * 0.2); // 26..31
  } else if (level <= 100) {
    // 32 to 40 grid -> 1024 to 1600 cells -> ~240 to 380 arrows
    base = 32 + Math.floor((level - 51) * 0.16); // 32..40
  } else if (level <= 250) {
    // 41 to 52 grid -> 1681 to 2704 cells -> ~380 to 620 arrows
    base = 41 + Math.floor((level - 101) * 0.075);
  } else if (level <= 500) {
    // 52 to 62 grid -> 2704 to 3844 cells -> ~600 to 900 arrows
    base = 52 + Math.floor((level - 251) * 0.04);
  } else {
    // 62+ grid -> Endless Extreme scaling
    base = 62 + Math.floor(Math.log2(level - 500 + 1) * 3);
  }

  // Deterministic aspect ratio variation for layout diversity
  const h = h32(level, 'dim_var');
  const delta = (h % 3) - 1; // -1, 0, or 1
  const rows = Math.max(3, base + delta);
  const cols = Math.max(3, base - delta);
  return { rows, cols };
}

interface TierConfig {
  tierName: string;
  targetOccupancy: number;
  minLen: number;
  maxLen: number;
  beta: number; // Blocker dependency weighting
}

function getTierConfig(level: number): TierConfig {
  if (level <= 3) {
    return {
      tierName: 'Tutorial',
      targetOccupancy: 0.85,
      minLen: 2,
      maxLen: 3,
      beta: 0.1,
    };
  }
  if (level <= 10) {
    // Very Hard: Level 4 immediately gets strong blockers & long wavy paths
    return {
      tierName: 'Very Hard',
      targetOccupancy: 0.90,
      minLen: 3,
      maxLen: 7,
      beta: 1.2,
    };
  }
  if (level <= 25) {
    return {
      tierName: 'Extreme',
      targetOccupancy: 0.92,
      minLen: 3,
      maxLen: 8,
      beta: 1.4,
    };
  }
  if (level <= 50) {
    return {
      tierName: 'Insane',
      targetOccupancy: 0.93,
      minLen: 3,
      maxLen: 9,
      beta: 1.6,
    };
  }
  if (level <= 100) {
    return {
      tierName: 'Brutal',
      targetOccupancy: 0.94,
      minLen: 4,
      maxLen: 10,
      beta: 1.8,
    };
  }
  if (level <= 250) {
    return {
      tierName: 'Ultra Brutal',
      targetOccupancy: 0.95,
      minLen: 4,
      maxLen: 11,
      beta: 2.0,
    };
  }
  if (level <= 500) {
    return {
      tierName: 'Nightmare',
      targetOccupancy: 0.95,
      minLen: 4,
      maxLen: 12,
      beta: 2.2,
    };
  }
  return {
    tierName: 'Endless Extreme',
    targetOccupancy: 0.96,
    minLen: 4,
    maxLen: 14,
    beta: 2.5,
  };
}

interface DifficultyFloor {
  minDepth: number;
  maxInitialFreeRatio: number;
  minOccupancy: number;
  minArrows: number;
  minScore: number;
}

function getDifficultyFloor(level: number): DifficultyFloor {
  if (level <= 3) {
    return {
      minDepth: 2,
      maxInitialFreeRatio: 0.85,
      minOccupancy: 0.8,
      minArrows: 3,
      minScore: 10,
    };
  }
  if (level <= 10) {
    // Level 4–10: Target 50–100+ arrows! Immediately Very Hard!
    return {
      minDepth: 7,
      maxInitialFreeRatio: 0.28,
      minOccupancy: 0.86,
      minArrows: 50,
      minScore: 240,
    };
  }
  if (level <= 25) {
    // Level 11–25: Extreme! Target 75–150+ arrows!
    return {
      minDepth: 10,
      maxInitialFreeRatio: 0.22,
      minOccupancy: 0.88,
      minArrows: 75,
      minScore: 380,
    };
  }
  if (level <= 50) {
    // Level 26–50: Insane! Target 100–200+ arrows!
    return {
      minDepth: 14,
      maxInitialFreeRatio: 0.18,
      minOccupancy: 0.89,
      minArrows: 100,
      minScore: 600,
    };
  }
  if (level <= 100) {
    // Level 51–100: Brutal! Target 150–300+ arrows!
    return {
      minDepth: 18,
      maxInitialFreeRatio: 0.15,
      minOccupancy: 0.90,
      minArrows: 150,
      minScore: 1000,
    };
  }
  if (level <= 250) {
    // Level 101–250: Ultra Brutal! Target 250–500+ arrows!
    return {
      minDepth: 24,
      maxInitialFreeRatio: 0.12,
      minOccupancy: 0.91,
      minArrows: 250,
      minScore: 1800,
    };
  }
  if (level <= 500) {
    // Level 251–500: Nightmare! Target 350–700+ arrows!
    return {
      minDepth: 30,
      maxInitialFreeRatio: 0.10,
      minOccupancy: 0.92,
      minArrows: 350,
      minScore: 2800,
    };
  }
  return {
    // Level 500+: Endless Extreme! Target 450–1000+ arrows!
    minDepth: 38,
    maxInitialFreeRatio: 0.08,
    minOccupancy: 0.93,
    minArrows: 450,
    minScore: 4000,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Handcrafted Tutorial Levels (Levels 1–3 ONLY)
// ─────────────────────────────────────────────────────────────────────────────

function getTutorialLevel(levelId: number): Level {
  if (levelId === 1) {
    // LEVEL 1: Teach basic arrow interaction (tap to fly off board)
    // 3x3 board (9 cells), 8 cells occupied (88.9% occupancy).
    return {
      id: 1,
      gridSize: { rows: 3, cols: 3 },
      arrows: [
        {
          id: '1',
          cells: [
            { r: 0, c: 0 },
            { r: 0, c: 1 },
            { r: 0, c: 2 },
          ],
          direction: 'RIGHT',
          color: PALETTE[1], // Blue
          active: true,
          cleared: false,
        },
        {
          id: '2',
          cells: [
            { r: 1, c: 0 },
            { r: 1, c: 1 },
            { r: 1, c: 2 },
          ],
          direction: 'RIGHT',
          color: PALETTE[2], // Green
          active: true,
          cleared: false,
        },
        {
          id: '3',
          cells: [
            { r: 2, c: 1 },
            { r: 2, c: 2 },
          ],
          direction: 'RIGHT',
          color: PALETTE[3], // Amber
          active: true,
          cleared: false,
        },
      ],
      maxHearts: 3,
    };
  }

  if (levelId === 2) {
    // LEVEL 2: Basic Mechanics (Turns, path interactions & small intersections)
    // 3x4 board (12 cells), 11 cells occupied (91.7% occupancy).
    // Teaches 90° turned arrows (Arrow 5) and path blocking (Arrow 1 blocked by Arrow 2).
    return {
      id: 2,
      gridSize: { rows: 3, cols: 4 },
      arrows: [
        {
          id: '1',
          cells: [
            { r: 0, c: 2 },
            { r: 0, c: 1 },
          ],
          direction: 'LEFT',
          color: PALETTE[1],
          active: true,
          cleared: false,
        },
        {
          id: '2',
          cells: [
            { r: 1, c: 0 },
            { r: 0, c: 0 },
          ],
          direction: 'UP',
          color: PALETTE[2],
          active: true,
          cleared: false,
        },
        {
          id: '3',
          cells: [
            { r: 1, c: 1 },
            { r: 2, c: 1 },
          ],
          direction: 'DOWN',
          color: PALETTE[0],
          active: true,
          cleared: false,
        },
        {
          id: '4',
          cells: [
            { r: 2, c: 3 },
            { r: 2, c: 2 },
          ],
          direction: 'LEFT',
          color: PALETTE[3],
          active: true,
          cleared: false,
        },
        {
          id: '5',
          cells: [
            { r: 1, c: 2 },
            { r: 1, c: 3 },
            { r: 0, c: 3 },
          ],
          direction: 'UP',
          color: PALETTE[4],
          active: true,
          cleared: false,
        },
      ],
      maxHearts: 3,
    };
  }

  // LEVEL 3: Final tutorial level (Last easy level: intersections & branching)
  // 4x4 board (16 cells), 16 cells occupied (100% occupancy).
  return {
    id: 3,
    gridSize: { rows: 4, cols: 4 },
    arrows: [
      {
        id: '1',
        cells: [
          { r: 0, c: 0 },
          { r: 0, c: 1 },
          { r: 0, c: 2 },
        ],
        direction: 'RIGHT',
        color: PALETTE[1],
        active: true,
        cleared: false,
      },
      {
        id: '2',
        cells: [
          { r: 1, c: 2 },
          { r: 2, c: 2 },
          { r: 3, c: 2 },
        ],
        direction: 'DOWN',
        color: PALETTE[0],
        active: true,
        cleared: false,
      },
      {
        id: '3',
        cells: [
          { r: 2, c: 0 },
          { r: 2, c: 1 },
        ],
        direction: 'RIGHT',
        color: PALETTE[2],
        active: true,
        cleared: false,
      },
      {
        id: '4',
        cells: [
          { r: 3, c: 0 },
          { r: 3, c: 1 },
        ],
        direction: 'RIGHT',
        color: PALETTE[3],
        active: true,
        cleared: false,
      },
      {
        id: '5',
        cells: [
          { r: 3, c: 3 },
          { r: 2, c: 3 },
          { r: 1, c: 3 },
          { r: 0, c: 3 },
        ],
        direction: 'UP',
        color: PALETTE[4],
        active: true,
        cleared: false,
      },
      {
        id: '6',
        cells: [
          { r: 1, c: 1 },
          { r: 1, c: 0 },
        ],
        direction: 'LEFT',
        color: PALETTE[5],
        active: true,
        cleared: false,
      },
    ],
    maxHearts: 3,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Procedural Maze Core (Reverse Unpeeling from Board Boundaries into Center)
// ─────────────────────────────────────────────────────────────────────────────

function generateCandidateMaze(
  level: number,
  attempt: number = 0,
): {
  rows: number;
  cols: number;
  arrows: Arrow[];
  occupancy: number;
  params: TierConfig;
} {
  const { rows, cols } = getBoardSize(level);
  const params = getTierConfig(level);
  const seed = h32(level, attempt, 'arrow_amaze_procedural');
  const rand = rng(seed);

  const totalCells = rows * cols;
  // R: 1 = uncarved cell, 0 = carved cell (transparent to exit rays of later-carved arrows)
  const R = new Uint8Array(totalCells).fill(1);
  const cellOwner = new Int16Array(totalCells).fill(-1);
  const rawArrows: { cells: Cell[]; direction: Direction }[] = [];

  let remainingCount = totalCells;
  const maxRemaining = Math.round(totalCells * (1 - params.targetOccupancy));

  function isRayFreeOfR(hr: number, hc: number, dr: number, dc: number): boolean {
    let r = hr + dr;
    let c = hc + dc;
    while (r >= 0 && r < rows && c >= 0 && c < cols) {
      if (R[r * cols + c] === 1) return false;
      r += dr;
      c += dc;
    }
    return true;
  }

  function countBlockers(hr: number, hc: number, dr: number, dc: number): number {
    let count = 0;
    const seen = new Set<number>();
    let r = hr + dr;
    let c = hc + dc;
    while (r >= 0 && r < rows && c >= 0 && c < cols) {
      const owner = cellOwner[r * cols + c];
      if (owner >= 0 && !seen.has(owner)) {
        seen.add(owner);
        count++;
      }
      r += dr;
      c += dc;
    }
    return count;
  }

  function findCandidateHeads(): {
    r: number;
    c: number;
    dir: { name: Direction; dr: number; dc: number };
    blockers: number;
  }[] {
    const candidates: {
      r: number;
      c: number;
      dir: { name: Direction; dr: number; dc: number };
      blockers: number;
    }[] = [];

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (R[r * cols + c] === 0) continue;
        for (const dir of DIR_LIST) {
          if (!isRayFreeOfR(r, c, dir.dr, dir.dc)) continue;

          // Predecessor cell that enters the head must also be in R
          const pr = r - dir.dr;
          const pc = c - dir.dc;
          if (
            pr < 0 ||
            pr >= rows ||
            pc < 0 ||
            pc >= cols ||
            R[pr * cols + pc] === 0
          )
            continue;

          const blockers = countBlockers(r, c, dir.dr, dir.dc);
          candidates.push({ r, c, dir, blockers });
        }
      }
    }
    return candidates;
  }

  let stagnation = 0;

  while (remainingCount > maxRemaining && stagnation < 45) {
    const cands = findCandidateHeads();
    if (cands.length === 0) break;

    const paths: { cells: Cell[]; direction: Direction; blockers: number }[] =
      [];
    const sampleSize = Math.min(cands.length, 36);

    for (let s = 0; s < sampleSize; s++) {
      const idx = Math.floor(rand() * cands.length);
      const { r: hr, c: hc, dir, blockers } = cands[idx];

      const desiredLen =
        params.minLen +
        Math.floor(rand() * (params.maxLen - params.minLen + 1));
      const pr = hr - dir.dr;
      const pc = hc - dir.dc;

      const path: Cell[] = [
        { r: hr, c: hc },
        { r: pr, c: pc },
      ];
      const visited = new Set<string>([`${hr},${hc}`, `${pr},${pc}`]);

      let curr = path[1];
      let growDir = { dr: -dir.dr, dc: -dir.dc }; // initial momentum back from head

      while (path.length < desiredLen) {
        const validNext: { cell: Cell; dir: { dr: number; dc: number }; isStraight: boolean }[] = [];
        for (const d of DIR_LIST) {
          const nr = curr.r + d.dr;
          const nc = curr.c + d.dc;
          const key = `${nr},${nc}`;
          if (
            nr >= 0 &&
            nr < rows &&
            nc >= 0 &&
            nc < cols &&
            R[nr * cols + nc] === 1 &&
            !visited.has(key)
          ) {
            const isStraight = d.dr === growDir.dr && d.dc === growDir.dc;
            const isReverse = d.dr === -growDir.dr && d.dc === -growDir.dc;
            if (!isReverse) {
              validNext.push({ cell: { r: nr, c: nc }, dir: d, isStraight });
            }
          }
        }
        if (validNext.length === 0) break;

        // Bias towards straight momentum to create flowing waves & clean S-curves
        const straightChoice = validNext.find(n => n.isStraight);
        let chosenNext;
        if (straightChoice && rand() < 0.65) {
          chosenNext = straightChoice;
        } else {
          chosenNext = validNext[Math.floor(rand() * validNext.length)];
        }

        visited.add(`${chosenNext.cell.r},${chosenNext.cell.c}`);
        path.push(chosenNext.cell);
        curr = chosenNext.cell;
        growDir = chosenNext.dir;
      }

      // Reverse so cells are ordered from tail to head
      path.reverse();
      paths.push({
        cells: path,
        direction: dir.name,
        blockers,
      });
    }

    if (paths.length === 0) {
      stagnation++;
      continue;
    }

    // Weighted selection: prioritize arrows with high blockers to build deep dependencies
    const weights = paths.map(p =>
      Math.exp(Math.min(8, params.beta * p.blockers)),
    );
    const totalWeight = weights.reduce((a, b) => a + b, 0);
    let pickVal = rand() * totalWeight;
    let chosen = paths[0];
    for (let i = 0; i < paths.length; i++) {
      pickVal -= weights[i];
      if (pickVal <= 0) {
        chosen = paths[i];
        break;
      }
    }

    const arrowIdx = rawArrows.length;
    rawArrows.push({
      cells: chosen.cells,
      direction: chosen.direction,
    });

    for (const { r, c } of chosen.cells) {
      R[r * cols + c] = 0;
      cellOwner[r * cols + c] = arrowIdx;
      remainingCount--;
    }
  }

  const occupancy = (totalCells - remainingCount) / totalCells;

  const arrows: Arrow[] = rawArrows.map((a, i) => ({
    id: String(i + 1),
    cells: a.cells,
    direction: a.direction,
    color: '',
    active: true,
    cleared: false,
  }));

  return {
    rows,
    cols,
    arrows,
    occupancy,
    params,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Analysis, Solver & Validation
// ─────────────────────────────────────────────────────────────────────────────

export function blockersOf(
  level: { rows: number; cols: number },
  grid: Int16Array,
  a: Arrow,
): Set<number> {
  const { rows, cols } = level;
  const h = a.cells[a.cells.length - 1];
  const { dr, dc } = DIRS[a.direction];
  const out = new Set<number>();
  let y = h.r + dr;
  let x = h.c + dc;
  while (y >= 0 && y < rows && x >= 0 && x < cols) {
    const j = grid[y * cols + x];
    if (j >= 0) out.add(j);
    y += dr;
    x += dc;
  }
  return out;
}

export function analyze(level: {
  rows: number;
  cols: number;
  arrows: Arrow[];
}): {
  solvable: boolean;
  order: string[];
  metrics: {
    arrows: number;
    cells: number;
    free0: number;
    depth: number;
    branching: number;
    avgLen: number;
    avgBlockers: number;
    maxBlockers: number;
    solutionLength: number;
    score: number;
  };
} {
  const { rows, cols, arrows } = level;
  const total = arrows.length;
  const grid = new Int16Array(rows * cols).fill(-1);

  arrows.forEach((a, i) => {
    a.cells.forEach(c => {
      grid[c.r * cols + c.c] = i;
    });
  });

  const blk = arrows.map(a => blockersOf(level, grid, a));
  const indeg = blk.map(s => s.size);
  const users: number[][] = arrows.map(() => []);
  blk.forEach((s, i) => s.forEach(j => users[j].push(i)));

  let layer: number[] = [];
  for (let i = 0; i < total; i++) {
    if (indeg[i] === 0) layer.push(i);
  }
  const free0 = layer.length;
  const layers: number[] = [];
  const order: number[] = [];

  while (layer.length > 0) {
    layers.push(layer.length);
    const nx: number[] = [];
    for (const i of layer) {
      order.push(i);
      for (const u of users[i]) {
        if (--indeg[u] === 0) nx.push(u);
      }
    }
    layer = nx;
  }

  const cells = arrows.reduce((s, a) => s + a.cells.length, 0);
  const nb = blk.reduce((s, x) => s + x.size, 0);

  const m = {
    arrows: total,
    cells,
    free0,
    depth: layers.length,
    branching: +(total / Math.max(1, layers.length)).toFixed(2),
    avgLen: +(cells / Math.max(1, total)).toFixed(2),
    avgBlockers: +(nb / Math.max(1, total)).toFixed(2),
    maxBlockers: Math.max(0, ...blk.map(s => s.size)),
    solutionLength: total,
    score: 0,
  };

  // Internal difficulty score formula
  m.score = Math.round(
    total * 2.0 +
      m.depth * 4.5 +
      (1 - free0 / Math.max(1, total)) * 25 +
      m.avgBlockers * 6 +
      rows * cols * 0.3,
  );

  return {
    solvable: order.length === total,
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

export function validate(level: {
  rows: number;
  cols: number;
  arrows: Arrow[];
}): {
  ok: boolean;
  errors: string[];
  metrics?: any;
  order?: string[];
} {
  const err: string[] = [];
  const { rows, cols, arrows } = level;
  const seen = new Set<number>();
  const ids = new Set<string>();

  if (!(rows > 0 && cols > 0) || !arrows.length) {
    err.push('empty/invalid board');
  }

  for (const a of arrows) {
    if (ids.has(a.id)) err.push(`dup id ${a.id}`);
    ids.add(a.id);
    if (a.cells.length < 2) err.push(`arrow ${a.id} too short`);

    a.cells.forEach((c, i) => {
      if (c.r < 0 || c.r >= rows || c.c < 0 || c.c >= cols) {
        err.push(`arrow ${a.id} out of bounds`);
      }
      const k = c.r * cols + c.c;
      if (seen.has(k)) {
        err.push(`overlap at ${c.r},${c.c}`);
      }
      seen.add(k);
      if (
        i > 0 &&
        Math.abs(c.r - a.cells[i - 1].r) + Math.abs(c.c - a.cells[i - 1].c) !== 1
      ) {
        err.push(`arrow ${a.id} not contiguous`);
      }
    });

    const n = a.cells.length;
    if (n > 1) {
      const dr = a.cells[n - 1].r - a.cells[n - 2].r;
      const dc = a.cells[n - 1].c - a.cells[n - 2].c;
      const expectedDir =
        dr < 0 ? 'UP' : dr > 0 ? 'DOWN' : dc < 0 ? 'LEFT' : 'RIGHT';
      if (a.direction !== expectedDir) {
        err.push(`arrow ${a.id} direction != head orientation`);
      }
    }
  }

  if (err.length > 0) return { ok: false, errors: err };

  const an = analyze(level);
  if (!an.solvable) {
    return {
      ok: false,
      errors: ['unsolvable (cycle in blocking graph)'],
      metrics: an.metrics,
    };
  }

  return { ok: true, errors: [], metrics: an.metrics, order: an.order };
}

// ─────────────────────────────────────────────────────────────────────────────
// Arrow Graph Coloring
// ─────────────────────────────────────────────────────────────────────────────

export function colorize(level: {
  rows: number;
  cols: number;
  arrows: Arrow[];
}): void {
  const { cols, arrows } = level;
  const grid = new Map<number, number>();

  arrows.forEach((a, i) =>
    a.cells.forEach(c => grid.set(c.r * cols + c.c, i)),
  );

  arrows.forEach((a, i) => {
    const used = new Set<string>();
    for (const c of a.cells) {
      for (const { dr, dc } of DIR_LIST) {
        const j = grid.get((c.r + dr) * cols + c.c + dc);
        if (j !== undefined && j < i) {
          used.add(arrows[j].color);
        }
      }
    }
    a.color =
      PALETTE.find(p => !used.has(p)) || PALETTE[i % PALETTE.length];
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Level Generator (Deterministic & Solvable)
// ─────────────────────────────────────────────────────────────────────────────

export function generateLevel(levelNumber: number): Level {
  if (levelNumber <= 3) {
    return getTutorialLevel(levelNumber);
  }

  const floor = getDifficultyFloor(levelNumber);

  // Validation loop with strict rejection floors: Reject easy & medium levels!
  for (let attempt = 0; attempt < 30; attempt++) {
    const candidate = generateCandidateMaze(levelNumber, attempt);
    const v = validate(candidate);

    if (!v.ok || !v.metrics) continue;

    // Reject candidates that do not meet the minimum arrow count (50+ for Level 4)
    if (candidate.arrows.length < floor.minArrows && attempt < 22) continue;

    // Reject candidates that are too shallow (solution depth must be deep)
    if (v.metrics.depth < floor.minDepth && attempt < 22) continue;

    // Reject candidates where too many arrows can fly immediately (too easy)
    if (
      v.metrics.free0 / Math.max(1, candidate.arrows.length) >
        floor.maxInitialFreeRatio &&
      attempt < 20
    ) {
      continue;
    }

    // Reject if difficulty score does not meet target difficulty floor
    if (v.metrics.score < floor.minScore && attempt < 20) {
      continue;
    }

    // Reject if board occupancy is below target threshold
    if (candidate.occupancy < floor.minOccupancy && attempt < 24) continue;

    colorize(candidate);

    return {
      id: levelNumber,
      gridSize: { rows: candidate.rows, cols: candidate.cols },
      arrows: candidate.arrows,
      maxHearts: 3,
    };
  }

  // Guaranteed fallback
  const fallback = generateCandidateMaze(levelNumber, 0);
  colorize(fallback);
  return {
    id: levelNumber,
    gridSize: { rows: fallback.rows, cols: fallback.cols },
    arrows: fallback.arrows,
    maxHearts: 3,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Compact Encoding & Decoding
// ─────────────────────────────────────────────────────────────────────────────

export const encodeLevel = (l: {
  rows: number;
  cols: number;
  arrows: Arrow[];
}): string =>
  `${l.rows}x${l.cols}:` +
  l.arrows
    .map(a => a.cells.map(c => c.r * l.cols + c.c).join('.'))
    .join(',');

export function decodeLevel(s: string, id: number = 0): Level {
  const [dim, body] = s.split(':');
  const [rows, cols] = dim.split('x').map(Number);
  const arrows: Arrow[] = body.split(',').map((t, i) => {
    const cells: Cell[] = t
      .split('.')
      .map(Number)
      .map(k => ({
        r: (k / cols) | 0,
        c: k % cols,
      }));
    const n = cells.length;
    const dr = cells[n - 1].r - cells[n - 2].r;
    const dc = cells[n - 1].c - cells[n - 2].c;
    const direction: Direction =
      dr < 0 ? 'UP' : dr > 0 ? 'DOWN' : dc < 0 ? 'LEFT' : 'RIGHT';

    return {
      id: String(i + 1),
      cells,
      direction,
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

// ─────────────────────────────────────────────────────────────────────────────
// Level Caching & Runtime Batch Generation
// ─────────────────────────────────────────────────────────────────────────────

const memoryCache = new Map<number, Level>();

export function getLevel(id: number): Level {
  const safeId = Math.max(1, id);
  if (memoryCache.has(safeId)) {
    return memoryCache.get(safeId)!;
  }

  const level = generateLevel(safeId);
  memoryCache.set(safeId, level);

  // LRU cleanup to prevent memory bloating
  if (memoryCache.size > 250) {
    const oldestKey = memoryCache.keys().next().value;
    if (oldestKey !== undefined) memoryCache.delete(oldestKey);
  }

  return level;
}

/**
 * Pre-generate future levels in batches to ensure seamless instant load.
 */
export async function prefetchLevels(fromLevel: number, count: number = 10): Promise<void> {
  const start = Math.max(1, fromLevel);
  for (let i = 0; i < count; i++) {
    const id = start + i;
    if (!memoryCache.has(id)) {
      getLevel(id);
    }
    // Yield to JS event loop
    await new Promise<void>(resolve => setTimeout(resolve, 0));
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Level Manager
// ─────────────────────────────────────────────────────────────────────────────

export class LevelManager {
  cache: Map<number, Level>;
  cacheSize: number;
  key: string;
  storage: any;
  progress: { unlocked: number; done: Record<number, { best: number }> };

  constructor({
    storage = null,
    cacheSize = 128,
    key = 'arrow-puzzle:v' + VERSION,
  }: { storage?: any; cacheSize?: number; key?: string } = {}) {
    this.cache = memoryCache;
    this.cacheSize = cacheSize;
    this.key = key;
    this.storage = storage;
    this.progress = { unlocked: 1, done: {} };
    try {
      const s = this._get();
      if (s) this.progress = JSON.parse(s);
    } catch (_) {}
  }

  _get() {
    return this.storage ? this.storage.getItem(this.key) : null;
  }

  _set(v: string) {
    try {
      if (this.storage) this.storage.setItem(this.key, v);
    } catch (_) {}
  }

  get(n: number): Level {
    return getLevel(n);
  }

  async prefetch(from: number, count = 10): Promise<void> {
    await prefetchLevels(from, count);
  }

  isUnlocked(n: number): boolean {
    return n <= this.progress.unlocked;
  }

  complete(n: number, moves = 0): void {
    const o = this.progress.done[n];
    this.progress.done[n] = { best: o ? Math.min(o.best, moves) : moves };
    if (n >= this.progress.unlocked) this.progress.unlocked = n + 1;
    this._set(JSON.stringify(this.progress));
  }

  reset(): void {
    this.progress = { unlocked: 1, done: {} };
    this._set(JSON.stringify(this.progress));
  }
}
