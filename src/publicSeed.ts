import { db } from './db';
import type { Character, Move, Preset, Setplay, Starter } from './types';
import { withAutoTagsForMoveName } from './moveTags';

const PUBLIC_SEED_URL = '/seed/setplay-backup.json';
const PUBLIC_SEED_STATE_KEY = 'setplay-frame-app:public-seed:v1';

type BackupData = {
  formatVersion?: number;
  appVersion?: string;
  exportedAt?: string;
  characters?: Character[];
  moves?: Move[];
  setplays?: Setplay[];
  presets?: Preset[];
  starters?: Starter[];
};

type SeedCounts = {
  characters: number;
  moves: number;
  setplays: number;
  presets: number;
  starters: number;
};

type SeedState = {
  status: 'applied' | 'skipped-existing-data';
  checkedAt: string;
  seedUrl: string;
  seedAppVersion?: string;
  seedExportedAt?: string;
};

export type PublicSeedResult =
  | { status: 'applied'; counts: SeedCounts; seedAppVersion?: string; seedExportedAt?: string }
  | { status: 'skipped'; reason: 'already-checked' | 'existing-data'; counts: SeedCounts }
  | { status: 'unavailable'; reason: 'not-found' | 'invalid' | 'network-error'; counts: SeedCounts };

function hasAnyData(counts: SeedCounts): boolean {
  return Object.values(counts).some((count) => count > 0);
}

async function countExistingData(): Promise<SeedCounts> {
  const [characters, moves, setplays, presets, starters] = await Promise.all([
    db.characters.count(),
    db.moves.count(),
    db.setplays.count(),
    db.presets.count(),
    db.starters.count(),
  ]);

  return { characters, moves, setplays, presets, starters };
}

function readSeedState(): SeedState | null {
  try {
    const raw = window.localStorage.getItem(PUBLIC_SEED_STATE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SeedState;
  } catch {
    return null;
  }
}

function writeSeedState(state: SeedState) {
  try {
    window.localStorage.setItem(PUBLIC_SEED_STATE_KEY, JSON.stringify(state));
  } catch {
    // If storage is unavailable, the IndexedDB emptiness check still prevents overwrites.
  }
}

function isValidBackupData(data: BackupData): data is Required<Pick<BackupData, 'characters' | 'moves' | 'setplays'>> & BackupData {
  return Array.isArray(data.characters) && Array.isArray(data.moves) && Array.isArray(data.setplays);
}

function buildCounts(data: BackupData): SeedCounts {
  return {
    characters: data.characters?.length ?? 0,
    moves: data.moves?.length ?? 0,
    setplays: data.setplays?.length ?? 0,
    presets: data.presets?.length ?? 0,
    starters: data.starters?.length ?? 0,
  };
}

export async function applyPublicSeedIfEmpty(): Promise<PublicSeedResult> {
  const existingCounts = await countExistingData();

  if (readSeedState()) {
    return { status: 'skipped', reason: 'already-checked', counts: existingCounts };
  }

  if (hasAnyData(existingCounts)) {
    writeSeedState({
      status: 'skipped-existing-data',
      checkedAt: new Date().toISOString(),
      seedUrl: PUBLIC_SEED_URL,
    });
    return { status: 'skipped', reason: 'existing-data', counts: existingCounts };
  }

  try {
    const response = await fetch(PUBLIC_SEED_URL, { cache: 'no-store' });
    if (!response.ok) {
      return { status: 'unavailable', reason: 'not-found', counts: existingCounts };
    }

    const data = await response.json() as BackupData;
    if (!isValidBackupData(data)) {
      return { status: 'unavailable', reason: 'invalid', counts: existingCounts };
    }

    await db.transaction('rw', [db.characters, db.moves, db.setplays, db.presets, db.starters], async () => {
      if (data.characters.length > 0) await db.characters.bulkPut(data.characters);
      if (data.moves.length > 0) {
        await db.moves.bulkPut(
          data.moves.map((move) => ({
            ...move,
            tags: withAutoTagsForMoveName(move.name, move.tags ?? []),
          }))
        );
      }
      if (data.setplays.length > 0) await db.setplays.bulkPut(data.setplays);
      if (Array.isArray(data.presets) && data.presets.length > 0) await db.presets.bulkPut(data.presets);
      if (Array.isArray(data.starters) && data.starters.length > 0) await db.starters.bulkPut(data.starters);
    });

    writeSeedState({
      status: 'applied',
      checkedAt: new Date().toISOString(),
      seedUrl: PUBLIC_SEED_URL,
      seedAppVersion: data.appVersion,
      seedExportedAt: data.exportedAt,
    });

    return {
      status: 'applied',
      counts: buildCounts(data),
      seedAppVersion: data.appVersion,
      seedExportedAt: data.exportedAt,
    };
  } catch {
    return { status: 'unavailable', reason: 'network-error', counts: existingCounts };
  }
}
