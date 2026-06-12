import { useState, useEffect, useCallback } from 'react';
import { db } from '../db';
import type { Character, Game } from '../types';
import { INITIAL_CHARACTERS } from '../constants';
import { genUUID, now } from '../utils';

interface Props {
  game: Game;
  onSelect: (characterName: string) => void;
  onBulkImportOfficial: () => Promise<void>;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

type CharacterListItem = {
  name: string;
  entryType: 'preset' | 'added';
  createdAt: string;
};

const AVATAR_PALETTE = [
  '#3b82f6', '#8b5cf6', '#06b6d4', '#10b981',
  '#f59e0b', '#ef4444', '#ec4899', '#14b8a6',
  '#6366f1', '#f97316', '#84cc16', '#0ea5e9',
];
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

function avatarColor(name: string): string {
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) & 0xffff;
  return AVATAR_PALETTE[h % AVATAR_PALETTE.length];
}

function localIconCandidates(gameId: string, name: string): string[] {
  const encodedName = encodeURIComponent(name);
  const fileNames = gameId === 'sf6' && SF6_LOCAL_ICON_SLUG_BY_NAME[name]
    ? [SF6_LOCAL_ICON_SLUG_BY_NAME[name], encodedName]
    : [encodedName];
  return fileNames.flatMap((fileName) =>
    LOCAL_ICON_EXTENSIONS.map((ext) => `/local-character-icons/${gameId}/${fileName}.${ext}`)
  );
}

// ---- 1枚のキャラカード ----
function CharacterCard({ char, gameId, onSelect, onEdited, showToast }: {
  char: CharacterListItem;
  gameId: string;
  onSelect: () => void;
  onEdited: () => void;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}) {
  const [mode, setMode] = useState<'view' | 'edit' | 'del'>('view');
  const [editName, setEditName] = useState('');
  const [iconIndex, setIconIndex] = useState(0);

  const color   = avatarColor(char.name);
  const initial = [...char.name][0] ?? '?';
  const iconCandidates = localIconCandidates(gameId, char.name);
  const iconSrc = iconIndex < iconCandidates.length ? iconCandidates[iconIndex] : null;

  const handleSaveEdit = async () => {
    const trimmed = editName.trim();
    if (!trimmed) return;
    const matches = await db.characters.where('gameId').equals(gameId).toArray();
    const gameMatches = matches.filter((candidate) => candidate.name === char.name);
    await Promise.all(gameMatches.map((candidate) =>
      db.characters.update(candidate.id, { name: trimmed, updatedAt: now() })
    ));
    showToast('名前を更新しました', 'success');
    setMode('view');
    onEdited();
  };

  const handleDelete = async () => {
    const allCharacters = await db.characters.where('gameId').equals(gameId).toArray();
    const targets = allCharacters.filter((candidate) => candidate.name === char.name);
    for (const target of targets) {
      await db.characters.delete(target.id);
      await db.moves.where('characterId').equals(target.id).delete();
      await db.setplays.where('characterId').equals(target.id).delete();
    }
    showToast(`「${char.name}」を削除しました`, 'info');
    onEdited();
  };

  if (mode === 'edit') {
    return (
      <div className="char-card char-card-editing">
        <input
          className="input input-sm"
          value={editName}
          onChange={(e) => setEditName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSaveEdit();
            if (e.key === 'Escape') setMode('view');
          }}
          autoFocus
        />
        <div className="char-card-row">
          <button className="btn btn-primary btn-sm" onClick={handleSaveEdit}>保存</button>
          <button className="btn btn-ghost btn-sm" onClick={() => setMode('view')}>戻る</button>
        </div>
      </div>
    );
  }

  if (mode === 'del') {
    return (
      <div className="char-card char-card-editing">
        <p className="char-card-confirm-text">「{char.name}」を削除しますか？</p>
        <div className="char-card-row">
          <button className="btn btn-danger btn-sm" onClick={handleDelete}>削除</button>
          <button className="btn btn-ghost btn-sm" onClick={() => setMode('view')}>戻る</button>
        </div>
      </div>
    );
  }

  return (
    <div className="char-card">
      <button className="char-card-main" onClick={onSelect} title={char.name}>
        <div className="char-avatar" style={{ backgroundColor: color }}>
          {iconSrc ? (
            <img
              className="char-avatar-img"
              src={iconSrc}
              alt=""
              draggable={false}
              onError={() => setIconIndex((current) => current + 1)}
            />
          ) : (
            initial
          )}
        </div>
        <span className="char-card-name">{char.name}</span>
      </button>
      <div className="char-card-actions">
        <button
          className="char-action-btn"
          title="名前を編集"
          onClick={() => { setEditName(char.name); setMode('edit'); }}
        >✏</button>
        <button
          className="char-action-btn char-action-del"
          title="削除"
          onClick={() => setMode('del')}
        >×</button>
      </div>
    </div>
  );
}

// ---- メインコンポーネント ----
export function CharacterSelect({ game, onSelect, onBulkImportOfficial, showToast }: Props) {
  const [characters, setCharacters] = useState<CharacterListItem[]>([]);
  const [newName, setNewName] = useState('');
  const [loading, setLoading] = useState(true);
  const [isImporting, setIsImporting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const allCharacters = await db.characters.where('gameId').equals(game.id).toArray();
    const byName = new Map<string, CharacterListItem>();

    for (const controlType of game.controlTypes) {
      for (const name of INITIAL_CHARACTERS[controlType.id] ?? []) {
        if (!byName.has(name)) {
          byName.set(name, { name, entryType: 'preset', createdAt: '' });
        }
      }
    }

    for (const character of allCharacters) {
      const existing = byName.get(character.name);
      if (!existing || existing.createdAt > character.createdAt || existing.createdAt === '') {
        byName.set(character.name, {
          name: character.name,
          entryType: character.entryType,
          createdAt: character.createdAt,
        });
      }
    }

    const chars = [...byName.values()];
    const canonical = INITIAL_CHARACTERS[game.controlTypes[0]?.id ?? ''] ?? [];
    chars.sort((a, b) => {
      const ia = canonical.indexOf(a.name);
      const ib = canonical.indexOf(b.name);
      if (ia === -1 && ib === -1) return a.createdAt.localeCompare(b.createdAt);
      if (ia === -1) return 1;
      if (ib === -1) return -1;
      return ia - ib;
    });

    setCharacters(chars);
    setLoading(false);
  }, [game]);

  useEffect(() => { load(); }, [load]);

  const handleAdd = async () => {
    const trimmed = newName.trim();
    if (!trimmed) return;

    const timestamp = now();
    const existing = await db.characters.where('gameId').equals(game.id).toArray();
    const toAdd: Character[] = game.controlTypes
      .filter((controlType) => !existing.some((character) =>
        character.controlTypeId === controlType.id && character.name === trimmed
      ))
      .map((controlType) => ({
        id: genUUID(),
        gameId: game.id,
        controlTypeId: controlType.id,
        name: trimmed,
        entryType: 'added',
        createdAt: timestamp,
        updatedAt: timestamp,
      }));

    if (toAdd.length > 0) await db.characters.bulkAdd(toAdd);
    showToast(`「${trimmed}」を追加しました`, 'success');

    setNewName('');
    load();
  };

  const handleBulkImportOfficial = async () => {
    setIsImporting(true);
    try {
      await onBulkImportOfficial();
      await load();
    } finally {
      setIsImporting(false);
    }
  };

  if (loading) return <div className="loading">読み込み中...</div>;

  return (
    <div className="char-select-view">
      <h2 className="select-title">キャラクターを選択</h2>
      <p className="select-subtitle">{game.name}</p>

      {game.id === 'sf6' && (
        <div className="select-actions">
          <button className="btn btn-outline" onClick={handleBulkImportOfficial} disabled={isImporting}>
            {isImporting ? '公式データ確認中...' : '公式データを一括インポート'}
          </button>
        </div>
      )}

      {characters.length === 0 ? (
        <p className="empty-message">キャラクターが登録されていません。</p>
      ) : (
        <div className="char-grid">
          {characters.map((char) => (
            <CharacterCard
              key={char.name}
              char={char}
              gameId={game.id}
              onSelect={() => onSelect(char.name)}
              onEdited={load}
              showToast={showToast}
            />
          ))}
        </div>
      )}

      <div className="char-add-bar">
        <input
          className="input"
          placeholder="キャラクター名を入力して追加"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); }}
        />
        <button className="btn btn-primary" onClick={handleAdd} disabled={!newName.trim()}>
          ＋ 追加
        </button>
      </div>
    </div>
  );
}
