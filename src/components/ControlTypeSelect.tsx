import { useEffect, useState } from 'react';
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

export function ControlTypeSelect({ game, characterName, onSelect, onImportOfficial }: Props) {
  const [importingId, setImportingId] = useState<string | null>(null);
  const [iconIndex, setIconIndex] = useState(0);
  const characterIconCandidates = localCharacterIconCandidates(game.id, characterName);
  const characterIconSrc = iconIndex < characterIconCandidates.length ? characterIconCandidates[iconIndex] : null;
  const initial = [...characterName][0] ?? '?';

  useEffect(() => {
    setIconIndex(0);
  }, [game.id, characterName]);

  const handleImport = async (controlType: ControlType) => {
    setImportingId(controlType.id);
    try {
      await onImportOfficial(controlType);
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

            return (
              <div key={ct.id} className={`control-type-card ${visual.className}`}>
                <button className="control-type-main" onClick={() => onSelect(ct)}>
                  <span className="control-type-number">0{index + 1}</span>
                  <span className="control-type-label">{visual.label}</span>
                  <span className="control-type-name">{ct.name}</span>
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
