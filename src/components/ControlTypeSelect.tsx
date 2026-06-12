import type { Game, ControlType } from '../types';
import { useState } from 'react';

interface Props {
  game: Game;
  characterName: string;
  onSelect: (ct: ControlType) => void;
  onImportOfficial: (ct: ControlType) => Promise<void>;
}

export function ControlTypeSelect({ game, characterName, onSelect, onImportOfficial }: Props) {
  const [importingId, setImportingId] = useState<string | null>(null);

  const handleImport = async (controlType: ControlType) => {
    setImportingId(controlType.id);
    try {
      await onImportOfficial(controlType);
    } finally {
      setImportingId(null);
    }
  };

  return (
    <div className="select-view">
      <h2 className="select-title">操作タイプを選択してください</h2>
      <p className="select-subtitle">{game.name} / {characterName}</p>
      <div className="select-grid">
        {game.controlTypes.map((ct) => (
          <div key={ct.id} className="select-card">
            <button className="select-card-main-action" onClick={() => onSelect(ct)}>
              <span className="select-card-name">{ct.name}</span>
            </button>
            {game.id === 'sf6' && (
              <button
                className="btn btn-outline btn-sm"
                onClick={() => handleImport(ct)}
                disabled={importingId === ct.id}
              >
                {importingId === ct.id ? '確認中...' : '公式差分インポート'}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
