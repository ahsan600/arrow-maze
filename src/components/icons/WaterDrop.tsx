import React from 'react';
import Svg, { Path } from 'react-native-svg';
import { useTheme } from '../../theme/ThemeContext';

export const WaterDrop = ({ size = 24, color = '#50A4FF', empty = false }: { size?: number; color?: string; empty?: boolean }) => {
  const { theme } = useTheme();
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {empty ? (
        <Path 
          d="M12 21a7 7 0 01-4.95-11.95L12 3l4.95 6.05A7 7 0 0112 21z" 
          fill={theme.disabledState} 
        />
      ) : (
        <Path 
          d="M12 21a7 7 0 01-4.95-11.95L12 3l4.95 6.05A7 7 0 0112 21z" 
          fill={color} 
        />
      )}
    </Svg>
  );
};
