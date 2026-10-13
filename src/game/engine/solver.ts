import { PuzzleState, getAvailableMoves, stepArrow as moveArrow, isLevelComplete } from './PuzzleEngine';

export function solveLevel(state: PuzzleState, maxDepth = 100): string[] | null {
  const visited = new Set<string>();

  function dfs(currentState: PuzzleState, path: string[], depth: number): string[] | null {
    if (isLevelComplete(currentState)) return path;
    if (depth >= maxDepth) return null;

    const stateKey = currentState.arrows
      .filter(a => a.active && !a.cleared)
      .map(a => a.id)
      .sort()
      .join(',');

    if (visited.has(stateKey)) return null;
    visited.add(stateKey);

    const moves = getAvailableMoves(currentState);
    for (const move of moves) {
      const nextState = moveArrow(currentState, move);
      const result = dfs(nextState, [...path, move], depth + 1);
      if (result) return result;
    }

    return null;
  }

  return dfs(state, [], 0);
}
