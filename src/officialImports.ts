import { db } from './db';
import type { Character, ControlType, ControlTypeId, Game, GameId, Move } from './types';
import { INITIAL_CHARACTERS } from './constants';
import { genUUID, now } from './utils';
import { fetchSf6OfficialFrameData, fetchSf6OfficialRoster, type Sf6OfficialCharacter } from './sf6OfficialSite';
import {
  SF6_CHUNLI_CLASSIC_DATA_META,
  SF6_CHUNLI_CLASSIC_MOVES,
} from './sf6ChunliClassicMoves';
import {
  SF6_CHUNLI_MODERN_DATA_META,
  SF6_CHUNLI_MODERN_MOVES,
} from './sf6ChunliModernMoves';

export type OfficialSeedMove = Omit<
  Move,
  'id' | 'gameId' | 'controlTypeId' | 'characterId' | 'entryType' | 'tags' | 'createdAt' | 'updatedAt'
>;

export type OfficialImportTarget = {
  label: string;
  meta: {
    gameId: GameId;
    controlTypeId: ControlTypeId;
    characterName: string;
    sourceName: string;
    sourceUrl?: string;
    dataCheckedAt: string;
  };
  moves: OfficialSeedMove[];
};

export type OfficialImportResult = {
  status: 'imported' | 'unchanged' | 'unavailable';
  importedCount: number;
  label: string;
};

export type OfficialImportPreview = {
  status: 'changed' | 'unchanged' | 'unavailable';
  label: string;
  currentCount: number;
  officialCount: number;
  sourceName?: string;
  sourceUrl?: string;
  dataCheckedAt?: string;
};

export const OFFICIAL_IMPORT_TARGETS: OfficialImportTarget[] = [
  {
    label: '春麗クラシック',
    meta: SF6_CHUNLI_CLASSIC_DATA_META,
    moves: SF6_CHUNLI_CLASSIC_MOVES,
  },
  {
    label: '春麗モダン',
    meta: SF6_CHUNLI_MODERN_DATA_META,
    moves: SF6_CHUNLI_MODERN_MOVES,
  },
];

export function getOfficialImportTarget(
  gameId: GameId,
  controlTypeId: ControlTypeId,
  characterName: string
): OfficialImportTarget | null {
  return OFFICIAL_IMPORT_TARGETS.find((target) =>
    target.meta.gameId === gameId &&
    target.meta.controlTypeId === controlTypeId &&
    target.meta.characterName === characterName
  ) ?? null;
}

export async function ensureGameCharacterRoster(game: Game): Promise<number> {
  if (game.id === 'sf6') {
    const roster = await fetchSf6OfficialRoster();
    return ensureGameCharacterNames(game, roster.characters.map((character) => character.name));
  }

  return ensureGameCharacterNames(game, []);
}

async function ensureGameCharacterNames(game: Game, officialNames: string[]): Promise<number> {
  const addedNames = new Set<string>();

  for (const controlType of game.controlTypes) {
    const canonicalNames = officialNames.length > 0 ? officialNames : INITIAL_CHARACTERS[controlType.id] ?? [];
    if (canonicalNames.length === 0) continue;

    const existing = await db.characters
      .where('[gameId+controlTypeId]')
      .equals([game.id, controlType.id])
      .toArray();
    const existingNames = new Set(existing.map((character) => character.name));
    const timestamp = now();
    const characters: Character[] = canonicalNames
      .filter((name) => !existingNames.has(name))
      .map((name) => ({
        id: genUUID(),
        gameId: game.id,
        controlTypeId: controlType.id,
        name,
        entryType: 'preset',
        createdAt: timestamp,
        updatedAt: timestamp,
      }));

    if (characters.length > 0) {
      await db.characters.bulkAdd(characters);
      characters.forEach((character) => addedNames.add(character.name));
    }
  }

  return addedNames.size;
}

export async function ensureCharacterForControlType(
  game: Game,
  controlType: ControlType,
  characterName: string
): Promise<Character> {
  const existing = await db.characters
    .where('[gameId+controlTypeId]')
    .equals([game.id, controlType.id])
    .toArray();
  const found = existing.find((character) => character.name === characterName);
  if (found) return found;

  const timestamp = now();
  const character: Character = {
    id: genUUID(),
    gameId: game.id,
    controlTypeId: controlType.id,
    name: characterName,
    entryType: 'preset',
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  await db.characters.add(character);
  return character;
}

export async function importOfficialTargetIfChanged(
  target: OfficialImportTarget
): Promise<OfficialImportResult> {
  const existingCharacters = await db.characters
    .where('[gameId+controlTypeId]')
    .equals([target.meta.gameId, target.meta.controlTypeId])
    .toArray();

  let character = existingCharacters.find((candidate) => candidate.name === target.meta.characterName);
  if (!character) {
    const timestamp = now();
    character = {
      id: genUUID(),
      gameId: target.meta.gameId,
      controlTypeId: target.meta.controlTypeId,
      name: target.meta.characterName,
      entryType: 'preset',
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    await db.characters.add(character);
  }

  const currentMoves = await db.moves.where('characterId').equals(character.id).toArray();
  currentMoves.sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.name.localeCompare(b.name, 'ja'));

  if (!hasOfficialMoveDiff(currentMoves, target.moves)) {
    return { status: 'unchanged', importedCount: 0, label: target.label };
  }

  await db.transaction('rw', [db.moves], async () => {
    await db.moves.where('characterId').equals(character.id).delete();
    const baseTime = Date.now();
    const moves: Move[] = target.moves.map((move, index) => {
      const timestamp = new Date(baseTime + index).toISOString();
      return {
        id: genUUID(),
        gameId: target.meta.gameId,
        controlTypeId: target.meta.controlTypeId,
        characterId: character.id,
        entryType: 'preset',
        tags: [],
        createdAt: timestamp,
        updatedAt: timestamp,
        ...move,
        memo: [
          `データ最終確認日: ${target.meta.dataCheckedAt}`,
          `参照元: ${target.meta.sourceName}`,
          move.memo,
        ].join('\n'),
      };
    });
    await db.moves.bulkAdd(moves);
  });

  return { status: 'imported', importedCount: target.moves.length, label: target.label };
}

export async function importOfficialForCharacterControl(
  gameId: GameId,
  controlTypeId: ControlTypeId,
  characterName: string
): Promise<OfficialImportResult> {
  const target = await resolveOfficialImportTarget(gameId, controlTypeId, characterName);
  if (!target) {
    return { status: 'unavailable', importedCount: 0, label: characterName };
  }
  return importOfficialTargetIfChanged(target);
}

export async function previewOfficialForCharacterControl(
  gameId: GameId,
  controlTypeId: ControlTypeId,
  characterName: string
): Promise<OfficialImportPreview> {
  const target = await resolveOfficialImportTarget(gameId, controlTypeId, characterName);
  if (!target) {
    return {
      status: 'unavailable',
      label: characterName,
      currentCount: 0,
      officialCount: 0,
    };
  }

  const existingCharacters = await db.characters
    .where('[gameId+controlTypeId]')
    .equals([target.meta.gameId, target.meta.controlTypeId])
    .toArray();
  const character = existingCharacters.find((candidate) => candidate.name === target.meta.characterName);
  const currentMoves = character ? await db.moves.where('characterId').equals(character.id).toArray() : [];
  currentMoves.sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.name.localeCompare(b.name, 'ja'));
  const changed = hasOfficialMoveDiff(currentMoves, target.moves);

  return {
    status: changed ? 'changed' : 'unchanged',
    label: target.label,
    currentCount: currentMoves.length,
    officialCount: target.moves.length,
    sourceName: target.meta.sourceName,
    sourceUrl: 'sourceUrl' in target.meta ? target.meta.sourceUrl : undefined,
    dataCheckedAt: target.meta.dataCheckedAt,
  };
}

export async function importAvailableOfficialTargetsForGame(game: Game): Promise<{
  addedCharacters: number;
  imported: OfficialImportResult[];
  rosterSource: 'official-site' | 'fallback' | 'preset';
  rosterError?: string;
}> {
  const roster = game.id === 'sf6' ? await fetchSf6OfficialRoster() : null;
  const addedCharacters = roster
    ? await ensureGameCharacterNames(game, roster.characters.map((character) => character.name))
    : await ensureGameCharacterRoster(game);
  const gameTargets = OFFICIAL_IMPORT_TARGETS.filter((target) => target.meta.gameId === game.id);
  const imported: OfficialImportResult[] = [];

  for (const target of gameTargets) {
    imported.push(await importOfficialTargetIfChanged(target));
  }

  return {
    addedCharacters,
    imported,
    rosterSource: roster?.source ?? 'preset',
    rosterError: roster?.error,
  };
}

function hasOfficialMoveDiff(currentMoves: Move[], seedMoves: OfficialSeedMove[]): boolean {
  if (currentMoves.length !== seedMoves.length) return true;

  return seedMoves.some((seedMove, index) => {
    const currentMove = currentMoves[index];
    return (
      currentMove.name !== seedMove.name ||
      currentMove.category !== seedMove.category ||
      currentMove.totalFrames !== seedMove.totalFrames ||
      currentMove.startupFrames !== seedMove.startupFrames ||
      (currentMove.activeStartFrames ?? null) !== (seedMove.activeStartFrames ?? null) ||
      currentMove.activeFrames !== seedMove.activeFrames ||
      currentMove.enabled !== seedMove.enabled ||
      !currentMove.memo.includes(seedMove.memo)
    );
  });
}

async function resolveOfficialImportTarget(
  gameId: GameId,
  controlTypeId: ControlTypeId,
  characterName: string
): Promise<OfficialImportTarget | null> {
  const staticTarget = getOfficialImportTarget(gameId, controlTypeId, characterName);
  if (staticTarget) return staticTarget;

  if (gameId !== 'sf6' || (controlTypeId !== 'sf6_classic' && controlTypeId !== 'sf6_modern')) {
    return null;
  }

  const roster = await fetchSf6OfficialRoster();
  const officialCharacter = findOfficialCharacterByName(roster.characters, characterName);
  if (!officialCharacter) return null;

  const frameData = await fetchSf6OfficialFrameData(officialCharacter, controlTypeId);
  return {
    label: `${characterName} ${controlTypeId === 'sf6_modern' ? 'モダン' : 'クラシック'}`,
    meta: {
      gameId,
      controlTypeId,
      characterName,
      sourceName: `STREET FIGHTER 6 公式 ${characterName} フレームデータ`,
      dataCheckedAt: frameData.dataCheckedAt,
      sourceUrl: frameData.sourceUrl,
    },
    moves: frameData.moves,
  };
}

function findOfficialCharacterByName(
  characters: Sf6OfficialCharacter[],
  characterName: string
): Sf6OfficialCharacter | null {
  return characters.find((character) => character.name === characterName) ?? null;
}
