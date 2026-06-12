import type { Game, ControlType, Character } from '../types';
import { APP_VERSION } from '../version';

interface Props {
  game: Game | null;
  controlType: ControlType | null;
  character: Character | null;
  characterName: string | null;
  currentView: string;
  onClickGame: () => void;
  onClickControlType: () => void;
  onClickCharacter: () => void;
  onClickSettings: () => void;
}

export function Header({
  game, controlType, character, characterName, currentView,
  onClickGame, onClickControlType, onClickCharacter, onClickSettings,
}: Props) {
  const displayCharacterName = character?.name ?? characterName;

  return (
    <header className="header">
      <div className="header-title">🎮 セットプレイ検索</div>

      <nav className="breadcrumb">
        <button
          className={`breadcrumb-item ${game ? 'active' : 'placeholder'}`}
          onClick={onClickGame}
        >
          {game ? game.name : 'ゲームを選択'}
        </button>

        {game && (
          <>
            <span className="breadcrumb-sep">›</span>
            <button
              className={`breadcrumb-item ${displayCharacterName ? 'active' : 'placeholder'}`}
              onClick={onClickCharacter}
            >
              {displayCharacterName ?? 'キャラクターを選択'}
            </button>
          </>
        )}

        {displayCharacterName && (currentView === 'controlTypeSelect' || currentView === 'main') && (
          <>
            <span className="breadcrumb-sep">›</span>
            <button
              className={`breadcrumb-item ${controlType ? 'active' : 'placeholder'}`}
              onClick={onClickControlType}
            >
              {controlType ? controlType.name : '操作タイプを選択'}
            </button>
          </>
        )}
      </nav>

      <button className="settings-btn" onClick={onClickSettings} title="プリセット設定">
        ⚙️ プリセット設定
      </button>
      <span className="app-version">v{APP_VERSION}</span>
    </header>
  );
}
