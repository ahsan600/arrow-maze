import React from 'react';
import { View, StatusBar, ViewProps, StyleSheet, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Line, Pattern, Rect, Defs } from 'react-native-svg';
import { useTheme } from '../../theme/ThemeContext';

interface ScreenContainerProps extends ViewProps {
  children: React.ReactNode;
  centered?: boolean;
  useBackgroundImage?: boolean;
  overlayOpacity?: number;
  edges?: readonly ('top' | 'right' | 'bottom' | 'left')[];
}

/**
 * ScreenContainer with Craft Table Paper Texture
 * Sets up safe area, status bar, and faint paper craft-table grain/cutting-mat grid.
 */
export const ScreenContainer: React.FC<ScreenContainerProps> = React.memo(({
  children,
  centered = false,
  useBackgroundImage = false,
  edges,
  style,
  ...props
}) => {
  const { theme, mode } = useTheme();

  React.useEffect(() => {
    if (Platform.OS === 'android') {
      (StatusBar as any).setTranslucent?.(true);
      (StatusBar as any).setBackgroundColor?.('transparent');
    }
  }, []);

  return (
    <View style={[styles.root, { backgroundColor: theme.appBackground }]}>
      <StatusBar
        barStyle={mode === 'dark' ? 'light-content' : 'dark-content'}
        {...(Platform.OS === 'android' ? { backgroundColor: 'transparent', translucent: true } : {})}
      />

      {/* Faint paper cutting mat / craft table grid lines */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <Svg width="100%" height="100%">
          <Defs>
            <Pattern id="craftGrid" width="40" height="40" patternUnits="userSpaceOnUse">
              <Line
                x1="0"
                y1="40"
                x2="40"
                y2="40"
                stroke={theme.crease}
                strokeWidth="0.8"
                strokeDasharray="2 4"
              />
              <Line
                x1="40"
                y1="0"
                x2="40"
                y2="40"
                stroke={theme.crease}
                strokeWidth="0.8"
                strokeDasharray="2 4"
              />
            </Pattern>
          </Defs>
          <Rect width="100%" height="100%" fill="url(#craftGrid)" />
        </Svg>
      </View>

      <SafeAreaView style={{ flex: 1 }} edges={edges}>
        <View style={[styles.container, centered && styles.centered, style]} {...props}>
          {children}
        </View>
      </SafeAreaView>
    </View>
  );
});

const styles = StyleSheet.create({
  root: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
