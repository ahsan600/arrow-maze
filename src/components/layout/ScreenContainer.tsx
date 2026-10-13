import React from 'react';
import { View, StatusBar, ViewProps, StyleSheet, ImageBackground, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../theme/ThemeContext';

interface ScreenContainerProps extends ViewProps {
  children: React.ReactNode;
  centered?: boolean;
  useBackgroundImage?: boolean;
  overlayOpacity?: number;
  edges?: readonly ('top' | 'right' | 'bottom' | 'left')[];
}

export const ScreenContainer: React.FC<ScreenContainerProps> = React.memo(({
  children,
  centered = false,
  useBackgroundImage = false,
  overlayOpacity,
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

  const defaultOverlay = mode === 'dark' ? 0.45 : 0.15;
  const overlay = overlayOpacity !== undefined ? overlayOpacity : defaultOverlay;

  const content = (
    <SafeAreaView style={{ flex: 1 }} edges={edges}>
      <StatusBar barStyle={mode === 'dark' || useBackgroundImage ? 'light-content' : 'dark-content'} />
      <View 
        style={[styles.container, centered && styles.centered, style]}
        {...props}
      >
        {children}
      </View>
    </SafeAreaView>
  );

  if (useBackgroundImage) {
    return (
      <ImageBackground
        source={require('../../assets/backgroundImage.png')}
        style={styles.imageBackground}
        resizeMode="cover"
      >
        <View style={[styles.overlay, { backgroundColor: `rgba(0,0,0,${overlay})` }]}>
          {content}
        </View>
      </ImageBackground>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.appBackground }}>
      <StatusBar barStyle={mode === 'dark' ? 'light-content' : 'dark-content'} />
      <View 
        style={[styles.container, centered && styles.centered, style]}
        {...props}
      >
        {children}
      </View>
    </SafeAreaView>
  );
});

const styles = StyleSheet.create({
  imageBackground: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
