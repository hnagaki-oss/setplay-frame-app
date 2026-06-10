import { db } from './db';
import type { Character, ControlType, ControlTypeId, Game, GameId, Move } from './types';
import { INITIAL_CHARACTERS } from './constants';
import { genUUID, now } from './utils';
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
    dataCheckedAt: string;
  };
  moves: OfficialSeedMove[];
};

export type OfficialImportResult = {
  status: 'imported' | 'unchanged' | 'unavailable';
  importedCount: number;
  label: string;
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
  let addedCount = 0;

  for (const controlType of game.controlTypes) {
    const canonicalNames = INITIAL_CHARACTERS[controlType.id] ?? [];
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
      addedCount += characters.length;
    }
  }

  return addedCount;
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
  const target = getOfficialImportTarget(gameId, controlTypeId, characterName);
  if (!target) {
    return { status: 'unavailable', importedCount: 0, label: characterName };
  }
  return importOfficialTargetIfChanged(target);
}

export async function importAvailableOfficialTargetsForGame(game: Game): Promise<{
  addedCharacters: number;
  imported: OfficialImportResult[];
}> {
  const addedCharacters = await ensureGameCharacterRoster(game);
  const gameTargets = OFFICIAL_IMPORT_TARGETS.filter((target) => target.meta.gameId === game.id);
  const imported: OfficialImportResult[] = [];

  for (const target of gameTargets) {
    imported.push(await importOfficialTargetIfChanged(target));
  }

  return { addedCharacters, imported };
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
