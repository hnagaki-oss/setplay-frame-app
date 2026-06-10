import { useState } from 'react';
import { db } from '../db';
import type { Setplay, SetplayCandidate } from '../types';
import { VERIFICATION_STATUS_LABELS, VERIFICATION_STATUS_COLORS } from '../constants';
import { now } from '../utils';

interface Props {
  setplay: Setplay;
  onBack: () => void;
  onDeleted: () => void;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export function SetplayDetail({ setplay: initialSetplay, onBack, onDeleted, showToast }: Props) {
  const [sp, setSp] = useState<Setplay>(initialSetplay);
  const [editingName, setEditingName] = useState(false);
  const [nameVal, setNameVal] = useState(sp.name);
  const [editingMemo, setEditingMemo] = useState(false);
  const [memoVal, setMemoVal] = useState(sp.memo);
  const [editingCandMemo, setEditingCandMemo] = useState<string | null>(null);
  const [candMemoVal, setCandMemoVal] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleteSetplayConfirm, setDeleteSetplayConfirm] = useState(false);

  const refresh = async () => {
    const updated = await db.setplays.get(sp.id);
    if (updated) setSp(updated);
  };

  const saveName = async () => {
    await db.setplays.update(sp.id, { name: nameVal.trim(), updatedAt: now() });
    setEditingName(false);
    showToast('セットプレイ名を更新しました', 'success');
    refresh();
  };

  const saveMemo = async () => {
    await db.setplays.update(sp.id, { memo: memoVal.trim(), updatedAt: now() });
    setEditingMemo(false);
    showToast('メモを更新しました', 'success');
    refresh();
  };

  const saveCandMemo = async (candidateId: string) => {
    const newCandidates = sp.candidates.map((c) =>
      c.id === candidateId ? { ...c, memo: candMemoVal.trim(), updatedAt: now() } : c
    );
    await db.setplays.update(sp.id, { candidates: newCandidates, updatedAt: now() });
    setEditingCandMemo(null);
    showToast('候補メモを更新しました', 'success');
    refresh();
  };

  const changeVerification = async (candidateId: string, status: SetplayCandidate['verificationStatus']) => {
    const newCandidates = sp.candidates.map((c) =>
      c.id === candidateId ? { ...c, verificationStatus: status, updatedAt: now() } : c
    );
    await db.setplays.update(sp.id, { candidates: newCandidates, updatedAt: now() });
    refresh();
  };

  const deleteCandidate = async (candidateId: string) => {
    const newCandidates = sp.candidates
      .filter((c) => c.id !== candidateId)
      .map((c, i) => ({ ...c, displayOrder: i }));
    await db.setplays.update(sp.id, { candidates: newCandidates, updatedAt: now() });
    setDeleteConfirmId(null);
    showToast('候補を削除しました', 'info');
    refresh();
  };

  const moveCandidate = async (idx: number, dir: -1 | 1) => {
    const newCandidates = [...sp.candidates];
    const target = idx + dir;
    if (target < 0 || target >= newCandidates.length) return;
    [newCandidates[idx], newCandidates[target]] = [newCandidates[target], newCandidates[idx]];
    const reOrdered = newCandidates.map((c, i) => ({ ...c, displayOrder: i }));
    await db.setplays.update(sp.id, { candidates: reOrdered, updatedAt: now() });
    refresh();
  };

  const handleDeleteSetplay = async () => {
    await db.setplays.delete(sp.id);
    showToast('セットプレイを削除しました', 'info');
    onDeleted();
  };

  const sortedCandidates = [...sp.candidates].sort((a, b) => a.displayOrder - b.displayOrder);

  return (
    <div className="setplay-detail">
      <div className="detail-back-row">
        <button className="btn btn-ghost" onClick={onBack}>← 一覧に戻る</button>
      </div>

      <div className="detail-header-card">
        {/* セットプレイ名 */}
        <div className="detail-name-row">
          {editingName ? (
            <div className="input-row">
              <input
                className="input"
                value={nameVal}
                onChange={(e) => setNameVal(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') saveName(); if (e.key === 'Escape') setEditingName(false); }}
                autoFocus
              />
              <button className="btn btn-primary btn-sm" onClick={saveName}>保存</button>
              <button className="btn btn-ghost btn-sm" onClick={() => setEditingName(false)}>キャンセル</button>
            </div>
          ) : (
            <div className="detail-name-display">
              <h2 className="detail-name">{sp.name || <em>（名前なし）</em>}</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => { setNameVal(sp.name); setEditingName(true); }}>名前を編集</button>
            </div>
          )}
        </div>

        {/* 基本情報 */}
        <div className="detail-info-grid">
          <div className="detail-info-item">
            <span className="info-label">有利F</span>
            <span>+{sp.currentAdvantageFrames}F</span>
          </div>
          {sp.targetFrames !== null && (
            <div className="detail-info-item">
              <span className="info-label">目標F</span>
              <span>+{sp.targetFrames}F</span>
            </div>
          )}
          <div className="detail-info-item">
            <span className="info-label">必要消費F</span>
            <span className="highlight-value">{sp.requiredConsumeFrames}F</span>
          </div>
          {sp.isMeatyMode && (
            <div className="detail-info-item">
              <span className="info-label">モード</span>
              <span className="badge badge-meaty">重ねモード</span>
            </div>
          )}
        </div>

        {/* 全体メモ */}
        <div className="detail-memo-section">
          <div className="detail-section-label">全体メモ</div>
          {editingMemo ? (
            <div>
              <textarea
                className="textarea"
                rows={3}
                value={memoVal}
                onChange={(e) => setMemoVal(e.target.value)}
                autoFocus
              />
              <div className="input-row" style={{ marginTop: '0.5rem' }}>
                <button className="btn btn-primary btn-sm" onClick={saveMemo}>保存</button>
                <button className="btn btn-ghost btn-sm" onClick={() => setEditingMemo(false)}>キャンセル</button>
              </div>
            </div>
          ) : (
            <div className="memo-display" onClick={() => { setMemoVal(sp.memo); setEditingMemo(true); }}>
              {sp.memo || <span className="memo-placeholder">クリックしてメモを追加</span>}
              <button className="btn btn-ghost btn-sm" onClick={(e) => { e.stopPropagation(); setMemoVal(sp.memo); setEditingMemo(true); }}>編集</button>
            </div>
          )}
        </div>
      </div>

      {/* 候補一覧 */}
      <h3 className="detail-candidates-title">候補一覧 ({sortedCandidates.length}件)</h3>

      {sortedCandidates.map((cand, idx) => (
        <div key={cand.id} className="candidate-card">
          {deleteConfirmId === cand.id ? (
            <div className="delete-confirm-row">
              <span>この候補を削除しますか？</span>
              <button className="btn btn-danger btn-sm" onClick={() => deleteCandidate(cand.id)}>削除</button>
              <button className="btn btn-ghost btn-sm" onClick={() => setDeleteConfirmId(null)}>キャンセル</button>
            </div>
          ) : (
            <>
              <div className="candidate-card-header">
                <span className="candidate-num">{idx + 1}.</span>
                <div className="candidate-moves">
                  {cand.moves.map((m, mi) => (
                    <span key={mi}>
                      <span className="cand-move-name">{m.name}</span>
                      <span className="cand-move-frames">({m.totalFrames}F)</span>
                      {mi < cand.moves.length - 1 && <span className="chain-arrow">→</span>}
                    </span>
                  ))}
                  {cand.waitFrames > 0 && (
                    <span><span className="chain-arrow">→</span> <span className="cand-wait">{cand.waitFrames}F待ち</span></span>
                  )}
                </div>
                <span className="cand-total">合計: {cand.totalFrames + cand.waitFrames}F</span>
              </div>

              {/* 検証状態 */}
              <div className="candidate-status-row">
                <span className="form-label-text">検証状態：</span>
                {(['unverified', 'verified', 'needsReview'] as const).map((status) => (
                  <button
                    key={status}
                    className={`status-btn ${cand.verificationStatus === status ? 'status-active' : ''}`}
                    style={cand.verificationStatus === status ? { backgroundColor: VERIFICATION_STATUS_COLORS[status], color: '#fff' } : {}}
                    onClick={() => changeVerification(cand.id, status)}
                  >
                    {VERIFICATION_STATUS_LABELS[status]}
                  </button>
                ))}
              </div>

              {/* 候補メモ */}
              <div className="candidate-memo-section">
                {editingCandMemo === cand.id ? (
                  <div>
                    <textarea
                      className="textarea"
                      rows={2}
                      value={candMemoVal}
                      onChange={(e) => setCandMemoVal(e.target.value)}
                      autoFocus
                    />
                    <div className="input-row" style={{ marginTop: '0.5rem' }}>
                      <button className="btn btn-primary btn-sm" onClick={() => saveCandMemo(cand.id)}>保存</button>
                      <button className="btn btn-ghost btn-sm" onClick={() => setEditingCandMemo(null)}>キャンセル</button>
                    </div>
                  </div>
                ) : (
                  <div
                    className="memo-display"
                    onClick={() => { setCandMemoVal(cand.memo); setEditingCandMemo(cand.id); }}
                  >
                    {cand.memo || <span className="memo-placeholder">クリックしてメモを追加</span>}
                  </div>
                )}
              </div>

              {/* アクション */}
              <div className="candidate-actions">
                <button className="btn btn-ghost btn-sm" onClick={() => moveCandidate(idx, -1)} disabled={idx === 0}>↑ 上へ</button>
                <button className="btn btn-ghost btn-sm" onClick={() => moveCandidate(idx, 1)} disabled={idx === sortedCandidates.length - 1}>↓ 下へ</button>
                <button className="btn btn-ghost btn-sm text-danger" onClick={() => setDeleteConfirmId(cand.id)}>削除</button>
              </div>
            </>
          )}
        </div>
      ))}

      {/* セットプレイ削除 */}
      <div className="danger-zone">
        {deleteSetplayConfirm ? (
          <div className="delete-confirm-row">
            <span>このセットプレイ全体を削除しますか？</span>
            <button className="btn btn-danger" onClick={handleDeleteSetplay}>削除する</button>
            <button className="btn btn-ghost" onClick={() => setDeleteSetplayConfirm(false)}>キャンセル</button>
          </div>
        ) : (
          <button className="btn btn-ghost text-danger" onClick={() => setDeleteSetplayConfirm(true)}>
            このセットプレイを削除
          </button>
        )}
      </div>
    </div>
  );
}
