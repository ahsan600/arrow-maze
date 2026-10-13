import React, { useMemo } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { MazeState, CellCoord, isSameCell } from '../../game/engine/MazeEngine';
import { colors } from '../../theme/colors';

interface MazeBoardProps {
  state: MazeState;
  onStateChange: (state: MazeState) => void;
  disabled?: boolean;
}

export const MazeBoard: React.FC<MazeBoardProps> = ({ state, onStateChange, disabled }) => {
  const { gridSize, edges } = state.level;
  const screenWidth = Dimensions.get('window').width;
  const padding = 24 * 2;
  const boardSize = screenWidth - padding;
  const cellSize = boardSize / Math.max(gridSize.rows, gridSize.cols);
  const strokeWidth = cellSize * 0.2;
  const halfCell = cellSize / 2;

  // Build the background maze path
  const baseMazePath = useMemo(() => {
    let d = '';
    edges.forEach(edge => {
      const x1 = edge.from.c * cellSize + halfCell;
      const y1 = edge.from.r * cellSize + halfCell;
      const x2 = edge.to.c * cellSize + halfCell;
      const y2 = edge.to.r * cellSize + halfCell;
      d += `M ${x1} ${y1} L ${x2} ${y2} `;
      
      if (edge.isOneWay) {
        // Simple arrowhead logic in the middle of the segment
        const mx = (x1 + x2) / 2;
        const my = (y1 + y2) / 2;
        const headSize = cellSize * 0.15;
        if (y1 === y2) { // horizontal
          const sign = x2 > x1 ? 1 : -1;
          d += `M ${mx - sign*headSize} ${my - headSize} L ${mx + sign*headSize} ${my} L ${mx - sign*headSize} ${my + headSize} `;
        } else { // vertical
          const sign = y2 > y1 ? 1 : -1;
          d += `M ${mx - headSize} ${my - sign*headSize} L ${mx} ${my + sign*headSize} L ${mx + headSize} ${my - sign*headSize} `;
        }
      }
    });
    return d;
  }, [edges, cellSize, halfCell]);

  // Build traced path
  const tracedPath = useMemo(() => {
    if (state.tracedPath.length === 0) return '';
    return state.tracedPath.map((cell, i) => {
      const x = cell.c * cellSize + halfCell;
      const y = cell.r * cellSize + halfCell;
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');
  }, [state.tracedPath, cellSize, halfCell]);

  // Gesture handling
  const panGesture = Gesture.Pan()
    .onBegin((e) => {
      if (disabled) return;
      const c = Math.floor(e.x / cellSize);
      const r = Math.floor(e.y / cellSize);
      if (c >= 0 && c < gridSize.cols && r >= 0 && r < gridSize.rows) {
        import('../../game/engine/MazeEngine').then(({ tryMove }) => {
          onStateChange(tryMove(state, { r, c }));
        });
      }
    })
    .onChange((e) => {
      if (disabled) return;
      const c = Math.floor(e.x / cellSize);
      const r = Math.floor(e.y / cellSize);
      if (c >= 0 && c < gridSize.cols && r >= 0 && r < gridSize.rows) {
        // Only update if we entered a new cell
        const lastCell = state.tracedPath[state.tracedPath.length - 1];
        if (!lastCell || !isSameCell(lastCell, {r, c})) {
          import('../../game/engine/MazeEngine').then(({ tryMove }) => {
            onStateChange(tryMove(state, { r, c }));
          });
        }
      }
    })
    .runOnJS(true);

  return (
    <GestureDetector gesture={panGesture}>
      <View style={[styles.board, { width: boardSize, height: boardSize }]}>
        <Svg width={boardSize} height={boardSize}>
          {/* Base Maze */}
          <Path 
            d={baseMazePath} 
            stroke={colors.primary} 
            strokeWidth={strokeWidth} 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            fill="none" 
          />
          
          {/* Traced Path */}
          {tracedPath ? (
            <Path 
              d={tracedPath} 
              stroke={colors.accent} 
              strokeWidth={strokeWidth * 0.8} 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              fill="none" 
            />
          ) : null}
        </Svg>
      </View>
    </GestureDetector>
  );
};

const styles = StyleSheet.create({
  board: {
    position: 'relative',
    overflow: 'hidden',
  },
});
