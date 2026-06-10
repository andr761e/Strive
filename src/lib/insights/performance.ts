import { getExerciseLiftedLoadVolume } from '../../app/utils/workoutVolume';
import type { ExerciseSessionPerformance, ExerciseTrend, InsightWorkout, InsightWorkoutExercise, InsightExerciseSet } from './types';

const FLAT_WINDOW = 4;
const FLAT_RANGE_PCT = 0.03;

export function estimateOneRepMax(weight: number, reps: number) {
  if (reps <= 0) return 0;
  if (weight <= 0) return reps;
  return weight * (1 + reps / 30);
}

export function isValidTrainingSet(set: InsightExerciseSet, includeWarmups = false) {
  if (set.completed === false) return false;
  if (!includeWarmups && set.type === 'warmup') return false;
  const hasRepWork = Number.isFinite(set.weight) && set.weight >= 0 && Number.isFinite(set.reps) && set.reps > 0;
  const hasTimedOrDistanceWork =
    (set.duration !== undefined && Number.isFinite(set.duration) && set.duration > 0) ||
    (set.distance !== undefined && Number.isFinite(set.distance) && set.distance > 0);

  return hasRepWork || hasTimedOrDistanceWork;
}

function average(values: number[]) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function calculateConfidence(dataPoints: number) {
  return Math.min(95, Math.max(45, 50 + dataPoints * 5));
}

function isFlatPerformance(sessions: ExerciseSessionPerformance[]) {
  const window = sessions.slice(-FLAT_WINDOW);
  if (window.length < 3) return false;

  const scores = window.map((session) => session.score);
  const avg = average(scores);
  if (avg <= 0) return false;

  return (Math.max(...scores) - Math.min(...scores)) / avg <= FLAT_RANGE_PCT;
}

export function calculateSessionPerformance(
  workout: InsightWorkout,
  exercise: InsightWorkoutExercise,
  exerciseOrder: number,
): ExerciseSessionPerformance | null {
  let validSets = exercise.sets.filter((set) => isValidTrainingSet(set));

  if (!validSets.length) {
    validSets = exercise.sets.filter((set) => isValidTrainingSet(set, true));
  }

  if (!validSets.length) return null;

  const bestSet = validSets.reduce((best, set) => {
    const bestScore = estimateOneRepMax(best.weight, best.reps);
    const nextScore = estimateOneRepMax(set.weight, set.reps);
    return nextScore > bestScore ? set : best;
  }, validSets[0]);

  return {
    exerciseId: exercise.exerciseId,
    exerciseName: exercise.exerciseName,
    workoutId: workout.id,
    workoutDate: workout.date,
    exerciseOrder,
    score: estimateOneRepMax(bestSet.weight, bestSet.reps),
    totalVolume: getExerciseLiftedLoadVolume({ ...exercise, sets: validSets }),
    validSets: validSets.length,
    bestSet,
  };
}

export function collectExercisePerformances(workouts: InsightWorkout[]) {
  const sessions: ExerciseSessionPerformance[] = [];
  const chronologicalWorkouts = [...workouts].sort(
    (a, b) => new Date(`${a.date}T00:00:00`).getTime() - new Date(`${b.date}T00:00:00`).getTime(),
  );

  chronologicalWorkouts.forEach((workout) => {
    workout.exercises.forEach((exercise, index) => {
      const performance = calculateSessionPerformance(workout, exercise, index + 1);
      if (performance) {
        sessions.push(performance);
      }
    });
  });

  return sessions;
}

export function calculateExerciseTrends(workouts: InsightWorkout[]): ExerciseTrend[] {
  const grouped = new Map<string, ExerciseSessionPerformance[]>();

  collectExercisePerformances(workouts).forEach((session) => {
    const existing = grouped.get(session.exerciseId) ?? [];
    existing.push(session);
    grouped.set(session.exerciseId, existing);
  });

  return Array.from(grouped.entries()).map(([exerciseId, sessions]) => {
    const recentWindow = sessions.slice(-3);
    const previousWindow = sessions.slice(Math.max(0, sessions.length - 6), Math.max(0, sessions.length - 3));
    const recentAvg = average(recentWindow.map((session) => session.score));
    const previousAvg = average(previousWindow.map((session) => session.score));
    const trendPct = previousAvg > 0 ? (recentAvg - previousAvg) / previousAvg : 0;
    const latest = sessions[sessions.length - 1];

    return {
      exerciseId,
      exerciseName: latest.exerciseName,
      sessions,
      sessionCount: sessions.length,
      latestScore: latest.score,
      latestDate: latest.workoutDate,
      recentAvg,
      previousAvg,
      trendPct,
      isFlat: isFlatPerformance(sessions),
      confidence: calculateConfidence(sessions.length),
    };
  });
}

export function averagePerformance(sessions: ExerciseSessionPerformance[]) {
  return average(sessions.map((session) => session.score));
}
