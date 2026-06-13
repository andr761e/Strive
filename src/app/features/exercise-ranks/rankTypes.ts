export type ExerciseRankTier =
  | 'Unranked'
  | 'Iron'
  | 'Bronze'
  | 'Silver'
  | 'Gold'
  | 'Platinum'
  | 'Diamond'
  | 'Ascendant'
  | 'Titan'
  | 'Apex';

export type RankedExerciseTier = Exclude<ExerciseRankTier, 'Unranked'>;
export type RankDivision = 'I' | 'II' | 'III';

export type RankCategory = 'barbell' | 'dumbbell' | 'weighted_bodyweight';
export type RankLoadMode = 'total' | 'per_hand' | 'bodyweight_plus_external';
export type ExerciseRankGender = 'male' | 'female';

export interface ExerciseRankMetadata {
  rankEligible: boolean;
  rankKey: string;
  rankCategory: RankCategory;
  rankLoadMode: RankLoadMode;
}

export interface ExerciseRankStandard {
  rank: RankedExerciseTier;
  division: RankDivision | null;
  minRatio: number;
}

export interface RankableExercise {
  id: string;
  name: string;
  equipment?: string;
}

export interface RankableSet {
  setNumber?: number;
  weight?: number;
  reps?: number;
  completed?: boolean;
}

export interface RankableWorkout {
  id?: string;
  workoutName?: string;
  date: string;
  bodyweightKg?: number | null;
  exercises: {
    exerciseId: string;
    exerciseName: string;
    sets: RankableSet[];
  }[];
}

export interface RankedSet {
  workoutId?: string;
  workoutName?: string;
  date: string;
  setNumber?: number;
  loggedWeight: number;
  reps: number;
  load: number;
  estimatedOneRepMax: number;
  strengthRatio?: number;
  bodyweight?: number;
}

export type ExerciseRankStatus =
  | 'not_eligible'
  | 'missing_bodyweight'
  | 'missing_standards'
  | 'no_valid_sets'
  | 'unranked'
  | 'ranked';

export interface NextRankProgress {
  nextStandard: ExerciseRankStandard | null;
  previousStandard: ExerciseRankStandard | null;
  progressPercent: number;
}

export interface ExerciseRankResult {
  exerciseId: string;
  exerciseName: string;
  eligible: boolean;
  status: ExerciseRankStatus;
  metadata?: ExerciseRankMetadata;
  rank: ExerciseRankTier;
  division: RankDivision | null;
  rankLabel: string;
  bestSet?: RankedSet;
  estimatedOneRepMax?: number;
  strengthRatio?: number;
  progressPercent?: number;
  nextStandard?: ExerciseRankStandard | null;
  nextTargetEstimatedOneRepMax?: number;
  nextTargetStrengthRatio?: number;
  message: string;
}
