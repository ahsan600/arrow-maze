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
  prefetchLevels,
  stageOf,
  tierOf,
  TIERS,
  shapeFor,
  getBoardSize,
} from './proceduralEngine';

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
  prefetchLevels,
  stageOf,
  tierOf,
  TIERS,
  shapeFor,
  getBoardSize,
};

/**
 * Global allLevels proxy providing O(1) procedural access to unlimited levels.
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
        for (let i = 1; i <= 1000; i++) {
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
    if (!isNaN(index) && index >= 0) {
      return getLevel(index + 1);
    }
    return (target as any)[prop];
  },
});
