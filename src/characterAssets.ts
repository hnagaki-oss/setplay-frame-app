import type { GameId } from './types';

const LOCAL_ICON_EXTENSIONS = ['webp', 'png', 'jpg', 'jpeg'];

const SF6_LOCAL_ICON_SLUG_BY_NAME: Record<string, string> = {
  'リュウ': 'ryu',
  'ルーク': 'luke',
  'ジェイミー': 'jamie',
  '春麗': 'chunli',
  'ガイル': 'guile',
  'キンバリー': 'kimberly',
  'ジュリ': 'juri',
  'ケン': 'ken',
  'ブランカ': 'blanka',
  'ダルシム': 'dhalsim',
  'エドモンド本田': 'ehonda',
  'ディージェイ': 'deejay',
  'マノン': 'manon',
  'マリーザ': 'marisa',
  'JP': 'jp',
  'ザンギエフ': 'zangief',
  'リリー': 'lily',
  'キャミィ': 'cammy',
  'ラシード': 'rashid',
  'A.K.I.': 'aki',
  'エド': 'ed',
  '豪鬼': 'gouki_akuma',
  'ベガ': 'vega_mbison',
  'テリー': 'terry',
  '舞': 'mai',
  'エレナ': 'elena',
  'サガット': 'sagat',
  'C.ヴァイパー': 'cviper',
  'アレックス': 'alex',
  'イングリッド': 'ingrid',
};

const COTW_LOCAL_ICON_SLUG_BY_NAME: Record<string, string> = {
  'ロック・ハワード': 'rock',
  'テリー・ボガード': 'terry',
  'B.ジェニー': 'janet',
  'マルコ・ロドリゲス': 'marco',
  'プリチャ': 'preecha',
  '双葉ほたる': 'hotaru',
  'ボックス・リーパー': 'vox',
  'グリフォンマスク': 'tizoc',
  'ケビン・ライアン': 'kevin',
  'ビリー・カーン': 'billy',
  '不知火舞': 'mai',
  'キム・ドンファン': 'donghwan',
  '牙刀': 'gato',
  'カイン・R・ハインライン': 'kain',
  'クリスティアーノ・ロナウド': 'cr7',
  'サルバトーレ・ガナッチ': 'ganacci',
  '北斗丸': 'hokutomaru',
  'アンディ・ボガード': 'andy',
  'ケン・マスターズ': 'ken',
  'ジョー・ヒガシ': 'joe',
  '春麗': 'chun-li',
  'Mr.ビッグ': 'mrbig',
  'キム・ジェイフン': 'jaehoon',
  'ナイトメアギース': 'geese',
  'ブルー・マリー': 'bluemary',
  'ヴォルフガング・クラウザー': 'krauser',
  'Mr.KARATE': 'karate',
};

export function gameLogoSrc(gameId: GameId): string {
  return `/local-game-logos/${gameId === 'sf6' ? 'sf6' : 'fatal_fury_cotw'}.png`;
}

export function localCharacterIconCandidates(gameId: GameId, name: string): string[] {
  const encodedName = encodeURIComponent(name);
  const localSlug =
    gameId === 'sf6'
      ? SF6_LOCAL_ICON_SLUG_BY_NAME[name]
      : gameId === 'fatal_fury_cotw'
        ? COTW_LOCAL_ICON_SLUG_BY_NAME[name]
        : null;
  const fileNames = localSlug ? [localSlug, encodedName] : [encodedName];

  return fileNames.flatMap((fileName) =>
    LOCAL_ICON_EXTENSIONS.map((ext) => `/local-character-icons/${gameId}/${fileName}.${ext}`)
  );
}
