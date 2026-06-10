import { useState, useCallback, useEffect } from 'react';
import { db } from './db';
import type { Game, ControlType, Character, Move, Setplay, SearchResult, SearchCondition, SearchSessionOverride, ToastItem, SearchDefaults, Starter } from './types';
import { GAMES, DEFAULT_SEARCH_DEFAULTS } from './constants';
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
import {
  ensureCharacterForControlType,
  importAvailableOfficialTargetsForGame,
  importOfficialForCharacterControl,
  previewOfficialForCharacterControl,
} from './officialImports';

type AppView = 'gameSelect' | 'controlTypeSelect' | 'characterSelect' | 'main';
type MainTab = 'search' | 'moves' | 'setplays' | 'data';
type SubView = 'main' | 'setplayDetail';

async function seedMovesForCharacter(game: Game, controlType: ControlType, character: Character) {
  const preset = await db.presets.get(`${game.id}_${controlType.id}`);
  if (!preset || preset.moves.length === 0) return;

  const moveCount = await db.moves.where('characterId').equals(character.id).count();
  if (moveCount > 0) return;

  const timestamp = now();
  const moves: Move[] = preset.moves.map((p) => ({
    id: genUUID(),
    gameId: game.id,
    controlTypeId: controlType.id,
    characterId: character.id,
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
    createdAt: timestamp,
    updatedAt: timestamp,
  }));
  await db.moves.bulkAdd(moves);
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
  const [selectedCharacterName, setSelectedCharacterName] = useState<string | null>(null);
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
    setSelectedCharacterName(null);
    setSelectedControlType(null);
    setSelectedCharacter(null);
    setView('characterSelect');
  };

  // キャラ選択 → 操作タイプ選択へ
  const handleSelectCharacter = (characterName: string) => {
    setSelectedCharacterName(characterName);
    setSelectedControlType(null);
    setSelectedCharacter(null);
    setView('controlTypeSelect');
  };

  // 操作タイプ選択 → メインへ
  const handleSelectControlType = async (ct: ControlType) => {
    if (!selectedGame || !selectedCharacterName) return;
    setSelectedControlType(ct);
    const character = await ensureCharacterForControlType(selectedGame, ct, selectedCharacterName);
    setSelectedCharacter(character);
    await seedMovesForCharacter(selectedGame, ct, character);
    // 保存済みプリセットの searchDefaults を読み込む
    const pid = `${selectedGame.id}_${ct.id}`;
    const preset = await db.presets.get(pid);
    if (preset) setSearchDefaults(preset.searchDefaults);
    else setSearchDefaults(DEFAULT_SEARCH_DEFAULTS);
    setCurrentTab('search');
    setSubView('main');
    setView('main');
  };

  const handleBulkOfficialImport = async () => {
    if (!selectedGame) return;
    const result = await importAvailableOfficialTargetsForGame(selectedGame);
    const importedCount = result.imported.filter((item) => item.status === 'imported').length;
    const unchangedCount = result.imported.filter((item) => item.status === 'unchanged').length;
    const sourceLabel = result.rosterSource === 'official-site' ? '公式サイト' : '内蔵ロスター';
    showToast(
      `公式データ確認完了（${sourceLabel}）：不足キャラ${result.addedCharacters}件、更新${importedCount}件、変更なし${unchangedCount}件`,
      importedCount > 0 || result.addedCharacters > 0 ? 'success' : 'info'
    );
    if (result.rosterError) {
      showToast(`公式サイト取得はフォールバックしました：${result.rosterError}`, 'info');
    }
  };

  const handleSingleOfficialImport = async (ct: ControlType) => {
    if (!selectedGame || !selectedCharacterName) return;
    await ensureCharacterForControlType(selectedGame, ct, selectedCharacterName);
    const preview = await previewOfficialForCharacterControl(selectedGame.id, ct.id, selectedCharacterName);
    if (preview.status === 'unavailable') {
      showToast(`「${selectedCharacterName} / ${ct.name}」の公式データはまだ未対応です`, 'info');
      return;
    }
    if (preview.status === 'unchanged') {
      showToast(`${preview.label}公式データに差分はありません（${preview.officialCount}件）`, 'info');
      return;
    }
    const shouldImport = window.confirm(
      [
        `${preview.label} の公式データ差分をインポートしますか？`,
        `現在: ${preview.currentCount}件`,
        `公式: ${preview.officialCount}件`,
        `データ最終確認日: ${preview.dataCheckedAt ?? '-'}`,
      ].join('\n')
    );
    if (!shouldImport) {
      showToast(`${preview.label}公式データのインポートをキャンセルしました`, 'info');
      return;
    }

    const result = await importOfficialForCharacterControl(selectedGame.id, ct.id, selectedCharacterName);
    if (result.status === 'unavailable') {
      showToast(`「${selectedCharacterName} / ${ct.name}」の公式データはまだ未対応です`, 'info');
      return;
    }
    if (result.status === 'unchanged') {
      showToast(`${result.label}公式データに差分はありません`, 'info');
      return;
    }
    showToast(`${result.label}公式データを投入しました（${result.importedCount}件）`, 'success');
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
    setSelectedGame(null); setSelectedCharacterName(null); setSelectedControlType(null); setSelectedCharacter(null);
    setView('gameSelect');
  };
  const goToControlTypeSelect = () => {
    if (!selectedCharacterName) {
      setView('characterSelect');
      return;
    }
    setSelectedControlType(null); setSelectedCharacter(null);
    setView('controlTypeSelect');
  };
  const goToCharacterSelect = () => {
    setSelectedCharacterName(null); setSelectedControlType(null); setSelectedCharacter(null); setSubView('main');
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
        characterName={selectedCharacterName}
        currentView={view}
        onClickGame={goToGameSelect}
        onClickControlType={selectedCharacterName ? goToControlTypeSelect : () => {}}
        onClickCharacter={selectedGame ? goToCharacterSelect : () => {}}
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

        {view === 'controlTypeSelect' && fullGame && selectedCharacterName && (
          <ControlTypeSelect
            game={fullGame}
            characterName={selectedCharacterName}
            onSelect={handleSelectControlType}
            onImportOfficial={handleSingleOfficialImport}
          />
        )}

        {view === 'characterSelect' && fullGame && (
          <CharacterSelect
            game={fullGame}
            onSelect={handleSelectCharacter}
            onBulkImportOfficial={handleBulkOfficialImport}
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
