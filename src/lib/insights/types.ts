import type { ExerciseLog, WorkoutRecord, WorkoutSet } from '../../app/services/db';

export type InsightPriority = 'critical' | 'important' | 'suggestion' | 'positive';

export type InsightType =
  | 'plateau'
  | 'progression'
  | 'undertrained_muscle'
  | 'high_volume'
  | 'exercise_order'
  | 'exercise_rotation'
  | 'recovery_fatigue'
  | 'push_pull_balance'
  | 'movement_gap'
  | 'progression_recommendation'
  | 'exercise_roi'
  | 'rir_warning'
  | 'pr_opportunity'
  | 'consistency'
  | 'session_quality'
  | 'warmup_readiness'
  | 'routine_adjustment';

export interface RoutineEditSuggestion {
  kind: 'add_exercise' | 'remove_exercise' | 'reduce_sets' | 'reorder_exercise';
  reason: string;
  muscleGroup?: string;
  exerciseId?: string;
  exerciseName?: string;
  targetSets?: number;
  targetPosition?: number;
}

export interface TrainingInsight {
  id: string;
  userId: string;
  type: InsightType;
  title: string;
  message: string;
  priority: InsightPriority;
  confidence: number;
  createdAt: string;
  relatedExercise?: string;
  relatedMuscleGroup?: string;
  relatedRoutineId?: string;
  relatedRoutineName?: string;
  routineSuggestion?: RoutineEditSuggestion;
  actionLabel?: string;
  relevanceScore: number;
}

export interface ExerciseMetadata {
  id: string;
  name: string;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  movement: string;
  equipment?: string;
  substitutions: string[];
}

export interface ExerciseSessionPerformance {
  exerciseId: string;
  exerciseName: string;
  workoutId: string;
  workoutDate: string;
  exerciseOrder: number;
  score: number;
  totalVolume: number;
  validSets: number;
  bestSet: WorkoutSet;
}

export interface ExerciseTrend {
  exerciseId: string;
  exerciseName: string;
  sessions: ExerciseSessionPerformance[];
  sessionCount: number;
  latestScore: number;
  latestDate: string;
  recentAvg: number;
  previousAvg: number;
  trendPct: number;
  isFlat: boolean;
  confidence: number;
}

export interface MuscleVolumeSummary {
  muscle: string;
  last7Sets: number;
  last28WeeklySets: number;
  previous28WeeklySets: number;
  trendPct: number;
}

export interface MuscleVolumeAnalysis {
  summaries: MuscleVolumeSummary[];
  recentWorkoutCount: number;
}

export interface InsightRoutineExercise {
  exerciseId: string;
  exerciseName: string;
  mainMuscles: string[];
  sets?: Array<{
    type?: string;
    weight?: number;
    reps?: number;
    rir?: number;
    duration?: number;
    distance?: number;
    incline?: number;
  }>;
}

export interface InsightRoutine {
  id: string;
  name: string;
  exercises: Array<{
    id: string;
    name: string;
    mainMuscles: string[];
  }>;
  exerciseLogs?: InsightRoutineExercise[];
}

export interface InsightAnalysisResult {
  insights: TrainingInsight[];
  generatedAt: string;
  stats: {
    workoutsAnalyzed: number;
    exercisesAnalyzed: number;
    musclesAnalyzed: number;
    candidateInsights: number;
    hasEnoughData: boolean;
  };
}

export type InsightWorkout = WorkoutRecord;
export type InsightWorkoutExercise = ExerciseLog;
export type InsightExerciseSet = WorkoutSet;
