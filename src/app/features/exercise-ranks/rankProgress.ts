import { formatRankLabel, getExerciseRank, MAX_REPS_FOR_RANK, MIN_REPS_FOR_RANK } from './rankUtils';
import type {
  ExerciseRankResult,
  ExerciseRankTier,
  RankableExercise,
  RankableWorkout,
  RankDivision,
} from './rankTypes';

export interface WorkoutRankProgressItem {
  progressKind: 'rank' | 'performance';
  exerciseId: string;
  exerciseName: string;
  beforeRank: ExerciseRankTier;
  beforeDivision: RankDivision | null;
  beforeRankLabel: string;
  afterRank: ExerciseRankTier;
  afterDivision: RankDivision | null;
  afterRankLabel: string;
  rankChanged: boolean;
  startProgressPercent: number;
  finishProgressPercent: number;
  nextProgressPercent: number;
  scoreImprovementPercent: number | null;
  bestSetLabel: string;
  estimatedOneRepMax: number;
  nextRankLabel: string | null;
  nextTargetLabel: string | null;
  note: string | null;
}

interface GetWorkoutRankProgressItemsInput {
  performedExercises: RankableExercise[];
  previousWorkouts: RankableWorkout[];
  workoutsWithCompletedWorkout: RankableWorkout[];
  completedWorkoutId: string;
  fallbackBodyweightKg?: number | null;
}

const rankTierScore: Record<ExerciseRankTier, number> = {
  Unranked: -1,
  Iron: 0,
  Bronze: 1,
  Silver: 2,
  Gold: 3,
  Platinum: 4,
  Diamond: 5,
  Ascendant: 6,
  Titan: 7,
  Apex: 8,
};

const rankDivisionScore: Record<RankDivision, number> = {
  I: 0,
  II: 1,
  III: 2,
};

function clampProgress(value: number | null | undefined) {
  if (!Number.isFinite(Number(value))) return 0;
  return Math.max(0, Math.min(100, Number(value)));
}

function getRankSortScore(result: ExerciseRankResult | null | undefined) {
  if (!result || result.status !== 'ranked') return -1;
  const tierScore = rankTierScore[result.rank] ?? -1;
  const divisionScore = result.division ? rankDivisionScore[result.division] : 3;
  return tierScore * 3 + divisionScore;
}

function getRankScore(result: ExerciseRankResult | null | undefined) {
  return Number(result?.strengthRatio ?? 0);
}

function formatKg(value: number) {
  if (!Number.isFinite(value)) return '- kg';
  return `${Number.isInteger(value) ? value.toFixed(0) : value.toFixed(1)} kg`;
}

function formatBestSet(result: ExerciseRankResult) {
  const bestSet = result.bestSet;
  if (!bestSet) return '-';

  if (result.metadata?.rankLoadMode === 'bodyweight_plus_external') {
    return bestSet.loggedWeight > 0
      ? `BW + ${formatKg(bestSet.loggedWeight)} x ${bestSet.reps}`
      : `Bodyweight x ${bestSet.reps}`;
  }

  if (result.metadata?.rankLoadMode === 'per_hand') {
    return `${formatKg(bestSet.loggedWeight)}/hand x ${bestSet.reps}`;
  }

  return `${formatKg(bestSet.loggedWeight)} x ${bestSet.reps}`;
}

function getNextRankLabel(result: ExerciseRankResult) {
  if (!result.nextStandard) return null;
  return formatRankLabel(result.nextStandard.rank, result.nextStandard.division);
}

function getNextTargetLabel(result: ExerciseRankResult) {
  if (!result.nextTargetEstimatedOneRepMax) return null;
  return `${formatKg(result.nextTargetEstimatedOneRepMax)} est. 1RM`;
}

function getSetPerformanceScore(weight: unknown, reps: unknown) {
  const normalizedWeight = Number(weight);
  const normalizedReps = Number(reps);
  if (!Number.isFinite(normalizedWeight) || normalizedWeight <= 0) return null;
  if (!Number.isFinite(normalizedReps) || normalizedReps <= 0) return null;
  return normalizedWeight * (1 + normalizedReps / 30);
}

function getBestPerformanceSet(workouts: RankableWorkout[], exerciseId: string) {
  return workouts.reduce<{
    workoutId?: string;
    weight: number;
    reps: number;
    estimatedOneRepMax: number;
  } | null>((best, workout) => {
    const workoutExercise = workout.exercises.find((item) => item.exerciseId === exerciseId);
    if (!workoutExercise) return best;

    return workoutExercise.sets.reduce<typeof best>((setBest, set) => {
      if (set.completed === false) return setBest;

      const score = getSetPerformanceScore(set.weight, set.reps);
      if (!score) return setBest;

      const candidate = {
        workoutId: workout.id,
        weight: Number(set.weight),
        reps: Number(set.reps),
        estimatedOneRepMax: score,
      };

      if (!setBest || candidate.estimatedOneRepMax > setBest.estimatedOneRepMax) return candidate;
      if (
        candidate.estimatedOneRepMax === setBest.estimatedOneRepMax &&
        candidate.weight > setBest.weight
      ) {
        return candidate;
      }

      return setBest;
    }, best);
  }, null);
}

function toRankProgressItem(
  exercise: RankableExercise,
  before: ExerciseRankResult | null,
  after: ExerciseRankResult,
): WorkoutRankProgressItem | null {
  if (!after.bestSet || !after.estimatedOneRepMax) return null;

  const beforeScore = getRankScore(before);
  const afterScore = getRankScore(after);
  const rankChanged = getRankSortScore(after) > getRankSortScore(before);
  const improved = afterScore > beforeScore + 0.0001;

  if (!rankChanged && !improved) return null;

  return {
    progressKind: 'rank',
    exerciseId: exercise.id,
    exerciseName: exercise.name,
    beforeRank: before?.rank ?? 'Unranked',
    beforeDivision: before?.division ?? null,
    beforeRankLabel: before?.rankLabel ?? 'Unranked',
    afterRank: after.rank,
    afterDivision: after.division,
    afterRankLabel: after.rankLabel,
    rankChanged,
    startProgressPercent: clampProgress(before?.progressPercent),
    finishProgressPercent: rankChanged ? 100 : clampProgress(after.progressPercent),
    nextProgressPercent: clampProgress(after.progressPercent),
    scoreImprovementPercent: beforeScore > 0 ? ((afterScore - beforeScore) / beforeScore) * 100 : null,
    bestSetLabel: formatBestSet(after),
    estimatedOneRepMax: after.estimatedOneRepMax,
    nextRankLabel: getNextRankLabel(after),
    nextTargetLabel: getNextTargetLabel(after),
    note: null,
  };
}

function toPerformanceProgressItem(
  exercise: RankableExercise,
  beforeRank: ExerciseRankResult | null,
  afterRank: ExerciseRankResult | null,
  beforeBest: ReturnType<typeof getBestPerformanceSet>,
  afterBest: NonNullable<ReturnType<typeof getBestPerformanceSet>>,
): WorkoutRankProgressItem | null {
  const previousScore = beforeBest?.estimatedOneRepMax ?? 0;
  if (previousScore > 0 && afterBest.estimatedOneRepMax <= previousScore + 0.0001) return null;

  const startProgressPercent =
    previousScore > 0 ? clampProgress((previousScore / afterBest.estimatedOneRepMax) * 100) : 0;

  return {
    progressKind: 'performance',
    exerciseId: exercise.id,
    exerciseName: exercise.name,
    beforeRank: beforeRank?.rank ?? 'Unranked',
    beforeDivision: beforeRank?.division ?? null,
    beforeRankLabel: beforeRank?.rankLabel ?? 'Unranked',
    afterRank: afterRank?.rank ?? beforeRank?.rank ?? 'Unranked',
    afterDivision: afterRank?.division ?? beforeRank?.division ?? null,
    afterRankLabel: afterRank?.rankLabel ?? beforeRank?.rankLabel ?? 'Unranked',
    rankChanged: false,
    startProgressPercent,
    finishProgressPercent: 100,
    nextProgressPercent: clampProgress(afterRank?.progressPercent),
    scoreImprovementPercent:
      previousScore > 0 ? ((afterBest.estimatedOneRepMax - previousScore) / previousScore) * 100 : null,
    bestSetLabel: `${formatKg(afterBest.weight)} x ${afterBest.reps}`,
    estimatedOneRepMax: afterBest.estimatedOneRepMax,
    nextRankLabel: afterRank ? getNextRankLabel(afterRank) : null,
    nextTargetLabel: afterRank ? getNextTargetLabel(afterRank) : null,
    note:
      afterBest.reps > MAX_REPS_FOR_RANK
        ? `This is a new estimated-1RM PR, but exercise ranks only use valid ${MIN_REPS_FOR_RANK}-${MAX_REPS_FOR_RANK} rep sets. Log a heavier set in that rep range to move the rank.`
        : 'This is a new estimated-1RM PR. Your exercise rank did not change yet.',
  };
}

/**
 * Compares rank state before and after a completed workout.
 *
 * The overlay should only celebrate meaningful changes caused by the workout
 * that was just logged, so we require the new best ranked set to come from the
 * completed workout id. Older personal bests are ignored even if they remain
 * the user's highest rank result.
 */
export function getWorkoutRankProgressItems({
  performedExercises,
  previousWorkouts,
  workoutsWithCompletedWorkout,
  completedWorkoutId,
  fallbackBodyweightKg,
}: GetWorkoutRankProgressItemsInput) {
  return performedExercises
    .map((exercise) => {
      const before = getExerciseRank(exercise, previousWorkouts, fallbackBodyweightKg);
      const after = getExerciseRank(exercise, workoutsWithCompletedWorkout, fallbackBodyweightKg);

      if (!after?.eligible) return null;

      if (after.bestSet?.workoutId === completedWorkoutId) {
        const rankItem = toRankProgressItem(exercise, before, after);
        if (rankItem) return rankItem;
      }

      const beforeBestPerformance = getBestPerformanceSet(previousWorkouts, exercise.id);
      const afterBestPerformance = getBestPerformanceSet(workoutsWithCompletedWorkout, exercise.id);
      if (!afterBestPerformance || afterBestPerformance.workoutId !== completedWorkoutId) return null;
      return toPerformanceProgressItem(exercise, before, after, beforeBestPerformance, afterBestPerformance);
    })
    .filter((item): item is WorkoutRankProgressItem => Boolean(item))
    .sort((a, b) => {
      if (a.rankChanged !== b.rankChanged) return a.rankChanged ? -1 : 1;
      if (a.progressKind !== b.progressKind) return a.progressKind === 'rank' ? -1 : 1;
      return (b.scoreImprovementPercent ?? 0) - (a.scoreImprovementPercent ?? 0);
    });
}
