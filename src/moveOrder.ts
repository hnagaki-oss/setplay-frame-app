import { ALL_MOVE_CATEGORIES } from './constants';
import type { Move, PresetMove } from './types';

export const MOVE_CATEGORY_SORT_ORDER = new Map(
  ALL_MOVE_CATEGORIES.map((category, index) => [category, index])
);

export function compareMovesByRegisteredOrder(
  a: Move,
  b: Move,
  presetMoves: PresetMove[] = []
): number {
  const displayOrderA = getDisplayOrder(a);
  const displayOrderB = getDisplayOrder(b);

  if (displayOrderA !== null || displayOrderB !== null) {
    if (displayOrderA === null) return 1;
    if (displayOrderB === null) return -1;
    if (displayOrderA !== displayOrderB) return displayOrderA - displayOrderB;
  }

  if (presetMoves.length > 0) {
    const presetIndexA = findPresetMoveIndex(a, presetMoves);
    const presetIndexB = findPresetMoveIndex(b, presetMoves);
    if (presetIndexA !== -1 || presetIndexB !== -1) {
      if (presetIndexA === -1) return 1;
      if (presetIndexB === -1) return -1;
      if (presetIndexA !== presetIndexB) return presetIndexA - presetIndexB;
    }
  }

  return a.createdAt.localeCompare(b.createdAt) || a.name.localeCompare(b.name, 'ja');
}

export function sortMovesByRegisteredOrder(
  moves: Move[],
  presetMoves: PresetMove[] = []
): Move[] {
  return [...moves].sort((a, b) => compareMovesByRegisteredOrder(a, b, presetMoves));
}

export function getNextDisplayOrder(moves: Move[]): number {
  return moves.reduce((maxOrder, move) => {
    const displayOrder = getDisplayOrder(move);
    return displayOrder === null ? maxOrder : Math.max(maxOrder, displayOrder);
  }, -1) + 1;
}

export function buildDisplayOrderMap(moves: Move[]): Map<string, number> {
  const displayOrderMap = new Map<string, number>();
  let displayOrder = 0;
  for (const category of ALL_MOVE_CATEGORIES) {
    for (const move of moves.filter((candidate) => candidate.category === category)) {
      displayOrderMap.set(move.id, displayOrder);
      displayOrder += 1;
    }
  }
  return displayOrderMap;
}

export function sortMovesByCategoryThenRegisteredOrder(moves: Move[]): Move[] {
  return [...moves].sort((a, b) =>
    (MOVE_CATEGORY_SORT_ORDER.get(a.category) ?? 999) -
      (MOVE_CATEGORY_SORT_ORDER.get(b.category) ?? 999) ||
    compareMovesByRegisteredOrder(a, b)
  );
}

function findPresetMoveIndex(move: Move, presetMoves: PresetMove[]): number {
  return presetMoves.findIndex((presetMove) =>
    presetMove.name === move.name && presetMove.category === move.category
  );
}

function getDisplayOrder(move: Move): number | null {
  return Number.isFinite(move.displayOrder) ? move.displayOrder as number : null;
}
