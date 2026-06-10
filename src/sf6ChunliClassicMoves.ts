import type { Move } from './types';

export type SeedMove = Pick<Move, 'name' | 'category' | 'totalFrames' | 'startupFrames' | 'activeStartFrames' | 'activeFrames' | 'memo' | 'enabled'>;

export const SF6_CHUNLI_CLASSIC_DATA_META = {
  gameId: 'sf6',
  controlTypeId: 'sf6_classic',
  characterName: '春麗',
  sourceName: 'STREET FIGHTER 6 公式 春麗 フレームデータ',
  sourceUrl: 'https://www.streetfighter.com/6/ja-jp/character/chunli/frame',
  dataCheckedAt: '2026-06-10',
} as const;

const RAW_MOVES = [
  {
    "name": "立ち弱P（手突）",
    "category": "normal",
    "totalFrames": 13,
    "startupFrames": 4,
    "activeStartFrames": 4,
    "activeFrames": 6,
    "memo": "公式カテゴリ: 通常技\n公式コマンド: 弱P\n公式発生: 4\n公式持続: 4-6\n硬直: 7\nヒット: 5\nガード: -3\nキャンセル: C\nダメージ: 300\nコンボ補正: 始動補正20%\nDゲージ増加（ヒット）: 250\nDゲージ減少（ガード）: -500\nDゲージ減少（パニッシュ）: -2000\nSAゲージ増加: 300\n属性: 上\n備考: 連打キャンセル対応",
    "enabled": true
  },
  {
    "name": "立ち弱K（斧刃脚）",
    "category": "normal",
    "totalFrames": 17,
    "startupFrames": 5,
    "activeStartFrames": 5,
    "activeFrames": 7,
    "memo": "公式カテゴリ: 通常技\n公式コマンド: 弱K\n公式発生: 5\n公式持続: 5-7\n硬直: 10\nヒット: 2\nガード: -2\nキャンセル: C\nダメージ: 300\nコンボ補正: 始動補正20%\nDゲージ増加（ヒット）: 250\nDゲージ減少（ガード）: -500\nDゲージ減少（パニッシュ）: -2000\nSAゲージ増加: 300\n属性: 上",
    "enabled": true
  },
  {
    "name": "立ち中P（頸穿刀）",
    "category": "normal",
    "totalFrames": 18,
    "startupFrames": 5,
    "activeStartFrames": 5,
    "activeFrames": 8,
    "memo": "公式カテゴリ: 通常技\n公式コマンド: 中P\n公式発生: 5\n公式持続: 5-8\n硬直: 10\nヒット: 6\nガード: 1\nキャンセル: C\nダメージ: 600\nDゲージ増加（ヒット）: 1500\nDゲージ減少（ガード）: -3000\nDゲージ減少（パニッシュ）: -4000\nSAゲージ増加: 600\n属性: 上",
    "enabled": true
  },
  {
    "name": "立ち中K（外擺脚）",
    "category": "normal",
    "totalFrames": 26,
    "startupFrames": 7,
    "activeStartFrames": 7,
    "activeFrames": 10,
    "memo": "公式カテゴリ: 通常技\n公式コマンド: 中K\n公式発生: 7\n公式持続: 7-10\n硬直: 16\nヒット: 4\nガード: -2\nキャンセル: C\nダメージ: 500\nDゲージ増加（ヒット）: 1500\nDゲージ減少（ガード）: -3000\nDゲージ減少（パニッシュ）: -4000\nSAゲージ増加: 700\n属性: 上",
    "enabled": true
  },
  {
    "name": "立ち強P（顎狙突拳）",
    "category": "normal",
    "totalFrames": 35,
    "startupFrames": 13,
    "activeStartFrames": 13,
    "activeFrames": 15,
    "memo": "公式カテゴリ: 通常技\n公式コマンド: 強P\n公式発生: 13\n公式持続: 13-15\n硬直: 20\nヒット: 2\nガード: -3\nキャンセル: ※\nダメージ: 800\nDゲージ増加（ヒット）: 4000\nDゲージ減少（ガード）: -6000\nDゲージ減少（パニッシュ）: -8000\nSAゲージ増加: 800\n属性: 上\n備考: ヒット・ガード時、行雲流水でキャンセル可能",
    "enabled": true
  },
  {
    "name": "立ち強K（前周脚）",
    "category": "normal",
    "totalFrames": 34,
    "startupFrames": 14,
    "activeStartFrames": 14,
    "activeFrames": 16,
    "memo": "公式カテゴリ: 通常技\n公式コマンド: 強K\n公式発生: 14\n公式持続: 14-16\n硬直: 18\nヒット: 4\nガード: 0\nキャンセル: ※\nダメージ: 900\nコンボ補正: 始動補正20%\nDゲージ増加（ヒット）: 3000\nDゲージ減少（ガード）: -6000\nDゲージ減少（パニッシュ）: -10000\nSAゲージ増加: 1000\n属性: 上\n備考: ヒット・ガード時、行雲流水でキャンセル可能\n空中ヒット時吹き飛びダウン",
    "enabled": true
  },
  {
    "name": "しゃがみ弱P（尖打）",
    "category": "normal",
    "totalFrames": 13,
    "startupFrames": 4,
    "activeStartFrames": 4,
    "activeFrames": 6,
    "memo": "公式カテゴリ: 通常技\n公式コマンド: ↓+弱P\n公式発生: 4\n公式持続: 4-6\n硬直: 7\nヒット: 4\nガード: -2\nキャンセル: C\nダメージ: 300\nコンボ補正: 始動補正20%\nDゲージ増加（ヒット）: 250\nDゲージ減少（ガード）: -500\nDゲージ減少（パニッシュ）: -2000\nSAゲージ増加: 300\n属性: 上\n備考: 連打キャンセル対応",
    "enabled": true
  },
  {
    "name": "しゃがみ弱K（前掃腿）",
    "category": "normal",
    "totalFrames": 15,
    "startupFrames": 4,
    "activeStartFrames": 4,
    "activeFrames": 5,
    "memo": "公式カテゴリ: 通常技\n公式コマンド: ↓+弱K\n公式発生: 4\n公式持続: 4-5\n硬直: 10\nヒット: 0\nガード: -2\nキャンセル: C\nダメージ: 200\nコンボ補正: 始動補正20%\nDゲージ増加（ヒット）: 250\nDゲージ減少（ガード）: -500\nDゲージ減少（パニッシュ）: -2000\nSAゲージ増加: 300\n属性: 下\n備考: 連打キャンセル対応",
    "enabled": true
  },
  {
    "name": "しゃがみ中P（丹頂拳）",
    "category": "normal",
    "totalFrames": 22,
    "startupFrames": 6,
    "activeStartFrames": 6,
    "activeFrames": 9,
    "memo": "公式カテゴリ: 通常技\n公式コマンド: ↓+中P\n公式発生: 6\n公式持続: 6-9\n硬直: 13\nヒット: 4\nガード: -2\nキャンセル: C\nダメージ: 600\nDゲージ増加（ヒット）: 1500\nDゲージ減少（ガード）: -3000\nDゲージ減少（パニッシュ）: -4000\nSAゲージ増加: 600\n属性: 上\nフレーム補足: 空振り時硬直1F増加\n備考: 空振り時硬直1F増加",
    "enabled": true
  },
  {
    "name": "しゃがみ中K（後掃旋腿）",
    "category": "normal",
    "totalFrames": 28,
    "startupFrames": 7,
    "activeStartFrames": 7,
    "activeFrames": 9,
    "memo": "公式カテゴリ: 通常技\n公式コマンド: ↓+中K\n公式発生: 7\n公式持続: 7-9\n硬直: 19\nヒット: -2\nガード: -6\nキャンセル: C\nダメージ: 500\nコンボ補正: 始動補正20%\nDゲージ増加（ヒット）: 1000\nDゲージ減少（ガード）: -2000\nDゲージ減少（パニッシュ）: -4000\nSAゲージ増加: 500\n属性: 下",
    "enabled": true
  },
  {
    "name": "しゃがみ強P（孔雀掌）",
    "category": "normal",
    "totalFrames": 41,
    "startupFrames": 11,
    "activeStartFrames": 19,
    "activeFrames": 23,
    "memo": "公式カテゴリ: 通常技\n公式コマンド: ↓+強P\n公式発生: 11\n公式持続: 11-23\n持続詳細: 11-13, 19-23\n硬直: 18\nヒット: 1\nガード: -3\nキャンセル: C\nダメージ: 900\nDゲージ増加（ヒット）: 2000\nDゲージ減少（ガード）: -5000\nDゲージ減少（パニッシュ）: -8000\nSAゲージ増加: 1000\n属性: 上\n備考: 強制立ち効果\n初段のみ空中ヒット時吹き飛びダウン",
    "enabled": true
  },
  {
    "name": "しゃがみ強K（元伝暗殺蹴）",
    "category": "normal",
    "totalFrames": 33,
    "startupFrames": 9,
    "activeStartFrames": 9,
    "activeFrames": 14,
    "memo": "公式カテゴリ: 通常技\n公式コマンド: ↓+強K\n公式発生: 9\n公式持続: 9-14\n硬直: 19\nヒット: D\nガード: -9\nキャンセル: ※\nダメージ: 900\nDゲージ増加（ヒット）: 3000\nDゲージ減少（ガード）: -4000\nDゲージ減少（パニッシュ）: -10000\nSAゲージ増加: 1000\n属性: 下\n備考: ※ヒット・ガード時、行雲流水でキャンセル可能　\nパニッシュカウンター時ダウン時間増加、ハードノックダウン\n空中ヒット時吹き飛びダウン",
    "enabled": true
  },
  {
    "name": "← or →+中P（追突拳）",
    "category": "commandNormal",
    "totalFrames": 24,
    "startupFrames": 7,
    "activeStartFrames": 7,
    "activeFrames": 9,
    "memo": "公式カテゴリ: 特殊技\n公式コマンド: ← or →+中P\n公式発生: 7\n公式持続: 7-9\n硬直: 15\nヒット: 2\nガード: -3\nキャンセル: C\nダメージ: 600\nDゲージ増加（ヒット）: 1500\nDゲージ減少（ガード）: -3000\nDゲージ減少（パニッシュ）: -4000\nSAゲージ増加: 500\n属性: 上",
    "enabled": true
  },
  {
    "name": "←+強P（発勁）",
    "category": "commandNormal",
    "totalFrames": 27,
    "startupFrames": 8,
    "activeStartFrames": 8,
    "activeFrames": 13,
    "memo": "公式カテゴリ: 特殊技\n公式コマンド: ←+強P\n公式発生: 8\n公式持続: 8-13\n硬直: 14\nヒット: 5\nガード: -1\nキャンセル: C\nダメージ: 800\nDゲージ増加（ヒット）: 2000\nDゲージ減少（ガード）: -5000\nDゲージ減少（パニッシュ）: -10000\nSAゲージ増加: 1000\n属性: 上",
    "enabled": true
  },
  {
    "name": "↘+強P（水蓮掌）",
    "category": "commandNormal",
    "totalFrames": 38,
    "startupFrames": 21,
    "activeStartFrames": 21,
    "activeFrames": 23,
    "memo": "公式カテゴリ: 特殊技\n公式コマンド: ↘+強P\n公式発生: 21\n公式持続: 21-23\n硬直: 15\nヒット: 2\nガード: -3\nキャンセル: ※\nダメージ: 800\nDゲージ増加（ヒット）: 2000\nDゲージ減少（ガード）: -5000\nDゲージ減少（パニッシュ）: -5000\nSAゲージ増加: 1000\n属性: 中\n備考: ※ヒット・ガード時、行雲流水でキャンセル可能",
    "enabled": true
  },
  {
    "name": "→+強K（翼旋脚）",
    "category": "commandNormal",
    "totalFrames": 40,
    "startupFrames": 16,
    "activeStartFrames": 16,
    "activeFrames": 17,
    "memo": "公式カテゴリ: 特殊技\n公式コマンド: →+強K\n公式発生: 16\n公式持続: 16-17\n硬直: 23\nヒット: -1\nガード: -4\nキャンセル: ※\nダメージ: 800\nDゲージ増加（ヒット）: 2000\nDゲージ減少（ガード）: -5000\nDゲージ減少（パニッシュ）: -10000\nSAゲージ増加: 1000\n属性: 上\nフレーム補足: 6～28F\n備考: ※ヒット・ガード時、行雲流水でキャンセル可能\nパニッシュカウンター時　膝崩れ\n空中パニッシュカウンター時吹き飛びダウン\n6～28F　空中判定",
    "enabled": true
  },
  {
    "name": "↘+強K（鶴脚落）",
    "category": "commandNormal",
    "totalFrames": null,
    "startupFrames": 37,
    "activeStartFrames": 37,
    "activeFrames": 38,
    "memo": "公式カテゴリ: 特殊技\n公式コマンド: ↘+強K\n公式発生: 37\n公式持続: 37-38\n硬直: 1+着地後12\nヒット: 7\nガード: 3\nダメージ: 800\nDゲージ増加（ヒット）: 2000\nDゲージ減少（ガード）: -5000\nDゲージ減少（パニッシュ）: -10000\nSAゲージ増加: 1000\n属性: 中\nフレーム補足: 7～39F\n備考: めくり性能\n空中ヒット時吹き飛びダウン\n7～39F　空中判定\n検索用全体Fは自動算出対象外です。",
    "enabled": false
  },
  {
    "name": "↓↙←+P（行雲流水）",
    "category": "commandNormal",
    "totalFrames": 89,
    "startupFrames": null,
    "activeStartFrames": null,
    "activeFrames": null,
    "memo": "公式カテゴリ: 特殊技\n公式コマンド: ↓↙←+P\n公式発生: -\n公式持続: -\n硬直: 全体 89\nダメージ: 0\nDゲージ増加（ヒット）: 0\nDゲージ減少（ガード）: 0\nDゲージ減少（パニッシュ）: 0\nSAゲージ増加: 0\nフレーム補足: 動作15F～各種派生技にキャンセル可能・ガード可能\n備考: 必殺技キャンセル可能な通常技・特殊技からキャンセル発動可能\n「行雲流水」中に、再度同じコマンドを入力する事で動作を中断可\n動作15F～各種派生技にキャンセル可能・ガード可能\n下方向を入力し続けると動作を継続する",
    "enabled": true
  },
  {
    "name": "（行雲流水中に）弱P（蘭華）",
    "category": "commandNormal",
    "totalFrames": null,
    "startupFrames": 5,
    "activeStartFrames": 5,
    "activeFrames": 9,
    "memo": "公式カテゴリ: 特殊技\n公式コマンド: （行雲流水中に）弱P\n公式発生: 5\n公式持続: 5-9\n硬直: ※17\nヒット: ※-3\nガード: ※-4\nキャンセル: C\nダメージ: 500\nDゲージ増加（ヒット）: 500\nDゲージ減少（ガード）: -1500\nDゲージ減少（パニッシュ）: -2000\nSAゲージ増加: 300\n属性: 上\nフレーム補足: 硬直17F以降はガード可能\n備考: ※行雲流水を継続した場合の数値\n硬直17F以降はガード可能\n検索用全体Fは自動算出対象外です。",
    "enabled": false
  },
  {
    "name": "（行雲流水中に）中P（這蛇突）",
    "category": "commandNormal",
    "totalFrames": null,
    "startupFrames": 6,
    "activeStartFrames": 6,
    "activeFrames": 17,
    "memo": "公式カテゴリ: 特殊技\n公式コマンド: （行雲流水中に）中P\n公式発生: 6\n公式持続: 6-17\n硬直: ※20\nヒット: D\nガード: ※-15\nダメージ: 750\nDゲージ増加（ヒット）: 2000\nDゲージ減少（ガード）: -3000\nDゲージ減少（パニッシュ）: -4000\nSAゲージ増加: 300\n属性: 下\nフレーム補足: 硬直20F目はガード可能な硬直\n備考: ※行雲流水を継続した場合の数値\n硬直20F目はガード可能な硬直\n検索用全体Fは自動算出対象外です。",
    "enabled": false
  },
  {
    "name": "（行雲流水中に）強P（蓮掌）",
    "category": "commandNormal",
    "totalFrames": 51,
    "startupFrames": 23,
    "activeStartFrames": 31,
    "activeFrames": 32,
    "memo": "公式カテゴリ: 特殊技\n公式コマンド: （行雲流水中に）強P\n公式発生: 23\n公式持続: 23-32\n持続詳細: 23-24, 31-32\n硬直: 19\nヒット: 2\nガード: -3\nキャンセル: C\nダメージ: 900\nDゲージ増加（ヒット）: 2000\nDゲージ減少（ガード）: -5000\nDゲージ減少（パニッシュ）: -6000\nSAゲージ増加: 600\n属性: ※中上\n備考: ※初段が空振り時のみ2段目が中段判定",
    "enabled": true
  },
  {
    "name": "（行雲流水中に）弱K（前突）",
    "category": "commandNormal",
    "totalFrames": null,
    "startupFrames": 8,
    "activeStartFrames": 8,
    "activeFrames": 12,
    "memo": "公式カテゴリ: 特殊技\n公式コマンド: （行雲流水中に）弱K\n公式発生: 8\n公式持続: 8-12\n硬直: ※13\nヒット: ※-1\nガード: ※-5\nキャンセル: C\nダメージ: 500\nDゲージ増加（ヒット）: 500\nDゲージ減少（ガード）: -1500\nDゲージ減少（パニッシュ）: -2000\nSAゲージ増加: 300\n属性: 下\nフレーム補足: 硬直13F目はガード可能な硬直\n備考: ※行雲流水を継続した場合の数値\n硬直13F目はガード可能な硬直\n検索用全体Fは自動算出対象外です。",
    "enabled": false
  },
  {
    "name": "（行雲流水中に）中K（仙風）",
    "category": "commandNormal",
    "totalFrames": null,
    "startupFrames": 10,
    "activeStartFrames": 10,
    "activeFrames": 14,
    "memo": "公式カテゴリ: 特殊技\n公式コマンド: （行雲流水中に）中K\n公式発生: 10\n公式持続: 10-14\n硬直: ※23\nヒット: ※-4\nガード: ※-10\nキャンセル: C\nダメージ: 800\nDゲージ増加（ヒット）: 2000\nDゲージ減少（ガード）: -3000\nDゲージ減少（パニッシュ）: -4000\nSAゲージ増加: 1000\n属性: 下\nフレーム補足: 硬直23F目はガード可能な硬直\n備考: ※行雲流水を継続した場合の数値\n硬直23F目はガード可能な硬直\n検索用全体Fは自動算出対象外です。",
    "enabled": false
  },
  {
    "name": "（行雲流水中に）強K（天空脚）",
    "category": "commandNormal",
    "totalFrames": 36,
    "startupFrames": 8,
    "activeStartFrames": 8,
    "activeFrames": 12,
    "memo": "公式カテゴリ: 特殊技\n公式コマンド: （行雲流水中に）強K\n公式発生: 8\n公式持続: 8-12\n硬直: 24\nヒット: D\nガード: -9\nキャンセル: ※\nダメージ: 700\nDゲージ増加（ヒット）: 2000\nDゲージ減少（ガード）: -5000\nDゲージ減少（パニッシュ）: -10000\nSAゲージ増加: 300\n属性: 上\n備考: ※ヒット時のみジャンプキャンセル可能",
    "enabled": true
  },
  {
    "name": "←溜め→+弱P（弱 気功拳）",
    "category": "special",
    "totalFrames": 47,
    "startupFrames": 15,
    "activeStartFrames": 15,
    "activeFrames": 104,
    "memo": "公式カテゴリ: 必殺技\n公式コマンド: ←溜め→+弱P\n公式発生: 15\n公式持続: 15-104\n硬直: 全体 47\nヒット: -3\nガード: -7\nキャンセル: SA3\nダメージ: 600\nDゲージ増加（ヒット）: 1000\nDゲージ減少（ガード）: -2500\nDゲージ減少（パニッシュ）: -3000\nSAゲージ増加: 300\n属性: 上・弾",
    "enabled": true
  },
  {
    "name": "←溜め→+中P（中 気功拳）",
    "category": "special",
    "totalFrames": 45,
    "startupFrames": 12,
    "activeStartFrames": 12,
    "activeFrames": 66,
    "memo": "公式カテゴリ: 必殺技\n公式コマンド: ←溜め→+中P\n公式発生: 12\n公式持続: 12-66\n硬直: 全体 45\nヒット: -3\nガード: -7\nキャンセル: SA3\nダメージ: 600\nDゲージ増加（ヒット）: 1000\nDゲージ減少（ガード）: -2500\nDゲージ減少（パニッシュ）: -3000\nSAゲージ増加: 300\n属性: 上・弾",
    "enabled": true
  },
  {
    "name": "←溜め→+強P（強 気功拳）",
    "category": "special",
    "totalFrames": 43,
    "startupFrames": 11,
    "activeStartFrames": 11,
    "activeFrames": 35,
    "memo": "公式カテゴリ: 必殺技\n公式コマンド: ←溜め→+強P\n公式発生: 11\n公式持続: 11-35\n硬直: 全体 43\nヒット: -2\nガード: -6\nキャンセル: SA3\nダメージ: 600\nDゲージ増加（ヒット）: 1000\nDゲージ減少（ガード）: -2500\nDゲージ減少（パニッシュ）: -3000\nSAゲージ増加: 300\n属性: 上・弾",
    "enabled": true
  },
  {
    "name": "←溜め→+P+P（OD 気功拳）",
    "category": "special",
    "totalFrames": 39,
    "startupFrames": 11,
    "activeStartFrames": null,
    "activeFrames": null,
    "memo": "公式カテゴリ: 必殺技\n公式コマンド: ←溜め→+P+P\n公式発生: 11\n公式持続: -\n硬直: 全体 39\nヒット: 5\nガード: 0\nキャンセル: SA2\nダメージ: 800\nコンボ補正: 始動補正20%\nDゲージ増加（ヒット）: 0\nDゲージ減少（ガード）: -2500\nDゲージ減少（パニッシュ）: -5000\nSAゲージ増加: 400\n属性: 上・弾",
    "enabled": true
  },
  {
    "name": "↓↘→+弱K（弱 百裂脚）",
    "category": "special",
    "totalFrames": 40,
    "startupFrames": 5,
    "activeStartFrames": 19,
    "activeFrames": 20,
    "memo": "公式カテゴリ: 必殺技\n公式コマンド: ↓↘→+弱K\n公式発生: 5\n公式持続: 5-20\n持続詳細: 5-6, 12-13, 19-20\n硬直: 20\nヒット: 3\nガード: -8\nキャンセル: SA3\nダメージ: 800\nコンボ補正: 始動補正20%\nDゲージ増加（ヒット）: 2000\nDゲージ減少（ガード）: -3000\nDゲージ減少（パニッシュ）: -5000\nSAゲージ増加: 800\n属性: 上\n備考: 2段目のみSA3/CAでキャンセル可能\n最終段パニッシュカウンター時吹き飛びダウン",
    "enabled": true
  },
  {
    "name": "↓↘→+中K（中 百裂脚）",
    "category": "special",
    "totalFrames": 54,
    "startupFrames": 12,
    "activeStartFrames": 31,
    "activeFrames": 32,
    "memo": "公式カテゴリ: 必殺技\n公式コマンド: ↓↘→+中K\n公式発生: 12\n公式持続: 12-32\n持続詳細: 12-13, 18-19, 24-25, 31-32\n硬直: 22\nヒット: 3\nガード: -8\nキャンセル: SA3\nダメージ: 900\nDゲージ増加（ヒット）: 2000\nDゲージ減少（ガード）: -4000\nDゲージ減少（パニッシュ）: -5000\nSAゲージ増加: 800\n属性: 上\n備考: 3段目のみSA3/CAでキャンセル可能",
    "enabled": true
  },
  {
    "name": "↓↘→+強K（強 百裂脚）",
    "category": "special",
    "totalFrames": 62,
    "startupFrames": 23,
    "activeStartFrames": 46,
    "activeFrames": 47,
    "memo": "公式カテゴリ: 必殺技\n公式コマンド: ↓↘→+強K\n公式発生: 23\n公式持続: 23-47\n持続詳細: 23-24, 28-29, 32-33, 38-39, 46-47\n硬直: 15\nヒット: D\nガード: -3\nキャンセル: SA3\nダメージ: 1000\nDゲージ増加（ヒット）: 2000\nDゲージ減少（ガード）: -4000\nDゲージ減少（パニッシュ）: -5000\nSAゲージ増加: 800\n属性: 上\n備考: 4段目のみSA3/CAでキャンセル可能",
    "enabled": true
  },
  {
    "name": "↓↘→+K+K（OD 百裂脚）",
    "category": "special",
    "totalFrames": 54,
    "startupFrames": 8,
    "activeStartFrames": 32,
    "activeFrames": 33,
    "memo": "公式カテゴリ: 必殺技\n公式コマンド: ↓↘→+K+K\n公式発生: 8\n公式持続: 8-33\n持続詳細: 8-9, 14-15, 20-21, 26-27, 32-33\n硬直: 21\nヒット: 3\nガード: -3\nキャンセル: SA2\nダメージ: 1000\nコンボ補正: 始動補正20%\nDゲージ増加（ヒット）: 0\nDゲージ減少（ガード）: -4000\nDゲージ減少（パニッシュ）: -5000\nSAゲージ増加: 800\n属性: 上\n備考: 5段目のみSA2/SA3/CAでキャンセル可能\n最終段パニッシュカウンター時膝崩れ\nヒット・ガード時に百裂連脚に派生可能",
    "enabled": true
  },
  {
    "name": "（OD百裂脚後に）K+K（百裂連脚）",
    "category": "special",
    "totalFrames": 71,
    "startupFrames": 11,
    "activeStartFrames": 46,
    "activeFrames": 46,
    "memo": "公式カテゴリ: 必殺技\n公式コマンド: （OD百裂脚後に）K+K\n公式発生: 11\n公式持続: 11- 46\n持続詳細: 11-12, 18-19, 24-25, 31-32, 46\n硬直: 25\nヒット: D\nガード: -13\nダメージ: 700\nDゲージ増加（ヒット）: 0\nDゲージ減少（ガード）: -5000\nDゲージ減少（パニッシュ）: -5000\nSAゲージ増加: 500\n属性: 上",
    "enabled": true
  },
  {
    "name": "↓溜め↑+弱K（弱 スピニングバードキック）",
    "category": "special",
    "totalFrames": null,
    "startupFrames": 9,
    "activeStartFrames": 25,
    "activeFrames": 26,
    "memo": "公式カテゴリ: 必殺技\n公式コマンド: ↓溜め↑+弱K\n公式発生: 9\n公式持続: 9-26\n持続詳細: 9-10, 17-18, 25-26\n硬直: 6+着地後24\nヒット: D\nガード: -18\nダメージ: 1000\nDゲージ増加（ヒット）: 2000\nDゲージ減少（ガード）: -3000\nDゲージ減少（パニッシュ）: -5000\nSAゲージ増加: 1200\n属性: 上\nフレーム補足: 8～32F\n備考: 8～32F　空中判定\n検索用全体Fは自動算出対象外です。",
    "enabled": false
  },
  {
    "name": "↓溜め↑+中K（中 スピニングバードキック）",
    "category": "special",
    "totalFrames": null,
    "startupFrames": 16,
    "activeStartFrames": 47,
    "activeFrames": 48,
    "memo": "公式カテゴリ: 必殺技\n公式コマンド: ↓溜め↑+中K\n公式発生: 16\n公式持続: 16-48\n持続詳細: 16-17, 24-25, 32-33, 41-42, 47-48\n硬直: 8+着地後21\nヒット: D\nガード: -17\nダメージ: 1200\nDゲージ増加（ヒット）: 2000\nDゲージ減少（ガード）: -4000\nDゲージ減少（パニッシュ）: -5000\nSAゲージ増加: 1200\n属性: 上\nフレーム補足: 15～56F\n備考: 15～56F　空中判定\n検索用全体Fは自動算出対象外です。",
    "enabled": false
  },
  {
    "name": "↓溜め↑+強K（強 スピニングバードキック）",
    "category": "special",
    "totalFrames": null,
    "startupFrames": 20,
    "activeStartFrames": 63,
    "activeFrames": 64,
    "memo": "公式カテゴリ: 必殺技\n公式コマンド: ↓溜め↑+強K\n公式発生: 20\n公式持続: 20-64\n持続詳細: 20-21, 26-27, 36-37, 44-45, 51-52, 58-59, 63-64\n硬直: 8+着地後22\nヒット: D\nガード: -18\nダメージ: 1400\nDゲージ増加（ヒット）: 2000\nDゲージ減少（ガード）: -4200\nDゲージ減少（パニッシュ）: -5000\nSAゲージ増加: 1200\n属性: 上\nフレーム補足: 18～72F\n備考: 18～72F　空中判定\n検索用全体Fは自動算出対象外です。",
    "enabled": false
  },
  {
    "name": "↓溜め↑+K+K（OD スピニングバードキック）",
    "category": "special",
    "totalFrames": null,
    "startupFrames": 16,
    "activeStartFrames": 54,
    "activeFrames": 55,
    "memo": "公式カテゴリ: 必殺技\n公式コマンド: ↓溜め↑+K+K\n公式発生: 16\n公式持続: 16-55\n持続詳細: 16-17, 22-23, 28-29, 35-36, 41-42, 48-49, 54-55\n硬直: 8+着地後15\nヒット: D\nガード: -12\nダメージ: 800\nDゲージ増加（ヒット）: 0\nDゲージ減少（ガード）: -4200\nDゲージ減少（パニッシュ）: -5000\nSAゲージ増加: 1200\n属性: 上\nフレーム補足: 14～63F\n備考: 14～63F　空中判定\n検索用全体Fは自動算出対象外です。",
    "enabled": false
  },
  {
    "name": "↓↙←+弱K（弱 覇山蹴）",
    "category": "special",
    "totalFrames": 45,
    "startupFrames": 23,
    "activeStartFrames": 23,
    "activeFrames": 25,
    "memo": "公式カテゴリ: 必殺技\n公式コマンド: ↓↙←+弱K\n公式発生: 23\n公式持続: 23-25\n硬直: 20\nヒット: D\nガード: -5\nキャンセル: SA3\nダメージ: 700\nコンボ補正: 始動補正20%\nDゲージ増加（ヒット）: 2000\nDゲージ減少（ガード）: -4000\nDゲージ減少（パニッシュ）: -4000\nSAゲージ増加: 1200\n属性: 中\nフレーム補足: 5～20F\n備考: 5～20F　空中判定",
    "enabled": true
  },
  {
    "name": "↓↙←+中K（中 覇山蹴）",
    "category": "special",
    "totalFrames": 45,
    "startupFrames": 27,
    "activeStartFrames": 27,
    "activeFrames": 29,
    "memo": "公式カテゴリ: 必殺技\n公式コマンド: ↓↙←+中K\n公式発生: 27\n公式持続: 27-29\n硬直: 16\nヒット: 2\nガード: -3\nキャンセル: SA3\nダメージ: 1000\nコンボ補正: 始動補正30%\nDゲージ増加（ヒット）: 2000\nDゲージ減少（ガード）: -4000\nDゲージ減少（パニッシュ）: -5000\nSAゲージ増加: 1200\n属性: 中\nフレーム補足: 7～21F / 6～24F\n備考: 7～21F　下半分飛び道具無敵\n6～24F　空中判定",
    "enabled": true
  },
  {
    "name": "↓↙←+強K（強 覇山蹴）",
    "category": "special",
    "totalFrames": 52,
    "startupFrames": 32,
    "activeStartFrames": 32,
    "activeFrames": 34,
    "memo": "公式カテゴリ: 必殺技\n公式コマンド: ↓↙←+強K\n公式発生: 32\n公式持続: 32-34\n硬直: 18\nヒット: 6\nガード: -1\nキャンセル: SA3\nダメージ: 1200\nコンボ補正: 始動補正20%\nDゲージ増加（ヒット）: 2000\nDゲージ減少（ガード）: -4000\nDゲージ減少（パニッシュ）: -7000\nSAゲージ増加: 1200\n属性: 中\nフレーム補足: 7～26F / 6～29F\n備考: 7～26F　下半分飛び道具無敵\n6～29F　空中判定",
    "enabled": true
  },
  {
    "name": "↓↙←+K+K（OD 覇山蹴）",
    "category": "special",
    "totalFrames": 44,
    "startupFrames": 26,
    "activeStartFrames": 26,
    "activeFrames": 28,
    "memo": "公式カテゴリ: 必殺技\n公式コマンド: ↓↙←+K+K\n公式発生: 26\n公式持続: 26-28\n硬直: 16\nヒット: D\nガード: -5\nキャンセル: SA2\nダメージ: 1200\nコンボ補正: 始動補正20%\nコンボ補正20%\nDゲージ増加（ヒット）: 0\nDゲージ減少（ガード）: -4000\nDゲージ減少（パニッシュ）: -5000\nSAゲージ増加: 1200\n属性: 中\nフレーム補足: 7～21F / 22～28F / 6～23F\n備考: 7～21F　下半分飛び道具無敵\n22～28F　飛び道具無敵\n6～23F　空中判定",
    "enabled": true
  },
  {
    "name": "↓↓+弱K（弱 天昇脚）",
    "category": "special",
    "totalFrames": null,
    "startupFrames": 5,
    "activeStartFrames": 17,
    "activeFrames": 18,
    "memo": "公式カテゴリ: 必殺技\n公式コマンド: ↓↓+弱K\n公式発生: 5\n公式持続: 5-18\n持続詳細: 5-7, 17-18\n硬直: 27+着地後12\nヒット: D\nガード: -37\nダメージ: 900\nDゲージ増加（ヒット）: 2000\nDゲージ減少（ガード）: -3000\nDゲージ減少（パニッシュ）: -5000\nSAゲージ増加: 1000\n属性: 上\nフレーム補足: 1～10F / 8～45F\n備考: 1～10F　空中判定の打撃・空弾属性に対して無敵\n8～45F　空中判定\n検索用全体Fは自動算出対象外です。",
    "enabled": false
  },
  {
    "name": "↓↓+中K（中 天昇脚）",
    "category": "special",
    "totalFrames": null,
    "startupFrames": 7,
    "activeStartFrames": 19,
    "activeFrames": 20,
    "memo": "公式カテゴリ: 必殺技\n公式コマンド: ↓↓+中K\n公式発生: 7\n公式持続: 7-20\n持続詳細: 7-9, 19-20\n硬直: 31+着地後12\nヒット: D\nガード: -41\nダメージ: 1000\nDゲージ増加（ヒット）: 2000\nDゲージ減少（ガード）: -3000\nDゲージ減少（パニッシュ）: -5000\nSAゲージ増加: 1000\n属性: 上\nフレーム補足: 1～10F / 8～51F\n備考: 1～10F　空中判定の打撃・空弾属性に対して無敵\n8～51F　空中判定\n検索用全体Fは自動算出対象外です。",
    "enabled": false
  },
  {
    "name": "↓↓+強K（強 天昇脚）",
    "category": "special",
    "totalFrames": null,
    "startupFrames": 9,
    "activeStartFrames": 42,
    "activeFrames": 43,
    "memo": "公式カテゴリ: 必殺技\n公式コマンド: ↓↓+強K\n公式発生: 9\n公式持続: 9-43\n持続詳細: 9-11, 19-20, 29-30, 42-43\n硬直: 26+着地後12\nヒット: D\nガード: -57\nダメージ: 1200\nDゲージ増加（ヒット）: 2000\nDゲージ減少（ガード）: -3000\nDゲージ減少（パニッシュ）: -5000\nSAゲージ増加: 1000\n属性: 上\nフレーム補足: 1～10F / 8～69F\n備考: 1～10F　空中判定の打撃・空弾属性に対して無敵\n8～69F　空中判定\n検索用全体Fは自動算出対象外です。",
    "enabled": false
  },
  {
    "name": "↓↓+K+K（OD 天昇脚）",
    "category": "special",
    "totalFrames": null,
    "startupFrames": 6,
    "activeStartFrames": 64,
    "activeFrames": 66,
    "memo": "公式カテゴリ: 必殺技\n公式コマンド: ↓↓+K+K\n公式発生: 6\n公式持続: 6-66\n持続詳細: 6-8, 14-16,42-44,49-51,55-57,64-66\n硬直: 37+着地後12\nヒット: D\nガード: -40\nダメージ: 1400\nDゲージ増加（ヒット）: 0\nDゲージ減少（ガード）: -3000\nDゲージ減少（パニッシュ）: 0\nSAゲージ増加: 1200\n属性: 上\nフレーム補足: 1～7F / 8～32F\n備考: 1～7F　完全無敵\n8～32F　空中判定\n3段目以降は2段目ヒット時のみ派生\n検索用全体Fは自動算出対象外です。",
    "enabled": false
  },
  {
    "name": "↓↘→↓↘→+P（SA1 気功掌）",
    "category": "super",
    "totalFrames": 122,
    "startupFrames": 7,
    "activeStartFrames": 7,
    "activeFrames": 76,
    "memo": "公式カテゴリ: スーパーアーツ\n公式コマンド: ↓↘→↓↘→+P\n公式発生: 7\n公式持続: 7-76\n硬直: 全体 122\nヒット: D\nガード: -22\nダメージ: 1700\nDゲージ増加（ヒット）: 0\nDゲージ減少（ガード）: -2500\nDゲージ減少（パニッシュ）: -5000\nSAゲージ増加: 0\n属性: 上\n備考: 1-7　打撃・投げに対して無敵\n最低保障ダメージ30％\nカウンター/パニッシュカウンターで数値が変動しない",
    "enabled": true
  },
  {
    "name": "↓↘→↓↘→+K（SA2 鳳翼扇）",
    "category": "super",
    "totalFrames": 144,
    "startupFrames": 11,
    "activeStartFrames": 94,
    "activeFrames": 96,
    "memo": "公式カテゴリ: スーパーアーツ\n公式コマンド: ↓↘→↓↘→+K\n公式発生: 11\n公式持続: 11-96\n持続詳細: 11-12,14-15,17-18,20-21,24-25,27-28,30-31,33-34,46-47,50-51,54-55,58-59,62-63,66-67,69-70,94-96\n硬直: 48\nヒット: D\nガード: -35\nキャンセル: ※\nダメージ: 2000\nコンボ補正: 始動補正40%\nコンボ補正40%\nDゲージ増加（ヒット）: 0\nDゲージ減少（ガード）: -5000\nDゲージ減少（パニッシュ）: -10000\nSAゲージ増加: 0\n属性: 上\nフレーム補足: 1-12F\n備考: 1-12F　完全無敵\n最低保障ダメージ40％\nカウンター/パニッシュカウンターで数値が変動しない\n※最終段ヒット時のみジャンプキャンセル可能",
    "enabled": true
  },
  {
    "name": "↓↙←↓↙←+K（SA3 蒼天乱華）",
    "category": "super",
    "totalFrames": 82,
    "startupFrames": 8,
    "activeStartFrames": 42,
    "activeFrames": 42,
    "memo": "公式カテゴリ: スーパーアーツ\n公式コマンド: ↓↙←↓↙←+K\n公式発生: 8\n公式持続: 8-42\n持続詳細: 8-9, 34,42\n硬直: 40\nヒット: D\nガード: -24\nダメージ: 4000\nコンボ補正: ※即時補正10％\nDゲージ増加（ヒット）: 0\nDゲージ減少（ガード）: -7500\nDゲージ減少（パニッシュ）: -15000\nSAゲージ増加: 0\n属性: 上\nフレーム補足: 1-9F\n備考: 1-9F　完全無敵\n最低保障ダメージ50％\nカウンター/パニッシュカウンターで数値が変動しない\n※必殺技キャンセル時のみ適用",
    "enabled": true
  },
  {
    "name": "（体力25%以下で）↓↙←↓↙←+K（CA 蒼天乱華）",
    "category": "super",
    "totalFrames": 82,
    "startupFrames": 8,
    "activeStartFrames": 42,
    "activeFrames": 42,
    "memo": "公式カテゴリ: スーパーアーツ\n公式コマンド: （体力25%以下で）↓↙←↓↙←+K\n公式発生: 8\n公式持続: 8-42\n持続詳細: 8-9, 34,42\n硬直: 40\nヒット: D\nガード: -24\nダメージ: 4500\nコンボ補正: ※即時補正10％\nDゲージ増加（ヒット）: 0\nDゲージ減少（ガード）: -10000\nDゲージ減少（パニッシュ）: -20000\nSAゲージ増加: 0\n属性: 上\nフレーム補足: 1-9F\n備考: 1-9F　完全無敵\n最低保障ダメージ50％\nカウンター/パニッシュカウンターで数値が変動しない\n※必殺技キャンセル時のみ適用",
    "enabled": true
  },
  {
    "name": "（近距離で）N or →+弱P+弱K（虎襲倒）",
    "category": "common",
    "totalFrames": 30,
    "startupFrames": 5,
    "activeStartFrames": 5,
    "activeFrames": 7,
    "memo": "公式カテゴリ: 通常投げ\n公式コマンド: （近距離で）N or →+弱P+弱K\n公式発生: 5\n公式持続: 5-7\n硬直: 23\nヒット: D\nダメージ: 1200\nコンボ補正: 即時補正20%\nDゲージ増加（ヒット）: 2000\nDゲージ減少（ガード）: 0\nDゲージ減少（パニッシュ）: -10000\nSAゲージ増加: 2000\n属性: 投\n備考: パニッシュカウンター時以下の性能変化\n・ダメージ2040\n・SAゲージ4000増加\n・ハードノックダウン",
    "enabled": true
  },
  {
    "name": "（近距離で）←+弱P+弱K（太極扇）",
    "category": "common",
    "totalFrames": 30,
    "startupFrames": 5,
    "activeStartFrames": 5,
    "activeFrames": 7,
    "memo": "公式カテゴリ: 通常投げ\n公式コマンド: （近距離で）←+弱P+弱K\n公式発生: 5\n公式持続: 5-7\n硬直: 23\nヒット: D\nダメージ: 1200\nコンボ補正: 即時補正20%\nDゲージ増加（ヒット）: 2000\nDゲージ減少（ガード）: 0\nDゲージ減少（パニッシュ）: -10000\nSAゲージ増加: 2000\n属性: 投\n備考: パニッシュカウンター時以下の性能変化\n・ダメージ2040\n・SAゲージ4000増加\n・ハードノックダウン",
    "enabled": true
  },
  {
    "name": "→→（前方ステップ）",
    "category": "common",
    "totalFrames": 19,
    "startupFrames": null,
    "activeStartFrames": null,
    "activeFrames": null,
    "memo": "公式カテゴリ: 共通システム\n公式コマンド: →→\n公式発生: -\n公式持続: -\n硬直: 全体 19\nダメージ: 0\nDゲージ増加（ヒット）: 0\nDゲージ減少（ガード）: 0\nDゲージ減少（パニッシュ）: 0\nSAゲージ増加: 0",
    "enabled": true
  },
  {
    "name": "←←（後方ステップ）",
    "category": "common",
    "totalFrames": 25,
    "startupFrames": null,
    "activeStartFrames": null,
    "activeFrames": null,
    "memo": "公式カテゴリ: 共通システム\n公式コマンド: ←←\n公式発生: -\n公式持続: -\n硬直: 全体 25\nダメージ: 0\nDゲージ増加（ヒット）: 0\nDゲージ減少（ガード）: 0\nDゲージ減少（パニッシュ）: 0\nSAゲージ増加: 0\nフレーム補足: 1-15F\n備考: 1-15F　投げ無敵",
    "enabled": true
  },
  {
    "name": "強P+強K（ドライブインパクト（鳳閃脚））",
    "category": "common",
    "totalFrames": 62,
    "startupFrames": 26,
    "activeStartFrames": 26,
    "activeFrames": 27,
    "memo": "公式カテゴリ: 共通システム\n公式コマンド: 強P+強K\n公式発生: 26\n公式持続: 26-27\n硬直: 35\nヒット: D\nガード: -3\nダメージ: 800\nコンボ補正: 始動補正20%\nDゲージ増加（ヒット）: 0\nDゲージ減少（ガード）: -5000\nDゲージ減少（パニッシュ）: -15000\nSAゲージ増加: 0\n属性: 上\nフレーム補足: 1-27F\n備考: 1-27F　 アーマー判定（2回）\nパニッシュカウンター、もしくはアーマー成立後にヒットで以下の性能変化\n・地上ヒット膝崩れ\n・空中ヒットきりもみダウン\n・SAゲージ3000増加",
    "enabled": true
  },
  {
    "name": "（ガード中 or ドライブパリィ成立中に）→+強P+強K（[ガード時]ドライブリバーサル（鳳翼脚））",
    "category": "common",
    "totalFrames": 61,
    "startupFrames": 20,
    "activeStartFrames": 33,
    "activeFrames": 35,
    "memo": "公式カテゴリ: 共通システム\n公式コマンド: （ガード中 or ドライブパリィ成立中に）→+強P+強K\n公式発生: 20\n公式持続: 20-35\n持続詳細: 20-22, 33-35\n硬直: 26\nヒット: D\nガード: -6\nダメージ: 500\nDゲージ増加（ヒット）: 0\nDゲージ減少（ガード）: 0\nDゲージ減少（パニッシュ）: 0\nSAゲージ増加: 0\n属性: 上\nフレーム補足: 1-22F / ヒット時硬直が7F増加\n備考: リカバリアブルダメージ\n1-22F　完全無敵\nヒット時硬直が7F増加",
    "enabled": true
  },
  {
    "name": "（起き上がり時に）→+強P+強K（[起き上がり時]ドライブリバーサル（鳳翼脚））",
    "category": "common",
    "totalFrames": 59,
    "startupFrames": 18,
    "activeStartFrames": 31,
    "activeFrames": 33,
    "memo": "公式カテゴリ: 共通システム\n公式コマンド: （起き上がり時に）→+強P+強K\n公式発生: 18\n公式持続: 18-33\n持続詳細: 18-20, 31-33\n硬直: 26\nヒット: D\nガード: -6\nダメージ: 500\nDゲージ増加（ヒット）: 0\nDゲージ減少（ガード）: 0\nDゲージ減少（パニッシュ）: 0\nSAゲージ増加: 0\n属性: 上\nフレーム補足: 1-20F / ヒット時硬直7F増加\n備考: リカバリアブルダメージ\n1-20F 完全無敵\nヒット時硬直7F増加",
    "enabled": true
  },
  {
    "name": "中P+中K（ドライブパリィ）",
    "category": "common",
    "totalFrames": 45,
    "startupFrames": 1,
    "activeStartFrames": 1,
    "activeFrames": 12,
    "memo": "公式カテゴリ: 共通システム\n公式コマンド: 中P+中K\n公式発生: 1\n公式持続: [※2] 1-12\n硬直: 33\nキャンセル: ※1\nダメージ: 0\nDゲージ増加（ヒット）: 0\nDゲージ減少（ガード）: 0\nDゲージ減少（パニッシュ）: 0\nSAゲージ増加: 0\nフレーム補足: ※1 動作の4F目からドライブラッシュでキャンセル可 / ※2 ボタンホールドでパリィの持続を延長可 / 硬直部分はガードのみ可\n備考: ※1 動作の4F目からドライブラッシュでキャンセル可\n※2 ボタンホールドでパリィの持続を延長可\n硬直部分はガードのみ可\n動作中常に被パニッシュカウンター判定",
    "enabled": true
  },
  {
    "name": "ガード方向+中P+中K（ジャストパリィ（打撃））",
    "category": "common",
    "totalFrames": null,
    "startupFrames": 1,
    "activeStartFrames": null,
    "activeFrames": null,
    "memo": "公式カテゴリ: 共通システム\n公式コマンド: ガード方向+中P+中K\n公式発生: 1\n公式持続: -\n硬直: 1\nダメージ: 0\nコンボ補正: 始動補正50％\nフレーム補足: 入力したフレーム、もしくはその次のフレームで攻撃を受けると成立する / 硬直終了から5Fの間完全無敵 （パリィを継続した場合は無敵にならない）\n備考: 相手の攻撃に対応した方向入力を行った状態でパリィを入力し、\n入力したフレーム、もしくはその次のフレームで攻撃を受けると成立する\n（上段/中段攻撃に対して←方向、下段攻撃に対しては↙方向)\n方向が正しくなかった場合は通常のドライブパリィとなり、追加でDゲージが3000増加する\n硬直終了から5Fの間完全無敵 （パリィを継続した場合は無敵にならない）\nジャストパリィを取られた側はキャンセルが出来なくなり、動作終了まで強制パニッシュカウンター\n検索用全体Fは自動算出対象外です。",
    "enabled": false
  },
  {
    "name": "中P+中K（ジャストパリィ（飛び道具））",
    "category": "common",
    "totalFrames": null,
    "startupFrames": 1,
    "activeStartFrames": null,
    "activeFrames": null,
    "memo": "公式カテゴリ: 共通システム\n公式コマンド: 中P+中K\n公式発生: 1\n公式持続: -\n硬直: 10\nダメージ: 0\nコンボ補正: 始動補正50％\nフレーム補足: パリィを入力したフレーム、もしくはその次のフレームで攻撃を受けると成立する\n備考: パリィを入力したフレーム、もしくはその次のフレームで攻撃を受けると成立する\n暗転演出が入らない\nジャストパリィを取られた側はキャンセルが出来なくなり、動作終了まで強制パニッシュカウンター\n検索用全体Fは自動算出対象外です。",
    "enabled": false
  },
  {
    "name": "（ドライブパリィ中に）→→（パリィドライブラッシュ）",
    "category": "common",
    "totalFrames": 45,
    "startupFrames": null,
    "activeStartFrames": null,
    "activeFrames": null,
    "memo": "公式カテゴリ: 共通システム\n公式コマンド: （ドライブパリィ中に）→→\n公式発生: -\n公式持続: -\n硬直: 全体 45\nキャンセル: ※\nダメージ: 0\nコンボ補正: 乗算補正15％\nDゲージ増加（ヒット）: 0\nDゲージ減少（ガード）: 0\nDゲージ減少（パニッシュ）: 0\nSAゲージ増加: 0\nフレーム補足: 暗転10F / ※動作9F目から攻撃行動にキャンセル可 / 24F目からパリィ以外の行動でキャンセル可\n備考: 暗転10F\n※動作9F目から攻撃行動にキャンセル可\n　24F目からパリィ以外の行動でキャンセル可",
    "enabled": true
  },
  {
    "name": "（必殺技キャンセル可能な攻撃ヒット中に）→→ or (N or →)+中P+中K（キャンセルドライブラッシュ）",
    "category": "common",
    "totalFrames": 46,
    "startupFrames": null,
    "activeStartFrames": null,
    "activeFrames": null,
    "memo": "公式カテゴリ: 共通システム\n公式コマンド: （必殺技キャンセル可能な攻撃ヒット中に）→→ or (N or →)+中P+中K\n公式発生: -\n公式持続: -\n硬直: 全体 46\nキャンセル: ※\nダメージ: 0\nコンボ補正: 乗算補正15％\nDゲージ増加（ヒット）: 0\nDゲージ減少（ガード）: 0\nDゲージ減少（パニッシュ）: 0\nSAゲージ増加: 0\nフレーム補足: 暗転9F / ※動作10F目から攻撃行動にキャンセル可 / 25F目からパリィ以外の行動でキャンセル可\n備考: 暗転9F\n※動作10F目から攻撃行動にキャンセル可\n　25F目からパリィ以外の行動でキャンセル可",
    "enabled": true
  }
];

export const SF6_CHUNLI_CLASSIC_MOVES = RAW_MOVES as SeedMove[];
