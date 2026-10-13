import { Level, Direction, Arrow } from '../../types/game.types';

const DIRS: Record<Direction, [number, number]> = {
  UP: [-1, 0],
  DOWN: [1, 0],
  LEFT: [0, -1],
  RIGHT: [0, 1]
};

const NEI = [[-1, 0], [1, 0], [0, -1], [0, 1]];

const ANIMALS: Record<string, [string[], string[]]> = {
  Fish: [["..###...",".#####.#","##.#####",".#####.#","..###..."], ['#f97316','#3b82f6','#fbbf24','#06b6d4']],
  Cat: [["#.....#","##...##","#######","#.###.#","#######",".#####."], ['#f59e0b','#ef4444','#8b5cf6','#10b981']],
  Rabbit: [[".#..#.",".#..#.",".#..#.",".####.","######","#.##.#","######",".####."], ['#ec4899','#8b5cf6','#3b82f6','#f472b6']],
  Pig: [["##.....##","#########","#########","##.###.##","#########","..#####..","..##.##.."], ['#ec4899','#f472b6','#ef4444','#f59e0b']],
  Penguin: [["..###..",".#####.",".#.#.#.",".#####.","#######","#######","#######",".#####.",".##.##."], ['#3b82f6','#8b5cf6','#f59e0b','#10b981']],
  Owl: [["#.....#","##...##","#######","#.###.#","###.###","#######",".#####.",".#####.","..#.#.."], ['#f59e0b','#ef4444','#10b981','#8b5cf6']],
  Duck: [["..###...",".#####..","##.####.",".#####..","..###...","..####..",".#######","########",".######."], ['#fbbf24','#f97316','#3b82f6','#10b981']],
  Turtle: [["...#####....","..#######.##",".#########.#",".#########..","..##....##..","..##....##.."], ['#10b981','#14b8a6','#f59e0b','#3b82f6']],
  Butterfly: [["##...#...##","####.#.####","###########","####.#.####",".###.#.###.","..#..#..#.."], ['#8b5cf6','#ec4899','#3b82f6','#f59e0b']],
  Dog: [["#.#####.#","##.###.##","##.#.#.##","#########",".#######.","..##.##..","...###..."], ['#f59e0b','#ef4444','#3b82f6','#10b981']],
  Crab: [["##.......##","#.#.....#.#","..#######..",".##.###.##.",".#########.",".#.#.#.#.#."], ['#ef4444','#f97316','#f59e0b','#ec4899']],
  Fox: [["#.......#","##.....##","###...###","#########","#.#####.#",".#######.","..#####..","...###...","....#...."], ['#f97316','#ef4444','#f59e0b','#8b5cf6']],
  Octopus: [["..#####..",".#######.","#########","##.###.##","#########",".#######.",".#.#.#.#.",".#.#.#.#."], ['#8b5cf6','#ec4899','#3b82f6','#14b8a6']],
  Bear: [["##.....##","##.....##",".#######.","#########","##.###.##","#########","####.####",".#######.","..#####.."], ['#b45309','#f59e0b','#ef4444','#10b981']],
  Whale: [["..#.........","..#......#.#",".#########.#",".#.########.",".#########..","..#######..."], ['#3b82f6','#06b6d4','#8b5cf6','#10b981']],
  Elephant: [["..########..",".##########.","###.########","##..########","##..########","#...########","#...###..###","....###..###"], ['#64748b','#3b82f6','#8b5cf6','#14b8a6']],
  Snake: [["#########","#########",".......##",".......##","#########","#########","##.......","##.......","#########","#########"], ['#10b981','#84cc16','#f59e0b','#14b8a6']],
  Spider: [["##.......##",".##.....##.","..#######..","###########","..#######..",".##.....##.","##.......##"], ['#ef4444','#8b5cf6','#f59e0b','#3b82f6']],
  Lion: [["..#######..",".#########.","###########","###.###.###","###########","####.#.####","###########",".#########.","..#######.."], ['#f59e0b','#ef4444','#f97316','#10b981']],
};

const BASE = ['#ef4444','#3b82f6','#10b981','#f59e0b','#8b5cf6','#ec4899','#14b8a6','#f97316'];

class PRNG {
  private seed: number;
  constructor(seed: number) { this.seed = seed; }
  next() {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }
  randrange(min: number, max?: number) {
    if (max === undefined) { max = min; min = 0; }
    return min + Math.floor(this.next() * (max - min));
  }
  choice<T>(arr: T[]): T {
    return arr[this.randrange(arr.length)];
  }
  choices<T>(arr: T[], weights: number[]): T {
    const total = weights.reduce((a, b) => a + b, 0);
    let r = this.next() * total;
    for (let i = 0; i < weights.length; i++) {
      r -= weights[i];
      if (r <= 0) return arr[i];
    }
    return arr[arr.length - 1];
  }
  shuffle<T>(arr: T[]) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  }
  random() { return this.next(); }
}

function shapeCells(rows: string[]): Set<string> {
  const s = new Set<string>();
  for (let r = 0; r < rows.length; r++) {
    for (let c = 0; c < rows[r].length; c++) {
      if (rows[r][c] === '#') s.add(`${r},${c}`);
    }
  }
  return s;
}

function ray(h: [number, number], d: Direction, rows: number, cols: number): [number, number][] {
  const [dr, dc] = DIRS[d];
  let r = h[0] + dr;
  let c = h[1] + dc;
  const out: [number, number][] = [];
  while (r >= 0 && r < rows && c >= 0 && c < cols) {
    out.push([r, c]);
    r += dr;
    c += dc;
  }
  return out;
}

function peel(R0: Set<string>, rows: number, cols: number, rng: PRNG, maxLen: number, beta: number, tph: number = 3) {
  const R = new Set(R0);
  const arrows: any[] = [];
  const owner = new Map<string, number>();

  while (R.size > 0) {
    const cands: any[] = [];
    for (const hStr of R) {
      const [hr, hc] = hStr.split(',').map(Number);
      const h: [number, number] = [hr, hc];
      
      for (const d of Object.keys(DIRS) as Direction[]) {
        const [dr, dc] = DIRS[d];
        const prev: [number, number] = [hr - dr, hc - dc];
        const prevStr = `${prev[0]},${prev[1]}`;
        if (!R.has(prevStr)) continue;

        const rc = ray(h, d, rows, cols);
        if (rc.some(([rr, cc]) => R.has(`${rr},${cc}`))) continue;

        const crossed = new Set<number>();
        for (const [rr, cc] of rc) {
          const o = owner.get(`${rr},${cc}`);
          if (o !== undefined) crossed.add(o);
        }

        for (let _ = 0; _ < tph; _++) {
          const k = rng.randrange(2, maxLen + 1);
          const path: [number, number][] = [h, prev];
          const seen = new Set([`${hr},${hc}`, prevStr]);

          while (path.length < k) {
            const [r, c] = path[path.length - 1];
            const opts: [number, number][] = [];
            for (const [a, b] of NEI) {
              const str = `${r + a},${c + b}`;
              if (R.has(str) && !seen.has(str)) opts.push([r + a, c + b]);
            }
            if (opts.length === 0) break;
            const n = rng.choice(opts);
            path.push(n);
            seen.add(`${n[0]},${n[1]}`);
          }

          path.reverse();
          const ps = new Set(path.map(p => `${p[0]},${p[1]}`));
          let ok = true;

          for (const p of path) {
            for (const [a, b] of NEI) {
              const q: [number, number] = [p[0] + a, p[1] + b];
              const qStr = `${q[0]},${q[1]}`;
              if (R.has(qStr) && !ps.has(qStr)) {
                let hasOther = false;
                for (const [x, y] of NEI) {
                  const sStr = `${q[0] + x},${q[1] + y}`;
                  if (R.has(sStr) && !ps.has(sStr)) {
                    hasOther = true;
                    break;
                  }
                }
                if (!hasOther) { ok = false; break; }
              }
            }
            if (!ok) break;
          }

          if (ok) cands.push({ path, d, crossed: crossed.size });
        }
      }
    }

    if (cands.length === 0) return null;

    const w = cands.map(c => Math.exp(beta * c.crossed));
    const chosen = rng.choices(cands, w);
    const idx = arrows.length;
    arrows.push({ cells: chosen.path, direction: chosen.d });
    for (const p of chosen.path) {
      owner.set(`${p[0]},${p[1]}`, idx);
      R.delete(`${p[0]},${p[1]}`);
    }
  }
  return arrows;
}

function analyze(arrows: any[], rows: number, cols: number) {
  const n = arrows.length;
  const own = new Map<string, number>();
  for (let i = 0; i < n; i++) {
    for (const c of arrows[i].cells) {
      own.set(`${c[0]},${c[1]}`, i);
    }
  }

  const bl: Set<number>[] = [];
  for (const a of arrows) {
    const head = a.cells[a.cells.length - 1];
    const s = new Set<number>();
    for (const x of ray(head, a.direction, rows, cols)) {
      const o = own.get(`${x[0]},${x[1]}`);
      if (o !== undefined) s.add(o);
    }
    bl.push(s);
  }

  const removed: number[] = [];
  const rs = new Set<number>();
  let prog = true;

  while (prog) {
    prog = false;
    for (let i = 0; i < n; i++) {
      if (!rs.has(i)) {
        let isSubset = true;
        for (const b of bl[i]) {
          if (!rs.has(b)) { isSubset = false; break; }
        }
        if (isSubset) { rs.add(i); removed.push(i); prog = true; }
      }
    }
  }

  const solvable = rs.size === n;
  const depth = new Map<number, number>();
  for (const i of removed) {
    let md = 0;
    for (const b of bl[i]) {
      const d = depth.get(b) || 0;
      if (d > md) md = d;
    }
    depth.set(i, 1 + md);
  }

  let maxDepth = 0;
  for (const d of depth.values()) if (d > maxDepth) maxDepth = d;

  let free = 0;
  for (const b of bl) if (b.size === 0) free++;

  let edges = 0;
  for (const b of bl) edges += b.size;

  return { solvable, depth: maxDepth, free, n, edges };
}

function blob(rows: number, cols: number, N: number, rng: PRNG): Set<string> {
  const cells = new Set<string>([`${rng.randrange(rows)},${rng.randrange(cols)}`]);
  while (cells.size < N) {
    if (rng.random() < 0.08) {
      cells.add(`${rng.randrange(rows)},${rng.randrange(cols)}`);
      continue;
    }
    const fr: string[] = [];
    for (const cStr of cells) {
      const [r, c] = cStr.split(',').map(Number);
      for (const [a, b] of NEI) {
        if (r + a >= 0 && r + a < rows && c + b >= 0 && c + b < cols) {
          const nStr = `${r + a},${c + b}`;
          if (!cells.has(nStr)) fr.push(nStr);
        }
      }
    }
    if (fr.length === 0) break;
    cells.add(rng.choice(fr));
  }
  return cells;
}

function colorArrows(arrows: any[], palette: string[], rng: PRNG): string[] {
  const own = new Map<string, number>();
  for (let i = 0; i < arrows.length; i++) {
    for (const c of arrows[i].cells) own.set(`${c[0]},${c[1]}`, i);
  }

  const adj: Set<number>[] = Array.from({ length: arrows.length }, () => new Set());
  for (const [cStr, i] of own.entries()) {
    const [r, c] = cStr.split(',').map(Number);
    for (const [a, b] of NEI) {
      const j = own.get(`${r + a},${c + b}`);
      if (j !== undefined && j !== i) adj[i].add(j);
    }
  }

  const col = new Map<number, string>();
  const use = new Map<string, number>();
  for (const p of palette) use.set(p, 0);

  const order = Array.from({ length: arrows.length }, (_, i) => i);
  rng.shuffle(order);

  for (const i of order) {
    const bad = new Set<string>();
    for (const j of adj[i]) {
      const c = col.get(j);
      if (c) bad.add(c);
    }
    let opts = palette.filter(p => !bad.has(p));
    if (opts.length === 0) opts = palette;
    
    let minUse = Infinity;
    for (const p of opts) {
      const u = use.get(p)!;
      if (u < minUse) minUse = u;
    }
    
    const bestOpts = opts.filter(p => use.get(p)! === minUse);
    const ch = rng.choice(bestOpts);
    col.set(i, ch);
    use.set(ch, use.get(ch)! + 1);
  }

  return Array.from({ length: arrows.length }, (_, i) => col.get(i)!);
}

function sizeFor(L: number) {
  let s = 4;
  const thresholds = [[7,5],[18,6],[28,7],[40,8],[52,9],[64,10],[76,11],[88,12]];
  for (const [t, v] of thresholds) {
    if (L >= t) s = v;
  }
  return s;
}

export function generateLevelData(L: number, animalName?: string, seedOffset: number = 0): Level {
  const rng = new PRNG(L * 7919 + 13 + seedOffset);
  const animal = animalName ? ANIMALS[animalName] : undefined;
  
  let best: any = null;
  let rows, cols, maxLen, beta, palette;
  
  if (animal) {
    const shape = animal[0];
    rows = shape.length;
    cols = shape[0].length;
    maxLen = Math.min(5, 3 + Math.floor(L / 40));
    beta = 0.6;
    palette = animal[1];
  } else {
    rows = cols = sizeFor(L);
    maxLen = Math.min(8, 3 + Math.floor(L / 14));
    beta = Math.min(0.55, 0.05 + L * 0.006);
    palette = BASE;
  }

  const target = 1.5 + L * 0.11;
  let got = 0;
  let tries = 0;
  const K = 30; // reduce tries for on-the-fly generation

  while (got < K && tries < K * 30) {
    tries++;
    let R: Set<string>;
    if (!animal) {
      const N = Math.max(L < 2 ? 4 : L < 4 ? 5 : 6, Math.round(rows * cols * (0.32 + 0.0045 * L)));
      R = blob(rows, cols, N, rng);
    } else {
      R = shapeCells(animal[0]);
    }
    
    const arrows = peel(R, rows, cols, rng, maxLen, beta);
    if (!arrows) continue;
    
    const st = analyze(arrows, rows, cols);
    if (!st.solvable) continue;
    
    if (!animal && st.n < (L < 5 ? 2 : L < 12 ? 3 : L < 30 ? 4 : 6)) continue;
    got++;
    
    const score = animal ? (st.depth * 10 - st.free * 4 + st.n) : (-Math.abs(st.depth - target) * 10 - st.free * 0.5);
    if (!best || score > best[0]) {
      best = [score, arrows, st];
    }
  }

  if (!best) {
    // If it fails to generate within the constraints, recurse with a different seed offset
    return generateLevelData(L, animalName, seedOffset + 1);
  }

  const [_, finalArrows, __] = best;
  rng.shuffle(finalArrows);
  const cols_ = colorArrows(finalArrows, palette, rng);

  const parsedArrows: Arrow[] = finalArrows.map((a: any, i: number) => ({
    id: String(i + 1),
    cells: a.cells.map((c: [number, number]) => ({ r: c[0], c: c[1] })),
    direction: a.direction,
    color: cols_[i],
    active: true,
    cleared: false
  }));

  return {
    id: L,
    gridSize: { rows, cols },
    arrows: parsedArrows
  };
}

export function getAnimalNameForLevel(L: number): string | undefined {
  const order = Object.keys(ANIMALS).sort((a, b) => {
    const ca = shapeCells(ANIMALS[a][0]).size;
    const cb = shapeCells(ANIMALS[b][0]).size;
    return ca - cb;
  });
  
  const alvls = Array.from({ length: 19 }, (_, i) => 10 + i * 5); // 10, 15, ..., 100
  const idx = alvls.indexOf(L);
  if (idx !== -1 && idx < order.length) return order[idx];
  return undefined;
}
