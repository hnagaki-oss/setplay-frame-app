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

const SF6_OFFICIAL_PROXY_BASE = '/official-site';
const SF6_ROSTER_SOURCE_PATH = '/6/ja-jp/character/chunli/frame';

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

function parseCharacterNameFromFrameHtml(html: string): string | null {
  const document = new DOMParser().parseFromString(html, 'text/html');
  const title = document.querySelector('title')?.textContent?.trim() ?? '';
  const match = title.match(/^(.+?)\s+フレームデータ/);
  return match?.[1]?.trim() || null;
}

async function fetchOfficialText(path: string): Promise<string> {
  const response = await fetch(`${SF6_OFFICIAL_PROXY_BASE}${path}`);
  if (!response.ok) {
    throw new Error(`公式サイト取得に失敗しました (${response.status})`);
  }
  return response.text();
}
