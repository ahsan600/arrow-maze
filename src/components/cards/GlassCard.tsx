import React from 'react';
import { ViewProps } from 'react-native';
import { PaperCard } from './PaperCard';

export interface GlassCardProps extends ViewProps {
  children: React.ReactNode;
  dogEar?: boolean;
}

export const GlassCard: React.FC<GlassCardProps> = React.memo(({ children, style, dogEar = false, ...props }) => {
  return (
    <PaperCard style={style} dogEar={dogEar} radiusSize="lg" {...props}>
      {children}
    </PaperCard>
  );
});
