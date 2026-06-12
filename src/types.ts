export type GameId = 'sf6' | 'fatal_fury_cotw';

export type ControlTypeId =
  | 'sf6_classic'
  | 'sf6_modern'
  | 'cotw_arcade'
  | 'cotw_smart';

export type MoveCategory = 'normal' | 'commandNormal' | 'special' | 'super' | 'common';

export interface ControlType {
  id: ControlTypeId;
  name: string;
}

export interface Game {
  id: GameId;
  name: string;
  controlTypes: ControlType[];
}

export interface Character {
  id: string;
  gameId: GameId;
  controlTypeId: ControlTypeId;
  name: string;
  entryType: 'preset' | 'added';
  createdAt: string;
  updatedAt: string;
}

export interface Move {
  id: string;
  gameId: GameId;
  controlTypeId: ControlTypeId;
  characterId: string;
  name: string;
  category: MoveCategory;
  /** 技データ管理での表示順。未設定の古いデータはプリセット順/作成順で補完する。 */
  displayOrder?: number;
  entryType: 'preset' | 'added';
  totalFrames: number | null;
  startupFrames: number | null;
  /** 最終段の持続開始F。公式表の詳細が "9-11, 19-20" の場合は 19 を保存する。 */
  activeStartFrames?: number | null;
  /** 最終持続F。公式表の持続が "4-6" の場合は 6、"9-11, 19-20" の場合は 20 を保存する。 */
  activeFrames: number | null;
  tags: string[];
  memo: string;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SearchCondition {
  currentAdvantageFrames: number;
  targetFrames: number | null;
  requiredConsumeFrames: number;
  isMeatyMode: boolean;
  meatyMoveId?: string;
  meatyTargetActiveIndex?: number;
  maxMoveCount: number;
  allowRepeatSameMove: boolean;
  allowWaitFrames: boolean;
  maxWaitFrames: number;
  enabledCategories: MoveCategory[];
  searchModeId: string;
}

export interface SearchResultMove {
  moveId: string;
  name: string;
  totalFrames: number;
  category: MoveCategory;
  tags: string[];
}

export interface SearchResult {
  id: string;
  moves: SearchResultMove[];
  totalFrames: number;
  waitFrames: number;
  score: number;
  reasons: string[];
  meatyInfo?: {
    moveId: string;
    moveName: string;
    startupFrames: number;
    activeFrames: number;
    targetActiveIndex: number;
    targetActiveLabel: string;
  };
}

export interface SearchSessionOverride {
  excludedMoveIds: string[];
  preferredMoveIds: string[];
  excludedCategories: MoveCategory[];
  preferredCategories: MoveCategory[];
  excludedTags: string[];
  preferredTags: string[];
  maxMoveCount?: number;
  maxWaitFrames?: number;
  allowWaitFrames?: boolean;
}

export interface SetplayCandidate {
  id: string;
  moves: {
    moveId: string;
    name: string;
    totalFrames: number;
  }[];
  totalFrames: number;
  waitFrames: number;
  displayOrder: number;
  memo: string;
  verificationStatus: 'unverified' | 'verified' | 'needsReview';
  createdAt: string;
  updatedAt: string;
}

export interface Setplay {
  id: string;
  gameId: GameId;
  controlTypeId: ControlTypeId;
  characterId: string;
  name: string;
  currentAdvantageFrames: number;
  targetFrames: number | null;
  requiredConsumeFrames: number;
  isMeatyMode: boolean;
  meatyMoveSnapshot?: {
    moveId: string;
    name: string;
    startupFrames: number;
    activeFrames: number;
    targetActiveIndex: number;
    targetActiveLabel: string;
  };
  starterId?: string;
  starterName?: string;

  candidates: SetplayCandidate[];
  searchConditionSnapshot: SearchCondition;
  searchOverrideSnapshot?: SearchSessionOverride;
  memo: string;
  createdAt: string;
  updatedAt: string;
}

export type ToastType = 'success' | 'error' | 'info';

export interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
}

// ---- 始動 ----

export interface Starter {
  id: string;
  gameId: GameId;
  controlTypeId: ControlTypeId;
  characterId: string;
  name: string;           // e.g., "前投げ"
  advantageFrames: number;
  memo: string;
  createdAt: string;
  updatedAt: string;
}

// ---- プリセット ----

export interface SearchDefaults {
  maxMoveCount: number;
  allowRepeatSameMove: boolean;
  allowWaitFrames: boolean;
  maxWaitFrames: number;
  enabledCategories: MoveCategory[];
}

export interface PresetMove {
  name: string;
  category: MoveCategory;
}

export interface Preset {
  id: string; // `${gameId}_${controlTypeId}`
  gameId: GameId;
  controlTypeId: ControlTypeId;
  moves: PresetMove[];
  searchDefaults: SearchDefaults;
  tags: string[];
  updatedAt: string;
}
