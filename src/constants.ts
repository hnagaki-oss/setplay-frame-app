import type { Game, MoveCategory, PresetMove, SearchDefaults } from './types';

export const GAMES: Game[] = [
  {
    id: 'sf6',
    name: 'ストリートファイター6',
    controlTypes: [
      { id: 'sf6_classic', name: 'クラシック' },
      { id: 'sf6_modern',  name: 'モダン' },
    ],
  },
  {
    id: 'fatal_fury_cotw',
    name: '餓狼伝説 City of the Wolves',
    controlTypes: [
      { id: 'cotw_arcade', name: 'アーケード' },
      { id: 'cotw_smart',  name: 'スマート' },
    ],
  },
];

// ============================================================
// SF6 全キャラ（公式日本語名・公式キャラセレ順）
// ベース18名 + DLC12名 = 計30名  / クラシック・モダン共通
// ============================================================
const SF6_ALL_CHARACTERS = [
  // ベースロスター
  'リュウ', 'ルーク', 'ジェイミー', '春麗',
  'ガイル', 'キンバリー', 'ジュリ', 'ケン',
  'ブランカ', 'ダルシム', 'エドモンド本田', 'ディージェイ',
  'マノン', 'マリーザ', 'JP', 'ザンギエフ',
  'リリー', 'キャミィ',
  // DLC Year 1（2023–2024）
  'ラシード', 'A.K.I.', 'エド', '豪鬼',
  // DLC Year 2（2024–2025）
  'ベガ', 'テリー', '舞', 'エレナ',
  // DLC Year 3（2025–2026）
  'サガット', 'C.ヴァイパー', 'アレックス', 'イングリッド',
];

// ============================================================
// CotW 全キャラ（公式日本語名・公式キャラセレ順）
// ベース17名 + DLC11名 = 計27名  / アーケード・スマート共通
// ※ ケンシロウは参戦未確認のため除外
// ============================================================
const COTW_ALL_CHARACTERS = [
  // ベースロスター
  'ロック・ハワード', 'テリー・ボガード', 'B.ジェニー', 'マルコ・ロドリゲス',
  'プリチャ', '双葉ほたる', 'ボックス・リーパー', 'グリフォンマスク',
  'ケビン・ライアン', 'ビリー・カーン', '不知火舞', 'キム・ドンファン',
  '牙刀', 'カイン・R・ハインライン',
  'クリスティアーノ・ロナウド', 'サルバトーレ・ガナッチ', '北斗丸',
  // DLC Season 1（2025）
  'アンディ・ボガード', 'ケン・マスターズ', 'ジョー・ヒガシ', '春麗', 'Mr.ビッグ',
  // DLC Season 2（2026）
  'キム・ジェイフン', 'ナイトメアギース', 'ブルー・マリー',
  'ヴォルフガング・クラウザー', 'Mr.KARATE',
];

export const INITIAL_CHARACTERS: Record<string, string[]> = {
  sf6_classic: SF6_ALL_CHARACTERS,
  sf6_modern:  SF6_ALL_CHARACTERS,
  cotw_arcade: COTW_ALL_CHARACTERS,
  cotw_smart:  COTW_ALL_CHARACTERS,
};

// ============================================================
// キャラクター名マイグレーション（旧名 → 正式日本語名）
// データが存在するゲームの既存キャラを自動リネームするために使用
// ============================================================
export const CHARACTER_NAME_MIGRATIONS: Record<string, string> = {
  // ---- SF6 ----
  // 旧シード短縮名
  'Ryu': 'リュウ', 'Ken': 'ケン', 'Chun-Li': '春麗', 'Luke': 'ルーク',
  // 英語名
  'Cammy': 'キャミィ', 'Guile': 'ガイル', 'Dhalsim': 'ダルシム',
  'Zangief': 'ザンギエフ', 'Juri': 'ジュリ', 'Dee Jay': 'ディージェイ',
  'E. Honda': 'エドモンド本田', 'Blanka': 'ブランカ',
  'Kimberly': 'キンバリー', 'Manon': 'マノン', 'Marisa': 'マリーザ',
  'Lily': 'リリー', 'Jamie': 'ジェイミー',
  'Rashid': 'ラシード', 'Ed': 'エド', 'Akuma': '豪鬼',
  'M. Bison': 'ベガ', 'Terry Bogard': 'テリー', 'Mai Shiranui': '舞',
  'Elena': 'エレナ', 'Sagat': 'サガット', 'C. Viper': 'C.ヴァイパー',
  'Alex': 'アレックス', 'Ingrid': 'イングリッド',
  // 旧日本語名（前バージョンで誤登録された名称）
  'E.本田': 'エドモンド本田',
  'マリーサ': 'マリーザ',
  'M.バイソン': 'ベガ',
  'テリー・ボガード': 'テリー',   // SF6での表記はテリー
  '不知火舞': '舞',              // SF6での表記は舞
  // ---- CotW（データありキャラのみ）----
  // Mr.KARATEは技データがあるためマイグレーション対象
  'ミスター・カラテ': 'Mr.KARATE',
  'Mr. Karate': 'Mr.KARATE',
};

// ============================================================

export const INITIAL_TAGS = [
  '安定', '突進技', '特殊効果あり', '位置調整あり',
  '位置ずれ注意', '相手に当たりやすい', '非推奨',
  'ドライブ系', 'REV系', 'ブレーキング', 'フェイント',
];

export const ALL_MOVE_CATEGORIES: MoveCategory[] = [
  'normal', 'commandNormal', 'special', 'super', 'common',
];

export const MOVE_CATEGORY_NAMES: Record<MoveCategory, string> = {
  normal: '通常技',
  commandNormal: '特殊技',
  special: '必殺技',
  super: '超必殺技',
  common: '共通技',
};

export const VERIFICATION_STATUS_LABELS: Record<string, string> = {
  unverified: '未検証',
  verified: '検証済み',
  needsReview: '要再確認',
};

export const VERIFICATION_STATUS_COLORS: Record<string, string> = {
  unverified: '#6b7280',
  verified: '#16a34a',
  needsReview: '#d97706',
};

// ---- プリセット初期値 ----

export const DEFAULT_SEARCH_DEFAULTS: SearchDefaults = {
  maxMoveCount: 3,
  allowRepeatSameMove: true,
  allowWaitFrames: false,
  maxWaitFrames: 5,
  enabledCategories: ['normal', 'commandNormal', 'special', 'super', 'common'],
};

export const INITIAL_PRESETS: Record<string, { moves: PresetMove[]; searchDefaults: SearchDefaults }> = {
  fatal_fury_cotw: {
    moves: [
      { name: 'ステップ',       category: 'common' },
      { name: 'ジャンプ',       category: 'common' },
      { name: '小ジャンプ',     category: 'common' },
      { name: 'バックステップ', category: 'common' },
      { name: 'フェイント',     category: 'common' },
      { name: '下フェイント',   category: 'common' },
      { name: '投げ',           category: 'common' },
      { name: '近距離立ちA', category: 'normal' },
      { name: '近距離立ちB', category: 'normal' },
      { name: '近距離立ちC', category: 'normal' },
      { name: '近距離立ちD', category: 'normal' },
      { name: '遠距離立ちA', category: 'normal' },
      { name: '遠距離立ちB', category: 'normal' },
      { name: '遠距離立ちC', category: 'normal' },
      { name: '遠距離立ちD', category: 'normal' },
      { name: 'しゃがみA',   category: 'normal' },
      { name: 'しゃがみB',   category: 'normal' },
      { name: 'しゃがみC',   category: 'normal' },
      { name: 'しゃがみD',   category: 'normal' },
      { name: '上段避け', category: 'commandNormal' },
      { name: '下段避け', category: 'commandNormal' },
    ],
    searchDefaults: DEFAULT_SEARCH_DEFAULTS,
  },
  sf6: {
    moves: [],
    searchDefaults: DEFAULT_SEARCH_DEFAULTS,
  },
};
