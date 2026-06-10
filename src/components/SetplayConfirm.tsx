import { useState, useEffect } from 'react';
import { db } from '../db';
import type { Setplay, SetplayCandidate, SearchResult, SearchCondition, SearchSessionOverride, Character, Game, ControlType, Starter } from '../types';
import { genUUID, now } from '../utils';

interface Props {
  character: Character;
  game: Game;
  controlType: ControlType;
  results: SearchResult[];
  condition: SearchCondition;
  override?: SearchSessionOverride;
  initialStarter?: Starter | null;
  onComplete: () => void;
  onCancel: () => void;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export function SetplayConfirm({
  character, game, controlType, results, condition, override,
  initialStarter, onComplete, onCancel, showToast,
}: Props) {
  const [name, setName] = useState('');
  const [memo, setMemo] = useState('');
  const [existingNames, setExistingNames] = useState<string[]>([]);
  const [showNameSuggests, setShowNameSuggests] = useState(false);

  // 始動関連
  const [starters, setStarters] = useState<Starter[]>([]);
  // 'select' | 'new' | 'none'
  const [starterMode, setStarterMode] = useState<'select' | 'new' | 'none'>(
    initialStarter ? 'select' : 'new'
  );
  const [selectedStarterId, setSelectedStarterId] = useState<string>(initialStarter?.id ?? '');
  const [newStarterName, setNewStarterName] = useState<string>('');

  useEffect(() => {
    (async () => {
      const [sp, ss] = await Promise.all([
        db.setplays
          .where('[gameId+controlTypeId+characterId]')
          .equals([character.gameId, character.controlTypeId, character.id])
          .toArray(),
        db.starters
          .where('[gameId+controlTypeId+characterId]')
          .equals([character.gameId, character.controlTypeId, character.id])
          .toArray(),
      ]);
      setExistingNames([...new Set(sp.map((s) => s.name).filter(Boolean))]);
      setStarters(ss);

      // 既存始動の中に同じ有利Fがあれば自動選択
      if (initialStarter) {
        setSelectedStarterId(initialStarter.id);
        setStarterMode('select');
      } else {
        const match = ss.find((s) => s.advantageFrames === condition.currentAdvantageFrames);
        if (match) {
          setSelectedStarterId(match.id);
          setStarterMode('select');
        }
      }
    })();
  }, [
    character.gameId,
    character.controlTypeId,
    character.id,
    condition.currentAdvantageFrames,
    initialStarter,
  ]);

  const handleSave = async () => {
    // 始動の処理
    let starterId: string | undefined;
    let starterName: string | undefined;

    if (starterMode === 'select' && selectedStarterId) {
      const found = starters.find((s) => s.id === selectedStarterId);
      if (found) { starterId = found.id; starterName = found.name; }
    } else if (starterMode === 'new' && newStarterName.trim()) {
      const newStarter: Starter = {
        id: genUUID(),
        gameId: character.gameId,
        controlTypeId: character.controlTypeId,
        characterId: character.id,
        name: newStarterName.trim(),
        advantageFrames: condition.currentAdvantageFrames,
        memo: '',
        createdAt: now(),
        updatedAt: now(),
      };
      await db.starters.add(newStarter);
      starterId = newStarter.id;
      starterName = newStarter.name;
    }

    const candidates: SetplayCandidate[] = results.map((r, i) => ({
      id: genUUID(),
      moves: r.moves.map((m) => ({ moveId: m.moveId, name: m.name, totalFrames: m.totalFrames })),
      totalFrames: r.totalFrames,
      waitFrames: r.waitFrames,
      displayOrder: i,
      memo: '',
      verificationStatus: 'unverified',
      createdAt: now(),
      updatedAt: now(),
    }));

    const setplay: Setplay = {
      id: genUUID(),
      gameId: character.gameId,
      controlTypeId: character.controlTypeId,
      characterId: character.id,
      name: name.trim(),
      starterId,
      starterName,
      currentAdvantageFrames: condition.currentAdvantageFrames,
      targetFrames: condition.targetFrames,
      requiredConsumeFrames: condition.requiredConsumeFrames,
      isMeatyMode: condition.isMeatyMode,
      candidates,
      searchConditionSnapshot: condition,
      searchOverrideSnapshot: override,
      memo: memo.trim(),
      createdAt: now(),
      updatedAt: now(),
    };

    await db.setplays.add(setplay);
    showToast('セットプレイを登録しました', 'success');
    onComplete();
  };

  const filteredSuggests = existingNames.filter(
    (n) => name && n.toLowerCase().includes(name.toLowerCase()) && n !== name
  );

  const selectedStarter = starters.find((s) => s.id === selectedStarterId);

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>セットプレイ登録確認</h3>
          <button className="btn-close" onClick={onCancel}>✕</button>
        </div>
        <div className="modal-body">
          {/* 基本情報 */}
          <div className="confirm-info-grid">
            <div className="confirm-info-item"><span className="confirm-label">ゲーム</span><span>{game.name}</span></div>
            <div className="confirm-info-item"><span className="confirm-label">操作タイプ</span><span>{controlType.name}</span></div>
            <div className="confirm-info-item"><span className="confirm-label">キャラクター</span><span>{character.name}</span></div>
            <div className="confirm-info-item"><span className="confirm-label">現在の有利F</span><span>+{condition.currentAdvantageFrames}F</span></div>
            {condition.targetFrames !== null && !condition.isMeatyMode && (
              <div className="confirm-info-item"><span className="confirm-label">目標F</span><span>+{condition.targetFrames}F</span></div>
            )}
            <div className="confirm-info-item">
              <span className="confirm-label">必要消費F</span>
              <span className="highlight-value">{condition.requiredConsumeFrames}F</span>
            </div>
            {condition.isMeatyMode && (
              <div className="confirm-info-item"><span className="confirm-label">モード</span><span>重ねモード</span></div>
            )}
          </div>

          {/* 始動 */}
          <div className="starter-confirm-section">
            <div className="starter-confirm-header">
              <strong>始動名（+{condition.currentAdvantageFrames}F の名前）</strong>
            </div>
            <div className="starter-mode-tabs">
              <button
                className={`btn btn-sm ${starterMode === 'select' ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setStarterMode('select')}
                disabled={starters.length === 0}
              >
                既存から選択
              </button>
              <button
                className={`btn btn-sm ${starterMode === 'new' ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setStarterMode('new')}
              >
                新しく登録
              </button>
              <button
                className={`btn btn-sm ${starterMode === 'none' ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setStarterMode('none')}
              >
                なし
              </button>
            </div>

            {starterMode === 'select' && starters.length > 0 && (
              <select
                className="select"
                value={selectedStarterId}
                onChange={(e) => setSelectedStarterId(e.target.value)}
              >
                <option value="">-- 選択してください --</option>
                {starters.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}（+{s.advantageFrames}F）
                    {s.advantageFrames !== condition.currentAdvantageFrames ? ' ⚠ フレームが違います' : ''}
                  </option>
                ))}
              </select>
            )}
            {starterMode === 'select' && selectedStarter && (
              <div className="starter-confirm-badge">
                🎯 始動「{selectedStarter.name}」（+{selectedStarter.advantageFrames}F）を紐付け
              </div>
            )}

            {starterMode === 'new' && (
              <div>
                <input
                  className="input"
                  placeholder="始動名を入力（例：前投げ、コーナー前投げ）"
                  value={newStarterName}
                  onChange={(e) => setNewStarterName(e.target.value)}
                />
                {newStarterName.trim() && (
                  <div className="starter-confirm-badge">
                    ✨ 「{newStarterName.trim()}」(+{condition.currentAdvantageFrames}F) を新規登録
                  </div>
                )}
              </div>
            )}
            {starterMode === 'none' && (
              <p className="starter-none-note">始動名なしで登録します。</p>
            )}
          </div>

          {/* セットプレイ名 */}
          <div className="confirm-name-section">
            <label className="form-label">
              セットプレイ名（コメント）
              <div style={{ position: 'relative' }}>
                <input
                  className="input"
                  value={name}
                  onChange={(e) => { setName(e.target.value); setShowNameSuggests(true); }}
                  onFocus={() => setShowNameSuggests(true)}
                  onBlur={() => setTimeout(() => setShowNameSuggests(false), 150)}
                  placeholder="例: 詐欺飛び、持続重ね（任意）"
                />
                {showNameSuggests && filteredSuggests.length > 0 && (
                  <div className="name-suggests">
                    {filteredSuggests.map((n) => (
                      <button key={n} className="name-suggest-item" onClick={() => { setName(n); setShowNameSuggests(false); }}>
                        {n}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </label>
            {existingNames.length > 0 && !name && (
              <div className="existing-names">
                <span className="form-label-text">既存：</span>
                {existingNames.slice(0, 5).map((n) => (
                  <button key={n} className="name-chip" onClick={() => setName(n)}>{n}</button>
                ))}
              </div>
            )}
          </div>

          {/* 登録プレビュー */}
          {(starterMode !== 'none' || name) && (
            <div className="confirm-preview">
              <span className="confirm-label">一覧での表示イメージ：</span>
              <span className="confirm-preview-title">
                {[
                  starterMode === 'select' ? selectedStarter?.name : starterMode === 'new' ? newStarterName.trim() : '',
                  name.trim(),
                ].filter(Boolean).join(' / ') || '（名前なし）'}
              </span>
            </div>
          )}

          {/* メモ */}
          <label className="form-label">
            メモ（任意）
            <textarea className="textarea" rows={2} value={memo} onChange={(e) => setMemo(e.target.value)} placeholder="任意" />
          </label>

          {/* 候補一覧 */}
          <div className="confirm-candidates">
            <h4>登録候補 ({results.length}件)</h4>
            {results.map((r, i) => (
              <div key={r.id} className="confirm-candidate-item">
                <span className="candidate-num">{i + 1}.</span>
                <span>{r.moves.map((m) => m.name).join(' → ')}{r.waitFrames > 0 && ` → ${r.waitFrames}F待ち`}</span>
                <span className="candidate-frames">合計{r.totalFrames + r.waitFrames}F</span>
              </div>
            ))}
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-primary btn-lg" onClick={handleSave}>登録する</button>
          <button className="btn btn-ghost" onClick={onCancel}>キャンセル</button>
        </div>
      </div>
    </div>
  );
}
