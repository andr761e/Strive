import { getRankMetadataByExercise, getRankStandards } from './rankStandards';
import type {
  ExerciseRankResult,
  ExerciseRankStandard,
  NextRankProgress,
  RankableExercise,
  RankableSet,
  RankableWorkout,
  RankedSet,
} from './rankTypes';

export const MIN_REPS_FOR_RANK = 1;
export const MAX_REPS_FOR_RANK = 15;

export function isRankEligibleExercise(exercise: RankableExercise | null | undefined) {
  return Boolean(getExerciseRankMetadata(exercise)?.rankEligible);
}

export function getExerciseRankMetadata(exercise: RankableExercise | null | undefined) {
  return getRankMetadataByExercise(exercise);
}

export function calculateEstimatedOneRepMax(load: number, reps: number) {
  return load * (1 + reps / 30);
}

export function getStrengthRatio(estimatedOneRepMax: number, bodyweight: number | null | undefined) {
  return bodyweight && bodyweight > 0 ? estimatedOneRepMax / bodyweight : null;
}

export function getExerciseLoad(
  set: RankableSet,
  exercise: RankableExercise,
  userBodyweight?: number | null,
) {
  const metadata = getExerciseRankMetadata(exercise);
  if (!metadata) return null;

  const loggedWeight = Number(set.weight ?? 0);

  if (metadata.rankLoadMode === 'per_hand') {
    return loggedWeight > 0 ? loggedWeight * 2 : null;
  }

  if (metadata.rankLoadMode === 'bodyweight_plus_external') {
    if (!userBodyweight || userBodyweight <= 0) return null;
    return userBodyweight + Math.max(0, loggedWeight);
  }

  return loggedWeight > 0 ? loggedWeight : null;
}

export function getEstimatedOneRepMax(
  set: RankableSet,
  exercise: RankableExercise,
  userBodyweight?: number | null,
) {
  const reps = Number(set.reps ?? 0);
  const load = getExerciseLoad(set, exercise, userBodyweight);

  if (!load || load <= 0 || reps < MIN_REPS_FOR_RANK || reps > MAX_REPS_FOR_RANK) return null;

  return calculateEstimatedOneRepMax(load, reps);
}

export function getBestRankedSet(
  sets: RankableSet[],
  exercise: RankableExercise,
  userBodyweight?: number | null,
  context?: Pick<RankedSet, 'date' | 'workoutId' | 'workoutName'>,
) {
  return sets.reduce<RankedSet | null>((best, set) => {
    if (set.completed === false) return best;

    const reps = Number(set.reps ?? 0);
    const load = getExerciseLoad(set, exercise, userBodyweight);
    if (!load || load <= 0 || reps < MIN_REPS_FOR_RANK || reps > MAX_REPS_FOR_RANK) return best;

    const estimatedOneRepMax = calculateEstimatedOneRepMax(load, reps);
    const strengthRatio = getStrengthRatio(estimatedOneRepMax, userBodyweight);
    const candidate: RankedSet = {
      workoutId: context?.workoutId,
      workoutName: context?.workoutName,
      date: context?.date ?? '',
      setNumber: set.setNumber,
      loggedWeight: Number(set.weight ?? 0),
      reps,
      load,
      estimatedOneRepMax,
      strengthRatio: strengthRatio ?? undefined,
      bodyweight: userBodyweight && userBodyweight > 0 ? userBodyweight : undefined,
    };

    if (!best) return candidate;
    if (candidate.estimatedOneRepMax > best.estimatedOneRepMax) return candidate;
    if (
      candidate.estimatedOneRepMax === best.estimatedOneRepMax &&
      candidate.loggedWeight > best.loggedWeight
    ) {
      return candidate;
    }
    return best;
  }, null);
}

export function getNextRankProgress(currentScore: number, standards: ExerciseRankStandard[]): NextRankProgress {
  const nextIndex = standards.findIndex((standard) => currentScore < standard.minRatio);

  if (nextIndex < 0) {
    return {
      nextStandard: null,
      previousStandard: standards[standards.length - 1] ?? null,
      progressPercent: 100,
    };
  }

  const nextStandard = standards[nextIndex];
  const previousStandard = standards[nextIndex - 1] ?? null;
  const previousScore = previousStandard?.minRatio ?? 0;
  const range = Math.max(0.01, nextStandard.minRatio - previousScore);
  const progressPercent = Math.max(0, Math.min(99, ((currentScore - previousScore) / range) * 100));

  return {
    nextStandard,
    previousStandard,
    progressPercent,
  };
}

export function formatRankLabel(
  rank: ExerciseRankResult['rank'],
  division: ExerciseRankResult['division'],
) {
  if (rank === 'Unranked' || rank === 'Apex') return rank;
  return division ? `${rank} ${division}` : rank;
}

function findRankForRatio(ratio: number, standards: ExerciseRankStandard[]) {
  const current = standards.reduce<ExerciseRankStandard | null>((best, standard) => {
    if (ratio < standard.minRatio) return best;
    return standard;
  }, null);

  return current;
}

function getWorkoutBodyweight(workout: RankableWorkout, fallbackBodyweight?: number | null) {
  const workoutBodyweight = Number(workout.bodyweightKg ?? 0);
  if (Number.isFinite(workoutBodyweight) && workoutBodyweight > 0) return workoutBodyweight;

  const fallback = Number(fallbackBodyweight ?? 0);
  return Number.isFinite(fallback) && fallback > 0 ? fallback : null;
}

function getRankComparisonScore(set: RankedSet) {
  return set.strengthRatio ?? 0;
}

function isBetterRankedSet(candidate: RankedSet, best: RankedSet | null) {
  if (!best) return true;

  const candidateScore = getRankComparisonScore(candidate);
  const bestScore = getRankComparisonScore(best);
  if (candidateScore > bestScore) return true;
  if (candidateScore < bestScore) return false;

  if (candidate.estimatedOneRepMax > best.estimatedOneRepMax) return true;
  if (candidate.estimatedOneRepMax < best.estimatedOneRepMax) return false;

  return candidate.loggedWeight > best.loggedWeight;
}

function getNoRankResult(
  exercise: RankableExercise,
  status: ExerciseRankResult['status'],
  message: string,
  bestSet?: RankedSet,
): ExerciseRankResult {
  return {
    exerciseId: exercise.id,
    exerciseName: exercise.name,
    eligible: status !== 'not_eligible',
    status,
    rank: 'Unranked',
    division: null,
    rankLabel: 'Unranked',
    bestSet,
    estimatedOneRepMax: bestSet?.estimatedOneRepMax,
    strengthRatio: bestSet?.strengthRatio,
    message,
  };
}

export function getExerciseRank(
  exercise: RankableExercise | null | undefined,
  workouts: RankableWorkout[],
  userBodyweight?: number | null,
): ExerciseRankResult | null {
  if (!exercise) return null;

  const metadata = getExerciseRankMetadata(exercise);
  if (!metadata) {
    return getNoRankResult(exercise, 'not_eligible', 'Ranks are not available for this exercise yet.');
  }

  const standards = getRankStandards(metadata.rankKey);
  if (!standards) {
    return {
      ...getNoRankResult(exercise, 'missing_standards', 'Rank standards have not been configured for this exercise yet.'),
      metadata,
    };
  }

  const hasAnyBodyweight = workouts.some((workout) => getWorkoutBodyweight(workout, userBodyweight));
  if (metadata.rankLoadMode === 'bodyweight_plus_external' && !hasAnyBodyweight) {
    return {
      ...getNoRankResult(exercise, 'missing_bodyweight', 'Add bodyweight to unlock strength ranks.'),
      metadata,
    };
  }

  const bestSet = workouts.reduce<RankedSet | null>((best, workout) => {
    const workoutExercise = workout.exercises.find((item) => item.exerciseId === exercise.id);
    if (!workoutExercise) return best;

    const workoutBodyweight = getWorkoutBodyweight(workout, userBodyweight);
    const workoutBest = getBestRankedSet(workoutExercise.sets, exercise, workoutBodyweight, {
      workoutId: workout.id,
      workoutName: workout.workoutName,
      date: workout.date,
    });

    if (!workoutBest) return best;
    return isBetterRankedSet(workoutBest, best) ? workoutBest : best;
  }, null);

  if (!bestSet) {
    return {
      ...getNoRankResult(
        exercise,
        'no_valid_sets',
        `Log a set between ${MIN_REPS_FOR_RANK} and ${MAX_REPS_FOR_RANK} reps to receive a rank.`,
      ),
      metadata,
    };
  }

  if (!bestSet.bodyweight) {
    return {
      ...getNoRankResult(exercise, 'missing_bodyweight', 'Add bodyweight to unlock strength ranks.', bestSet),
      metadata,
    };
  }

  const strengthRatio = bestSet.estimatedOneRepMax / bestSet.bodyweight;
  const currentRank = findRankForRatio(strengthRatio, standards);
  const nextProgress = getNextRankProgress(strengthRatio, standards);
  const rank = currentRank?.rank ?? 'Unranked';
  const division = currentRank?.division ?? null;
  const nextTargetStrengthRatio = nextProgress.nextStandard?.minRatio;

  return {
    exerciseId: exercise.id,
    exerciseName: exercise.name,
    eligible: true,
    status: currentRank ? 'ranked' : 'unranked',
    metadata,
    rank,
    division,
    rankLabel: formatRankLabel(rank, division),
    bestSet: {
      ...bestSet,
      strengthRatio,
      bodyweight: bestSet.bodyweight,
    },
    estimatedOneRepMax: bestSet.estimatedOneRepMax,
    strengthRatio,
    progressPercent: nextProgress.progressPercent,
    nextStandard: nextProgress.nextStandard,
    nextTargetStrengthRatio,
    nextTargetEstimatedOneRepMax: nextTargetStrengthRatio
      ? nextTargetStrengthRatio * bestSet.bodyweight
      : undefined,
    message: currentRank
      ? `Ranked from your best valid ${MIN_REPS_FOR_RANK}-${MAX_REPS_FOR_RANK} rep set, adjusted against the bodyweight logged with that workout.`
      : 'Your best set is logged, but it has not reached Iron I yet.',
  };
}
