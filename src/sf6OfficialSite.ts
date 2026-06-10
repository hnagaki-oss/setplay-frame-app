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

type Sf6OfficialMoveCommand = {
  name: string;
  classicCommand: string;
  modernCommand: string | null;
};

type Sf6OfficialMovelistEntry = {
  skill: string | null;
  command: string | null;
  command_modern: string | null;
};

const SF6_OFFICIAL_PROXY_BASE = '/official-site';
const SF6_OFFICIAL_ORIGIN = 'https://www.streetfighter.com';
const SF6_ROSTER_SOURCE_PATH = '/6/ja-jp/character/chunli/frame';
const officialTextCache = new Map<string, Promise<string>>();

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
  const commandMap = await fetchSf6OfficialMoveCommandMap(character).catch(() => new Map<string, Sf6OfficialMoveCommand>());
  const rawMoves = mergeSf6OfficialCommands(
    parseSf6OfficialFrameMoveSources(html, controlTypeId),
    commandMap,
    controlTypeId
  );
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

export async function fetchSf6OfficialMoveCommandMap(
  character: Sf6OfficialCharacter
): Promise<Map<string, Sf6OfficialMoveCommand>> {
  const movelistPath = character.framePath.replace(/\/frame(?:$|[?#])/, '/movelist');
  const html = await fetchOfficialText(movelistPath);
  const chunkPath = parseMovelistChunkPath(html);
  if (!chunkPath) return new Map();

  const chunk = await fetchOfficialText(chunkPath);
  return parseSf6OfficialMoveCommandMap(html, chunk, character.slug);
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

export function parseSf6OfficialMoveCommandMap(
  movelistHtml: string,
  movelistChunk: string,
  characterSlug: string
): Map<string, Sf6OfficialMoveCommand> {
  const translations = parseMovelistTranslations(movelistHtml, characterSlug);
  const entries = parseMovelistEntriesFromChunk(movelistChunk, characterSlug);
  const commandMap = new Map<string, Sf6OfficialMoveCommand>();

  for (const entry of entries) {
    if (!entry.skill) continue;
    const name = translations.get(entry.skill) ?? entry.skill.replace(/^\[t\]/, '');
    commandMap.set(name, {
      name,
      classicCommand: normalizeOfficialCommandNotation(entry.command ?? ''),
      modernCommand: entry.command_modern === null ? null : normalizeOfficialCommandNotation(entry.command_modern),
    });
  }

  return commandMap;
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

function mergeSf6OfficialCommands(
  moves: OfficialFrameMoveSource[],
  commandMap: Map<string, Sf6OfficialMoveCommand>,
  controlTypeId: ControlTypeId
): OfficialFrameMoveSource[] {
  return moves
    .map((move) => {
      const command = findMoveCommand(move.name, commandMap);
      if (!command) return move;
      if (controlTypeId === 'sf6_modern' && command.modernCommand === null) return null;

      const baseCommandText = controlTypeId === 'sf6_modern' ? command.modernCommand : command.classicCommand;
      const commandText = applyMoveVariantToCommand(move.name, baseCommandText ?? '');
      if (!commandText) return move;
      return {
        ...move,
        inputText: commandText,
        commandText,
      };
    })
    .filter((move): move is OfficialFrameMoveSource => move !== null);
}

function findMoveCommand(
  moveName: string,
  commandMap: Map<string, Sf6OfficialMoveCommand>
): Sf6OfficialMoveCommand | undefined {
  const exact = commandMap.get(moveName);
  if (exact) return exact;

  const baseName = moveName.replace(/^(弱|中|強|OD)\s+/, '');
  return commandMap.get(baseName);
}

function applyMoveVariantToCommand(moveName: string, command: string): string {
  const variant = moveName.match(/^(弱|中|強|OD)\s+/)?.[1];
  if (!variant) return command;

  if (variant === '弱') return command.replace('弱P/中P/強P', '弱P').replace('弱K/中K/強K', '弱K');
  if (variant === '中') return command.replace('弱P/中P/強P', '中P').replace('弱K/中K/強K', '中K');
  if (variant === '強') return command.replace('弱P/中P/強P', '強P').replace('弱K/中K/強K', '強K');
  if (variant === 'OD') return command.replace('弱P/中P/強P', 'PP').replace('弱K/中K/強K', 'KK');
  return command;
}

function parseMovelistChunkPath(html: string): string | null {
  const document = new DOMParser().parseFromString(html, 'text/html');
  const script = [...document.scripts]
    .map((node) => node.getAttribute('src') ?? '')
    .find((src) => /\/_next\/static\/chunks\/pages\/character\/.*movelist-.*\.js/.test(src));
  if (!script) return null;

  try {
    const url = new URL(script, SF6_OFFICIAL_ORIGIN);
    return url.pathname;
  } catch {
    return script.startsWith('/') ? script : `/${script}`;
  }
}

function parseMovelistTranslations(html: string, characterSlug: string): Map<string, string> {
  const document = new DOMParser().parseFromString(html, 'text/html');
  const json = document.querySelector('#__NEXT_DATA__')?.textContent;
  if (!json) return new Map();

  try {
    const data = JSON.parse(json) as {
      props?: { pageProps?: { __namespaces?: Record<string, Record<string, string>> } };
    };
    const namespaces = data.props?.pageProps?.__namespaces ?? {};
    const namespace = {
      ...(namespaces[`character/${characterSlug}`] ?? {}),
      ...(namespaces[`character/movelist/${characterSlug}`] ?? {}),
    };
    const translations = new Map<string, string>();
    for (const [key, value] of Object.entries(namespace)) {
      translations.set(key, value);
      translations.set(key.replace(/^\[t\]/, ''), value);
    }
    return translations;
  } catch {
    return new Map();
  }
}

function parseMovelistEntriesFromChunk(chunk: string, characterSlug: string): Sf6OfficialMovelistEntry[] {
  const matches = [...chunk.matchAll(/JSON\.parse\('(?<json>\{"frame".*?\})'\)/gs)];
  for (const match of matches) {
    const json = match.groups?.json;
    if (!json || !json.includes(`skill_name_${characterSlug}_`)) continue;

    try {
      const parsed = JSON.parse(json) as { frame?: Sf6OfficialMovelistEntry[] };
      return parsed.frame ?? [];
    } catch {
      return [];
    }
  }

  return [];
}

function normalizeOfficialCommandNotation(command: string | null): string {
  if (!command) return '';

  const normalized = command
    .replace(/Nor6/g, 'N or 6')
    .replace(/Nutral/gi, 'N')
    .replace(/\bLPMPHP\b/g, '弱P/中P/強P')
    .replace(/\bLKMKHK\b/g, '弱K/中K/強K')
    .replace(/\bLPLK\b/g, '弱P+弱K')
    .replace(/\bMPMK\b/g, '中P+中K')
    .replace(/\bHPHK\b/g, '強P+強K')
    .replace(/\bLP\b/g, '弱P')
    .replace(/\bMP\b/g, '中P')
    .replace(/\bHP\b/g, '強P')
    .replace(/\bLK\b/g, '弱K')
    .replace(/\bMK\b/g, '中K')
    .replace(/\bHK\b/g, '強K')
    .replace(/\bM攻\b/g, '攻撃')
    .replace(/\bM(?=[弱中強])/g, '')
    .replace(/\b[a-z]+T\d+\b/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  return normalized;
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
  const cached = officialTextCache.get(path);
  if (cached) return cached;

  const request = fetchOfficialTextUncached(path);
  officialTextCache.set(path, request);
  return request;
}

async function fetchOfficialTextUncached(path: string): Promise<string> {
  const response = await fetch(`${SF6_OFFICIAL_PROXY_BASE}${path}`);
  if (!response.ok) {
    throw new Error(`公式サイト取得に失敗しました (${response.status})`);
  }
  return response.text();
}
