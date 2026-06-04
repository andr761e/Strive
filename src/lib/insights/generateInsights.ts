import { aggregateMuscleVolume } from './muscleVolume';
import { calculateExerciseTrends, isValidTrainingSet } from './performance';
import {
  createExerciseOrderInsights,
  createExerciseRoiInsights,
  createHighVolumeInsights,
  createMovementGapInsights,
  createPlateauInsights,
  createPrOpportunityInsights,
  createProgressionInsights,
  createProgressionRecommendationInsights,
  createPushPullBalanceInsights,
  createRecoveryFatigueInsights,
  createRirWarningInsights,
  createRoutineAdjustmentInsights,
  createRotationInsights,
  createConsistencyInsights,
  createSessionQualityInsights,
  createUndertrainedMuscleInsights,
  createWarmupReadinessInsights,
} from './insightRules';
import type { InsightAnalysisResult, InsightPriority, InsightRoutine, InsightWorkout, TrainingInsight } from './types';

const DEFAULT_MAX_INSIGHTS = 8;
const MAX_POSITIVE_INSIGHTS = 2;

const priorityRank: Record<InsightPriority, number> = {
  critical: 4,
  important: 3,
  suggestion: 2,
  positive: 1,
};

function validSetCount(workouts: InsightWorkout[]) {
  return workouts.reduce(
    (workoutTotal, workout) =>
      workoutTotal +
      workout.exercises.reduce(
        (exerciseTotal, exercise) => exerciseTotal + exercise.sets.filter((set) => isValidTrainingSet(set, true)).length,
        0,
      ),
    0,
  );
}

function getInsightKey(insight: TrainingInsight) {
  // Muscle-volume insights should compete by muscle group, not by the weakest related exercise.
  // Otherwise a biceps volume warning could be hidden by a curl plateau even though they are
  // different coaching signals.
  if (insight.type === 'high_volume' || insight.type === 'undertrained_muscle') {
    return `muscle:${insight.relatedMuscleGroup ?? insight.type}`;
  }
  if (insight.type === 'routine_adjustment') {
    return `routine:${insight.relatedRoutineId ?? 'none'}:${insight.relatedMuscleGroup ?? insight.relatedExercise ?? insight.id}`;
  }
  if (insight.relatedRoutineId && insight.routineSuggestion) {
    return `routine:${insight.relatedRoutineId}:${insight.routineSuggestion.kind}:${insight.relatedMuscleGroup ?? insight.relatedExercise ?? insight.id}`;
  }
  if (insight.relatedExercise) return `exercise:${insight.relatedExercise}`;
  if (insight.relatedMuscleGroup) return `muscle:${insight.relatedMuscleGroup}`;
  return insight.type;
}

function rankInsights(insights: TrainingInsight[], maxInsights: number) {
  const sorted = [...insights].sort((a, b) => {
    const priorityDiff = priorityRank[b.priority] - priorityRank[a.priority];
    if (priorityDiff !== 0) return priorityDiff;
    const confidenceDiff = b.confidence - a.confidence;
    if (confidenceDiff !== 0) return confidenceDiff;
    return b.relevanceScore - a.relevanceScore;
  });

  const result: TrainingInsight[] = [];
  const keyCounts = new Map<string, number>();
  let positiveCount = 0;

  sorted.forEach((insight) => {
    if (result.length >= maxInsights) return;
    if (insight.priority === 'positive' && positiveCount >= MAX_POSITIVE_INSIGHTS) return;

    const key = getInsightKey(insight);
    const count = keyCounts.get(key) ?? 0;
    const isUsefulFollowUp =
      insight.type === 'exercise_rotation' &&
      count === 1 &&
      insight.confidence >= 70 &&
      result.some((item) => item.relatedExercise === insight.relatedExercise && item.type === 'plateau');

    if (count > 0 && !isUsefulFollowUp) return;

    result.push(insight);
    keyCounts.set(key, count + 1);
    if (insight.priority === 'positive') {
      positiveCount += 1;
    }
  });

  return result;
}

export function generateInsights({
  userId,
  workouts,
  routines = [],
  maxInsights = DEFAULT_MAX_INSIGHTS,
}: {
  userId: string;
  workouts: InsightWorkout[];
  routines?: InsightRoutine[];
  maxInsights?: number;
}): InsightAnalysisResult {
  const generatedAt = new Date().toISOString();
  const trends = calculateExerciseTrends(workouts);
  const latestWorkoutDate = workouts.reduce<Date | null>((latest, workout) => {
    const date = new Date(`${workout.date}T00:00:00`);
    if (!latest || date > latest) return date;
    return latest;
  }, null);
  const volume = aggregateMuscleVolume(workouts, latestWorkoutDate ?? new Date());

  // The first version is intentionally rule-based: each rule produces explainable candidates,
  // then a small ranking pass chooses the most actionable set for the user.
  const candidates = [
    ...createPlateauInsights(userId, trends, volume),
    ...createHighVolumeInsights(userId, trends, volume),
    ...createRecoveryFatigueInsights(userId, trends, volume, routines),
    ...createUndertrainedMuscleInsights(userId, volume),
    ...createRoutineAdjustmentInsights(userId, volume, routines),
    ...createPushPullBalanceInsights(userId, volume, routines),
    ...createMovementGapInsights(userId, workouts, routines),
    ...createRirWarningInsights(userId, workouts, routines),
    ...createExerciseOrderInsights(userId, workouts),
    ...createRotationInsights(userId, trends),
    ...createProgressionRecommendationInsights(userId, trends),
    ...createExerciseRoiInsights(userId, trends),
    ...createPrOpportunityInsights(userId, trends),
    ...createConsistencyInsights(userId, workouts, volume, routines),
    ...createSessionQualityInsights(userId, workouts),
    ...createWarmupReadinessInsights(userId, workouts),
    ...createProgressionInsights(userId, trends),
  ];

  const uniqueExercises = new Set(
    workouts.flatMap((workout) => workout.exercises.map((exercise) => exercise.exerciseId)),
  );

  return {
    insights: rankInsights(candidates, maxInsights),
    generatedAt,
    stats: {
      workoutsAnalyzed: workouts.length,
      exercisesAnalyzed: uniqueExercises.size,
      musclesAnalyzed: volume.summaries.length,
      candidateInsights: candidates.length,
      hasEnoughData: workouts.length >= 2 && validSetCount(workouts) >= 4,
    },
  };
}
