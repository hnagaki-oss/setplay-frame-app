import type { Move, SearchCondition, SearchResult, SearchResultMove, SearchSessionOverride } from './types';

type MoveWithFrames = Move & { totalFrames: number };

let _idCounter = 0;
function genId(): string {
  return `r${++_idCounter}_${Math.random().toString(36).slice(2, 7)}`;
}

export function filterMoves(
  moves: Move[],
  condition: SearchCondition,
  override?: SearchSessionOverride
): MoveWithFrames[] {
  const excludedCats = override?.excludedCategories ?? [];
  const effectiveCategories = condition.enabledCategories.filter(
    (c) => !excludedCats.includes(c)
  );

  return moves.filter((move): move is MoveWithFrames => {
    if (!move.enabled) return false;
    if (move.totalFrames === null || move.totalFrames <= 0) return false;
    if (!effectiveCategories.includes(move.category)) return false;
    if (override?.excludedMoveIds?.includes(move.id)) return false;
    if (
      override?.excludedTags?.length &&
      override.excludedTags.some((tag) => move.tags.includes(tag))
    )
      return false;
    return true;
  });
}

function findCombinations(
  moves: MoveWithFrames[],
  target: number,
  maxCount: number,
  allowRepeat: boolean
): MoveWithFrames[][] {
  const results: MoveWithFrames[][] = [];
  const sorted = [...moves].sort((a, b) => a.totalFrames - b.totalFrames);

  function backtrack(current: MoveWithFrames[], remaining: number, startIdx: number) {
    if (remaining === 0) {
      results.push([...current]);
      return;
    }
    if (current.length >= maxCount) return;

    for (let i = startIdx; i < sorted.length; i++) {
      const move = sorted[i];
      if (move.totalFrames > remaining) break;
      current.push(move);
      backtrack(current, remaining - move.totalFrames, allowRepeat ? i : i + 1);
      current.pop();
    }
  }

  backtrack([], target, 0);
  return results;
}

function scoreResult(
  resultMoves: SearchResultMove[],
  waitFrames: number,
  override?: SearchSessionOverride
): { score: number; reasons: string[] } {
  let score = 100;
  const reasons: string[] = [];

  const count = resultMoves.length;
  score += (3 - count) * 10;
  reasons.push(`技数${count}`);

  if (waitFrames === 0) {
    score += 10;
    reasons.push('待ちFなし');
  } else {
    score -= waitFrames * 3;
    reasons.push(`待ちF: ${waitFrames}F`);
  }

  const hasSpecial = resultMoves.some((m) => m.category === 'special');
  if (hasSpecial) {
    score += 5;
    reasons.push('必殺技を含む');
  }

  const allTags = new Set(resultMoves.flatMap((m) => m.tags));

  if (allTags.has('安定')) { score += 10; reasons.push('安定タグ'); }
  if (allTags.has('突進技')) { score += 5; reasons.push('突進技タグ'); }
  if (allTags.has('特殊効果あり')) { score += 5; reasons.push('特殊効果ありタグ'); }
  if (allTags.has('位置調整あり')) { score += 3; reasons.push('位置調整ありタグ'); }
  if (allTags.has('位置ずれ注意')) { score -= 10; reasons.push('位置ずれ注意タグ（減点）'); }
  if (allTags.has('相手に当たりやすい')) { score -= 5; reasons.push('相手に当たりやすいタグ（減点）'); }
  if (allTags.has('非推奨')) { score -= 30; reasons.push('非推奨タグ（大減点）'); }

  if (override) {
    resultMoves.forEach((m) => {
      if (override.preferredMoveIds.includes(m.moveId)) {
        score += 15;
        reasons.push(`優先技: ${m.name}`);
      }
    });
    override.preferredTags?.forEach((tag) => {
      if (allTags.has(tag)) {
        score += 10;
        reasons.push(`優先タグ: ${tag}`);
      }
    });
    override.preferredCategories?.forEach((cat) => {
      if (resultMoves.some((m) => m.category === cat)) {
        score += 5;
      }
    });
  }

  return { score, reasons };
}

function combosToResults(
  combos: MoveWithFrames[][],
  waitFrames: number,
  meatyInfo: SearchResult['meatyInfo'],
  override?: SearchSessionOverride
): SearchResult[] {
  return combos.map((combo) => {
    const resultMoves: SearchResultMove[] = combo.map((m) => ({
      moveId: m.id,
      name: m.name,
      totalFrames: m.totalFrames,
      category: m.category,
      tags: m.tags,
    }));
    const { score, reasons } = scoreResult(resultMoves, waitFrames, override);
    return {
      id: genId(),
      moves: resultMoves,
      totalFrames: combo.reduce((s, m) => s + m.totalFrames, 0),
      waitFrames,
      score,
      reasons,
      meatyInfo,
    };
  });
}

export function search(
  moves: Move[],
  condition: SearchCondition,
  override?: SearchSessionOverride
): SearchResult[] {
  const effectiveMaxCount = override?.maxMoveCount ?? condition.maxMoveCount;
  const effectiveAllowWait = override?.allowWaitFrames ?? condition.allowWaitFrames;
  const effectiveMaxWait = override?.maxWaitFrames ?? condition.maxWaitFrames;

  const filtered = filterMoves(moves, condition, override);
  const target = condition.requiredConsumeFrames;

  let meatyInfo: SearchResult['meatyInfo'] | undefined;
  if (condition.isMeatyMode && condition.meatyMoveId) {
    const meatyMove = moves.find((m) => m.id === condition.meatyMoveId);
    if (meatyMove?.startupFrames && meatyMove?.activeFrames) {
      const activeStart = meatyMove.activeStartFrames ?? meatyMove.startupFrames;
      const activeIdx = condition.meatyTargetActiveIndex ?? meatyMove.activeFrames - activeStart;
      meatyInfo = {
        moveId: meatyMove.id,
        moveName: meatyMove.name,
        startupFrames: meatyMove.startupFrames,
        activeFrames: meatyMove.activeFrames,
        targetActiveIndex: activeIdx,
        targetActiveLabel: `持続${activeIdx + 1}F目`,
      };
    }
  }

  const allResults: SearchResult[] = [];

  const baseCombos = findCombinations(filtered, target, effectiveMaxCount, condition.allowRepeatSameMove);
  allResults.push(...combosToResults(baseCombos, 0, meatyInfo, override));

  if (effectiveAllowWait && effectiveMaxWait > 0) {
    for (let wait = 1; wait <= effectiveMaxWait; wait++) {
      const subTarget = target - wait;
      if (subTarget <= 0) break;
      const waitCombos = findCombinations(filtered, subTarget, effectiveMaxCount, condition.allowRepeatSameMove);
      allResults.push(...combosToResults(waitCombos, wait, meatyInfo, override));
    }
  }

  return allResults.sort((a, b) => b.score - a.score);
}
