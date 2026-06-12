import { useEffect, useState } from 'react';
import { db } from '../db';
import { gameLogoSrc, localCharacterIconCandidates } from '../characterAssets';
import type { Game, ControlType, ControlTypeId } from '../types';

interface Props {
  game: Game;
  characterName: string;
  onSelect: (ct: ControlType) => void;
  onImportOfficial: (ct: ControlType) => Promise<void>;
}

const CONTROL_TYPE_VISUALS: Record<ControlTypeId, { label: string; className: string }> = {
  sf6_classic: { label: 'CLASSIC', className: 'control-type-card-classic' },
  sf6_modern: { label: 'MODERN', className: 'control-type-card-modern' },
  cotw_arcade: { label: 'ARCADE', className: 'control-type-card-arcade' },
  cotw_smart: { label: 'SMART', className: 'control-type-card-smart' },
};

type ControlTypeDataSummary = {
  moveCount: number;
  lastInputDate: string | null;
};

function formatDateLabel(value: string | null | undefined): string {
  if (value === undefined) return '確認中...';
  if (!value) return '未入力';
  return value.slice(0, 10).replaceAll('-', '/');
}

export function ControlTypeSelect({ game, characterName, onSelect, onImportOfficial }: Props) {
  const [importingId, setImportingId] = useState<string | null>(null);
  const [iconIndex, setIconIndex] = useState(0);
  const [dataRefreshKey, setDataRefreshKey] = useState(0);
  const [dataSummaries, setDataSummaries] = useState<Partial<Record<ControlTypeId, ControlTypeDataSummary>>>({});
  const characterIconCandidates = localCharacterIconCandidates(game.id, characterName);
  const characterIconSrc = iconIndex < characterIconCandidates.length ? characterIconCandidates[iconIndex] : null;
  const initial = [...characterName][0] ?? '?';

  useEffect(() => {
    setIconIndex(0);
  }, [game.id, characterName]);

  useEffect(() => {
    let cancelled = false;

    async function loadDataSummaries() {
      const entries = await Promise.all(game.controlTypes.map(async (controlType) => {
        const characters = await db.characters
          .where('[gameId+controlTypeId]')
          .equals([game.id, controlType.id])
          .toArray();
        const character = characters.find((candidate) => candidate.name === characterName);
        if (!character) {
          return [controlType.id, { moveCount: 0, lastInputDate: null }] as const;
        }

        const moves = await db.moves
          .where('[gameId+controlTypeId+characterId]')
          .equals([game.id, controlType.id, character.id])
          .toArray();
        const lastInputDate = moves
          .map((move) => move.updatedAt)
          .filter(Boolean)
          .sort()
          .at(-1)
          ?.slice(0, 10) ?? null;

        return [controlType.id, { moveCount: moves.length, lastInputDate }] as const;
      }));

      if (!cancelled) {
        setDataSummaries(Object.fromEntries(entries));
      }
    }

    setDataSummaries({});
    loadDataSummaries();

    return () => {
      cancelled = true;
    };
  }, [dataRefreshKey, game.controlTypes, game.id, characterName]);

  const handleImport = async (controlType: ControlType) => {
    setImportingId(controlType.id);
    try {
      await onImportOfficial(controlType);
      setDataRefreshKey((key) => key + 1);
    } finally {
      setImportingId(null);
    }
  };

  return (
    <div className="select-view control-select-view" data-game-id={game.id}>
      <div className="control-select-shell">
        <div className="control-select-hero">
          <div className="control-select-copy">
            <img className="control-select-game-logo" src={gameLogoSrc(game.id)} alt="" aria-hidden="true" />
            <p className="control-select-game-name">{game.name}</p>
            <h2 className="select-title control-select-title">操作タイプを選択</h2>
            <p className="control-select-character-name">{characterName}</p>
          </div>

          <div className="control-select-character" aria-hidden="true">
            {characterIconSrc ? (
              <img
                className="control-select-character-img"
                src={characterIconSrc}
                alt=""
                draggable={false}
                onError={() => setIconIndex((index) => index + 1)}
              />
            ) : (
              <span className="control-select-character-fallback">{initial}</span>
            )}
          </div>
        </div>

        <div className="control-select-grid">
          {game.controlTypes.map((ct, index) => {
            const visual = CONTROL_TYPE_VISUALS[ct.id];
            const dataSummary = dataSummaries[ct.id];

            return (
              <div key={ct.id} className={`control-type-card ${visual.className}`}>
                <button className="control-type-main" onClick={() => onSelect(ct)}>
                  <span className="control-type-number">0{index + 1}</span>
                  <span className="control-type-label">{visual.label}</span>
                  <span className="control-type-name">{ct.name}</span>
                  <span className="control-type-data">
                    <span>データ最終入力</span>
                    <strong>{formatDateLabel(dataSummary?.lastInputDate)}</strong>
                  </span>
                  <span className="control-type-count">
                    {dataSummary ? `技 ${dataSummary.moveCount}件` : '技 --件'}
                  </span>
                </button>
                {game.id === 'sf6' && (
                  <button
                    className="btn btn-outline btn-sm control-type-import"
                    onClick={() => handleImport(ct)}
                    disabled={importingId === ct.id}
                  >
                    {importingId === ct.id ? '確認中...' : '公式差分インポート'}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
