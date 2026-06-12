import { GAMES } from '../constants';
import type { Game, GameId } from '../types';

const GAME_SELECT_VISUALS: Record<GameId, { logoSrc: string; cardClass: string }> = {
  sf6: {
    logoSrc: '/local-game-logos/sf6.png',
    cardClass: 'game-select-card-sf6',
  },
  fatal_fury_cotw: {
    logoSrc: '/local-game-logos/fatal_fury_cotw.png',
    cardClass: 'game-select-card-cotw',
  },
};

interface Props {
  onSelect: (game: Game) => void;
  onOpenDataManager: () => void;
}

export function GameSelect({ onSelect, onOpenDataManager }: Props) {
  return (
    <div className="select-view game-select-view">
      <div className="game-select-shell">
        <p className="game-select-brand">Setplay Frame App</p>
        <h2 className="select-title game-select-title">ゲームを選択</h2>

        <div className="select-grid game-select-grid">
          {GAMES.map((game) => {
            const visual = GAME_SELECT_VISUALS[game.id];

            return (
              <button
                key={game.id}
                className={`select-card game-select-card ${visual.cardClass}`}
                onClick={() => onSelect(game)}
                aria-label={`${game.name}を開く`}
              >
                <span className="game-select-logo-wrap" aria-hidden="true">
                  <img className="game-select-logo" src={visual.logoSrc} alt="" draggable={false} />
                </span>
                <span className="select-card-name game-select-card-name">{game.name}</span>
              </button>
            );
          })}
        </div>

        <div className="select-actions game-select-actions">
          <button className="btn btn-outline game-select-data-button" onClick={onOpenDataManager}>
            データ管理
          </button>
        </div>
      </div>
    </div>
  );
}
