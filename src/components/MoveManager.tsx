import { useState, useEffect, useCallback } from 'react';
import { db } from '../db';
import type { Move, MoveCategory, Character } from '../types';
import { ALL_MOVE_CATEGORIES, MOVE_CATEGORY_NAMES, INITIAL_TAGS } from '../constants';
import { genUUID, now } from '../utils';

interface Props {
  character: Character;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

type ModalFormData = {
  name: string;
  category: MoveCategory;
  entryType: 'preset' | 'added';
  tags: string[];
  memo: string;
  enabled: boolean;
};

const DEFAULT_FORM = (): ModalFormData => ({
  name: '',
  category: 'normal',
  entryType: 'added',
  tags: [],
  memo: '',
  enabled: true,
});

// ---- インライン Frame 入力コンポーネント ----
function FrameInput({
  value,
  placeholder,
  onCommit,
}: {
  value: number | null;
  placeholder?: string;
  onCommit: (val: number | null) => void;
}) {
  const [local, setLocal] = useState(value?.toString() ?? '');

  useEffect(() => {
    setLocal(value?.toString() ?? '');
  }, [value]);

  const commit = () => {
    const trimmed = local.trim();
    const num = trimmed === '' ? null : parseInt(trimmed, 10);
    const parsed = num === null || isNaN(num) ? null : Math.max(1, num);
    if (parsed !== value) onCommit(parsed);
    setLocal(parsed?.toString() ?? '');
  };

  return (
    <input
      type="number"
      className="frame-inline-input"
      value={local}
      min={1}
      placeholder={placeholder ?? '--'}
      onChange={(e) => setLocal(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
    />
  );
}

// ---- 1行の技コンポーネント ----
function MoveRow({
  move,
  onFrameUpdate,
  onToggleEnabled,
  onOpenDetail,
  onDeleteRequest,
}: {
  move: Move;
  onFrameUpdate: (id: string, patch: Partial<Pick<Move, 'startupFrames' | 'activeStartFrames' | 'activeFrames' | 'totalFrames'>>) => void;
  onToggleEnabled: (move: Move) => void;
  onOpenDetail: (move: Move) => void;
  onDeleteRequest: (id: string) => void;
}) {
  const memoPreview = getMoveMemoPreview(move.memo);

  return (
    <div className={`move-row ${!move.enabled ? 'move-disabled' : ''}`}>
      {/* 技名 */}
      <div className="move-row-name">
        <span className="move-name">{move.name}</span>
        {memoPreview && (
          <span className="move-memo-preview" title={move.memo}>
            {memoPreview}
          </span>
        )}
        {move.tags.length > 0 && (
          <div className="move-tags-inline">
            {move.tags.map((t) => <span key={t} className="tag">{t}</span>)}
          </div>
        )}
        {!move.enabled && <span className="disabled-badge">検索除外</span>}
      </div>

      {/* フレーム入力 */}
      <FrameInput
        value={move.startupFrames}
        placeholder="--"
        onCommit={(v) => onFrameUpdate(move.id, { startupFrames: v })}
      />
      <FrameInput
        value={move.activeStartFrames ?? null}
        placeholder="発生F"
        onCommit={(v) => onFrameUpdate(move.id, { activeStartFrames: v })}
      />
      <FrameInput
        value={move.activeFrames}
        placeholder="--"
        onCommit={(v) => onFrameUpdate(move.id, { activeFrames: v })}
      />
      <FrameInput
        value={move.totalFrames}
        placeholder="必須"
        onCommit={(v) => onFrameUpdate(move.id, { totalFrames: v })}
      />

      {/* 操作 */}
      <div className="move-row-actions">
        <button
          className={`btn btn-sm ${move.enabled ? 'btn-ghost' : 'btn-outline'}`}
          title={move.enabled ? '検索から除外する' : '検索に含める'}
          onClick={() => onToggleEnabled(move)}
        >
          {move.enabled ? '除外' : '有効化'}
        </button>
        <button className="btn btn-ghost btn-sm" onClick={() => onOpenDetail(move)}>
          詳細
        </button>
        <button className="btn btn-ghost btn-sm text-danger" onClick={() => onDeleteRequest(move.id)}>
          削除
        </button>
      </div>
    </div>
  );
}

function getMoveMemoPreview(memo: string): string {
  const trimmed = memo.trim();
  if (!trimmed) return '';
  const lines = trimmed.split('\n');
  const frameNoteLine = lines
    .find((line) => line.trim().startsWith('フレーム補足:'));
  const noteLine = lines
    .find((line) => line.trim().startsWith('備考:'));
  return (frameNoteLine ?? noteLine ?? lines[0]).trim();
}

// ---- メインコンポーネント ----
export function MoveManager({ character, showToast }: Props) {
  const [moves, setMoves] = useState<Move[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>(INITIAL_TAGS);
  const [collapsedCats, setCollapsedCats] = useState<Set<MoveCategory>>(new Set());
  const [detailMove, setDetailMove] = useState<Move | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [addCategory, setAddCategory] = useState<MoveCategory>('normal');
  const [formData, setFormData] = useState<ModalFormData>(DEFAULT_FORM());
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // ---- DB操作 ----
  const load = useCallback(async () => {
    const [ms, preset] = await Promise.all([
      db.moves
        .where('[gameId+controlTypeId+characterId]')
        .equals([character.gameId, character.controlTypeId, character.id])
        .toArray(),
      db.presets.get(`${character.gameId}_${character.controlTypeId}`),
    ]);

    // タグをプリセットから取得
    if (preset?.tags?.length) setAvailableTags(preset.tags);
    else setAvailableTags(INITIAL_TAGS);

    const compareByCreatedAt = (a: Move, b: Move) =>
      a.createdAt.localeCompare(b.createdAt) || a.name.localeCompare(b.name, 'ja');

    // プリセット順にソート。プリセット順がないデータは投入順を維持する。
    if (preset && preset.moves.length > 0) {
      const presetMoves = preset.moves;
      ms.sort((a, b) => {
        const ia = presetMoves.findIndex((p) => p.name === a.name && p.category === a.category);
        const ib = presetMoves.findIndex((p) => p.name === b.name && p.category === b.category);
        if (ia === -1 && ib === -1) return compareByCreatedAt(a, b);
        if (ia === -1) return 1;
        if (ib === -1) return -1;
        return ia - ib;
      });
    } else {
      ms.sort(compareByCreatedAt);
    }

    setMoves(ms);
  }, [character.gameId, character.controlTypeId, character.id]);

  useEffect(() => { load(); }, [load]);

  // フレーム値のインライン更新（blur時に呼ばれる）
  const handleFrameUpdate = useCallback(async (
    id: string,
    patch: Partial<Pick<Move, 'startupFrames' | 'activeStartFrames' | 'activeFrames' | 'totalFrames'>>
  ) => {
    await db.moves.update(id, { ...patch, updatedAt: now() });
    setMoves((prev) => prev.map((m) => m.id === id ? { ...m, ...patch } : m));
  }, []);

  const handleToggleEnabled = async (move: Move) => {
    const next = !move.enabled;
    await db.moves.update(move.id, { enabled: next, updatedAt: now() });
    setMoves((prev) => prev.map((m) => m.id === move.id ? { ...m, enabled: next } : m));
  };

  const handleDelete = async (id: string) => {
    const move = moves.find((m) => m.id === id);
    await db.moves.delete(id);
    setDeleteConfirmId(null);
    showToast(`「${move?.name}」を削除しました`, 'info');
    setMoves((prev) => prev.filter((m) => m.id !== id));
  };

  const toggleCat = (cat: MoveCategory) => {
    setCollapsedCats((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) {
        next.delete(cat);
      } else {
        next.add(cat);
      }
      return next;
    });
  };

  // モーダル（追加 / 詳細編集）
  const openAdd = (cat: MoveCategory) => {
    setAddCategory(cat);
    setFormData({ ...DEFAULT_FORM(), category: cat });
    setDetailMove(null);
    setIsAdding(true);
  };

  const openDetail = (move: Move) => {
    setDetailMove(move);
    setFormData({ name: move.name, category: move.category, entryType: move.entryType, tags: [...move.tags], memo: move.memo, enabled: move.enabled });
    setIsAdding(false);
  };

  const closeModal = () => { setDetailMove(null); setIsAdding(false); };

  const handleModalSave = async () => {
    if (!formData.name.trim()) { showToast('技名を入力してください', 'error'); return; }
    if (isAdding) {
      const move: Move = {
        id: genUUID(),
        gameId: character.gameId,
        controlTypeId: character.controlTypeId,
        characterId: character.id,
        ...formData,
        name: formData.name.trim(),
        memo: formData.memo.trim(),
        entryType: 'added',
        totalFrames: null,
        startupFrames: null,
        activeStartFrames: null,
        activeFrames: null,
        createdAt: now(),
        updatedAt: now(),
      };
      await db.moves.add(move);
      showToast(`「${move.name}」を追加しました`, 'success');
      setMoves((prev) => [...prev, move]);
    } else if (detailMove) {
      const patch = { name: formData.name.trim(), category: formData.category, tags: formData.tags, memo: formData.memo.trim(), enabled: formData.enabled, updatedAt: now() };
      await db.moves.update(detailMove.id, patch);
      showToast(`「${formData.name.trim()}」を更新しました`, 'success');
      setMoves((prev) => prev.map((m) => m.id === detailMove.id ? { ...m, ...patch } : m));
    }
    closeModal();
  };

  const toggleTag = (tag: string) =>
    setFormData((p) => ({ ...p, tags: p.tags.includes(tag) ? p.tags.filter((t) => t !== tag) : [...p.tags, tag] }));

  const showModal = isAdding || detailMove !== null;

  return (
    <div className="move-manager">
      <h2 className="section-title">技データ管理 — {character.name}</h2>

      {/* 詳細モーダル（技名・タグ・メモ・カテゴリ） */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{isAdding ? `${MOVE_CATEGORY_NAMES[addCategory]}を追加` : '技の詳細編集'}</h3>
              <button className="btn-close" onClick={closeModal}>✕</button>
            </div>
            <div className="modal-body">
              <label className="form-label">
                技名 <span className="required">*</span>
                <input className="input" value={formData.name} autoFocus
                  onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                  placeholder="例: 近距離立ちA、波動拳" />
              </label>

              {!isAdding && (
                <label className="form-label">
                  カテゴリ
                  <select className="select" value={formData.category}
                    onChange={(e) => setFormData((p) => ({ ...p, category: e.target.value as MoveCategory }))}>
                    {ALL_MOVE_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>{MOVE_CATEGORY_NAMES[cat]}</option>
                    ))}
                  </select>
                </label>
              )}

              <div className="form-label">
                タグ
                <div className="tag-grid">
                  {availableTags.map((tag) => (
                    <label key={tag} className="tag-checkbox">
                      <input type="checkbox" checked={formData.tags.includes(tag)} onChange={() => toggleTag(tag)} />
                      {tag}
                    </label>
                  ))}
                </div>
              </div>

              <label className="form-label">
                備考メモ
                <textarea className="textarea" rows={2} value={formData.memo}
                  onChange={(e) => setFormData((p) => ({ ...p, memo: e.target.value }))}
                  placeholder="任意" />
              </label>

              <label className="checkbox-label">
                <input type="checkbox" checked={formData.enabled}
                  onChange={(e) => setFormData((p) => ({ ...p, enabled: e.target.checked }))} />
                検索対象に含める
              </label>
            </div>
            <div className="modal-footer">
              <button className="btn btn-primary" onClick={handleModalSave}>保存</button>
              <button className="btn btn-ghost" onClick={closeModal}>キャンセル</button>
            </div>
          </div>
        </div>
      )}

      {/* カテゴリ別リスト */}
      {ALL_MOVE_CATEGORIES.map((cat) => {
        const catMoves = moves.filter((m) => m.category === cat);
        const collapsed = collapsedCats.has(cat);
        return (
          <div key={cat} className="category-section">
            <button className="category-header" onClick={() => toggleCat(cat)}>
              <span className="category-name">{MOVE_CATEGORY_NAMES[cat]}</span>
              <span className="category-count">{catMoves.length}件</span>
              <span className="category-chevron">{collapsed ? '▶' : '▼'}</span>
            </button>

            {!collapsed && (
              <div className="category-body">
                {catMoves.length > 0 && (
                  <div className="move-table-header">
                    <span className="col-name">技名</span>
                    <span className="col-frame">発生F</span>
                    <span className="col-frame">最終段開始F</span>
                    <span className="col-frame">最終持続F</span>
                    <span className="col-frame col-frame-total">全体F <span className="col-frame-note">（検索用）</span></span>
                    <span className="col-actions"></span>
                  </div>
                )}

                {catMoves.length === 0 && (
                  <p className="empty-message-sm">技が登録されていません</p>
                )}

                {catMoves.map((move) => (
                  deleteConfirmId === move.id ? (
                    <div key={move.id} className="delete-confirm-row" style={{ padding: '0.6rem 1rem' }}>
                      <span>「{move.name}」を削除しますか？</span>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(move.id)}>削除</button>
                      <button className="btn btn-ghost btn-sm" onClick={() => setDeleteConfirmId(null)}>キャンセル</button>
                    </div>
                  ) : (
                    <MoveRow
                      key={move.id}
                      move={move}
                      onFrameUpdate={handleFrameUpdate}
                      onToggleEnabled={handleToggleEnabled}
                      onOpenDetail={openDetail}
                      onDeleteRequest={setDeleteConfirmId}
                    />
                  )
                ))}

                <button className="btn-add-move" onClick={() => openAdd(cat)}>
                  ＋ {MOVE_CATEGORY_NAMES[cat]}を追加
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
