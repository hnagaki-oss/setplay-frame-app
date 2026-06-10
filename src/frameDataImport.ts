import type { MoveCategory } from './types';

export interface OfficialFrameMoveSource {
  name: string;
  officialCategory: string;
  activeText: string;
  note?: string;
  inputText?: string;
}

export interface ParsedFinalActiveRange {
  activeStartFrames: number | null;
  activeFrames: number | null;
}

const OFFICIAL_CATEGORY_MAP: Record<string, MoveCategory> = {
  通常技: 'normal',
  特殊技: 'commandNormal',
  必殺技: 'special',
  スーパーアーツ: 'super',
  共通システム: 'common',
  通常投げ: 'common',
};

export function mapOfficialCategory(category: string): MoveCategory | null {
  return OFFICIAL_CATEGORY_MAP[category] ?? null;
}

export function shouldImportOfficialFrameMove(move: OfficialFrameMoveSource): boolean {
  const haystack = `${move.name} ${move.inputText ?? ''} ${move.note ?? ''}`;
  if (haystack.includes('ジャンプ')) return false;
  if (move.officialCategory === '必殺技' && /空中|ジャンプ中/.test(haystack)) return false;
  return mapOfficialCategory(move.officialCategory) !== null;
}

export function parseFinalActiveRange(activeText: string): ParsedFinalActiveRange {
  const ranges = [...activeText.matchAll(/(-?\d+)\s*-\s*(-?\d+)/g)];
  if (ranges.length > 0) {
    const last = ranges[ranges.length - 1];
    return {
      activeStartFrames: Number(last[1]),
      activeFrames: Number(last[2]),
    };
  }

  const single = activeText.match(/-?\d+/);
  if (!single) {
    return { activeStartFrames: null, activeFrames: null };
  }

  const frame = Number(single[0]);
  return { activeStartFrames: frame, activeFrames: frame };
}
