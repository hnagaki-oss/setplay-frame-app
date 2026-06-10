import { useState, useEffect, useCallback } from 'react';
import { db } from '../db';
import type { Character, Game, ControlType, Move } from '../types';
import { INITIAL_CHARACTERS } from '../constants';
import { genUUID, now } from '../utils';

interface Props {
  game: Game;
  controlType: ControlType;
  onSelect: (char: Character) => void;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

const AVATAR_PALETTE = [
  '#3b82f6', '#8b5cf6', '#06b6d4', '#10b981',
  '#f59e0b', '#ef4444', '#ec4899', '#14b8a6',
  '#6366f1', '#f97316', '#84cc16', '#0ea5e9',
];

function avatarColor(name: string): string {
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) & 0xffff;
  return AVATAR_PALETTE[h % AVATAR_PALETTE.length];
}

// ---- 1枚のキャラカード ----
function CharacterCard({ char, onSelect, onEdited, showToast }: {
  char: Character;
  onSelect: () => void;
  onEdited: () => void;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}) {
  const [mode, setMode] = useState<'view' | 'edit' | 'del'>('view');
  const [editName, setEditName] = useState('');

  const color   = avatarColor(char.name);
  const initial = [...char.name][0] ?? '?';

  const handleSaveEdit = async () => {
    const trimmed = editName.trim();
    if (!trimmed) return;
    await db.characters.update(char.id, { name: trimmed, updatedAt: now() });
    showToast('名前を更新しました', 'success');
    setMode('view');
    onEdited();
  };

  const handleDelete = async () => {
    await db.characters.delete(char.id);
    await db.moves.where('characterId').equals(char.id).delete();
    await db.setplays.where('characterId').equals(char.id).delete();
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
          {initial}
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
export function CharacterSelect({ game, controlType, onSelect, showToast }: Props) {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [newName, setNewName] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const chars = await db.characters
      .where('[gameId+controlTypeId]')
      .equals([game.id, controlType.id])
      .toArray();

    const canonical = INITIAL_CHARACTERS[controlType.id] ?? [];
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
  }, [game.id, controlType.id]);

  useEffect(() => { load(); }, [load]);

  const handleAdd = async () => {
    const trimmed = newName.trim();
    if (!trimmed) return;

    const char: Character = {
      id: genUUID(),
      gameId: game.id,
      controlTypeId: controlType.id,
      name: trimmed,
      entryType: 'added',
      createdAt: now(),
      updatedAt: now(),
    };
    await db.characters.add(char);

    // プリセット技を自動シード
    const pid = `${game.id}_${controlType.id}`;
    const preset = await db.presets.get(pid);
    if (preset && preset.moves.length > 0) {
      const moves: Move[] = preset.moves.map((p) => ({
        id: genUUID(),
        gameId: game.id,
        controlTypeId: controlType.id,
        characterId: char.id,
        name: p.name,
        category: p.category,
        entryType: 'preset' as const,
        totalFrames: null,
        startupFrames: null,
        activeFrames: null,
        tags: [],
        memo: '',
        enabled: true,
        createdAt: now(),
        updatedAt: now(),
      }));
      await db.moves.bulkAdd(moves);
      showToast(`「${trimmed}」を追加しました（プリセット技${moves.length}件を登録）`, 'success');
    } else {
      showToast(`「${trimmed}」を追加しました`, 'success');
    }

    setNewName('');
    load();
  };

  if (loading) return <div className="loading">読み込み中...</div>;

  return (
    <div className="char-select-view">
      <h2 className="select-title">キャラクターを選択</h2>
      <p className="select-subtitle">{game.name} / {controlType.name}</p>

      {characters.length === 0 ? (
        <p className="empty-message">キャラクターが登録されていません。</p>
      ) : (
        <div className="char-grid">
          {characters.map((char) => (
            <CharacterCard
              key={char.id}
              char={char}
              onSelect={() => onSelect(char)}
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
