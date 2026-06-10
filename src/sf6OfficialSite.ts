import type { ControlTypeId } from './types';
import {
  type OfficialFrameMoveSource,
  type ParsedOfficialFrameMove,
  parseOfficialFrameMove,
} from './frameDataImport';

export type Sf6OfficialCharacter = {
  slug: string;
  name: string;
  framePath: string;
};

export type Sf6OfficialRosterResult = {
  source: 'official-site' | 'fallback';
  characters: Sf6OfficialCharacter[];
  error?: string;
};

export type Sf6OfficialFrameDataResult = {
  source: 'official-site';
  slug: string;
  controlTypeId: ControlTypeId;
  sourceUrl: string;
  dataCheckedAt: string;
  rawMoves: OfficialFrameMoveSource[];
  moves: ParsedOfficialFrameMove[];
};

const SF6_OFFICIAL_PROXY_BASE = '/official-site';
const SF6_OFFICIAL_ORIGIN = 'https://www.streetfighter.com';
const SF6_ROSTER_SOURCE_PATH = '/6/ja-jp/character/chunli/frame';

const SF6_OFFICIAL_NAME_BY_SLUG: Record<string, string> = {
  ryu: 'リュウ',
  luke: 'ルーク',
  jamie: 'ジェイミー',
  chunli: '春麗',
  guile: 'ガイル',
  kimberly: 'キンバリー',
  juri: 'ジュリ',
  ken: 'ケン',
  blanka: 'ブランカ',
  dhalsim: 'ダルシム',
  ehonda: 'エドモンド本田',
  deejay: 'ディージェイ',
  manon: 'マノン',
  marisa: 'マリーザ',
  jp: 'JP',
  zangief: 'ザンギエフ',
  lily: 'リリー',
  cammy: 'キャミィ',
  rashid: 'ラシード',
  aki: 'A.K.I.',
  ed: 'エド',
  gouki_akuma: '豪鬼',
  vega_mbison: 'ベガ',
  terry: 'テリー',
  mai: '舞',
  elena: 'エレナ',
  sagat: 'サガット',
  cviper: 'C.ヴァイパー',
  alex: 'アレックス',
  ingrid: 'イングリッド',
};

export async function fetchSf6OfficialRoster(): Promise<Sf6OfficialRosterResult> {
  try {
    const sourceHtml = await fetchOfficialText(SF6_ROSTER_SOURCE_PATH);
    const characters = parseSf6OfficialRoster(sourceHtml);
    const resolved = await resolveUnknownCharacterNames(characters);
    return { source: 'official-site', characters: resolved };
  } catch (error) {
    return {
      source: 'fallback',
      characters: Object.entries(SF6_OFFICIAL_NAME_BY_SLUG).map(([slug, name]) => ({
        slug,
        name,
        framePath: `/6/ja-jp/character/${slug}/frame`,
      })),
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function fetchSf6OfficialFrameData(
  character: Sf6OfficialCharacter,
  controlTypeId: ControlTypeId
): Promise<Sf6OfficialFrameDataResult> {
  const html = await fetchOfficialText(character.framePath);
  const rawMoves = parseSf6OfficialFrameMoveSources(html, controlTypeId);
  return {
    source: 'official-site',
    slug: character.slug,
    controlTypeId,
    sourceUrl: `${SF6_OFFICIAL_ORIGIN}${character.framePath}`,
    dataCheckedAt: new Date().toISOString().slice(0, 10),
    rawMoves,
    moves: rawMoves
      .map((move) => parseOfficialFrameMove(move))
      .filter((move): move is ParsedOfficialFrameMove => move !== null),
  };
}

export function parseSf6OfficialRoster(html: string): Sf6OfficialCharacter[] {
  const document = new DOMParser().parseFromString(html, 'text/html');
  const bySlug = new Map<string, Sf6OfficialCharacter>();

  for (const anchor of [...document.querySelectorAll('a[href*="/6/ja-jp/character/"]')]) {
    const href = anchor.getAttribute('href') ?? '';
    const match = href.match(/\/6\/ja-jp\/character\/([^/]+)\/frame(?:$|[?#])/);
    if (!match) continue;

    const slug = match[1];
    if (bySlug.has(slug)) continue;
    bySlug.set(slug, {
      slug,
      name: SF6_OFFICIAL_NAME_BY_SLUG[slug] ?? slug,
      framePath: `/6/ja-jp/character/${slug}/frame`,
    });
  }

  return [...bySlug.values()];
}

export function parseSf6OfficialFrameMoveSources(
  html: string,
  controlTypeId: ControlTypeId
): OfficialFrameMoveSource[] {
  const document = new DOMParser().parseFromString(html, 'text/html');
  const rows = [...document.querySelectorAll('table tr')];
  const moves: OfficialFrameMoveSource[] = [];
  let currentCategory = '';

  for (const row of rows) {
    if (row.className.includes('frame_heading')) {
      currentCategory = normalizeCellText(row.textContent ?? '');
      continue;
    }

    const cells = [...row.children] as HTMLElement[];
    if (cells.length < 15 || !currentCategory) continue;

    const skillCell = cells[0];
    const name = extractMoveName(skillCell);
    if (!name) continue;

    const active = extractActiveTexts(cells[2]);
    moves.push({
      name,
      officialCategory: normalizeOfficialCategory(currentCategory),
      startupText: normalizeCellText(cells[1].innerText),
      activeText: active.activeText,
      activeDetailText: active.activeDetailText,
      recoveryText: normalizeCellText(cells[3].innerText),
      inputText: extractCommandText(skillCell, controlTypeId),
      commandText: extractCommandText(skillCell, controlTypeId),
      note: buildSourceNote(cells),
    });
  }

  return moves;
}

async function resolveUnknownCharacterNames(
  characters: Sf6OfficialCharacter[]
): Promise<Sf6OfficialCharacter[]> {
  const resolved: Sf6OfficialCharacter[] = [];

  for (const character of characters) {
    if (SF6_OFFICIAL_NAME_BY_SLUG[character.slug]) {
      resolved.push(character);
      continue;
    }

    try {
      const html = await fetchOfficialText(character.framePath);
      resolved.push({
        ...character,
        name: parseCharacterNameFromFrameHtml(html) ?? character.name,
      });
    } catch {
      resolved.push(character);
    }
  }

  return resolved;
}

function extractMoveName(skillCell: HTMLElement): string {
  const artName = skillCell.querySelector('[class*="arts"]')?.textContent;
  if (artName?.trim()) return normalizeCellText(artName);

  const lines = splitCellLines(skillCell.innerText);
  return lines[0] ?? '';
}

function extractCommandText(skillCell: HTMLElement, controlTypeId: ControlTypeId): string {
  const modeSelector = controlTypeId === 'sf6_modern' ? '[class*="modern"]' : '[class*="classic"]';
  const modeCommand = skillCell.querySelector(modeSelector)?.textContent;
  if (modeCommand?.trim()) return normalizeCellText(modeCommand);

  const fallbackCommand = skillCell.querySelector('p')?.textContent;
  return normalizeCellText(fallbackCommand ?? '');
}

function extractActiveTexts(activeCell: HTMLElement): { activeText: string; activeDetailText: string } {
  const lines = splitCellLines(activeCell.innerText);
  const activeText = normalizeCellText(activeCell.querySelector('label')?.textContent ?? '') || lines[0] || '';
  const detailText = normalizeCellText(activeCell.querySelector('[class*="ex"]')?.textContent ?? '');
  return {
    activeText,
    activeDetailText: detailText,
  };
}

function buildSourceNote(cells: HTMLElement[]): string {
  const noteParts = [
    ['ヒット', cells[4]],
    ['ガード', cells[5]],
    ['キャンセル', cells[6]],
    ['ダメージ', cells[7]],
    ['コンボ補正', cells[8]],
    ['Dゲージ増加（ヒット）', cells[9]],
    ['Dゲージ減少（ガード）', cells[10]],
    ['Dゲージ減少（パニッシュ）', cells[11]],
    ['SAゲージ増加', cells[12]],
    ['属性', cells[13]],
    ['備考', cells[14]],
  ]
    .map(([label, cell]) => {
      const value = normalizeCellText((cell as HTMLElement).innerText);
      return value ? `${label}: ${value}` : '';
    })
    .filter(Boolean);

  return noteParts.join('\n');
}

function normalizeOfficialCategory(category: string): string {
  return category === 'スーパーアーツ' ? '超必殺技' : category;
}

function splitCellLines(text: string): string[] {
  return text
    .split('\n')
    .map((line) => normalizeCellText(line))
    .filter(Boolean);
}

function normalizeCellText(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

function parseCharacterNameFromFrameHtml(html: string): string | null {
  const document = new DOMParser().parseFromString(html, 'text/html');
  const title = document.querySelector('title')?.textContent?.trim() ?? '';
  const match = title.match(/^(.+?)\s+フレームデータ/);
  return match?.[1]?.trim() || null;
}

async function fetchOfficialText(path: string): Promise<string> {
  const response = await fetch(`${SF6_OFFICIAL_PROXY_BASE}${path}`);
  if (!response.ok) {
    throw new Error(`公式サイト取得に失敗しました (${response.status})`);
  }
  return response.text();
}
