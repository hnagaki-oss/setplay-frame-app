import { GAMES } from '../constants';
import type { Game } from '../types';

interface Props {
  onSelect: (game: Game) => void;
  onOpenDataManager: () => void;
}

export function GameSelect({ onSelect, onOpenDataManager }: Props) {
  return (
    <div className="select-view">
      <h2 className="select-title">ゲームを選択してください</h2>
      <div className="select-actions">
        <button className="btn btn-outline" onClick={onOpenDataManager}>
          💾 データ管理
        </button>
      </div>
      <div className="select-grid">
        {GAMES.map((game) => (
          <button key={game.id} className="select-card" onClick={() => onSelect(game)}>
            <span className="select-card-name">{game.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
