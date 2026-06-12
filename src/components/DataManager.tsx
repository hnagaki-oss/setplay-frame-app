import { useRef, useState } from 'react';
import { db } from '../db';
import type { Character, Move, Preset, Setplay, Starter } from '../types';
import { genUUID, now } from '../utils';
import { withAutoTagsForMoveName } from '../moveTags';
import { APP_VERSION, DB_SCHEMA_VERSION, DATA_FORMAT_VERSION } from '../version';
import {
  SF6_CHUNLI_CLASSIC_DATA_META,
  SF6_CHUNLI_CLASSIC_MOVES,
} from '../sf6ChunliClassicMoves';
import {
  SF6_CHUNLI_MODERN_DATA_META,
  SF6_CHUNLI_MODERN_MOVES,
} from '../sf6ChunliModernMoves';

interface Props {
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

type OfficialSeedMeta = {
  gameId: 'sf6';
  controlTypeId: 'sf6_classic' | 'sf6_modern';
  characterName: string;
  sourceName: string;
  dataCheckedAt: string;
};

type OfficialImportTarget = {
  label: string;
  meta: OfficialSeedMeta;
  moves: Array<Omit<Move, 'id' | 'gameId' | 'controlTypeId' | 'characterId' | 'entryType' | 'tags' | 'createdAt' | 'updatedAt'>>;
};

type BackupData = {
  formatVersion?: number;
  characters?: Character[];
  moves?: Move[];
  setplays?: Setplay[];
  presets?: Preset[];
  starters?: Starter[];
};

type ImportSummary = {
  formatVersion: number;
  characters: number;
  moves: number;
  setplays: number;
};

export function DataManager({ showToast }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [resetConfirm, setResetConfirm] = useState(false);
  const [officialImportTarget, setOfficialImportTarget] = useState<OfficialImportTarget | null>(null);

  const importBackupData = async (data: BackupData): Promise<ImportSummary | null> => {
    if (!Array.isArray(data.characters) || !Array.isArray(data.moves) || !Array.isArray(data.setplays)) {
      showToast('無効なファイル形式です（characters / moves / setplays が必要です）', 'error');
      return null;
    }

    await db.transaction('rw', [db.characters, db.moves, db.setplays, db.presets, db.starters], async () => {
      await db.characters.bulkPut(data.characters!);
      await db.moves.bulkPut(
        data.moves!.map((move) => ({
          ...move,
          tags: withAutoTagsForMoveName(move.name, move.tags ?? []),
        }))
      );
      await db.setplays.bulkPut(data.setplays!);
      if (Array.isArray(data.presets) && data.presets.length > 0) {
        await db.presets.bulkPut(data.presets);
      }
      if (Array.isArray(data.starters) && data.starters.length > 0) {
        await db.starters.bulkPut(data.starters);
      }
    });

    return {
      formatVersion: data.formatVersion ?? 1,
      characters: data.characters.length,
      moves: data.moves.length,
      setplays: data.setplays.length,
    };
  };

  const showImportSummary = (summary: ImportSummary) => {
    showToast(
      `インポート完了 (フォーマットv${summary.formatVersion})：` +
      `キャラ${summary.characters}件、技${summary.moves}件、` +
      `セットプレイ${summary.setplays}件`,
      'success'
    );
  };

  // ---- エクスポート ----
  const handleExport = async () => {
    const [characters, moves, setplays, presets, starters] = await Promise.all([
      db.characters.toArray(),
      db.moves.toArray(),
      db.setplays.toArray(),
      db.presets.toArray(),
      db.starters.toArray(),
    ]);
    const data = {
      formatVersion: DATA_FORMAT_VERSION,
      appVersion: APP_VERSION,
      exportedAt: new Date().toISOString(),
      characters,
      moves,
      setplays,
      presets,
      starters,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `setplay-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('データをエクスポートしました', 'success');
  };

  // ---- インポート ----
  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      const summary = await importBackupData(data);
      if (summary) showImportSummary(summary);
    } catch {
      showToast('インポート中にエラーが発生しました', 'error');
    }
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleImportLocalBackup = async () => {
    try {
      const response = await fetch('/__local-data/setplay-backup.json', { cache: 'no-store' });
      if (!response.ok) {
        showToast('data/setplay-backup.json が見つかりません', 'error');
        return;
      }
      const data = await response.json();
      const summary = await importBackupData(data);
      if (summary) showImportSummary(summary);
    } catch {
      showToast('ローカルバックアップのインポート中にエラーが発生しました', 'error');
    }
  };

  // ---- 全初期化 ----
  const handleReset = async () => {
    await db.transaction('rw', [db.characters, db.moves, db.setplays, db.presets, db.starters], async () => {
      await db.characters.clear();
      await db.moves.clear();
      await db.setplays.clear();
      await db.presets.clear();
      await db.starters.clear();
    });
    setResetConfirm(false);
    showToast('全データを初期化しました', 'info');
  };

  // ---- 公式データ試験投入 ----
  const handleImportOfficialMoves = async (target: OfficialImportTarget) => {
    const { label, meta } = target;
    let importedCount = 0;

    await db.transaction('rw', [db.characters, db.moves], async () => {
      const existingCharacters = await db.characters
        .where('[gameId+controlTypeId]')
        .equals([meta.gameId, meta.controlTypeId])
        .toArray();

      let character = existingCharacters.find((c) => c.name === meta.characterName);
      if (!character) {
        character = {
          id: genUUID(),
          gameId: meta.gameId,
          controlTypeId: meta.controlTypeId,
          name: meta.characterName,
          entryType: 'preset',
          createdAt: now(),
          updatedAt: now(),
        } satisfies Character;
        await db.characters.add(character);
      }

      await db.moves.where('characterId').equals(character.id).delete();

      const baseTime = Date.now();
      const moves: Move[] = target.moves.map((move, index) => {
        const timestamp = new Date(baseTime + index).toISOString();
        return {
          id: genUUID(),
          gameId: meta.gameId,
          controlTypeId: meta.controlTypeId,
          characterId: character.id,
          entryType: 'preset',
          tags: withAutoTagsForMoveName(move.name, []),
          createdAt: timestamp,
          updatedAt: timestamp,
          ...move,
          memo: [
            `データ最終確認日: ${meta.dataCheckedAt}`,
            `参照元: ${meta.sourceName}`,
            move.memo,
          ].join('\n'),
        };
      });

      await db.moves.bulkAdd(moves);
      importedCount = moves.length;
    });

    setOfficialImportTarget(null);
    showToast(`${label}公式データを投入しました（${importedCount}件）`, 'success');
  };

  const officialImportTargets: OfficialImportTarget[] = [
    {
      label: '春麗クラシック',
      meta: SF6_CHUNLI_CLASSIC_DATA_META,
      moves: SF6_CHUNLI_CLASSIC_MOVES,
    },
    {
      label: '春麗モダン',
      meta: SF6_CHUNLI_MODERN_DATA_META,
      moves: SF6_CHUNLI_MODERN_MOVES,
    },
  ];

  return (
    <div className="data-manager">
      <h2 className="section-title">データ管理</h2>

      {/* ---- アプリ情報 ---- */}
      <div className="data-info-card">
        <h3>📱 アプリ情報</h3>
        <table className="info-table">
          <tbody>
            <tr>
              <th>アプリバージョン</th>
              <td><code>v{APP_VERSION}</code></td>
            </tr>
            <tr>
              <th>DBスキーマバージョン</th>
              <td><code>v{DB_SCHEMA_VERSION}</code></td>
            </tr>
            <tr>
              <th>エクスポート形式</th>
              <td><code>フォーマット v{DATA_FORMAT_VERSION}</code></td>
            </tr>
          </tbody>
        </table>
        <p className="info-note">
          アプリを更新した際もIndexedDB内のデータは保持されます。<br />
          念のため定期的に下記の「JSONエクスポート」でバックアップを取得してください。
        </p>
      </div>

      {/* ---- エクスポート ---- */}
      <div className="data-action-card">
        <h3>📤 JSONエクスポート</h3>
        <p>全データ（キャラクター・技・セットプレイ・プリセット・始動）をJSONファイルとしてダウンロードします。</p>
        <button className="btn btn-primary" onClick={handleExport}>エクスポートする</button>
      </div>

      {/* ---- インポート ---- */}
      <div className="data-action-card">
        <h3>📥 JSONインポート</h3>
        <p>
          エクスポートしたJSONファイルを読み込みます。既存データとマージされます（同じIDは上書き）。<br />
          旧フォーマット（v1）のファイルも読み込めます。
        </p>
        <button className="btn btn-outline" onClick={() => fileRef.current?.click()}>
          ファイルを選択してインポート
        </button>
        {import.meta.env.DEV && (
          <button className="btn btn-outline" onClick={handleImportLocalBackup}>
            ローカルバックアップをインポート
          </button>
        )}
        <input
          ref={fileRef}
          type="file"
          accept=".json"
          style={{ display: 'none' }}
          onChange={handleImport}
        />
      </div>

      {/* ---- 公式データ試験投入 ---- */}
      <div className="data-action-card">
        <h3>🧪 公式データ試験投入</h3>
        <p>
          {SF6_CHUNLI_CLASSIC_DATA_META.sourceName} を春麗へ投入します。<br />
          データ最終確認日：<code>{SF6_CHUNLI_CLASSIC_DATA_META.dataCheckedAt}</code><br />
          既存の対象操作タイプの春麗技データは差し替えられます。
        </p>
        {officialImportTarget ? (
          <div className="delete-confirm-row">
            <span>{officialImportTarget.label}の技データを差し替えますか？</span>
            <button className="btn btn-primary" onClick={() => handleImportOfficialMoves(officialImportTarget)}>投入する</button>
            <button className="btn btn-ghost" onClick={() => setOfficialImportTarget(null)}>キャンセル</button>
          </div>
        ) : (
          <div className="delete-confirm-row">
            {officialImportTargets.map((target) => (
              <button key={target.meta.controlTypeId} className="btn btn-outline" onClick={() => setOfficialImportTarget(target)}>
                {target.label}公式データを投入
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ---- 全初期化 ---- */}
      <div className="data-action-card danger-card">
        <h3>🗑️ 全データ初期化</h3>
        <p>全てのキャラクター・技データ・セットプレイ・プリセット・始動を削除します。この操作は元に戻せません。</p>
        <p style={{ fontSize: '0.85rem', color: 'var(--danger)', fontWeight: 600 }}>
          ⚠ 実行前に必ずJSONエクスポートでバックアップを取得してください。
        </p>
        {resetConfirm ? (
          <div className="delete-confirm-row">
            <span>本当に全データを削除しますか？この操作は取り消せません。</span>
            <button className="btn btn-danger" onClick={handleReset}>削除する</button>
            <button className="btn btn-ghost" onClick={() => setResetConfirm(false)}>キャンセル</button>
          </div>
        ) : (
          <button className="btn btn-ghost text-danger" onClick={() => setResetConfirm(true)}>
            全データを初期化する
          </button>
        )}
      </div>
    </div>
  );
}
