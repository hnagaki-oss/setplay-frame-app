import Dexie, { type Table } from 'dexie';
import type { Character, Move, Setplay, Preset, Starter } from './types';

export class AppDatabase extends Dexie {
  characters!: Table<Character, string>;
  moves!: Table<Move, string>;
  setplays!: Table<Setplay, string>;
  presets!: Table<Preset, string>;
  starters!: Table<Starter, string>;

  constructor() {
    super('SetplayFrameApp');
    this.version(1).stores({
      characters: 'id, gameId, controlTypeId, [gameId+controlTypeId]',
      moves: 'id, gameId, controlTypeId, characterId, [gameId+controlTypeId+characterId]',
      setplays: 'id, gameId, controlTypeId, characterId, [gameId+controlTypeId+characterId]',
    });
    this.version(2).stores({
      presets: 'id, gameId, controlTypeId',
    });
    this.version(3).stores({
      starters: 'id, gameId, controlTypeId, characterId, [gameId+controlTypeId+characterId]',
    });
  }
}

export const db = new AppDatabase();
