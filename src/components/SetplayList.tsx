import { useState, useEffect, useCallback } from 'react';
import { db } from '../db';
import type { Setplay, Character } from '../types';

interface Props {
  character: Character;
  onDetail: (setplay: Setplay) => void;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export function SetplayList({ character, onDetail, showToast }: Props) {
  const [setplays, setSetplays] = useState<Setplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const sp = await db.setplays
      .where('[gameId+controlTypeId+characterId]')
      .equals([character.gameId, character.controlTypeId, character.id])
      .toArray();
    sp.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    setSetplays(sp);
    setLoading(false);
  }, [character.gameId, character.controlTypeId, character.id]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id: string) => {
    const sp = setplays.find((s) => s.id === id);
    await db.setplays.delete(id);
    setDeleteConfirmId(null);
    showToast(`セットプレイ「${sp?.name || '（名前なし）'}」を削除しました`, 'info');
    load();
  };

  if (loading) return <div className="loading">読み込み中...</div>;

  return (
    <div className="setplay-list">
      <h2 className="section-title">セットプレイ一覧 — {character.name}</h2>

      {setplays.length === 0 ? (
        <div className="empty-message">
          まだセットプレイが登録されていません。<br />
          「フレーム検索」タブで検索して登録できます。
        </div>
      ) : (
        <div className="setplay-cards">
          {setplays.map((sp) => (
            <div key={sp.id} className="setplay-card">
              {deleteConfirmId === sp.id ? (
                <div className="delete-confirm-row">
                  <span>「{sp.name || '（名前なし）'}」を削除しますか？</span>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(sp.id)}>削除</button>
                  <button className="btn btn-ghost btn-sm" onClick={() => setDeleteConfirmId(null)}>キャンセル</button>
                </div>
              ) : (
                <>
                  <div className="setplay-card-header">
                    <div className="setplay-card-title">
                      {sp.starterName && <span className="setplay-starter-name">{sp.starterName}</span>}
                      {sp.starterName && sp.name && <span className="setplay-title-sep">/</span>}
                      {sp.name && <span className="setplay-name">{sp.name}</span>}
                      {!sp.starterName && !sp.name && <em className="setplay-name">（名前なし）</em>}
                      {sp.isMeatyMode && <span className="badge badge-meaty">重ねモード</span>}
                    </div>
                    <div className="setplay-card-actions">
                      <button className="btn btn-ghost btn-sm text-danger" onClick={() => setDeleteConfirmId(sp.id)}>削除</button>
                    </div>
                  </div>
                  <div className="setplay-card-info">
                    <span>有利F: +{sp.currentAdvantageFrames}F</span>
                    {sp.targetFrames !== null && <span>→ 目標: +{sp.targetFrames}F</span>}
                    <span>消費: {sp.requiredConsumeFrames}F</span>
                    <span>候補: {sp.candidates.length}件</span>
                  </div>
                  {sp.memo && <p className="setplay-card-memo">{sp.memo}</p>}
                  <div className="setplay-card-candidates">
                    {sp.candidates.slice(0, 3).map((c, i) => (
                      <div key={c.id} className="setplay-card-candidate">
                        <span className="cand-num">{i + 1}.</span>
                        {c.moves.map((m) => m.name).join(' → ')}
                        {c.waitFrames > 0 && ` → ${c.waitFrames}F待ち`}
                        <span className={`verification-badge status-${c.verificationStatus}`}>
                          {c.verificationStatus === 'verified' ? '✓' : c.verificationStatus === 'needsReview' ? '!' : '?'}
                        </span>
                      </div>
                    ))}
                    {sp.candidates.length > 3 && (
                      <div className="setplay-card-more">...他{sp.candidates.length - 3}件</div>
                    )}
                  </div>
                  <button className="btn btn-outline btn-sm" onClick={() => onDetail(sp)}>
                    詳細・編集 →
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
