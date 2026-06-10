import type { MoveCategory } from './types';

export interface OfficialFrameMoveSource {
  name: string;
  officialCategory: string;
  startupText: string;
  activeText: string;
  recoveryText: string;
  activeDetailText?: string;
  note?: string;
  inputText?: string;
}

export interface ParsedFinalActiveRange {
  activeStartFrames: number | null;
  activeFrames: number | null;
}

export interface ParsedOfficialFrameMove {
  name: string;
  category: MoveCategory;
  startupFrames: number | null;
  activeStartFrames: number | null;
  activeFrames: number | null;
  totalFrames: number | null;
  memo: string;
  enabled: boolean;
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

export function parseOfficialFrameMove(move: OfficialFrameMoveSource): ParsedOfficialFrameMove | null {
  if (!shouldImportOfficialFrameMove(move)) return null;

  const category = mapOfficialCategory(move.officialCategory);
  if (!category) return null;

  const startupFrames = parseFirstNumber(move.startupText);
  const surfaceActive = parseFirstActiveRange(move.activeText);
  const finalActive = parseFinalActiveRange(move.activeDetailText?.trim() ? move.activeDetailText : move.activeText);
  const recoveryFrames = parseStrictInteger(move.recoveryText);
  const totalFrames =
    startupFrames !== null && surfaceActive.activeStartFrames !== null && surfaceActive.activeFrames !== null && recoveryFrames !== null
      ? startupFrames + (surfaceActive.activeFrames - surfaceActive.activeStartFrames + 1) + recoveryFrames - 1
      : null;

  return {
    name: move.name,
    category,
    startupFrames,
    activeStartFrames: finalActive.activeStartFrames,
    activeFrames: finalActive.activeFrames,
    totalFrames,
    memo: buildOfficialFrameMemo(move),
    enabled: totalFrames !== null,
  };
}

export function parseFinalActiveRange(activeText: string): ParsedFinalActiveRange {
  const ranges = extractFrameRanges(activeText);
  if (ranges.length > 0) {
    const last = ranges[ranges.length - 1];
    return {
      activeStartFrames: last.start,
      activeFrames: last.end,
    };
  }

  const frame = parseFirstNumber(activeText);
  if (frame === null) {
    return { activeStartFrames: null, activeFrames: null };
  }

  return { activeStartFrames: frame, activeFrames: frame };
}

export function parseFirstActiveRange(activeText: string): ParsedFinalActiveRange {
  const ranges = extractFrameRanges(activeText);
  if (ranges.length > 0) {
    const first = ranges[0];
    return {
      activeStartFrames: first.start,
      activeFrames: first.end,
    };
  }
  return parseFinalActiveRange(activeText);
}

function extractFrameRanges(text: string): Array<{ start: number; end: number }> {
  return [...text.matchAll(/(-?\d+)\s*-\s*(-?\d+)/g)].map((match) => ({
    start: Number(match[1]),
    end: Number(match[2]),
  }));
}

function parseFirstNumber(text: string): number | null {
  const match = text.match(/-?\d+/);
  return match ? Number(match[0]) : null;
}

function parseStrictInteger(text: string): number | null {
  const trimmed = text.trim();
  return /^-?\d+$/.test(trimmed) ? Number(trimmed) : null;
}

function buildOfficialFrameMemo(move: OfficialFrameMoveSource): string {
  const parts = [
    `公式カテゴリ: ${move.officialCategory}`,
    `公式発生: ${move.startupText || '-'}`,
    `公式持続: ${move.activeText || '-'}`,
  ];

  if (move.activeDetailText?.trim()) {
    parts.push(`持続詳細: ${move.activeDetailText.trim()}`);
  }

  parts.push(`硬直: ${move.recoveryText || '-'}`);

  if (move.note?.trim()) {
    parts.push(`備考: ${move.note.trim()}`);
  }

  return parts.join('\n');
}
