import { useState, useCallback, useEffect } from 'react';
import { db } from './db';
import type { Game, ControlType, Character, Move, Setplay, SearchResult, SearchCondition, SearchSessionOverride, ToastItem, SearchDefaults, Starter } from './types';
import { GAMES, INITIAL_CHARACTERS, DEFAULT_SEARCH_DEFAULTS, CHARACTER_NAME_MIGRATIONS } from './constants';
import { genUUID, now } from './utils';
import { Header } from './components/Header';
import { Toast } from './components/Toast';
import { GameSelect } from './components/GameSelect';
import { ControlTypeSelect } from './components/ControlTypeSelect';
import { CharacterSelect } from './components/CharacterSelect';
import { MoveManager } from './components/MoveManager';
import { FrameSearch } from './components/FrameSearch';
import { SetplayConfirm } from './components/SetplayConfirm';
import { SetplayList } from './components/SetplayList';
import { SetplayDetail } from './components/SetplayDetail';
import { DataManager } from './components/DataManager';
import { SettingsModal } from './components/SettingsModal';

type AppView = 'gameSelect' | 'controlTypeSelect' | 'characterSelect' | 'main';
type MainTab = 'search' | 'moves' | 'setplays' | 'data';
type SubView = 'main' | 'setplayDetail';

async function seedCharacters(game: Game, controlType: ControlType) {
  const canonicalNames = INITIAL_CHARACTERS[controlType.id] ?? [];
  if (canonicalNames.length === 0) return;

  const existing = await db.characters
    .where('[gameId+controlTypeId]')
    .equals([game.id, controlType.id])
    .toArray();

  // キャラごとにデータ（技・セットプレイ）の有無を確認
  const withData: Character[] = [];
  const withoutData: Character[] = [];
  for (const char of existing) {
    const hasMoves    = (await db.moves.where('characterId').equals(char.id).count()) > 0;
    const hasSetplays = (await db.setplays.where('characterId').equals(char.id).count()) > 0;
    if (hasMoves || hasSetplays) {
      withData.push(char);
    } else {
      withoutData.push(char);
    }
  }

  // データなしキャラを削除（名前が正しくない重複キャラ等を一掃）
  for (const char of withoutData) {
    await db.characters.delete(char.id);
  }

  // データありキャラは名前をマイグレーション（旧名 → 正式日本語名）
  // ただし現在の名前がすでにこのゲームのカノニカルリストにある場合はスキップ
  // （例: CotWの「テリー・ボガード」をSF6用ルールで「テリー」に誤改名しないようにする）
  for (const char of withData) {
    if (canonicalNames.includes(char.name)) continue;
    const newName = CHARACTER_NAME_MIGRATIONS[char.name];
    if (newName && newName !== char.name) {
      await db.characters.update(char.id, { name: newName, updatedAt: now() });
    }
  }

  // 現在残っているキャラ名を取得
  const remaining = await db.characters
    .where('[gameId+controlTypeId]')
    .equals([game.id, controlType.id])
    .toArray();
  const existingNames = new Set(remaining.map((c) => c.name));

  // 不足しているカノニカルキャラを追加
  const toAdd = canonicalNames.filter((name) => !existingNames.has(name));
  if (toAdd.length === 0) return;
  const chars: Character[] = toAdd.map((name) => ({
    id: genUUID(),
    gameId: game.id,
    controlTypeId: controlType.id,
    name,
    entryType: 'preset',
    createdAt: now(),
    updatedAt: now(),
  }));
  await db.characters.bulkAdd(chars);
}

/** 操作タイプ配下の技が0件のキャラ全員にプリセット技を一括シード */
async function seedMovesForAllCharacters(game: Game, controlType: ControlType) {
  const preset = await db.presets.get(`${game.id}_${controlType.id}`);
  if (!preset || preset.moves.length === 0) return;

  const characters = await db.characters
    .where('[gameId+controlTypeId]')
    .equals([game.id, controlType.id])
    .toArray();

  for (const char of characters) {
    const moveCount = await db.moves.where('characterId').equals(char.id).count();
    if (moveCount > 0) continue; // 既に技あり → スキップ

    const moves: Move[] = preset.moves.map((p) => ({
      id: genUUID(),
      gameId: game.id,
      controlTypeId: controlType.id,
      characterId: char.id,
      name: p.name,
      category: p.category,
      entryType: 'preset' as const,
      totalFrames: null,
      startupFrames: null,
      activeStartFrames: null,
      activeFrames: null,
      tags: [],
      memo: '',
      enabled: true,
      createdAt: now(),
      updatedAt: now(),
    }));
    await db.moves.bulkAdd(moves);
  }
}

/** 起動時マイグレーション: sf6_classic プリセットを sf6_modern にコピー（未設定の場合のみ）
 *  プリセットIDは `${gameId}_${controlTypeId}` 形式 → sf6_sf6_classic / sf6_sf6_modern
 */
async function migrateCopyClassicToModern() {
  const classicId = 'sf6_sf6_classic';
  const modernId  = 'sf6_sf6_modern';
  const classic = await db.presets.get(classicId);
  if (!classic) return;                    // クラシックプリセットがまだない
  const modern = await db.presets.get(modernId);
  if (modern) return;                      // モダンに既に設定済み
  await db.presets.put({
    ...classic,
    id: modernId,
    controlTypeId: 'sf6_modern',
    updatedAt: now(),
  });
}

export default function App() {
  const [view, setView] = useState<AppView>('gameSelect');
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [selectedControlType, setSelectedControlType] = useState<ControlType | null>(null);
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [currentTab, setCurrentTab] = useState<MainTab>('search');
  const [subView, setSubView] = useState<SubView>('main');
  const [detailSetplay, setDetailSetplay] = useState<Setplay | null>(null);
  const [searchDefaults, setSearchDefaults] = useState<SearchDefaults>(DEFAULT_SEARCH_DEFAULTS);
  const [showSettings, setShowSettings] = useState(false);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const [pendingResults, setPendingResults] = useState<SearchResult[] | null>(null);
  const [pendingCondition, setPendingCondition] = useState<SearchCondition | null>(null);
  const [pendingOverride, setPendingOverride] = useState<SearchSessionOverride | undefined>();
  const [pendingStarter, setPendingStarter] = useState<Starter | null | undefined>();

  const showToast = useCallback((message: string, type: ToastItem['type'] = 'info') => {
    const id = genUUID();
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);

  // 起動時マイグレーション（一度だけ実行）
  useEffect(() => { migrateCopyClassicToModern(); }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // ゲーム選択
  const handleSelectGame = (game: Game) => {
    setSelectedGame(game);
    setSelectedControlType(null);
    setSelectedCharacter(null);
    setView('controlTypeSelect');
  };

  // 操作タイプ選択 → キャラ選択へ直接（プリセットはヘッダーの⚙️から設定）
  const handleSelectControlType = async (ct: ControlType) => {
    if (!selectedGame) return;
    setSelectedControlType(ct);
    setSelectedCharacter(null);
    await seedCharacters(selectedGame, ct);
    // 技が0件のキャラ全員にプリセット技を一括シード
    await seedMovesForAllCharacters(selectedGame, ct);
    // 保存済みプリセットの searchDefaults を読み込む
    const pid = `${selectedGame.id}_${ct.id}`;
    const preset = await db.presets.get(pid);
    if (preset) setSearchDefaults(preset.searchDefaults);
    else setSearchDefaults(DEFAULT_SEARCH_DEFAULTS);
    setView('characterSelect');
  };

  // キャラ選択
  const handleSelectCharacter = async (char: Character) => {
    setSelectedCharacter(char);
    setCurrentTab('search');
    setSubView('main');
    // プリセットの searchDefaults を再ロード
    const pid = `${char.gameId}_${char.controlTypeId}`;
    const preset = await db.presets.get(pid);
    if (preset) setSearchDefaults(preset.searchDefaults);
    setView('main');
  };

  // 設定モーダルを閉じたあとに searchDefaults を再ロード
  const handleSettingsClose = async () => {
    setShowSettings(false);
    if (selectedGame && selectedControlType) {
      const pid = `${selectedGame.id}_${selectedControlType.id}`;
      const preset = await db.presets.get(pid);
      if (preset) setSearchDefaults(preset.searchDefaults);
    }
  };

  // セットプレイ登録フロー
  const handleRegister = (results: SearchResult[], condition: SearchCondition, override?: SearchSessionOverride, starter?: Starter | null) => {
    setPendingResults(results); setPendingCondition(condition); setPendingOverride(override); setPendingStarter(starter);
  };
  const handleRegisterComplete = () => {
    setPendingResults(null); setPendingCondition(null); setPendingOverride(undefined); setPendingStarter(undefined);
    setCurrentTab('setplays');
  };
  const handleRegisterCancel = () => {
    setPendingResults(null); setPendingCondition(null); setPendingOverride(undefined); setPendingStarter(undefined);
  };

  // セットプレイ詳細
  const handleSetplayDetail = (sp: Setplay) => { setDetailSetplay(sp); setSubView('setplayDetail'); };
  const handleDetailBack = () => { setDetailSetplay(null); setSubView('main'); };
  const handleDetailDeleted = () => { setDetailSetplay(null); setSubView('main'); };

  // ヘッダーナビ
  const goToGameSelect = () => {
    setSelectedGame(null); setSelectedControlType(null); setSelectedCharacter(null);
    setView('gameSelect');
  };
  const goToControlTypeSelect = () => {
    setSelectedControlType(null); setSelectedCharacter(null);
    setView('controlTypeSelect');
  };
  const goToCharacterSelect = () => {
    setSelectedCharacter(null); setSubView('main');
    setView('characterSelect');
  };

  const fullGame = selectedGame ? GAMES.find((g) => g.id === selectedGame.id) ?? null : null;
  const controlType = fullGame && selectedControlType
    ? fullGame.controlTypes.find((ct) => ct.id === selectedControlType.id) ?? null
    : null;

  return (
    <div className="app">
      <Header
        game={fullGame}
        controlType={controlType}
        character={selectedCharacter}
        currentView={view}
        onClickGame={goToGameSelect}
        onClickControlType={selectedGame ? goToControlTypeSelect : goToGameSelect}
        onClickCharacter={selectedControlType ? goToCharacterSelect : () => {}}
        onClickSettings={() => setShowSettings(true)}
      />

      <main className="main-content">
        {/* ⚙️ 設定モーダル */}
        {showSettings && (
          <SettingsModal
            initialGame={fullGame}
            initialControlType={controlType}
            onClose={handleSettingsClose}
            showToast={showToast}
          />
        )}

        {/* セットプレイ登録確認モーダル */}
        {pendingResults && pendingCondition && selectedCharacter && fullGame && controlType && (
          <SetplayConfirm
            character={selectedCharacter}
            game={fullGame}
            controlType={controlType}
            results={pendingResults}
            condition={pendingCondition}
            override={pendingOverride}
            initialStarter={pendingStarter}
            onComplete={handleRegisterComplete}
            onCancel={handleRegisterCancel}
            showToast={showToast}
          />
        )}

        {view === 'gameSelect' && <GameSelect onSelect={handleSelectGame} />}

        {view === 'controlTypeSelect' && fullGame && (
          <ControlTypeSelect game={fullGame} onSelect={handleSelectControlType} />
        )}

        {view === 'characterSelect' && fullGame && controlType && (
          <CharacterSelect
            game={fullGame}
            controlType={controlType}
            onSelect={handleSelectCharacter}
            showToast={showToast}
          />
        )}

        {view === 'main' && selectedCharacter && controlType && fullGame && (
          <>
            {subView === 'setplayDetail' && detailSetplay ? (
              <SetplayDetail
                setplay={detailSetplay}
                onBack={handleDetailBack}
                onDeleted={handleDetailDeleted}
                showToast={showToast}
              />
            ) : (
              <>
                <div className="tab-bar">
                  {([
                    { key: 'search',   label: '🔍 フレーム検索' },
                    { key: 'moves',    label: '📋 技データ管理' },
                    { key: 'setplays', label: '📁 セットプレイ一覧' },
                    { key: 'data',     label: '💾 データ管理' },
                  ] as { key: MainTab; label: string }[]).map((tab) => (
                    <button
                      key={tab.key}
                      className={`tab-btn ${currentTab === tab.key ? 'tab-active' : ''}`}
                      onClick={() => setCurrentTab(tab.key)}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
                <div className="tab-content">
                  {currentTab === 'search' && (
                    <FrameSearch
                      character={selectedCharacter}
                      searchDefaults={searchDefaults}
                      showToast={showToast}
                      onRegister={handleRegister}
                    />
                  )}
                  {currentTab === 'moves' && (
                    <MoveManager character={selectedCharacter} showToast={showToast} />
                  )}
                  {currentTab === 'setplays' && (
                    <SetplayList character={selectedCharacter} onDetail={handleSetplayDetail} showToast={showToast} />
                  )}
                  {currentTab === 'data' && (
                    <DataManager showToast={showToast} />
                  )}
                </div>
              </>
            )}
          </>
        )}
      </main>

      <Toast toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
