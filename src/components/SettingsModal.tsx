import { useState } from 'react';
import type { Game, ControlType } from '../types';
import { GAMES } from '../constants';
import { PresetConfig } from './PresetConfig';

interface Props {
  initialGame?: Game | null;
  initialControlType?: ControlType | null;
  onClose: () => void;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export function SettingsModal({ initialGame, initialControlType, onClose, showToast }: Props) {
  const defaultGame = initialGame ?? GAMES[0];
  const defaultCt = initialControlType ?? defaultGame.controlTypes[0];

  const [game, setGame] = useState<Game>(defaultGame);
  const [ct, setCt] = useState<ControlType>(defaultCt);

  const handleGameChange = (g: Game) => {
    setGame(g);
    setCt(g.controlTypes[0]);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-xl settings-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>⚙️ プリセット設定</h3>
          <button className="btn-close" onClick={onClose}>✕</button>
        </div>

        <div className="settings-modal-selector">
          {/* ゲーム選択タブ */}
          <div className="settings-game-tabs">
            {GAMES.map((g) => (
              <button
                key={g.id}
                className={`btn btn-sm ${game.id === g.id ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => handleGameChange(g)}
              >
                {g.name}
              </button>
            ))}
          </div>
          {/* 操作タイプ選択タブ */}
          <div className="settings-ct-tabs">
            {game.controlTypes.map((c) => (
              <button
                key={c.id}
                className={`btn btn-sm ${ct.id === c.id ? 'btn-outline' : 'btn-ghost'}`}
                onClick={() => setCt(c)}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>

        <div className="modal-body settings-modal-body">
          <PresetConfig
            game={game}
            controlType={ct}
            onSaved={onClose}
            showToast={showToast}
          />
        </div>
      </div>
    </div>
  );
}
