import { Level } from '../../types/game.types';
import {
  getLevel,
  generateLevel,
  decodeLevel,
  encodeLevel,
  TOTAL_STORED_LEVELS,
  LevelManager,
  analyze,
  solve,
  validate,
} from './proceduralEngine';

// Old static 1-100 level definitions preserved but unused per user request:
import { levels1_10 as _unused_levels1_10 } from './levels1_10';
import { levels11_20 as _unused_levels11_20 } from './levels11_20';
import { levels21_30 as _unused_levels21_30 } from './levels21_30';
import { levels31_40 as _unused_levels31_40 } from './levels31_40';
import { levels41_50 as _unused_levels41_50 } from './levels41_50';
import { levels51_60 as _unused_levels51_60 } from './levels51_60';
import { levels61_70 as _unused_levels61_70 } from './levels61_70';
import { levels71_80 as _unused_levels71_80 } from './levels71_80';
import { levels81_90 as _unused_levels81_90 } from './levels81_90';
import { levels91_100 as _unused_levels91_100 } from './levels91_100';

export const oldLevels: Level[] = [
  ..._unused_levels1_10,
  ..._unused_levels11_20,
  ..._unused_levels21_30,
  ..._unused_levels31_40,
  ..._unused_levels41_50,
  ..._unused_levels51_60,
  ..._unused_levels61_70,
  ..._unused_levels71_80,
  ..._unused_levels81_90,
  ..._unused_levels91_100,
];

export {
  getLevel,
  generateLevel,
  decodeLevel,
  encodeLevel,
  TOTAL_STORED_LEVELS,
  LevelManager,
  analyze,
  solve,
  validate,
};

/**
 * Global allLevels proxy providing O(1) access to all 10,000 generated levels.
 */
export const allLevels: Level[] = new Proxy([] as Level[], {
  get(target, prop) {
    if (prop === 'find') {
      return (predicate: (l: Level) => boolean) => {
        const str = predicate.toString();
        const match = str.match(/(?:id\s*===?\s*|===\s*)(\d+)/);
        if (match) {
          const id = parseInt(match[1], 10);
          if (id >= 1) return getLevel(id);
        }
        for (let i = 1; i <= Math.min(1000, TOTAL_STORED_LEVELS); i++) {
          const l = getLevel(i);
          if (predicate(l)) return l;
        }
        return undefined;
      };
    }
    if (prop === 'length') {
      return TOTAL_STORED_LEVELS;
    }
    const index = typeof prop === 'string' ? Number(prop) : NaN;
    if (!isNaN(index) && index >= 0 && index < TOTAL_STORED_LEVELS) {
      return getLevel(index + 1);
    }
    return (target as any)[prop];
  },
});
