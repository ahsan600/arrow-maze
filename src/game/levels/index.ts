import { Level } from '../../types/game.types';
import { levels1_10 } from './levels1_10';
import { levels11_20 } from './levels11_20';
import { levels21_30 } from './levels21_30';
import { levels31_40 } from './levels31_40';
import { levels41_50 } from './levels41_50';
import { levels51_60 } from './levels51_60';
import { levels61_70 } from './levels61_70';
import { levels71_80 } from './levels71_80';
import { levels81_90 } from './levels81_90';
import { levels91_100 } from './levels91_100';

export const allLevels: Level[] = [
  ...levels1_10,
  ...levels11_20,
  ...levels21_30,
  ...levels31_40,
  ...levels41_50,
  ...levels51_60,
  ...levels61_70,
  ...levels71_80,
  ...levels81_90,
  ...levels91_100
];
