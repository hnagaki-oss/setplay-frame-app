import { useState, useEffect, useCallback } from 'react';
import { db } from '../db';
import type { Move, MoveCategory, Character, SearchCondition, SearchResult, SearchSessionOverride, SearchDefaults, Starter } from '../types';
import { ALL_MOVE_CATEGORIES, MOVE_CATEGORY_NAMES, INITIAL_TAGS } from '../constants';
import { search } from '../search';
import { MOVE_CATEGORY_SORT_ORDER, sortMovesByRegisteredOrder } from '../moveOrder';

interface Props {
  character: Character;
  searchDefaults: SearchDefaults;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  onRegister: (results: SearchResult[], condition: SearchCondition, override?: SearchSessionOverride, starter?: Starter | null) => void;
}

const DEFAULT_OVERRIDE = (): SearchSessionOverride => ({
  excludedMoveIds: [],
  preferredMoveIds: [],
  excludedCategories: [],
  preferredCategories: [],
  excludedTags: [],
  preferredTags: [],
});

type MeatySelectableMove = Move & {
  startupFrames: number;
  activeFrames: number;
};

const hasMeatyFrameInput = (move: Move | null | undefined): move is MeatySelectableMove =>
  move?.startupFrames !== null &&
  move?.startupFrames !== undefined &&
  move.activeFrames !== null &&
  move.activeFrames !== undefined;

function sortMovesForOverride(moves: Move[]): Move[] {
  return moves
    .map((move, index) => ({ move, index }))
    .sort((a, b) =>
      (MOVE_CATEGORY_SORT_ORDER.get(a.move.category) ?? 999) -
      (MOVE_CATEGORY_SORT_ORDER.get(b.move.category) ?? 999) ||
      a.index - b.index
    )
    .map(({ move }) => move);
}

export function FrameSearch({ character, searchDefaults, showToast, onRegister }: Props) {
  const [moves, setMoves] = useState<Move[]>([]);
  const [starters, setStarters] = useState<Starter[]>([]);
  const [activeStarter, setActiveStarter] = useState<Starter | null>(null);
  const [currentF, setCurrentF] = useState<string>('');
  const [targetF, setTargetF] = useState<string>('');
  const [isMeaty, setIsMeaty] = useState(false);
  const [meatyMoveId, setMeatyMoveId] = useState<string>('');
  const [meatyActiveIdx, setMeatyActiveIdx] = useState<number>(0);
  const [maxMoveCount, setMaxMoveCount] = useState(searchDefaults.maxMoveCount);
  const [allowRepeat, setAllowRepeat] = useState(searchDefaults.allowRepeatSameMove);
  const [allowWait, setAllowWait] = useState(searchDefaults.allowWaitFrames);
  const [maxWait, setMaxWait] = useState(searchDefaults.maxWaitFrames > 0 ? searchDefaults.maxWaitFrames : 5);
  const [enabledCats, setEnabledCats] = useState<MoveCategory[]>(searchDefaults.enabledCategories);
  const [results, setResults] = useState<SearchResult[] | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [override, setOverride] = useState<SearchSessionOverride>(DEFAULT_OVERRIDE());
  const [showOverride, setShowOverride] = useState(false);
  const [lastCondition, setLastCondition] = useState<SearchCondition | null>(null);
  const [showOptions, setShowOptions] = useState(false);
  const [deleteStarterConfirmId, setDeleteStarterConfirmId] = useState<string | null>(null);

  const loadMoves = useCallback(async () => {
    const [ms, preset] = await Promise.all([
      db.moves
        .where('[gameId+controlTypeId+characterId]')
        .equals([character.gameId, character.controlTypeId, character.id])
        .toArray(),
      db.presets.get(`${character.gameId}_${character.controlTypeId}`),
    ]);
    setMoves(sortMovesByRegisteredOrder(ms, preset?.moves));
  }, [character.gameId, character.controlTypeId, character.id]);

  const loadStarters = useCallback(async () => {
    const ss = await db.starters
      .where('[gameId+controlTypeId+characterId]')
      .equals([character.gameId, character.controlTypeId, character.id])
      .toArray();
    ss.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    setStarters(ss);
  }, [character.gameId, character.controlTypeId, character.id]);

  useEffect(() => {
    loadMoves();
    loadStarters();
  }, [loadMoves, loadStarters]);

  // 始動チップを選択 → 有利Fを自動入力
  const handleSelectStarter = (starter: Starter) => {
    setActiveStarter(starter);
    setCurrentF(String(starter.advantageFrames));
    setResults(null);
    setSelectedIds(new Set());
  };

  const handleDeleteStarter = async (id: string) => {
    await db.starters.delete(id);
    if (activeStarter?.id === id) { setActiveStarter(null); setCurrentF(''); }
    setDeleteStarterConfirmId(null);
    loadStarters();
  };

  // 有利Fを手動変更したら activeStarter をリセット
  const handleCurrentFChange = (val: string) => {
    setCurrentF(val);
    if (activeStarter && val !== String(activeStarter.advantageFrames)) {
      setActiveStarter(null);
    }
  };

  const curF = currentF === '' ? null : Number(currentF);
  const tgtF = targetF === '' ? null : Number(targetF);

  const meatyMove = moves.find((m) => m.id === meatyMoveId);
  const meatyActiveStart = meatyMove?.activeStartFrames ?? meatyMove?.startupFrames ?? null;
  const meatyMoveOptions = moves.filter(hasMeatyFrameInput);
  const overrideMoveOptions = sortMovesForOverride(moves);

  useEffect(() => {
    if (!isMeaty || !meatyMoveId) return;
    const selected = moves.find((m) => m.id === meatyMoveId);
    if (!hasMeatyFrameInput(selected)) {
      setMeatyMoveId('');
      setMeatyActiveIdx(0);
    }
  }, [isMeaty, meatyMoveId, moves]);

  const computeRequired = (): { value: number | null; error: string | null } => {
    if (curF === null || tgtF === null) return { value: null, error: null };
    if (isMeaty && hasMeatyFrameInput(meatyMove) && meatyActiveStart !== null) {
      if (meatyMove.activeFrames < meatyActiveStart) {
        return { value: null, error: '重ね技の最終持続Fが発生Fより小さくなっています。技データを確認してください。' };
      }
      const activeIdx = meatyActiveIdx;
      const reach = meatyActiveStart + activeIdx;
      const req = curF - reach;
      return req < 0
        ? { value: null, error: '目標Fが現在の有利Fを上回っています。' }
        : req === 0
        ? { value: 0, error: null }
        : { value: req, error: null };
    }
    const req = curF - tgtF;
    if (req < 0) return { value: null, error: '目標Fが現在の有利Fを上回っています。技空振りによるフレーム消費ではこの状況は作れません。' };
    if (req === 0) return { value: 0, error: null };
    return { value: req, error: null };
  };

  const { value: requiredF, error: inputError } = computeRequired();

  const handleSearch = useCallback(() => {
    if (curF === null || tgtF === null) {
      showToast('有利Fと目標Fを入力してください', 'error');
      return;
    }
    if (requiredF === null) {
      showToast(inputError ?? 'エラー', 'error');
      return;
    }
    if (requiredF === 0) {
      showToast('フレーム消費は不要です。現在の状況がすでに目標Fです。', 'info');
      return;
    }

    const condition: SearchCondition = {
      currentAdvantageFrames: curF,
      targetFrames: tgtF,
      requiredConsumeFrames: requiredF,
      isMeatyMode: isMeaty,
      meatyMoveId: isMeaty ? meatyMoveId : undefined,
      meatyTargetActiveIndex: isMeaty ? meatyActiveIdx : undefined,
      maxMoveCount,
      allowRepeatSameMove: allowRepeat,
      allowWaitFrames: allowWait,
      maxWaitFrames: maxWait,
      enabledCategories: enabledCats,
      searchModeId: 'standard',
    };

    setLastCondition(condition);
    const found = search(moves, condition, override);
    setResults(found);
    setSelectedIds(new Set());

    if (found.length === 0) {
      showToast('該当する候補が見つかりませんでした', 'info');
    } else {
      showToast(`${found.length}件の候補が見つかりました`, 'success');
    }
  }, [curF, tgtF, requiredF, inputError, isMeaty, meatyMoveId, meatyActiveIdx, maxMoveCount, allowRepeat, allowWait, maxWait, enabledCats, moves, override, showToast]);

  const handleReSearch = () => {
    if (!lastCondition) return;
    const found = search(moves, lastCondition, override);
    setResults(found);
    setSelectedIds(new Set());
    showToast(`再検索: ${found.length}件`, 'info');
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleCat = (cat: MoveCategory) => {
    setEnabledCats((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const clearOverride = () => setOverride(DEFAULT_OVERRIDE());

  const hasOverride = Object.values(override).some((v) =>
    Array.isArray(v) ? v.length > 0 : v !== undefined
  );

  const meatyActiveOptions = (() => {
    if (!hasMeatyFrameInput(meatyMove) || meatyActiveStart === null) return [];
    const activeCount = meatyMove.activeFrames - meatyActiveStart + 1;
    if (activeCount <= 0) return [];
    return Array.from({ length: activeCount }, (_, i) => ({
      idx: i,
      label: `最終段 持続${i + 1}F目（${meatyActiveStart + i}F目）`,
    }));
  })();

  const selectedResults = results?.filter((r) => selectedIds.has(r.id)) ?? [];

  return (
    <div className="frame-search">
      <h2 className="section-title">フレーム検索</h2>

      {/* 始動セクション */}
      <div className="starter-bar">
        <span className="starter-bar-label">始動：</span>
        <div className="starter-chips">
          {starters.map((s) => (
            <div key={s.id} className={`starter-chip-wrap ${activeStarter?.id === s.id ? 'starter-active' : ''}`}>
              {deleteStarterConfirmId === s.id ? (
                <div className="starter-delete-confirm">
                  <span>「{s.name}」削除？</span>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDeleteStarter(s.id)}>削除</button>
                  <button className="btn btn-ghost btn-sm" onClick={() => setDeleteStarterConfirmId(null)}>×</button>
                </div>
              ) : (
                <>
                  <button
                    className="starter-chip"
                    onClick={() => handleSelectStarter(s)}
                    title={`クリックで有利F +${s.advantageFrames} を入力`}
                  >
                    {s.name}
                    <span className="starter-chip-frame">+{s.advantageFrames}F</span>
                  </button>
                  <button
                    className="starter-chip-del"
                    onClick={(e) => { e.stopPropagation(); setDeleteStarterConfirmId(s.id); }}
                    title="削除"
                  >×</button>
                </>
              )}
            </div>
          ))}
          {starters.length === 0 && (
            <span className="starter-empty">始動が未登録です（セットプレイ登録時に追加できます）</span>
          )}
        </div>
      </div>

      {/* 入力エリア */}
      <div className="search-input-card">
        {activeStarter && (
          <div className="active-starter-banner">
            🎯 始動：<strong>{activeStarter.name}</strong>（+{activeStarter.advantageFrames}F）
            <button className="btn-link" onClick={() => { setActiveStarter(null); setCurrentF(''); }}>解除</button>
          </div>
        )}
        <div className="frame-inputs">
          <label className="frame-input-label">
            現在の有利F
            <input
              type="number"
              className="input frame-input"
              value={currentF}
              onChange={(e) => handleCurrentFChange(e.target.value)}
              placeholder="例: 50"
            />
          </label>
          <label className="frame-input-label">
            目標F
            <input
              type="number"
              className="input frame-input"
              value={targetF}
              onChange={(e) => setTargetF(e.target.value)}
              placeholder="例: 42"
            />
          </label>
        </div>

        {inputError && <p className="error-message">{inputError}</p>}

        {requiredF !== null && !inputError && (
          <div className="required-display">
            必要消費F：<strong className="required-frames">{requiredF}F</strong>
          </div>
        )}

        {/* 重ねモード */}
        <div className="meaty-section">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={isMeaty}
              onChange={(e) => setIsMeaty(e.target.checked)}
            />
            <strong>重ねモード</strong>（攻撃持続を重ねる）
          </label>

          {isMeaty && (
            <div className="meaty-options">
              <label className="form-label">
                重ね技を選択
                <select
                  className="select"
                  value={meatyMoveId}
                  onChange={(e) => { setMeatyMoveId(e.target.value); setMeatyActiveIdx(0); }}
                >
                  <option value="">-- 選択してください --</option>
                  {meatyMoveOptions.map((m) => {
                    const activeStart = m.activeStartFrames ?? m.startupFrames;
                    const isInvalidActiveRange = m.activeFrames < activeStart;
                    return (
                      <option
                        key={m.id}
                        value={m.id}
                        disabled={isInvalidActiveRange}
                      >
                        {m.name}
                        {isInvalidActiveRange
                          ? '（最終持続Fが発生F未満）'
                          : ` (発生${m.startupFrames}F 最終段${activeStart}-${m.activeFrames}F)`}
                      </option>
                    );
                  })}
                </select>
              </label>

              {meatyMoveOptions.length === 0 && (
                <p className="empty-message-sm">発生F・最終持続Fが入力済みの技がありません。</p>
              )}

              {hasMeatyFrameInput(meatyMove) && meatyActiveStart !== null ? (
                <>
                  <label className="form-label">
                    重ね位置
                    <select
                      className="select"
                      value={meatyActiveIdx}
                      onChange={(e) => setMeatyActiveIdx(Number(e.target.value))}
                    >
                      {meatyActiveOptions.map((opt) => (
                        <option key={opt.idx} value={opt.idx}>{opt.label}</option>
                      ))}
                    </select>
                  </label>
                  {requiredF !== null && (
                    <p className="meaty-calc">
                      必要消費F：{curF} − ({meatyActiveStart} + {meatyActiveIdx}) = <strong>{requiredF}F</strong>
                    </p>
                  )}
                </>
              ) : meatyMoveId ? (
                <p className="error-message">この技は発生Fまたは最終持続Fが未入力です。重ね検索を行うには技データに発生F・最終持続Fを入力してください。</p>
              ) : null}
            </div>
          )}
        </div>

        {/* 詳細オプション */}
        <details open={showOptions} onToggle={(e) => setShowOptions((e.target as HTMLDetailsElement).open)}>
          <summary className="options-summary">詳細オプション</summary>
          <div className="options-body">
            <label className="form-label">
              最大技数（{maxMoveCount}）
              <input
                type="range"
                min={1}
                max={5}
                value={maxMoveCount}
                onChange={(e) => setMaxMoveCount(Number(e.target.value))}
                className="range-input"
              />
            </label>

            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={allowRepeat}
                onChange={(e) => setAllowRepeat(e.target.checked)}
              />
              同じ技を複数回使用可
            </label>

            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={allowWait}
                onChange={(e) => setAllowWait(e.target.checked)}
              />
              待ちF（ニュートラル待機）を許可する
            </label>

            {allowWait && (
              <label className="form-label">
                最大待ちF（{maxWait}F）
                <input
                  type="range"
                  min={1}
                  max={30}
                  value={maxWait}
                  onChange={(e) => setMaxWait(Number(e.target.value))}
                  className="range-input"
                />
              </label>
            )}

            <div className="form-label">
              検索対象カテゴリ
              <div className="cat-checkboxes">
                {ALL_MOVE_CATEGORIES.map((cat) => (
                  <label key={cat} className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={enabledCats.includes(cat)}
                      onChange={() => toggleCat(cat)}
                    />
                    {MOVE_CATEGORY_NAMES[cat]}
                  </label>
                ))}
              </div>
            </div>
          </div>
        </details>

        <button
          className="btn btn-primary btn-lg"
          onClick={handleSearch}
          disabled={curF === null || tgtF === null || requiredF === null || requiredF === 0}
        >
          🔍 検索する
        </button>
      </div>

      {/* 検索結果 */}
      {results !== null && (
        <div className="results-section">
          <div className="results-header">
            <h3 className="results-title">
              検索結果：{results.length}件
              {requiredF !== null && ` （必要消費F: ${requiredF}F）`}
            </h3>
            <button className="btn btn-ghost btn-sm" onClick={() => setShowOverride((p) => !p)}>
              {showOverride ? '一時条件を閉じる' : '一時条件を設定'}
              {hasOverride && <span className="badge-dot" />}
            </button>
          </div>

          {/* 一時条件パネル */}
          {showOverride && (
            <div className="override-panel">
              <div className="override-header">
                <strong>一時条件（この検索セッションのみ適用）</strong>
                {hasOverride && (
                  <button className="btn btn-ghost btn-sm text-danger" onClick={clearOverride}>
                    すべて解除
                  </button>
                )}
              </div>

              <div className="override-grid">
                <OverrideMoveList
                  label="除外する技"
                  moves={overrideMoveOptions}
                  selected={override.excludedMoveIds}
                  onChange={(ids) => setOverride((p) => ({ ...p, excludedMoveIds: ids }))}
                />
                <OverrideMoveList
                  label="優先する技"
                  moves={overrideMoveOptions}
                  selected={override.preferredMoveIds}
                  onChange={(ids) => setOverride((p) => ({ ...p, preferredMoveIds: ids }))}
                />
                <OverrideTagList
                  label="除外するタグ"
                  selected={override.excludedTags}
                  onChange={(tags) => setOverride((p) => ({ ...p, excludedTags: tags }))}
                />
                <OverrideTagList
                  label="優先するタグ"
                  selected={override.preferredTags}
                  onChange={(tags) => setOverride((p) => ({ ...p, preferredTags: tags }))}
                />
              </div>

              <div className="override-cats">
                <span className="form-label-text">除外するカテゴリ：</span>
                {ALL_MOVE_CATEGORIES.map((cat) => (
                  <label key={cat} className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={override.excludedCategories.includes(cat)}
                      onChange={() =>
                        setOverride((p) => ({
                          ...p,
                          excludedCategories: p.excludedCategories.includes(cat)
                            ? p.excludedCategories.filter((c) => c !== cat)
                            : [...p.excludedCategories, cat],
                        }))
                      }
                    />
                    {MOVE_CATEGORY_NAMES[cat]}
                  </label>
                ))}
              </div>

              <button className="btn btn-primary btn-sm" onClick={handleReSearch}>
                一時条件を適用して再検索
              </button>

              {hasOverride && (
                <div className="override-summary">
                  <strong>現在の一時条件：</strong>
                  {override.excludedMoveIds.length > 0 && (
                    <span>除外技: {override.excludedMoveIds.map((id) => moves.find((m) => m.id === id)?.name).filter(Boolean).join(', ')}</span>
                  )}
                  {override.preferredMoveIds.length > 0 && (
                    <span>優先技: {override.preferredMoveIds.map((id) => moves.find((m) => m.id === id)?.name).filter(Boolean).join(', ')}</span>
                  )}
                  {override.excludedTags.length > 0 && <span>除外タグ: {override.excludedTags.join(', ')}</span>}
                  {override.preferredTags.length > 0 && <span>優先タグ: {override.preferredTags.join(', ')}</span>}
                  {override.excludedCategories.length > 0 && (
                    <span>除外カテゴリ: {override.excludedCategories.map((c) => MOVE_CATEGORY_NAMES[c]).join(', ')}</span>
                  )}
                </div>
              )}
            </div>
          )}

          {results.length === 0 ? (
            <p className="empty-message">条件に合う候補が見つかりませんでした。技データを追加するか、条件を変更してください。</p>
          ) : (
            <>
              {results.map((result, idx) => (
                <div
                  key={result.id}
                  className={`result-item ${selectedIds.has(result.id) ? 'result-selected' : ''}`}
                  onClick={() => toggleSelect(result.id)}
                >
                  <div className="result-check">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(result.id)}
                      onChange={() => toggleSelect(result.id)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                  <div className="result-body">
                    <div className="result-moves">
                      <span className="result-num">{idx + 1}.</span>
                      {result.moves.map((m, mi) => (
                        <span key={mi} className="result-move-chain">
                          <span className={`result-move-name cat-${m.category}`}>{m.name}</span>
                          <span className="result-move-frames">({m.totalFrames}F)</span>
                          {mi < result.moves.length - 1 && <span className="chain-arrow">→</span>}
                        </span>
                      ))}
                      {result.waitFrames > 0 && (
                        <span className="result-move-chain">
                          <span className="chain-arrow">→</span>
                          <span className="result-wait">{result.waitFrames}F待ち</span>
                        </span>
                      )}
                    </div>
                    <div className="result-meta">
                      <span className="result-total">合計: {result.totalFrames + result.waitFrames}F</span>
                      <span className="result-score">スコア: {result.score}</span>
                    </div>
                    <details className="result-reasons">
                      <summary>評価理由</summary>
                      <ul>
                        {result.reasons.map((r, ri) => <li key={ri}>{r}</li>)}
                      </ul>
                    </details>
                    {result.meatyInfo && (
                      <div className="result-meaty">
                        重ね: {result.meatyInfo.moveName} / {result.meatyInfo.targetActiveLabel}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {selectedIds.size > 0 && lastCondition && (
                <div className="register-bar">
                  <span>{selectedIds.size}件を選択中</span>
                  <button
                    className="btn btn-primary"
                    onClick={() => onRegister(selectedResults, lastCondition, hasOverride ? override : undefined, activeStarter)}
                  >
                    選択した候補をセットプレイ登録 →
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function OverrideMoveList({
  label,
  moves,
  selected,
  onChange,
}: {
  label: string;
  moves: Move[];
  selected: string[];
  onChange: (ids: string[]) => void;
}) {
  const toggleMove = (id: string) => {
    onChange(selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id]);
  };
  return (
    <div className="override-block">
      <div className="override-block-label">{label}</div>
      <div className="override-move-list">
        {moves.map((m) => (
          <label key={m.id} className="checkbox-label-sm">
            <input type="checkbox" checked={selected.includes(m.id)} onChange={() => toggleMove(m.id)} />
            {m.name}
          </label>
        ))}
      </div>
    </div>
  );
}

function OverrideTagList({
  label,
  selected,
  onChange,
}: {
  label: string;
  selected: string[];
  onChange: (tags: string[]) => void;
}) {
  const toggleTag = (tag: string) => {
    onChange(selected.includes(tag) ? selected.filter((t) => t !== tag) : [...selected, tag]);
  };
  return (
    <div className="override-block">
      <div className="override-block-label">{label}</div>
      <div className="override-move-list">
        {INITIAL_TAGS.map((tag) => (
          <label key={tag} className="checkbox-label-sm">
            <input type="checkbox" checked={selected.includes(tag)} onChange={() => toggleTag(tag)} />
            {tag}
          </label>
        ))}
      </div>
    </div>
  );
}
