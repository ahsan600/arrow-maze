import React from 'react';
import { View, StatusBar, ViewProps, StyleSheet, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Pattern, Rect, Defs, Circle } from 'react-native-svg';
import { useTheme } from '../../theme/ThemeContext';

interface ScreenContainerProps extends ViewProps {
  children: React.ReactNode;
  centered?: boolean;
  useBackgroundImage?: boolean;
  overlayOpacity?: number;
  edges?: readonly ('top' | 'right' | 'bottom' | 'left')[];
  showDots?: boolean;
}

/**
 * ScreenContainer with Full-Screen Dot Matrix Grid
 */
export const ScreenContainer: React.FC<ScreenContainerProps> = React.memo(({
  children,
  centered = false,
  useBackgroundImage = false,
  edges,
  showDots = true,
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

      {/* Full-screen seamless dot matrix grid */}
      {showDots && (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <Svg width="100%" height="100%">
            <Defs>
              <Pattern id="dotMatrix" width="24" height="24" patternUnits="userSpaceOnUse">
                <Circle
                  cx="12"
                  cy="12"
                  r="1.4"
                  fill={mode === 'dark' ? 'rgba(255, 255, 255, 0.14)' : 'rgba(43, 45, 91, 0.18)'}
                />
              </Pattern>
            </Defs>
            <Rect width="100%" height="100%" fill="url(#dotMatrix)" />
          </Svg>
        </View>
      )}


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
