import type { Game, ControlType } from '../types';

interface Props {
  game: Game;
  onSelect: (ct: ControlType) => void;
}

export function ControlTypeSelect({ game, onSelect }: Props) {
  return (
    <div className="select-view">
      <h2 className="select-title">操作タイプを選択してください</h2>
      <p className="select-subtitle">{game.name}</p>
      <div className="select-grid">
        {game.controlTypes.map((ct) => (
          <button key={ct.id} className="select-card" onClick={() => onSelect(ct)}>
            <span className="select-card-name">{ct.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
