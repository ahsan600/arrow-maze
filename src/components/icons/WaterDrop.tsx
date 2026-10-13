import React from 'react';
import Svg, { Circle, Path, G } from 'react-native-svg';
import { useTheme } from '../../theme/ThemeContext';

interface HankoStampProps {
  size?: number;
  color?: string;
  empty?: boolean;
}

/**
 * Japanese "Hanko" Ink Seal Stamp
 * Represents player lives: a stamped ink impression with a droplet seal mark.
 * When lost (empty): the ink stamp shows a crack and fades to muted gray.
 */
export const WaterDrop: React.FC<HankoStampProps> = ({
  size = 28,
  color,
  empty = false,
}) => {
  const { theme, mode } = useTheme();

  const inkColor = empty
    ? theme.hankoFaded
    : (color || theme.hanko);

  const opacity = empty ? 0.35 : 0.95;

  return (
    <Svg width={size} height={size} viewBox="0 0 32 32">
      <G opacity={opacity}>
        {/* Outer stamped seal circle with slight organic hand-carved variation */}
        <Circle
          cx={16}
          cy={16}
          r={13.5}
          fill="none"
          stroke={inkColor}
          strokeWidth={2.4}
          strokeDasharray={empty ? "8 2 4 2" : undefined}
        />

        {/* Inner ink seal character: origami droplet / water crest */}
        <Path
          d="M 16 6.5 C 16 6.5 9.5 14.5 9.5 19 C 9.5 22.6 12.4 25.5 16 25.5 C 19.6 25.5 22.5 22.6 22.5 19 C 22.5 14.5 16 6.5 16 6.5 Z"
          fill={empty ? "none" : inkColor}
          stroke={inkColor}
          strokeWidth={empty ? 1.5 : 0}
        />

        {/* Origami fold crease line running down center of droplet */}
        <Path
          d="M 16 7 L 16 25"
          stroke={empty ? inkColor : (mode === 'dark' ? '#1B1A2E' : '#FFFDF8')}
          strokeWidth={1.2}
          strokeLinecap="round"
        />

        {/* Crack line when lost */}
        {empty && (
          <Path
            d="M 8 10 L 14 15 L 18 14 L 24 22"
            stroke={mode === 'dark' ? '#F6EFE4' : '#2B2D5B'}
            strokeWidth={1.5}
            strokeLinecap="round"
            opacity={0.6}
          />
        )}
      </G>
    </Svg>
  );
};
