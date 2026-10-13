import React from 'react';
import { View, ViewProps, StyleSheet } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';

interface GlassCardProps extends ViewProps {
  children: React.ReactNode;
}

export const GlassCard: React.FC<GlassCardProps> = React.memo(({ children, style, className, ...props }) => {
  const { theme, mode } = useTheme();
  const glassBg = mode === 'dark' ? 'rgba(20, 20, 20, 0.82)' : 'rgba(255, 255, 255, 0.88)';
  return (
    <View 
      style={[{ 
        width: '100%', 
        backgroundColor: glassBg, 
        borderRadius: 24, 
        padding: 24,
        borderWidth: 1,
        borderColor: mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.6)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
        elevation: 6,
      }, style]}
      {...props}
    >
      {children}
    </View>
  );
});

const styles = StyleSheet.create({});
