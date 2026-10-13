import React from 'react';
import { View, ViewProps, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useTheme } from '../../theme/ThemeContext';
import { radius as radiusTokens } from '../../theme/radius';

export interface PaperCardProps extends ViewProps {
  children: React.ReactNode;
  dogEar?: boolean;
  dogEarSize?: number;
  dogEarPosition?: 'top-right' | 'top-left';
  radiusSize?: 'sm' | 'md' | 'lg' | 'xl';
  flat?: boolean;
  style?: StyleProp<ViewStyle>;
}

export const PaperCard: React.FC<PaperCardProps> = React.memo(({
  children,
  dogEar = false,
  dogEarSize = 22,
  dogEarPosition = 'top-right',
  radiusSize = 'lg',
  flat = false,
  style,
  ...props
}) => {
  const { theme, mode } = useTheme();

  const borderRadius = radiusTokens[radiusSize] ?? radiusTokens.lg;
  const shadowColor = theme.shadow;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.cardBackground,
          borderRadius,
          borderColor: theme.border,
          borderWidth: 1,
          borderTopColor: theme.creaseHighlight,
          borderTopWidth: 1.5,
          shadowColor,
          shadowOffset: { width: 0, height: flat ? 2 : 4 },
          shadowOpacity: mode === 'dark' ? 0.35 : 0.16,
          shadowRadius: flat ? 4 : 10,
          elevation: flat ? 2 : 4,
        },
        style,
      ]}
      {...props}
    >
      {/* Dog-ear folded corner */}
      {dogEar && (
        <View
          style={[
            styles.dogEarContainer,
            dogEarPosition === 'top-right' ? styles.dogEarRight : styles.dogEarLeft,
            { width: dogEarSize, height: dogEarSize },
          ]}
          pointerEvents="none"
        >
          <Svg width={dogEarSize} height={dogEarSize} viewBox="0 0 24 24">
            {dogEarPosition === 'top-right' ? (
              <>
                {/* Fold crease shadow underneath fold */}
                <Path d="M 0 0 L 24 24 L 0 24 Z" fill={theme.crease} />
                {/* Folded paper flap */}
                <Path
                  d="M 0 0 L 24 24 L 24 0 Z"
                  fill={mode === 'dark' ? '#3B3860' : '#EDE4D3'}
                />
                {/* 1px highlight crease fold line */}
                <Path d="M 0 0 L 24 24" stroke={theme.border} strokeWidth={1} />
              </>
            ) : (
              <>
                <Path d="M 24 0 L 0 24 L 24 24 Z" fill={theme.crease} />
                <Path
                  d="M 24 0 L 0 24 L 0 0 Z"
                  fill={mode === 'dark' ? '#3B3860' : '#EDE4D3'}
                />
                <Path d="M 24 0 L 0 24" stroke={theme.border} strokeWidth={1} />
              </>
            )}
          </Svg>
        </View>
      )}

      {children}
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    position: 'relative',
    overflow: 'hidden',
  },
  dogEarContainer: {
    position: 'absolute',
    top: 0,
    zIndex: 10,
  },
  dogEarRight: {
    right: 0,
  },
  dogEarLeft: {
    left: 0,
  },
});
