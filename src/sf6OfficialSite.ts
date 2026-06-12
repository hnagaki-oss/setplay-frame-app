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
  modernManualCommand: string | null;
};

type Sf6OfficialMovelistEntry = {
  skill: string | null;
  command: string | null;
  command_modern: string | null;
  command_modern_manual: string | null;
};

type Sf6OfficialFrameEntry = {
  skill: string | null;
  type: string | null;
  webId: string | number | null;
  command: string | null;
  command_modern: string | null;
  command_modern_manual?: string | null;
  startup_frame: string | null;
  active_frame: string | null;
  recovery_frame: string | null;
  frame: string | null;
  block_frame: string | null;
  hit_frame: string | null;
  web_cancel: string | null;
  damage: string | null;
  combo_correct: string[] | string | null;
  drive_gauge_gain_hit: string | null;
  drive_gauge_gain_parry: string | null;
  drive_gauge_lose_dguard: string | null;
  drive_gauge_lose_punish: string | null;
  sa_gauge_gain: string | null;
  attribute: string | null;
  note: string[] | string | null;
};

const SF6_OFFICIAL_PROXY_BASE = '/official-site';
const SF6_OFFICIAL_ORIGIN = 'https://www.streetfighter.com';
const SF6_ROSTER_SOURCE_PATH = '/6/ja-jp/character/chunli/frame';
const officialTextCache = new Map<string, Promise<string>>();

const SF6_FRAME_TYPE_CATEGORY: Record<string, string> = {
  NORMAL: '通常技',
  UNIQUE_ATTACK: '特殊技',
  SPECIAL_MOVE: '必殺技',
  SUPER_ARTS: 'スーパーアーツ',
  COMMON: '共通システム',
  THROW: '通常投げ',
  UNIQUE: '特殊技',
  SPECIAL: '必殺技',
  SUPER_ART: 'スーパーアーツ',
  SYSTEM: '共通システム',
  THROWS: '通常投げ',
};

const SF6_FRAME_WEB_ID_CATEGORY: Array<[number, string]> = [
  [100, '通常技'],
  [200, '特殊技'],
  [300, '必殺技'],
  [400, 'スーパーアーツ'],
  [500, '通常投げ'],
  [600, '共通システム'],
];

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
  const frameEntries = await fetchSf6OfficialFrameEntries(character, html).catch(() => []);
  let rawMoves = parseSf6OfficialFrameMoveSourcesFromEntries(frameEntries, controlTypeId);

  if (rawMoves.length === 0) {
    const commandMap = await fetchSf6OfficialMoveCommandMap(character).catch(() => new Map<string, Sf6OfficialMoveCommand>());
    rawMoves = mergeSf6OfficialCommands(
      parseSf6OfficialFrameMoveSources(html, controlTypeId),
      commandMap,
      controlTypeId
    );
  }

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

    const officialCategory = normalizeOfficialCategory(currentCategory);
    const commandText = extractCommandText(skillCell, controlTypeId);
    if (shouldSkipClassicCommandlessOfficialMove(controlTypeId, officialCategory, commandText)) continue;

    const active = extractActiveTexts(cells[2]);
    moves.push({
      name,
      officialCategory,
      startupText: normalizeCellText(cells[1].innerText),
      activeText: active.activeText,
      activeDetailText: active.activeDetailText,
      recoveryText: normalizeCellText(cells[3].innerText),
      inputText: commandText,
      commandText,
      note: buildSourceNote(cells),
    });
  }

  return moves;
}

function parseSf6OfficialFrameMoveSourcesFromEntries(
  entries: Sf6OfficialFrameEntry[],
  controlTypeId: ControlTypeId
): OfficialFrameMoveSource[] {
  return entries
    .map((entry): OfficialFrameMoveSource | null => {
      const name = normalizeCellText(entry.skill ?? '');
      const officialCategory = normalizeOfficialFrameEntryCategory(entry);
      if (!name || !officialCategory) return null;

      const rawCommand = controlTypeId === 'sf6_modern'
        ? entry.command_modern ?? entry.command_modern_manual ?? null
        : entry.command;
      if (controlTypeId === 'sf6_modern' && !rawCommand?.trim()) return null;

      const commandText = controlTypeId === 'sf6_modern'
        ? normalizeModernCommandNotation(rawCommand)
        : normalizeOfficialCommandNotation(rawCommand);
      if (shouldSkipClassicCommandlessOfficialMove(controlTypeId, officialCategory, commandText)) return null;

      const displayName = controlTypeId === 'sf6_modern' && commandText
        ? buildModernMoveDisplayName(name, commandText)
        : undefined;

      return {
        name,
        displayName,
        officialCategory,
        startupText: normalizeCellText(entry.startup_frame ?? ''),
        activeText: normalizeCellText(entry.active_frame ?? ''),
        activeDetailText: normalizeCellText(entry.active_frame ?? ''),
        recoveryText: normalizeCellText(entry.recovery_frame ?? ''),
        totalFrameText: normalizeCellText(entry.frame ?? ''),
        inputText: commandText,
        commandText,
        note: buildFrameEntryNote(entry),
      };
    })
    .filter((move): move is OfficialFrameMoveSource => move !== null);
}

function shouldSkipClassicCommandlessOfficialMove(
  controlTypeId: ControlTypeId,
  officialCategory: string,
  commandText: string
): boolean {
  return controlTypeId === 'sf6_classic' && officialCategory !== '通常技' && !commandText.trim();
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
      modernManualCommand: entry.command_modern_manual === null ? null : normalizeOfficialCommandNotation(entry.command_modern_manual),
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

async function fetchSf6OfficialFrameEntries(
  character: Sf6OfficialCharacter,
  frameHtml: string
): Promise<Sf6OfficialFrameEntry[]> {
  const chunkPath = parseFrameChunkPath(frameHtml);
  if (!chunkPath) return [];

  const chunk = await fetchOfficialText(chunkPath);
  return parseSf6OfficialFrameEntriesFromChunk(frameHtml, chunk, character.slug);
}

function parseFrameChunkPath(html: string): string | null {
  const document = new DOMParser().parseFromString(html, 'text/html');
  const script = [...document.scripts]
    .map((node) => node.getAttribute('src') ?? '')
    .find((src) => /\/_next\/static\/chunks\/pages\/character\/.*frame-.*\.js/.test(src));
  if (!script) return null;

  try {
    const url = new URL(script, SF6_OFFICIAL_ORIGIN);
    return url.pathname;
  } catch {
    return script.startsWith('/') ? script : `/${script}`;
  }
}

function parseSf6OfficialFrameEntriesFromChunk(
  frameHtml: string,
  frameChunk: string,
  characterSlug: string
): Sf6OfficialFrameEntry[] {
  const variableBySlug = parseFrameDataVariableMap(frameChunk);
  const frameVariable = variableBySlug.get(characterSlug);
  if (frameVariable) {
    const entries = parseFrameEntryBlocksByVariable(frameChunk).get(frameVariable);
    if (entries) return entries;
  }

  const blocks = parseFrameEntryBlocks(frameChunk);
  if (blocks.length === 0) return [];

  const expectedSkills = parseFrameSkillNames(frameHtml, characterSlug);
  if (expectedSkills.size > 0) {
    const best = blocks
      .map((entries) => ({
        entries,
        score: entries.reduce((score, entry) => score + (entry.skill && expectedSkills.has(entry.skill) ? 1 : 0), 0),
      }))
      .sort((a, b) => b.score - a.score)[0];
    const minimumScore = Math.max(20, Math.floor(expectedSkills.size * 0.5));
    if (best && best.score >= minimumScore) return best.entries;
  }

  const slugOrder = parseFrameRosterSlugOrder(frameChunk);
  const slugIndex = slugOrder.indexOf(characterSlug);
  if (blocks.length >= slugOrder.length && slugIndex >= 0 && blocks[slugIndex]) return blocks[slugIndex];

  return blocks.length === 1 ? blocks[0] : [];
}

function parseFrameDataVariableMap(frameChunk: string): Map<string, string> {
  const map = new Map<string, string>();
  const match = frameChunk.match(/\(\{([^{}]+)\}\)\[t\]\.frame\.sort/);
  const mappingSource = match?.[1] ?? '';
  for (const pair of mappingSource.split(',')) {
    const [slug, variable] = pair.split(':').map((part) => part.trim());
    if (/^[a-z0-9_]+$/.test(slug) && /^[A-Za-z_$][\w$]*$/.test(variable)) {
      map.set(slug, variable);
    }
  }
  return map;
}

function parseFrameEntryBlocksByVariable(frameChunk: string): Map<string, Sf6OfficialFrameEntry[]> {
  const blocks = new Map<string, Sf6OfficialFrameEntry[]>();
  const matches = frameChunk.matchAll(/(?:let\s+|,)([A-Za-z_$][\w$]*)=JSON\.parse\('((?:\\.|[^'])*)'\)/gs);
  for (const match of matches) {
    const variableName = match[1];
    const parsed = parseJsonParsePayload(match[2]);
    const entries = isRecord(parsed) && Array.isArray(parsed.frame) ? parsed.frame : null;
    if (isFrameEntryList(entries)) blocks.set(variableName, entries);
  }
  return blocks;
}

function parseFrameEntryBlocks(frameChunk: string): Sf6OfficialFrameEntry[][] {
  return parseJsonParsePayloads(frameChunk)
    .map((payload) => isRecord(payload) && Array.isArray(payload.frame) ? payload.frame : null)
    .filter((entries): entries is Sf6OfficialFrameEntry[] => isFrameEntryList(entries));
}

function parseFrameSkillNames(frameHtml: string, characterSlug: string): Set<string> {
  const document = new DOMParser().parseFromString(frameHtml, 'text/html');
  const json = document.querySelector('#__NEXT_DATA__')?.textContent;
  if (!json) return new Set();

  try {
    const data = JSON.parse(json) as {
      props?: { pageProps?: { __namespaces?: Record<string, Record<string, string>> } };
    };
    const namespaces = data.props?.pageProps?.__namespaces ?? {};
    const namespace = namespaces[`character/frame/${characterSlug}`] ?? {};
    const skills = new Set<string>();
    for (const [key, value] of Object.entries(namespace)) {
      skills.add(key.replace(/^\[t\]/, ''));
      if (value) skills.add(value);
    }
    return skills;
  } catch {
    return new Set();
  }
}

function parseFrameRosterSlugOrder(frameChunk: string): string[] {
  for (const payload of parseJsonParsePayloads(frameChunk)) {
    if (!isRecord(payload) || !Array.isArray(payload.G)) continue;
    const slugs = payload.G.filter((value): value is string => typeof value === 'string');
    if (slugs.length > 0) return slugs;
  }
  return [];
}

function parseJsonParsePayloads(chunk: string): unknown[] {
  const payloads: unknown[] = [];
  const matches = chunk.matchAll(/JSON\.parse\('((?:\\.|[^'])*)'\)/gs);
  for (const match of matches) {
    const parsed = parseJsonParsePayload(match[1]);
    if (parsed !== null) payloads.push(parsed);
  }
  return payloads;
}

function parseJsonParsePayload(payload: string): unknown | null {
  try {
    return JSON.parse(payload);
  } catch {
    try {
      return JSON.parse(decodeJavaScriptStringLiteralContent(payload));
    } catch {
      return null;
    }
  }
}

function decodeJavaScriptStringLiteralContent(value: string): string {
  let decoded = '';
  for (let index = 0; index < value.length; index += 1) {
    const current = value[index];
    if (current !== '\\') {
      decoded += current;
      continue;
    }

    const next = value[index + 1];
    if (next === undefined) {
      decoded += current;
      continue;
    }

    if (next === 'x' && /^[0-9a-fA-F]{2}$/.test(value.slice(index + 2, index + 4))) {
      decoded += String.fromCharCode(Number.parseInt(value.slice(index + 2, index + 4), 16));
      index += 3;
      continue;
    }

    if (next === 'u' && /^[0-9a-fA-F]{4}$/.test(value.slice(index + 2, index + 6))) {
      decoded += String.fromCharCode(Number.parseInt(value.slice(index + 2, index + 6), 16));
      index += 5;
      continue;
    }

    if (next === 'n') {
      decoded += '\\n';
      index += 1;
      continue;
    }

    if (next === 'r') {
      decoded += '\\r';
      index += 1;
      continue;
    }

    if (next === 't') {
      decoded += '\\t';
      index += 1;
      continue;
    }

    decoded += next;
    index += 1;
  }
  return decoded;
}

function isFrameEntryList(value: unknown): value is Sf6OfficialFrameEntry[] {
  return Array.isArray(value) && value.some((entry) => (
    isRecord(entry) &&
    'skill' in entry &&
    'startup_frame' in entry &&
    'active_frame' in entry &&
    'recovery_frame' in entry
  ));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
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

      const baseCommandText = controlTypeId === 'sf6_modern'
        ? command.modernCommand ?? command.modernManualCommand
        : command.classicCommand;
      if (!baseCommandText) return null;
      const commandText = refineOfficialMoveCommand(move.name, baseCommandText ?? '');
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

  const baseName = normalizeMoveNameForCommandLookup(moveName);
  return commandMap.get(baseName);
}

function normalizeMoveNameForCommandLookup(moveName: string): string {
  return moveName
    .replace(/^\[[^\]]+\]/, '')
    .replace(/^(?:P|K)\s+/, '')
    .replace(/^(?:OD\s+)?(?:弱|中|強)\s+/, '')
    .replace(/^OD\s+/, '')
    .replace(/（[12]段目）$/, '')
    .replace(/[（(](?:後方|上方|前方)[）)]$/, '')
    .trim();
}

function refineOfficialMoveCommand(moveName: string, command: string): string {
  return applyDirectionalVariantToCommand(
    moveName,
    applyMoveStageToCommand(moveName, applyMoveVariantToCommand(moveName, command))
  );
}

function applyMoveVariantToCommand(moveName: string, command: string): string {
  const match = moveName.match(/^(OD\s+)?(弱|中|強)?\s*/);
  const isOd = Boolean(match?.[1]);
  const strength = match?.[2] ?? null;
  if (!isOd && !strength) return command;

  const select = (
    text: string,
    light: string,
    medium: string,
    heavy: string,
    odLight: string,
    odMedium: string,
    odHeavy: string
  ) => {
    if (isOd && strength === '弱') return text.replace(light, odLight);
    if (isOd && strength === '中') return text.replace(light, odMedium);
    if (isOd && strength === '強') return text.replace(light, odHeavy);
    if (isOd) return text.replace(light, odLight);
    if (strength === '弱') return text.replace(light, light.split(/\s*(?:\/|\|)\s*/)[0]);
    if (strength === '中') return text.replace(light, medium);
    if (strength === '強') return text.replace(light, heavy);
    return text;
  };

  let resolved = command;
  resolved = select(resolved, '弱P/中P/強P', '中P', '強P', '弱中', '弱強', '中強');
  resolved = select(resolved, '弱K/中K/強K', '中K', '強K', '弱中', '弱強', '中強');
  resolved = select(resolved, '弱P | 中P | 強P', '中P', '強P', '弱中', '弱強', '中強');
  resolved = select(resolved, '弱K | 中K | 強K', '中K', '強K', '弱中', '弱強', '中強');
  return resolved;
}

function applyDirectionalVariantToCommand(moveName: string, command: string): string {
  const direction = moveName.includes('後方') ? '4' : moveName.includes('上方') ? '2' : moveName.includes('前方') ? '6' : '';
  if (!direction || !command.includes(' or ')) return command;

  const directionPattern = /(?:4|2|6)(?:\s+or\s+(?:4|2|6))*\s+or\s+\+\s*|(?:4|2|6)(?:\s+or\s+(?:4|2|6))*\s*\+\s*/;
  const resolved = command.replace(directionPattern, `${direction} + `);
  return collapseRepeatedAttackButtons(resolved
    .replace(/\s+(弱K\s*\|\s*中K\s*\|\s*強K|弱P\s*\|\s*中P\s*\|\s*強P)$/, '')
    .trim());
}

function applyMoveStageToCommand(moveName: string, command: string): string {
  const stageMatch = moveName.match(/（(\d+)段目）$/);
  if (!stageMatch || !command.includes('>')) return command;

  const stage = Number(stageMatch[1]);
  const parts = command.split('>').map((part) => part.trim()).filter(Boolean);
  if (stage <= 1) return parts[0] ?? command;
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

function normalizeOfficialFrameEntryCategory(entry: Sf6OfficialFrameEntry): string | null {
  const webId = Number(entry.webId);
  if (Number.isFinite(webId)) {
    const categoryByWebId = SF6_FRAME_WEB_ID_CATEGORY
      .find(([minimumWebId]) => webId >= minimumWebId && webId <= minimumWebId + 99)?.[1] ?? null;
    if (categoryByWebId) return normalizeOfficialCategory(categoryByWebId);
  }

  if (!entry.type) return null;
  const category = SF6_FRAME_TYPE_CATEGORY[entry.type] ?? null;
  return category ? normalizeOfficialCategory(category) : null;
}

function normalizeOfficialCommandNotation(command: string | null): string {
  if (!command) return '';

  const normalized = collapseRepeatedAttackButtons(command
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
    .replace(/M攻/g, '攻撃')
    .replace(/\bM(?=[弱中強])/g, '')
    .replace(/\b[a-z]+T\d+\b/g, '')
    .replace(/\s+/g, ' ')
    .trim());

  return normalized;
}

function normalizeModernCommandNotation(command: string | null): string {
  if (!command) return '';

  return command
    .replace(/Nor6/g, 'N or 6')
    .replace(/Nutral/gi, 'N')
    .replace(/M攻/g, '攻撃')
    .replace(/\bM(?=[弱中強])/g, '')
    .replace(/\b[a-z]+T\d+\b/g, '')
    .replace(/\s*[>＞]\s*/g, ' > ')
    .replace(/\s*[+＋]\s*/g, '+')
    .replace(/\s+or\s+/gi, ' or ')
    .replace(/\s+/g, ' ')
    .trim();
}

function buildModernMoveDisplayName(moveName: string, commandText: string): string {
  const command = normalizeModernCommandNotation(commandText);
  if (!command) return moveName;

  const parentheticalParts = [...moveName.matchAll(/（([^（）]+)）/g)]
    .map((match) => match[1].trim())
    .filter(Boolean);
  if (parentheticalParts.length > 0) {
    return `${command}（${parentheticalParts.join('・')}）`;
  }

  const plainMoveName = moveName
    .replace(/（[^（）]+）/g, '')
    .replace(/(弱|中|強)[PK]/g, '$1')
    .trim();
  return plainMoveName && plainMoveName !== command ? `${command}（${plainMoveName}）` : command;
}

function collapseRepeatedAttackButtons(command: string): string {
  return command
    .replace(/攻撃\s+攻撃\s+攻撃/g, '攻撃×3')
    .replace(/攻撃\s+攻撃/g, '攻撃×2');
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

function buildFrameEntryNote(entry: Sf6OfficialFrameEntry): string {
  const noteParts = [
    ['ヒット', entry.hit_frame],
    ['ガード', entry.block_frame],
    ['キャンセル', entry.web_cancel],
    ['ダメージ', entry.damage],
    ['コンボ補正', entry.combo_correct],
    ['Dゲージ増加（ヒット）', entry.drive_gauge_gain_hit],
    ['Dゲージ増加（パリィ）', entry.drive_gauge_gain_parry],
    ['Dゲージ減少（ガード）', entry.drive_gauge_lose_dguard],
    ['Dゲージ減少（パニッシュ）', entry.drive_gauge_lose_punish],
    ['SAゲージ増加', entry.sa_gauge_gain],
    ['属性', entry.attribute],
    ['備考', entry.note],
  ]
    .map(([label, value]) => {
      const text = normalizeFrameEntryNoteValue(value);
      return text ? `${label}: ${text}` : '';
    })
    .filter(Boolean);

  return noteParts.join('\n');
}

function normalizeFrameEntryNoteValue(value: string[] | string | null): string {
  if (Array.isArray(value)) {
    return value.map((part) => normalizeCellText(part)).filter(Boolean).join(' / ');
  }
  return normalizeCellText(value ?? '');
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
