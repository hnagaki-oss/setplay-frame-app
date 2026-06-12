import type { MoveCategory } from './types';

export interface OfficialFrameMoveSource {
  name: string;
  displayName?: string;
  officialCategory: string;
  startupText: string;
  activeText: string;
  recoveryText: string;
  totalFrameText?: string;
  activeDetailText?: string;
  note?: string;
  inputText?: string;
  commandText?: string;
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
  超必殺技: 'super',
  共通システム: 'common',
  通常投げ: 'common',
};

export function mapOfficialCategory(category: string): MoveCategory | null {
  return OFFICIAL_CATEGORY_MAP[category] ?? null;
}

export function shouldImportOfficialFrameMove(move: OfficialFrameMoveSource): boolean {
  const name = move.name;
  const inputText = move.inputText ?? '';
  if (/ジャンプ中に/.test(inputText)) return false;
  if (/^ジャンプ/.test(name)) return false;
  if (/空中/.test(name)) return false;
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
  const calculatedTotalFrames =
    startupFrames !== null && surfaceActive.activeStartFrames !== null && surfaceActive.activeFrames !== null && recoveryFrames !== null
      ? startupFrames + (surfaceActive.activeFrames - surfaceActive.activeStartFrames + 1) + recoveryFrames - 1
      : null;
  const officialTotalFrames = move.totalFrameText?.trim()
    ? parseStrictInteger(move.totalFrameText) ?? parseTotalFramesFromText(move.totalFrameText)
    : null;
  const notedTotalFrames = parseTotalFramesFromText(`${move.recoveryText} ${move.note ?? ''}`);
  const totalFrames = officialTotalFrames ?? calculatedTotalFrames ?? notedTotalFrames;

  return {
    name: move.displayName?.trim() || buildOfficialMoveName(move, category),
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
  const segments = extractFrameSegments(activeText);
  if (segments.length > 0) {
    const last = segments[segments.length - 1];
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
  const segments = extractFrameSegments(activeText);
  if (segments.length > 0) {
    const first = segments[0];
    return {
      activeStartFrames: first.start,
      activeFrames: first.end,
    };
  }
  return parseFinalActiveRange(activeText);
}

function extractFrameSegments(text: string): Array<{ start: number; end: number }> {
  const withoutFootnoteMarkers = text.replace(/\[\s*※\d+\s*\]|※\d+/g, '');
  return [...withoutFootnoteMarkers.matchAll(/(-?\d+)\s*-\s*(-?\d+)|(-?\d+)/g)].map((match) => {
    if (match[1] !== undefined && match[2] !== undefined) {
      return { start: Number(match[1]), end: Number(match[2]) };
    }
    const frame = Number(match[3]);
    return { start: frame, end: frame };
  });
}

function parseFirstNumber(text: string): number | null {
  const match = text.match(/-?\d+/);
  return match ? Number(match[0]) : null;
}

function parseStrictInteger(text: string): number | null {
  const trimmed = text.trim();
  return /^-?\d+$/.test(trimmed) ? Number(trimmed) : null;
}

function parseTotalFramesFromText(text: string): number | null {
  const match = text.match(/全体\s*(\d+)\s*F?/i);
  return match ? Number(match[1]) : null;
}

function buildOfficialFrameMemo(move: OfficialFrameMoveSource): string {
  const parts = [`公式カテゴリ: ${move.officialCategory}`];

  if (move.commandText?.trim()) {
    parts.push(`公式コマンド: ${move.commandText.trim()}`);
  }

  if (move.displayName?.trim() && move.displayName.trim() !== move.name.trim()) {
    parts.push(`公式技名: ${move.name.trim()}`);
  }

  parts.push(
    `公式発生: ${move.startupText || '-'}`,
    `公式持続: ${move.activeText || '-'}`
  );

  if (move.activeDetailText?.trim()) {
    parts.push(`持続詳細: ${move.activeDetailText.trim()}`);
  }

  parts.push(`硬直: ${move.recoveryText || '-'}`);

  if (move.totalFrameText?.trim()) {
    parts.push(`公式全体: ${move.totalFrameText.trim()}`);
  }

  if (move.note?.trim()) {
    const frameNotes = extractFrameRelatedNotes(move.note);
    if (frameNotes.length > 0) {
      parts.push(`フレーム補足: ${frameNotes.join(' / ')}`);
    }
    parts.push(`備考: ${move.note.trim()}`);
  }

  return parts.join('\n');
}

function buildOfficialMoveName(move: OfficialFrameMoveSource, category: MoveCategory): string {
  const commandText = move.commandText?.trim();
  if (category !== 'normal' && commandText) {
    return `${commandText}（${move.name}）`;
  }
  return move.name;
}

function extractFrameRelatedNotes(note: string): string[] {
  return note
    .split(/\n|。|(?<=F)\s+/)
    .map((part) => part.trim())
    .filter((part) => /全体|発生|持続|硬直|フレーム|\d+\s*F/i.test(part));
}
