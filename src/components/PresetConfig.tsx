import { useState, useEffect } from 'react';
import { db } from '../db';
import type { Preset, PresetMove, MoveCategory, SearchDefaults, Game, ControlType } from '../types';
import { ALL_MOVE_CATEGORIES, MOVE_CATEGORY_NAMES, INITIAL_PRESETS, DEFAULT_SEARCH_DEFAULTS, INITIAL_TAGS } from '../constants';
import { now } from '../utils';

interface Props {
  game: Game;
  controlType: ControlType;
  onSaved: () => void;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

function presetId(gameId: string, controlTypeId: string) {
  return `${gameId}_${controlTypeId}`;
}

export function PresetConfig({ game, controlType, onSaved, showToast }: Props) {
  // ---- 技表 ----
  const [moves, setMoves] = useState<PresetMove[]>([]);
  const [newMoveName, setNewMoveName] = useState('');
  const [newMoveCat, setNewMoveCat] = useState<MoveCategory>('normal');
  const [deleteMoveIdx, setDeleteMoveIdx] = useState<number | null>(null);

  // ---- 検索デフォルト ----
  const [searchDefaults, setSearchDefaults] = useState<SearchDefaults>(DEFAULT_SEARCH_DEFAULTS);

  // ---- タグ ----
  const [tags, setTags] = useState<string[]>([...INITIAL_TAGS]);
  const [newTagName, setNewTagName] = useState('');
  const [editTagIdx, setEditTagIdx] = useState<number | null>(null);
  const [editTagVal, setEditTagVal] = useState('');
  const [deleteTagIdx, setDeleteTagIdx] = useState<number | null>(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    (async () => {
      const pid = presetId(game.id, controlType.id);
      const existing = await db.presets.get(pid);
      if (existing) {
        setMoves(existing.moves);
        setSearchDefaults(existing.searchDefaults);
        setTags(existing.tags?.length ? existing.tags : [...INITIAL_TAGS]);
      } else {
        const initial = INITIAL_PRESETS[game.id];
        setMoves(initial?.moves ?? []);
        setSearchDefaults(initial?.searchDefaults ?? DEFAULT_SEARCH_DEFAULTS);
        setTags([...INITIAL_TAGS]);
      }
      setLoading(false);
    })();
  }, [game.id, controlType.id]);

  // ---- 技表ハンドラ ----
  const handleAddMove = () => {
    const trimmed = newMoveName.trim();
    if (!trimmed) return;
    setMoves((prev) => [...prev, { name: trimmed, category: newMoveCat }]);
    setNewMoveName('');
  };

  const handleDeleteMove = (idx: number) => {
    setMoves((prev) => prev.filter((_, i) => i !== idx));
    setDeleteMoveIdx(null);
  };

  const moveMoveUp = (idx: number) => {
    if (idx === 0) return;
    setMoves((prev) => { const n = [...prev]; [n[idx-1], n[idx]] = [n[idx], n[idx-1]]; return n; });
  };

  const moveMoveDown = (idx: number) => {
    setMoves((prev) => {
      if (idx >= prev.length - 1) return prev;
      const n = [...prev]; [n[idx], n[idx+1]] = [n[idx+1], n[idx]]; return n;
    });
  };

  const handleMoveCatChange = (idx: number, cat: MoveCategory) =>
    setMoves((prev) => prev.map((m, i) => i === idx ? { ...m, category: cat } : m));

  const handleMoveNameChange = (idx: number, name: string) =>
    setMoves((prev) => prev.map((m, i) => i === idx ? { ...m, name } : m));

  // ---- タグハンドラ ----
  const handleAddTag = () => {
    const trimmed = newTagName.trim();
    if (!trimmed || tags.includes(trimmed)) return;
    setTags((prev) => [...prev, trimmed]);
    setNewTagName('');
  };

  const handleSaveTagEdit = (idx: number) => {
    const trimmed = editTagVal.trim();
    if (!trimmed) return;
    setTags((prev) => prev.map((t, i) => i === idx ? trimmed : t));
    setEditTagIdx(null);
  };

  const handleDeleteTag = (idx: number) => {
    setTags((prev) => prev.filter((_, i) => i !== idx));
    setDeleteTagIdx(null);
  };

  const moveTagUp = (idx: number) => {
    if (idx === 0) return;
    setTags((prev) => { const n = [...prev]; [n[idx-1], n[idx]] = [n[idx], n[idx-1]]; return n; });
  };

  const moveTagDown = (idx: number) => {
    setTags((prev) => {
      if (idx >= prev.length - 1) return prev;
      const n = [...prev]; [n[idx], n[idx+1]] = [n[idx+1], n[idx]]; return n;
    });
  };

  // ---- 検索カテゴリ ----
  const toggleEnabledCat = (cat: MoveCategory) => {
    setSearchDefaults((prev) => ({
      ...prev,
      enabledCategories: prev.enabledCategories.includes(cat)
        ? prev.enabledCategories.filter((c) => c !== cat)
        : [...prev.enabledCategories, cat],
    }));
  };

  // ---- 他の操作タイプへコピー ----
  const handleCopyTo = async (targetCt: ControlType) => {
    const preset: Preset = {
      id: presetId(game.id, targetCt.id),
      gameId: game.id,
      controlTypeId: targetCt.id,
      moves,
      searchDefaults,
      tags,
      updatedAt: now(),
    };
    await db.presets.put(preset);
    showToast(`「${targetCt.name}」にプリセットをコピーしました`, 'success');
  };

  // ---- 保存 ----
  const handleSave = async () => {
    const preset: Preset = {
      id: presetId(game.id, controlType.id),
      gameId: game.id,
      controlTypeId: controlType.id,
      moves,
      searchDefaults,
      tags,
      updatedAt: now(),
    };
    await db.presets.put(preset);
    showToast('プリセットを保存しました', 'success');
    onSaved();
  };

  if (loading) return <div className="loading">読み込み中...</div>;

  const grouped = ALL_MOVE_CATEGORIES.map((cat) => ({
    cat,
    items: moves.map((m, i) => ({ ...m, idx: i })).filter((m) => m.category === cat),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="preset-config">

      {/* ===== ベース技表 ===== */}
      <div className="preset-section">
        <h3 className="preset-section-title">ベース技表</h3>
        <p className="preset-section-desc">
          新しいキャラクターを追加したとき自動登録される技の一覧です。<br />
          フレームデータ（発生・持続・全体）は各キャラのページで入力します。
        </p>

        {moves.length === 0 && (
          <p className="empty-message-sm">技が登録されていません。下のフォームから追加してください。</p>
        )}

        {grouped.map(({ cat, items }) => (
          <div key={cat} className="preset-cat-group">
            <div className="preset-cat-label">{MOVE_CATEGORY_NAMES[cat]}</div>
            {items.map(({ name, idx }) => (
              <div key={idx} className="preset-move-row">
                {deleteMoveIdx === idx ? (
                  <div className="delete-confirm-row">
                    <span>「{name}」を削除しますか？</span>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDeleteMove(idx)}>削除</button>
                    <button className="btn btn-ghost btn-sm" onClick={() => setDeleteMoveIdx(null)}>キャンセル</button>
                  </div>
                ) : (
                  <>
                    <select
                      className="select select-sm preset-move-cat-sel"
                      value={moves[idx].category}
                      onChange={(e) => handleMoveCatChange(idx, e.target.value as MoveCategory)}
                    >
                      {ALL_MOVE_CATEGORIES.map((c) => (
                        <option key={c} value={c}>{MOVE_CATEGORY_NAMES[c]}</option>
                      ))}
                    </select>
                    <input
                      className="input preset-move-name-input"
                      value={moves[idx].name}
                      onChange={(e) => handleMoveNameChange(idx, e.target.value)}
                    />
                    <div className="preset-move-btns">
                      <button className="btn btn-ghost btn-sm" onClick={() => moveMoveUp(idx)} disabled={idx === 0} title="上へ">↑</button>
                      <button className="btn btn-ghost btn-sm" onClick={() => moveMoveDown(idx)} disabled={idx === moves.length - 1} title="下へ">↓</button>
                      <button className="btn btn-ghost btn-sm text-danger" onClick={() => setDeleteMoveIdx(idx)}>削除</button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        ))}

        <div className="preset-add-form">
          <select className="select select-sm" value={newMoveCat} onChange={(e) => setNewMoveCat(e.target.value as MoveCategory)}>
            {ALL_MOVE_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>{MOVE_CATEGORY_NAMES[cat]}</option>
            ))}
          </select>
          <input
            className="input"
            placeholder="技名を入力して追加"
            value={newMoveName}
            onChange={(e) => setNewMoveName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleAddMove(); }}
          />
          <button className="btn btn-primary" onClick={handleAddMove} disabled={!newMoveName.trim()}>追加</button>
        </div>
      </div>

      {/* ===== タグ管理 ===== */}
      <div className="preset-section">
        <h3 className="preset-section-title">タグ管理</h3>
        <p className="preset-section-desc">
          技に設定できるタグの一覧です。タグ名をクリックして編集できます。
        </p>

        {tags.length === 0 && (
          <p className="empty-message-sm">タグが登録されていません。</p>
        )}

        <div className="tag-manage-list">
          {tags.map((tag, idx) => (
            <div key={idx} className="tag-manage-row">
              {deleteTagIdx === idx ? (
                <div className="delete-confirm-row">
                  <span>「{tag}」を削除しますか？</span>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDeleteTag(idx)}>削除</button>
                  <button className="btn btn-ghost btn-sm" onClick={() => setDeleteTagIdx(null)}>キャンセル</button>
                </div>
              ) : editTagIdx === idx ? (
                <div className="tag-edit-row">
                  <input
                    className="input input-sm"
                    value={editTagVal}
                    autoFocus
                    onChange={(e) => setEditTagVal(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveTagEdit(idx);
                      if (e.key === 'Escape') setEditTagIdx(null);
                    }}
                  />
                  <button className="btn btn-primary btn-sm" onClick={() => handleSaveTagEdit(idx)}>保存</button>
                  <button className="btn btn-ghost btn-sm" onClick={() => setEditTagIdx(null)}>キャンセル</button>
                </div>
              ) : (
                <>
                  <button
                    className="tag-manage-name"
                    onClick={() => { setEditTagIdx(idx); setEditTagVal(tag); }}
                    title="クリックして編集"
                  >
                    {tag}
                  </button>
                  <div className="tag-manage-actions">
                    <button className="btn btn-ghost btn-sm" onClick={() => moveTagUp(idx)} disabled={idx === 0} title="上へ">↑</button>
                    <button className="btn btn-ghost btn-sm" onClick={() => moveTagDown(idx)} disabled={idx === tags.length - 1} title="下へ">↓</button>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => { setEditTagIdx(idx); setEditTagVal(tag); }}
                    >編集</button>
                    <button className="btn btn-ghost btn-sm text-danger" onClick={() => setDeleteTagIdx(idx)}>削除</button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>

        <div className="preset-add-form">
          <input
            className="input"
            placeholder="新しいタグ名を入力"
            value={newTagName}
            onChange={(e) => setNewTagName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleAddTag(); }}
          />
          <button
            className="btn btn-primary"
            onClick={handleAddTag}
            disabled={!newTagName.trim() || tags.includes(newTagName.trim())}
          >
            追加
          </button>
        </div>
        {newTagName.trim() && tags.includes(newTagName.trim()) && (
          <p style={{ fontSize: '0.82rem', color: 'var(--danger)', marginTop: '0.25rem' }}>
            同名のタグが既に存在します
          </p>
        )}
      </div>

      {/* ===== 検索デフォルトルール ===== */}
      <div className="preset-section">
        <h3 className="preset-section-title">検索デフォルトルール</h3>
        <p className="preset-section-desc">
          フレーム検索を開いたときの初期値として使用されます。
        </p>

        <div className="preset-defaults-grid">
          <label className="form-label">
            最大技数：{searchDefaults.maxMoveCount}
            <input type="range" min={1} max={5} className="range-input"
              value={searchDefaults.maxMoveCount}
              onChange={(e) => setSearchDefaults((p) => ({ ...p, maxMoveCount: Number(e.target.value) }))} />
            <div className="range-labels"><span>1</span><span>2</span><span>3</span><span>4</span><span>5</span></div>
          </label>

          <label className="checkbox-label">
            <input type="checkbox" checked={searchDefaults.allowRepeatSameMove}
              onChange={(e) => setSearchDefaults((p) => ({ ...p, allowRepeatSameMove: e.target.checked }))} />
            同じ技を複数回使用可
          </label>

          <label className="checkbox-label">
            <input type="checkbox" checked={searchDefaults.allowWaitFrames}
              onChange={(e) => setSearchDefaults((p) => ({ ...p, allowWaitFrames: e.target.checked }))} />
            待ちF（ニュートラル待機）を許可する
          </label>

          {searchDefaults.allowWaitFrames && (
            <label className="form-label">
              最大待ちF：{searchDefaults.maxWaitFrames}F
              <input type="range" min={1} max={30} className="range-input"
                value={searchDefaults.maxWaitFrames}
                onChange={(e) => setSearchDefaults((p) => ({ ...p, maxWaitFrames: Number(e.target.value) }))} />
            </label>
          )}

          <div className="form-label">
            検索対象カテゴリ
            <div className="cat-checkboxes">
              {ALL_MOVE_CATEGORIES.map((cat) => (
                <label key={cat} className="checkbox-label">
                  <input type="checkbox"
                    checked={searchDefaults.enabledCategories.includes(cat)}
                    onChange={() => toggleEnabledCat(cat)} />
                  {MOVE_CATEGORY_NAMES[cat]}
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 他の操作タイプへコピー */}
      {game.controlTypes.length > 1 && (
        <div className="preset-copy-bar">
          <span className="preset-copy-label">このプリセットを他の操作タイプにコピー：</span>
          <div className="preset-copy-btns">
            {game.controlTypes
              .filter((ct) => ct.id !== controlType.id)
              .map((ct) => (
                <button
                  key={ct.id}
                  className="btn btn-ghost btn-sm"
                  onClick={() => handleCopyTo(ct)}
                >
                  {ct.name} にコピー
                </button>
              ))}
          </div>
        </div>
      )}

      {/* 保存ボタン */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button className="btn btn-primary btn-lg" onClick={handleSave}>保存</button>
      </div>
    </div>
  );
}
