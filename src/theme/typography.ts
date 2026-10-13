import { Platform } from 'react-native';

export const typography = {
  fontFamily: Platform.select({
    ios: 'System',
    android: 'sans-serif-medium',
    default: 'sans-serif',
  }),
  headingFamily: Platform.select({
    ios: 'System',
    android: 'sans-serif-condensed',
    default: 'sans-serif',
  }),
  sizes: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 22,
    xxl: 28,
    huge: 36,
    display: 44,
  },
  weights: {
    regular: '400' as const,
    medium: '500' as const,
    semiBold: '600' as const,
    bold: '700' as const,
    extraBold: '800' as const,
    black: '900' as const,
  },
};
