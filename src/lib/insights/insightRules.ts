import { commonInsightMuscles, getExerciseMetadata } from './exerciseMetadata';
import { averagePerformance, collectExercisePerformances, estimateOneRepMax, isValidTrainingSet } from './performance';
import type {
  ExerciseTrend,
  InsightPriority,
  InsightRoutine,
  InsightWorkout,
  MuscleVolumeAnalysis,
  MuscleVolumeSummary,
  RoutineEditSuggestion,
  TrainingInsight,
} from './types';

const UNDERTRAINED_WEEKLY_SETS = 6;
const VERY_LOW_WEEKLY_SETS = 3;
const HIGH_VOLUME_WEEKLY_SETS = 20;
const RELATIVE_LOW_RATIO = 0.55;
const RELATIVE_VERY_LOW_RATIO = 0.35;
const RELATIVE_HIGH_RATIO = 1.6;
const RELATIVE_HIGH_MIN_SETS = 10;
const PLATEAU_LIMIT = 1.01;
const PROGRESSION_MIN_CHANGE = 0.04;
const ORDER_EFFECT_MIN_CHANGE = 0.05;
const FAILURE_SET_RATIO = 0.35;
const PR_OPPORTUNITY_RANGE = 0.025;

const priorityRelevance: Record<InsightPriority, number> = {
  critical: 4,
  important: 3,
  suggestion: 2,
  positive: 1,
};

function titleCase(value: string) {
  return value.slice(0, 1).toUpperCase() + value.slice(1);
}

function percent(value: number) {
  return Math.abs(value * 100).toFixed(1);
}

function insightId(type: string, key: string) {
  return `${type}-${key.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
}

function confidenceFromPoints(points: number) {
  return Math.min(95, Math.max(50, 50 + points * 5));
}

function makeInsight(input: Omit<TrainingInsight, 'createdAt' | 'id' | 'relevanceScore'> & { idKey: string }): TrainingInsight {
  return {
    ...input,
    id: insightId(input.type, input.idKey),
    createdAt: new Date().toISOString(),
    relevanceScore: priorityRelevance[input.priority] * 100 + input.confidence,
  };
}

function isPlateauTrend(trend: ExerciseTrend) {
  // Plateau rule: enough sessions, recent rolling average not meaningfully above the previous block,
  // and the latest scores are tightly clustered. This keeps the model explainable and conservative.
  return (
    trend.sessionCount >= 4 &&
    trend.previousAvg > 0 &&
    trend.recentAvg <= trend.previousAvg * PLATEAU_LIMIT &&
    trend.trendPct <= 0.01 &&
    trend.isFlat
  );
}

function relatedTrendsForMuscle(muscle: string, trends: ExerciseTrend[]) {
  return trends.filter((trend) => {
    const metadata = getExerciseMetadata(trend.exerciseId, trend.exerciseName);
    return metadata.primaryMuscles.includes(muscle) || metadata.secondaryMuscles.includes(muscle);
  });
}

function average(values: number[]) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function median(values: number[]) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

function getVolumeContext(volume: MuscleVolumeAnalysis) {
  const summaries = volume.summaries.filter((summary) => commonInsightMuscles.includes(summary.muscle));
  const activeValues = summaries.map((summary) => summary.last28WeeklySets).filter((value) => value > 0);

  return {
    summaries,
    averageWeeklySets: Number(average(activeValues).toFixed(1)),
    medianWeeklySets: Number(median(activeValues).toFixed(1)),
  };
}

function getRelativeReference(volume: MuscleVolumeAnalysis) {
  const context = getVolumeContext(volume);
  return Math.max(context.averageWeeklySets, context.medianWeeklySets);
}

function isUndertrainedVolume(summary: MuscleVolumeSummary, volume: MuscleVolumeAnalysis) {
  const reference = getRelativeReference(volume);
  return (
    summary.last28WeeklySets < UNDERTRAINED_WEEKLY_SETS ||
    (reference >= UNDERTRAINED_WEEKLY_SETS && summary.last28WeeklySets < reference * RELATIVE_LOW_RATIO)
  );
}

function isVeryUndertrainedVolume(summary: MuscleVolumeSummary, volume: MuscleVolumeAnalysis) {
  const reference = getRelativeReference(volume);
  return (
    summary.last28WeeklySets < VERY_LOW_WEEKLY_SETS ||
    (reference >= UNDERTRAINED_WEEKLY_SETS && summary.last28WeeklySets < reference * RELATIVE_VERY_LOW_RATIO)
  );
}

function isHighVolume(summary: MuscleVolumeSummary, volume: MuscleVolumeAnalysis) {
  const reference = getRelativeReference(volume);
  return (
    summary.last28WeeklySets > HIGH_VOLUME_WEEKLY_SETS ||
    (reference >= UNDERTRAINED_WEEKLY_SETS &&
      summary.last28WeeklySets >= RELATIVE_HIGH_MIN_SETS &&
      summary.last28WeeklySets > reference * RELATIVE_HIGH_RATIO)
  );
}

function relativeVolumePhrase(summary: MuscleVolumeSummary, volume: MuscleVolumeAnalysis) {
  const reference = getRelativeReference(volume);
  if (reference <= 0) return '';
  return ` Your average active muscle group is around ${reference.toFixed(1)} sets/week, so this is ${
    summary.last28WeeklySets < reference ? 'low' : 'high'
  } relative to the rest of your program.`;
}

const addExerciseByMuscle: Record<string, { exerciseId: string; exerciseName: string }> = {
  Chest: { exerciseId: '40', exerciseName: 'Pec Deck' },
  Back: { exerciseId: '52', exerciseName: 'Seated Cable Row' },
  Delts: { exerciseId: '142', exerciseName: 'Cable Lateral Raise' },
  Biceps: { exerciseId: '70', exerciseName: 'Cable Curl' },
  Triceps: { exerciseId: '81', exerciseName: 'Rope Pushdown' },
  Quads: { exerciseId: '15', exerciseName: 'Leg Extension' },
  Hamstrings: { exerciseId: '17', exerciseName: 'Seated Leg Curl' },
  Glutes: { exerciseId: '30', exerciseName: 'Hip Thrust' },
  Calves: { exerciseId: '156', exerciseName: 'Standing Calf Raise' },
  Forearms: { exerciseId: '178', exerciseName: "Farmer's Walk" },
  Core: { exerciseId: '243', exerciseName: 'Pallof Press' },
};

function routineExercises(routine: InsightRoutine) {
  if (routine.exerciseLogs?.length) return routine.exerciseLogs;
  return routine.exercises.map((exercise) => ({
    exerciseId: exercise.id,
    exerciseName: exercise.name,
    mainMuscles: exercise.mainMuscles,
    sets: [],
  }));
}

function exerciseMatchesMuscle(exercise: { exerciseId: string; exerciseName: string; mainMuscles: string[] }, muscle: string) {
  const metadata = getExerciseMetadata(exercise.exerciseId, exercise.exerciseName, exercise.mainMuscles);
  return (
    exercise.mainMuscles.includes(muscle) ||
    metadata.primaryMuscles.includes(muscle) ||
    metadata.secondaryMuscles.includes(muscle)
  );
}

function routineMuscleScore(routine: InsightRoutine, muscle: string) {
  return routineExercises(routine).reduce((score, exercise) => {
    if (!exerciseMatchesMuscle(exercise, muscle)) return score;
    const workingSets = exercise.sets?.filter((set) => set.type !== 'warmup').length;
    return score + Math.max(workingSets ?? 0, 2);
  }, 0);
}

function preferredRoutineTermsForMuscle(muscle: string) {
  if (['Chest', 'Triceps', 'Delts'].includes(muscle)) return ['push', 'upper', 'full'];
  if (['Back', 'Biceps', 'Forearms'].includes(muscle)) return ['pull', 'upper', 'full'];
  if (['Quads', 'Hamstrings', 'Glutes', 'Calves', 'Core'].includes(muscle)) return ['legs', 'lower', 'full'];
  return ['full'];
}

function findRoutineForMuscle(routines: InsightRoutine[], muscle: string, mode: 'add' | 'reduce') {
  if (!routines.length) return null;

  const preferredTerms = preferredRoutineTermsForMuscle(muscle);
  const scored = routines.map((routine) => {
    const name = routine.name.toLowerCase();
    const nameScore = preferredTerms.some((term) => name.includes(term)) ? 10 : 0;
    const muscleScore = routineMuscleScore(routine, muscle);
    return { routine, score: nameScore + (mode === 'add' ? -muscleScore : muscleScore) };
  });

  return scored.sort((a, b) => b.score - a.score)[0]?.routine ?? routines[0];
}

function findRoutineExerciseForMuscle(routine: InsightRoutine | null, muscle: string) {
  if (!routine) return null;
  const matches = routineExercises(routine).filter((exercise) => exerciseMatchesMuscle(exercise, muscle));
  if (!matches.length) return null;

  return (
    matches.find((exercise) =>
      /curl|pushdown|extension|raise|fly|pec deck|leg extension|leg curl|calf|tibialis|wrist/i.test(exercise.exerciseName),
    ) ?? matches[matches.length - 1]
  );
}

function routineSuggestionFields(routine: InsightRoutine | null, suggestion?: RoutineEditSuggestion) {
  if (!routine || !suggestion) return {};
  return {
    relatedRoutineId: routine.id,
    relatedRoutineName: routine.name,
    routineSuggestion: suggestion,
  };
}

function workoutDate(workout: InsightWorkout) {
  return new Date(`${workout.date}T00:00:00`);
}

function latestWorkoutDate(workouts: InsightWorkout[]) {
  return workouts.reduce<Date | null>((latest, workout) => {
    const date = workoutDate(workout);
    return !latest || date > latest ? date : latest;
  }, null);
}

function daysBetweenDates(from: Date, to: Date) {
  const start = new Date(from);
  start.setHours(0, 0, 0, 0);
  const end = new Date(to);
  end.setHours(0, 0, 0, 0);
  return Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
}

function recentWorkouts(workouts: InsightWorkout[], days: number) {
  const latest = latestWorkoutDate(workouts);
  if (!latest) return [];
  return workouts.filter((workout) => daysBetweenDates(workoutDate(workout), latest) >= 0 && daysBetweenDates(workoutDate(workout), latest) < days);
}

function inferMovementPattern(exerciseName: string) {
  const name = exerciseName.toLowerCase();
  if (name.includes('bench') || name.includes('chest press') || name.includes('push-up') || name.includes('dip')) return 'horizontal press';
  if (name.includes('shoulder press') || name.includes('overhead press') || name.includes('arnold press')) return 'vertical press';
  if (name.includes('pull-up') || name.includes('chin-up') || name.includes('pulldown')) return 'vertical pull';
  if (name.includes('row') || name.includes('face pull') || name.includes('reverse pec deck')) return 'horizontal pull';
  if (name.includes('romanian') || name.includes('deadlift') || name.includes('good morning') || name.includes('back extension')) return 'hinge';
  if (name.includes('split squat') || name.includes('lunge') || name.includes('step-up')) return 'single-leg';
  if (name.includes('squat') || name.includes('leg press')) return 'squat';
  if (name.includes('pallof') || name.includes('plank') || name.includes('dead bug') || name.includes('hollow')) return 'core';
  if (name.includes('carry') || name.includes("farmer's walk")) return 'carry';
  return 'accessory';
}

function hardSetCount(workout: InsightWorkout) {
  return workout.exercises.reduce(
    (sum, exercise) => sum + exercise.sets.filter((set) => isValidTrainingSet(set)).length,
    0,
  );
}

function workoutVolume(workout: InsightWorkout) {
  return workout.exercises.reduce(
    (sum, exercise) =>
      sum + exercise.sets.filter((set) => isValidTrainingSet(set)).reduce((setSum, set) => setSum + set.weight * set.reps, 0),
    0,
  );
}

export function createPlateauInsights(userId: string, trends: ExerciseTrend[], volume: MuscleVolumeAnalysis) {
  return trends.filter(isPlateauTrend).map((trend) => {
    const metadata = getExerciseMetadata(trend.exerciseId, trend.exerciseName);
    const hasHighMuscleVolume = metadata.primaryMuscles.some((muscle) => {
      const summary = volume.summaries.find((item) => item.muscle === muscle);
      return summary ? summary.last28WeeklySets > HIGH_VOLUME_WEEKLY_SETS : false;
    });
    const priority: InsightPriority = hasHighMuscleVolume || trend.trendPct < -0.02 ? 'critical' : 'important';

    return makeInsight({
      idKey: trend.exerciseId,
      userId,
      type: 'plateau',
      title: `${trend.exerciseName} performance has plateaued`,
      message: `Your recent ${trend.exerciseName} performance has not improved meaningfully over the last ${Math.min(
        trend.sessionCount,
        4,
      )} logged sessions. Consider checking recovery, volume, or progression targets.`,
      priority,
      confidence: trend.confidence,
      relatedExercise: trend.exerciseName,
      actionLabel: 'Review exercise',
    });
  });
}

export function createProgressionInsights(userId: string, trends: ExerciseTrend[]) {
  return trends
    .filter((trend) => trend.sessionCount >= 4 && trend.previousAvg > 0 && trend.trendPct >= PROGRESSION_MIN_CHANGE)
    .map((trend) =>
      makeInsight({
        idKey: trend.exerciseId,
        userId,
        type: 'progression',
        title: `${trend.exerciseName} is progressing well`,
        message: `Your recent ${trend.exerciseName} performance is up approximately ${percent(
          trend.trendPct,
        )}% compared with the previous sessions. The current structure appears to be working.`,
        priority: 'positive',
        confidence: trend.confidence,
        relatedExercise: trend.exerciseName,
        actionLabel: 'Keep structure',
      }),
    );
}

export function createUndertrainedMuscleInsights(userId: string, volume: MuscleVolumeAnalysis) {
  if (volume.recentWorkoutCount < 2) return [];

  return volume.summaries
    .filter((summary) => commonInsightMuscles.includes(summary.muscle))
    .filter((summary) => isUndertrainedVolume(summary, volume))
    .map((summary) =>
      makeInsight({
        idKey: summary.muscle,
        userId,
        type: 'undertrained_muscle',
        title: `${titleCase(summary.muscle)} may be undertrained`,
        message: `You have logged approximately ${summary.last28WeeklySets.toFixed(1)} weighted hard sets per week for ${
          summary.muscle
        } recently.${relativeVolumePhrase(
          summary,
          volume,
        )} Consider adding direct work if this muscle group matters for your goals.`,
        priority: isVeryUndertrainedVolume(summary, volume) ? 'important' : 'suggestion',
        confidence: confidenceFromPoints(volume.recentWorkoutCount),
        relatedMuscleGroup: summary.muscle,
        actionLabel: 'Adjust plan',
      }),
    );
}

export function createHighVolumeInsights(userId: string, trends: ExerciseTrend[], volume: MuscleVolumeAnalysis) {
  return volume.summaries
    .filter((summary) => isHighVolume(summary, volume))
    .map((summary) => {
      const related = relatedTrendsForMuscle(summary.muscle, trends).filter((trend) => trend.sessionCount >= 4);
      const weakestTrend = related.sort((a, b) => a.trendPct - b.trendPct)[0];

      if (!weakestTrend || weakestTrend.trendPct > 0.01) return null;

      return makeInsight({
        idKey: summary.muscle,
        userId,
        type: 'high_volume',
        title: `${titleCase(summary.muscle)} volume may be too high`,
        message: `You are logging about ${summary.last28WeeklySets.toFixed(1)} weighted hard sets per week for ${
          summary.muscle
        }, but related performance is not improving.${relativeVolumePhrase(
          summary,
          volume,
        )} Consider reducing volume or improving recovery.`,
        priority: weakestTrend.trendPct < 0 ? 'critical' : 'important',
        confidence: Math.min(95, Math.max(weakestTrend.confidence, confidenceFromPoints(related.length + 4))),
        relatedMuscleGroup: summary.muscle,
        relatedExercise: weakestTrend.exerciseName,
        actionLabel: 'Review recovery',
      });
    })
    .filter((insight): insight is TrainingInsight => Boolean(insight));
}

export function createExerciseOrderInsights(userId: string, workouts: InsightWorkout[]) {
  const grouped = new Map<string, ReturnType<typeof collectExercisePerformances>>();

  collectExercisePerformances(workouts).forEach((session) => {
    const existing = grouped.get(session.exerciseId) ?? [];
    existing.push(session);
    grouped.set(session.exerciseId, existing);
  });

  return Array.from(grouped.values())
    .map((sessions) => {
      const early = sessions.filter((session) => session.exerciseOrder <= 2);
      const late = sessions.filter((session) => session.exerciseOrder >= 4);
      if (early.length < 2 || late.length < 2) return null;

      const earlyAvg = averagePerformance(early);
      const lateAvg = averagePerformance(late);
      if (lateAvg <= 0 || earlyAvg <= lateAvg * (1 + ORDER_EFFECT_MIN_CHANGE)) return null;

      const effect = (earlyAvg - lateAvg) / lateAvg;
      const exerciseName = sessions[0].exerciseName;

      return makeInsight({
        idKey: sessions[0].exerciseId,
        userId,
        type: 'exercise_order',
        title: `Move ${exerciseName} earlier in your workout`,
        message: `You tend to perform about ${percent(effect)}% better on ${exerciseName} when it appears in the first two exercises of a session.`,
        priority: effect >= 0.1 ? 'important' : 'suggestion',
        confidence: confidenceFromPoints(early.length + late.length),
        relatedExercise: exerciseName,
        actionLabel: 'Reorder workout',
      });
    })
    .filter((insight): insight is TrainingInsight => Boolean(insight));
}

export function createRotationInsights(userId: string, trends: ExerciseTrend[]) {
  return trends
    .filter(isPlateauTrend)
    .map((trend) => {
      const metadata = getExerciseMetadata(trend.exerciseId, trend.exerciseName);
      if (!metadata.substitutions.length) return null;

      return makeInsight({
        idKey: trend.exerciseId,
        userId,
        type: 'exercise_rotation',
        title: `Consider rotating ${trend.exerciseName}`,
        message: `Your performance has been flat for several sessions. A similar movement such as ${metadata.substitutions
          .slice(0, 2)
          .join(' or ')} may help manage fatigue or provide a new stimulus.`,
        priority: 'suggestion',
        confidence: Math.max(50, trend.confidence - 10),
        relatedExercise: trend.exerciseName,
        actionLabel: 'Find alternative',
      });
    })
    .filter((insight): insight is TrainingInsight => Boolean(insight));
}

export function createRoutineAdjustmentInsights(
  userId: string,
  volume: MuscleVolumeAnalysis,
  routines: InsightRoutine[] = [],
) {
  if (!routines.length || volume.recentWorkoutCount < 2) return [];

  const volumeCandidates = volume.summaries
    .filter((summary) => commonInsightMuscles.includes(summary.muscle))
    .filter((summary) => isUndertrainedVolume(summary, volume) || isHighVolume(summary, volume))
    .sort((a, b) => {
      const reference = Math.max(getRelativeReference(volume), UNDERTRAINED_WEEKLY_SETS);
      const aSeverity = isHighVolume(a, volume)
        ? a.last28WeeklySets / reference
        : (reference - a.last28WeeklySets) / reference;
      const bSeverity = isHighVolume(b, volume)
        ? b.last28WeeklySets / reference
        : (reference - b.last28WeeklySets) / reference;
      return bSeverity - aSeverity;
    })
    .slice(0, 4);

  return volumeCandidates
    .map((summary) => {
      const high = isHighVolume(summary, volume);
      const routine = findRoutineForMuscle(routines, summary.muscle, high ? 'reduce' : 'add');
      if (!routine) return null;

      if (high) {
        const exercise = findRoutineExerciseForMuscle(routine, summary.muscle);
        if (!exercise) return null;

        const suggestion: RoutineEditSuggestion = {
          kind: 'remove_exercise',
          reason: `${summary.muscle} is high compared with the rest of your current effective-set distribution.`,
          muscleGroup: summary.muscle,
          exerciseId: exercise.exerciseId,
          exerciseName: exercise.exerciseName,
        };

        return makeInsight({
          idKey: `${summary.muscle}-${routine.id}-reduce`,
          userId,
          type: 'routine_adjustment',
          title: `Review ${summary.muscle.toLowerCase()} work in ${routine.name}`,
          message: `${routine.name} is a sensible place to reduce ${summary.muscle.toLowerCase()} volume. Consider removing ${exercise.exerciseName} or replacing it with work for a lagging muscle group.`,
          priority: summary.last28WeeklySets > HIGH_VOLUME_WEEKLY_SETS ? 'important' : 'suggestion',
          confidence: confidenceFromPoints(volume.recentWorkoutCount + 2),
          relatedMuscleGroup: summary.muscle,
          relatedExercise: exercise.exerciseName,
          ...routineSuggestionFields(routine, suggestion),
          actionLabel: 'Edit routine',
        });
      }

      const recommendation = addExerciseByMuscle[summary.muscle];
      if (!recommendation) return null;

      const suggestion: RoutineEditSuggestion = {
        kind: 'add_exercise',
        reason: `${summary.muscle} is low compared with your other trained muscle groups.`,
        muscleGroup: summary.muscle,
        exerciseId: recommendation.exerciseId,
        exerciseName: recommendation.exerciseName,
        targetSets: 3,
      };

      return makeInsight({
        idKey: `${summary.muscle}-${routine.id}-add`,
        userId,
        type: 'routine_adjustment',
        title: `Add ${summary.muscle.toLowerCase()} work to ${routine.name}`,
        message: `${routine.name} is a good place to add a small ${summary.muscle.toLowerCase()} block. ${recommendation.exerciseName} for 2-3 controlled sets would bring the routine closer to your overall volume balance.`,
        priority: isVeryUndertrainedVolume(summary, volume) ? 'important' : 'suggestion',
        confidence: confidenceFromPoints(volume.recentWorkoutCount + 2),
        relatedMuscleGroup: summary.muscle,
        relatedExercise: recommendation.exerciseName,
        ...routineSuggestionFields(routine, suggestion),
        actionLabel: 'Edit routine',
      });
    })
    .filter((insight): insight is TrainingInsight => Boolean(insight));
}

export function createRecoveryFatigueInsights(
  userId: string,
  trends: ExerciseTrend[],
  volume: MuscleVolumeAnalysis,
  routines: InsightRoutine[] = [],
) {
  return volume.summaries
    .filter((summary) => isHighVolume(summary, volume))
    .map((summary) => {
      const weakestTrend = relatedTrendsForMuscle(summary.muscle, trends)
        .filter((trend) => trend.sessionCount >= 4)
        .sort((a, b) => a.trendPct - b.trendPct)[0];

      if (!weakestTrend || weakestTrend.trendPct > -0.02) return null;

      const routine = findRoutineForMuscle(routines, summary.muscle, 'reduce');
      const exercise = findRoutineExerciseForMuscle(routine, summary.muscle);
      const suggestion: RoutineEditSuggestion | undefined =
        exercise && routine
          ? {
              kind: 'reduce_sets',
              reason: `${summary.muscle} volume is high while ${weakestTrend.exerciseName} is trending down.`,
              muscleGroup: summary.muscle,
              exerciseId: exercise.exerciseId,
              exerciseName: exercise.exerciseName,
              targetSets: 1,
            }
          : undefined;

      return makeInsight({
        idKey: `${summary.muscle}-${weakestTrend.exerciseId}`,
        userId,
        type: 'recovery_fatigue',
        title: `${summary.muscle} may be carrying fatigue`,
        message: `${summary.muscle} volume is high at ${summary.last28WeeklySets.toFixed(
          1,
        )} effective sets/week while ${weakestTrend.exerciseName} is down ${percent(
          weakestTrend.trendPct,
        )}%. A small volume reduction or easier session may improve recovery.`,
        priority: weakestTrend.trendPct < -0.05 ? 'critical' : 'important',
        confidence: Math.min(95, Math.max(weakestTrend.confidence, confidenceFromPoints(volume.recentWorkoutCount))),
        relatedMuscleGroup: summary.muscle,
        relatedExercise: weakestTrend.exerciseName,
        ...routineSuggestionFields(routine, suggestion),
        actionLabel: routine ? 'Edit routine' : 'Review recovery',
      });
    })
    .filter((insight): insight is TrainingInsight => Boolean(insight));
}

export function createPushPullBalanceInsights(
  userId: string,
  volume: MuscleVolumeAnalysis,
  routines: InsightRoutine[] = [],
) {
  const set = (muscle: string) => volume.summaries.find((summary) => summary.muscle === muscle)?.last28WeeklySets ?? 0;
  const push = set('Chest') + set('Triceps') + set('Delts') * 0.5;
  const pull = set('Back') + set('Biceps') + set('Forearms') * 0.25;
  const bigger = Math.max(push, pull);
  const smaller = Math.min(push, pull);

  if (smaller <= 0 || bigger < smaller * 1.35 || bigger - smaller < 4) return [];

  const pullLagging = push > pull;
  const targetMuscle = pullLagging ? 'Back' : 'Chest';
  const recommendation = addExerciseByMuscle[targetMuscle];
  const routine = findRoutineForMuscle(routines, targetMuscle, 'add');
  const suggestion: RoutineEditSuggestion | undefined =
    routine && recommendation
      ? {
          kind: 'add_exercise',
          reason: `${pullLagging ? 'Pulling' : 'Pressing'} work is lagging behind the opposite side.`,
          muscleGroup: targetMuscle,
          exerciseId: recommendation.exerciseId,
          exerciseName: recommendation.exerciseName,
          targetSets: 3,
        }
      : undefined;

  return [
    makeInsight({
      idKey: pullLagging ? 'push-dominant' : 'pull-dominant',
      userId,
      type: 'push_pull_balance',
      title: pullLagging ? 'Pulling volume is lagging behind pressing' : 'Pressing volume is lagging behind pulling',
      message: `Your recent push-to-pull balance is about ${push.toFixed(1)} vs ${pull.toFixed(
        1,
      )} weighted sets/week. Consider adding a little ${targetMuscle.toLowerCase()} work or trimming the dominant side.`,
      priority: 'important',
      confidence: confidenceFromPoints(volume.recentWorkoutCount + 3),
      relatedMuscleGroup: targetMuscle,
      relatedExercise: recommendation?.exerciseName,
      ...routineSuggestionFields(routine, suggestion),
      actionLabel: routine ? 'Edit routine' : 'Adjust plan',
    }),
  ];
}

export function createMovementGapInsights(
  userId: string,
  workouts: InsightWorkout[],
  routines: InsightRoutine[] = [],
) {
  const recent = recentWorkouts(workouts, 28);
  if (recent.length < 3) return [];

  const movementSets = new Map<string, number>();
  recent.forEach((workout) => {
    workout.exercises.forEach((exercise) => {
      const pattern = inferMovementPattern(exercise.exerciseName);
      const sets = exercise.sets.filter((set) => isValidTrainingSet(set)).length;
      movementSets.set(pattern, (movementSets.get(pattern) ?? 0) + sets / 4);
    });
  });

  const required: Array<{ pattern: string; label: string; target: number; muscle: string; exerciseId: string; exerciseName: string }> = [
    { pattern: 'core', label: 'core stability', target: 4, muscle: 'Core', exerciseId: '243', exerciseName: 'Pallof Press' },
    { pattern: 'hinge', label: 'hinge work', target: 4, muscle: 'Hamstrings', exerciseId: '16', exerciseName: 'Romanian Deadlift' },
    { pattern: 'vertical pull', label: 'vertical pulling', target: 4, muscle: 'Back', exerciseId: '6', exerciseName: 'Lat Pulldown' },
    { pattern: 'vertical press', label: 'vertical pressing', target: 3, muscle: 'Delts', exerciseId: '136', exerciseName: 'Machine Shoulder Press' },
    { pattern: 'single-leg', label: 'single-leg work', target: 2, muscle: 'Quads', exerciseId: '29', exerciseName: 'Bulgarian Split Squat' },
  ];

  return required
    .map((item) => {
      const actual = movementSets.get(item.pattern) ?? 0;
      if (actual >= item.target) return null;

      const routine = findRoutineForMuscle(routines, item.muscle, 'add');
      const suggestion: RoutineEditSuggestion | undefined =
        routine
          ? {
              kind: 'add_exercise',
              reason: `${item.label} is below the target movement-pattern floor.`,
              muscleGroup: item.muscle,
              exerciseId: item.exerciseId,
              exerciseName: item.exerciseName,
              targetSets: Math.ceil(item.target - actual),
            }
          : undefined;

      return makeInsight({
        idKey: item.pattern,
        userId,
        type: 'movement_gap',
        title: `${titleCase(item.label)} is light this month`,
        message: `You are averaging about ${actual.toFixed(1)} sets/week of ${item.label}. Adding 2-3 sets can make the program more complete without changing the whole split.`,
        priority: actual < item.target / 2 ? 'important' : 'suggestion',
        confidence: confidenceFromPoints(recent.length),
        relatedMuscleGroup: item.muscle,
        relatedExercise: item.exerciseName,
        ...routineSuggestionFields(routine, suggestion),
        actionLabel: routine ? 'Edit routine' : 'Adjust plan',
      });
    })
    .filter((insight): insight is TrainingInsight => Boolean(insight))
    .slice(0, 2);
}

export function createProgressionRecommendationInsights(userId: string, trends: ExerciseTrend[]) {
  return trends
    .filter((trend) => trend.sessionCount >= 3 && trend.latestScore > 0 && trend.trendPct > -0.01)
    .map((trend) => {
      const latestSet = trend.sessions[trend.sessions.length - 1]?.bestSet;
      if (!latestSet || latestSet.weight <= 0 || latestSet.reps <= 0) return null;

      const metadata = getExerciseMetadata(trend.exerciseId, trend.exerciseName);
      const loadStep = metadata.equipment === 'Dumbbell' ? 1 : 2.5;
      const addLoad = latestSet.reps >= 8;
      const target = addLoad
        ? `${(latestSet.weight + loadStep).toFixed(loadStep < 2 ? 1 : 1)} kg for ${Math.max(5, latestSet.reps - 1)} reps`
        : `${latestSet.weight} kg for ${latestSet.reps + 1} reps`;

      return makeInsight({
        idKey: trend.exerciseId,
        userId,
        type: 'progression_recommendation',
        title: `Next ${trend.exerciseName} target: ${target}`,
        message: `Your recent trend is stable enough to try a small progression. Keep the same setup and aim for ${target} on your best working set.`,
        priority: 'suggestion',
        confidence: Math.max(55, trend.confidence - 5),
        relatedExercise: trend.exerciseName,
        actionLabel: 'Review exercise',
      });
    })
    .filter((insight): insight is TrainingInsight => Boolean(insight));
}

export function createExerciseRoiInsights(userId: string, trends: ExerciseTrend[]) {
  return trends
    .filter((trend) => trend.sessionCount >= 4 && trend.previousAvg > 0)
    .map((trend) => {
      const latest = new Date(`${trend.latestDate}T00:00:00`);
      const recentSetsPerWeek =
        trend.sessions
          .filter((session) => daysBetweenDates(new Date(`${session.workoutDate}T00:00:00`), latest) < 28)
          .reduce((sum, session) => sum + session.validSets, 0) / 4;

      if (trend.trendPct >= 0.05 && recentSetsPerWeek <= 6) {
        return makeInsight({
          idKey: `${trend.exerciseId}-high-return`,
          userId,
          type: 'exercise_roi',
          title: `${trend.exerciseName} is giving strong return`,
          message: `${trend.exerciseName} is up ${percent(
            trend.trendPct,
          )}% on only about ${recentSetsPerWeek.toFixed(1)} hard sets/week. Keep it in the plan unless your goals change.`,
          priority: 'positive',
          confidence: trend.confidence,
          relatedExercise: trend.exerciseName,
          actionLabel: 'Keep structure',
        });
      }

      if (trend.trendPct <= -0.01 && recentSetsPerWeek >= 8) {
        return makeInsight({
          idKey: `${trend.exerciseId}-low-return`,
          userId,
          type: 'exercise_roi',
          title: `${trend.exerciseName} may be low return right now`,
          message: `${trend.exerciseName} is receiving about ${recentSetsPerWeek.toFixed(
            1,
          )} hard sets/week, but recent performance is not moving up. Consider reducing sets, moving it earlier, or rotating the movement.`,
          priority: 'suggestion',
          confidence: trend.confidence,
          relatedExercise: trend.exerciseName,
          actionLabel: 'Review exercise',
        });
      }

      return null;
    })
    .filter((insight): insight is TrainingInsight => Boolean(insight));
}

export function createRirWarningInsights(
  userId: string,
  workouts: InsightWorkout[],
  routines: InsightRoutine[] = [],
) {
  const recent = recentWorkouts(workouts, 28);
  const hardSets = recent.flatMap((workout) =>
    workout.exercises.flatMap((exercise) =>
      exercise.sets.filter((set) => isValidTrainingSet(set)).map((set) => ({ set, exercise })),
    ),
  );

  if (hardSets.length < 10) return [];

  const nearFailure = hardSets.filter(({ set }) => set.type === 'failure' || (set.rir !== undefined && set.rir <= 0));
  const ratio = nearFailure.length / hardSets.length;
  if (ratio < FAILURE_SET_RATIO) return [];

  const muscleCounts = new Map<string, number>();
  nearFailure.forEach(({ exercise }) => {
    exercise.mainMuscles.forEach((muscle) => muscleCounts.set(muscle, (muscleCounts.get(muscle) ?? 0) + 1));
  });
  const mainMuscle = Array.from(muscleCounts.entries()).sort((a, b) => b[1] - a[1])[0]?.[0];
  const routine = mainMuscle ? findRoutineForMuscle(routines, mainMuscle, 'reduce') : null;

  return [
    makeInsight({
      idKey: 'failure-rir-density',
      userId,
      type: 'rir_warning',
      title: 'Many sets are being pushed to failure',
      message: `${nearFailure.length} of your last ${hardSets.length} logged hard sets are failure sets or 0 RIR. That can work in short blocks, but consider keeping most sets 1-3 reps in reserve if recovery or progression slows.`,
      priority: ratio >= 0.5 ? 'important' : 'suggestion',
      confidence: confidenceFromPoints(recent.length + nearFailure.length),
      relatedMuscleGroup: mainMuscle,
      relatedRoutineId: routine?.id,
      relatedRoutineName: routine?.name,
      actionLabel: routine ? 'Review routine' : 'Review intensity',
    }),
  ];
}

export function createPrOpportunityInsights(userId: string, trends: ExerciseTrend[]) {
  return trends
    .filter((trend) => trend.sessionCount >= 4)
    .map((trend) => {
      const best = trend.sessions.reduce((currentBest, session) => (session.score > currentBest.score ? session : currentBest), trend.sessions[0]);
      const latest = trend.sessions[trend.sessions.length - 1];
      if (!best || !latest || latest.score < best.score * (1 - PR_OPPORTUNITY_RANGE) || trend.trendPct < -0.02) return null;

      return makeInsight({
        idKey: trend.exerciseId,
        userId,
        type: 'pr_opportunity',
        title: `${trend.exerciseName} is close to PR shape`,
        message: `Your latest best set is within ${percent(
          (latest.score - best.score) / best.score,
        )}% of your top estimated 1RM for ${trend.exerciseName}. A new PR may be realistic if warm-up and recovery are good.`,
        priority: 'positive',
        confidence: Math.max(55, trend.confidence - 5),
        relatedExercise: trend.exerciseName,
        actionLabel: 'Review exercise',
      });
    })
    .filter((insight): insight is TrainingInsight => Boolean(insight));
}

export function createConsistencyInsights(
  userId: string,
  workouts: InsightWorkout[],
  volume: MuscleVolumeAnalysis,
  routines: InsightRoutine[] = [],
) {
  const latest = latestWorkoutDate(workouts);
  if (!latest || workouts.length < 4) return [];

  const lastTrainedByMuscle = new Map<string, Date>();
  workouts.forEach((workout) => {
    workout.exercises.forEach((exercise) => {
      if (!exercise.sets.some((set) => isValidTrainingSet(set))) return;
      exercise.mainMuscles
        .filter((muscle) => commonInsightMuscles.includes(muscle))
        .forEach((muscle) => {
          const date = workoutDate(workout);
          const current = lastTrainedByMuscle.get(muscle);
          if (!current || date > current) lastTrainedByMuscle.set(muscle, date);
        });
    });
  });

  return volume.summaries
    .filter((summary) => commonInsightMuscles.includes(summary.muscle))
    .map((summary) => {
      const lastTrained = lastTrainedByMuscle.get(summary.muscle);
      const days = lastTrained ? daysBetweenDates(lastTrained, latest) : 999;
      if (days < 10 && summary.last28WeeklySets >= 3) return null;

      const recommendation = addExerciseByMuscle[summary.muscle];
      const routine = findRoutineForMuscle(routines, summary.muscle, 'add');
      const suggestion: RoutineEditSuggestion | undefined =
        routine && recommendation
          ? {
              kind: 'add_exercise',
              reason: `${summary.muscle} has not appeared consistently in recent sessions.`,
              muscleGroup: summary.muscle,
              exerciseId: recommendation.exerciseId,
              exerciseName: recommendation.exerciseName,
              targetSets: 2,
            }
          : undefined;

      return makeInsight({
        idKey: summary.muscle,
        userId,
        type: 'consistency',
        title: `${summary.muscle} training has been inconsistent`,
        message:
          days >= 999
            ? `${summary.muscle} has not appeared in the logged program recently. Add a small recurring slot if it matters for your goals.`
            : `${summary.muscle} has not been trained for ${days} days. A small recurring slot can keep the signal from dropping out of the program.`,
        priority: days >= 14 || summary.last28WeeklySets < 2 ? 'important' : 'suggestion',
        confidence: confidenceFromPoints(workouts.length),
        relatedMuscleGroup: summary.muscle,
        relatedExercise: recommendation?.exerciseName,
        ...routineSuggestionFields(routine, suggestion),
        actionLabel: routine ? 'Edit routine' : 'Adjust plan',
      });
    })
    .filter((insight): insight is TrainingInsight => Boolean(insight))
    .slice(0, 2);
}

export function createSessionQualityInsights(userId: string, workouts: InsightWorkout[]) {
  const chronological = [...workouts].sort((a, b) => workoutDate(a).getTime() - workoutDate(b).getTime());
  if (chronological.length < 6) return [];

  const recent = chronological.slice(-3);
  const previous = chronological.slice(-6, -3);
  const recentVolume = average(recent.map(workoutVolume));
  const previousVolume = average(previous.map(workoutVolume));
  const recentDuration = average(recent.map((workout) => workout.duration || 0));
  const previousDuration = average(previous.map((workout) => workout.duration || 0));
  const recentSets = average(recent.map(hardSetCount));
  const previousSets = average(previous.map(hardSetCount));

  if (previousVolume <= 0 || previousDuration <= 0) return [];

  if (recentDuration <= previousDuration * 0.9 && recentVolume >= previousVolume * 0.95) {
    return [
      makeInsight({
        idKey: 'session-efficiency-up',
        userId,
        type: 'session_quality',
        title: 'Recent sessions are more efficient',
        message: `Your last three sessions are shorter while holding similar total work. Average session volume is ${recentVolume.toFixed(
          0,
        )} kg vs ${previousVolume.toFixed(0)} kg previously.`,
        priority: 'positive',
        confidence: confidenceFromPoints(chronological.length),
        actionLabel: 'Keep structure',
      }),
    ];
  }

  if (recentVolume < previousVolume * 0.85 && recentSets <= previousSets * 1.05) {
    return [
      makeInsight({
        idKey: 'session-output-down',
        userId,
        type: 'session_quality',
        title: 'Session output has dipped',
        message: `Your last three sessions are down about ${percent(
          (recentVolume - previousVolume) / previousVolume,
        )}% in total volume without a matching drop in set count. This can be a fatigue or exercise-selection signal.`,
        priority: 'important',
        confidence: confidenceFromPoints(chronological.length),
        actionLabel: 'Review recovery',
      }),
    ];
  }

  return [];
}

export function createWarmupReadinessInsights(userId: string, workouts: InsightWorkout[]) {
  const sessionsByExercise = new Map<string, Array<{ exerciseId: string; exerciseName: string; gap: number }>>();

  workouts.forEach((workout) => {
    workout.exercises.forEach((exercise) => {
      const validSets = exercise.sets.filter((set) => isValidTrainingSet(set));
      if (validSets.length < 2) return;

      const first = validSets[0];
      const bestLater = validSets.slice(1).reduce((best, set) => {
        return estimateOneRepMax(set.weight, set.reps) > estimateOneRepMax(best.weight, best.reps) ? set : best;
      }, validSets[1]);
      const firstScore = estimateOneRepMax(first.weight, first.reps);
      const laterScore = estimateOneRepMax(bestLater.weight, bestLater.reps);
      if (firstScore <= 0 || laterScore <= firstScore * 1.05) return;

      const entries = sessionsByExercise.get(exercise.exerciseId) ?? [];
      entries.push({
        exerciseId: exercise.exerciseId,
        exerciseName: exercise.exerciseName,
        gap: (laterScore - firstScore) / laterScore,
      });
      sessionsByExercise.set(exercise.exerciseId, entries);
    });
  });

  return Array.from(sessionsByExercise.values())
    .filter((sessions) => sessions.length >= 3)
    .map((sessions) => {
      const avgGap = average(sessions.map((session) => session.gap));
      const exerciseName = sessions[0].exerciseName;
      return makeInsight({
        idKey: sessions[0].exerciseId,
        userId,
        type: 'warmup_readiness',
        title: `${exerciseName} may need a better ramp-up`,
        message: `Your first working set is often below later sets on ${exerciseName}. A more specific warm-up or a slightly lighter first set may improve session quality.`,
        priority: avgGap >= 0.1 ? 'important' : 'suggestion',
        confidence: confidenceFromPoints(sessions.length),
        relatedExercise: exerciseName,
        actionLabel: 'Review exercise',
      });
    });
}
