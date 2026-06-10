import type {
  ExerciseRankMetadata,
  ExerciseRankStandard,
  RankCategory,
  RankedExerciseTier,
} from './rankTypes';

const rankedSteps: { rank: RankedExerciseTier; division: ExerciseRankStandard['division'] }[] = [
  { rank: 'Iron', division: 'I' },
  { rank: 'Iron', division: 'II' },
  { rank: 'Iron', division: 'III' },
  { rank: 'Bronze', division: 'I' },
  { rank: 'Bronze', division: 'II' },
  { rank: 'Bronze', division: 'III' },
  { rank: 'Silver', division: 'I' },
  { rank: 'Silver', division: 'II' },
  { rank: 'Silver', division: 'III' },
  { rank: 'Gold', division: 'I' },
  { rank: 'Gold', division: 'II' },
  { rank: 'Gold', division: 'III' },
  { rank: 'Platinum', division: 'I' },
  { rank: 'Platinum', division: 'II' },
  { rank: 'Platinum', division: 'III' },
  { rank: 'Diamond', division: 'I' },
  { rank: 'Diamond', division: 'II' },
  { rank: 'Diamond', division: 'III' },
  { rank: 'Ascendant', division: 'I' },
  { rank: 'Ascendant', division: 'II' },
  { rank: 'Ascendant', division: 'III' },
  { rank: 'Titan', division: 'I' },
  { rank: 'Titan', division: 'II' },
  { rank: 'Titan', division: 'III' },
  { rank: 'Apex', division: null },
];

function makeStandards(startRatio: number, apexRatio: number, curve = 1.12): ExerciseRankStandard[] {
  const maxIndex = rankedSteps.length - 1;

  return rankedSteps.map((step, index) => {
    const progress = index / maxIndex;
    const ratio = startRatio + (apexRatio - startRatio) * Math.pow(progress, curve);

    return {
      ...step,
      minRatio: Number(ratio.toFixed(2)),
    };
  });
}

export const exerciseRankStandards: Record<string, ExerciseRankStandard[]> = {
  barbell_bench_press: makeStandards(0.50, 2.00),
  incline_barbell_bench_press: makeStandards(0.42, 1.75),

  barbell_back_squat: makeStandards(0.70, 2.65),
  high_bar_squat: makeStandards(0.65, 2.55),
  low_bar_squat: makeStandards(0.75, 2.75),
  front_squat: makeStandards(0.55, 2.20),

  deadlift: makeStandards(0.85, 3.00),
  romanian_deadlift: makeStandards(0.65, 2.35),
  stiff_leg_deadlift: makeStandards(0.60, 2.20),

  barbell_overhead_press: makeStandards(0.30, 1.35),
  seated_barbell_shoulder_press: makeStandards(0.30, 1.30),

  barbell_bent_over_row: makeStandards(0.50, 1.90),
  pendlay_row: makeStandards(0.45, 1.75),

  dumbbell_bench_press: makeStandards(0.35, 1.70),
  incline_dumbbell_bench_press: makeStandards(0.30, 1.55),
  decline_dumbbell_bench_press: makeStandards(0.38, 1.75),

  dumbbell_shoulder_press: makeStandards(0.22, 1.15),
  seated_dumbbell_shoulder_press: makeStandards(0.24, 1.22),

  dumbbell_row: makeStandards(0.40, 1.65),
  chest_supported_dumbbell_row: makeStandards(0.36, 1.50),

  barbell_curl: makeStandards(0.20, 0.90),
  ez_bar_curl: makeStandards(0.19, 0.85),

  dumbbell_curl: makeStandards(0.14, 0.68),
  alternating_dumbbell_curl: makeStandards(0.13, 0.65),
  seated_dumbbell_curl: makeStandards(0.13, 0.62),
  incline_dumbbell_curl: makeStandards(0.12, 0.58),
  hammer_curl: makeStandards(0.15, 0.72),

  pull_up: makeStandards(1.00, 2.20),
  chin_up: makeStandards(1.00, 2.25),
  chest_dip: makeStandards(1.05, 2.40),
  triceps_dip: makeStandards(1.00, 2.30),
};

const metadataByExerciseId: Record<string, ExerciseRankMetadata> = {
  '1': metadata('barbell_bench_press', 'barbell', 'total'),
  '33': metadata('incline_barbell_bench_press', 'barbell', 'total'),
  '13': metadata('barbell_back_squat', 'barbell', 'total'),
  '100': metadata('high_bar_squat', 'barbell', 'total'),
  '101': metadata('low_bar_squat', 'barbell', 'total'),
  '28': metadata('front_squat', 'barbell', 'total'),
  '7': metadata('deadlift', 'barbell', 'total'),
  '16': metadata('romanian_deadlift', 'barbell', 'total'),
  '121': metadata('stiff_leg_deadlift', 'barbell', 'total'),
  '18': metadata('barbell_overhead_press', 'barbell', 'total'),
  '133': metadata('seated_barbell_shoulder_press', 'barbell', 'total'),
  '5': metadata('barbell_bent_over_row', 'barbell', 'total'),
  '48': metadata('pendlay_row', 'barbell', 'total'),
  '21': metadata('dumbbell_bench_press', 'dumbbell', 'per_hand'),
  '2': metadata('incline_dumbbell_bench_press', 'dumbbell', 'per_hand'),
  '36': metadata('decline_dumbbell_bench_press', 'dumbbell', 'per_hand'),
  '134': metadata('dumbbell_shoulder_press', 'dumbbell', 'per_hand'),
  '135': metadata('seated_dumbbell_shoulder_press', 'dumbbell', 'per_hand'),
  '49': metadata('dumbbell_row', 'dumbbell', 'total'),
  '50': metadata('chest_supported_dumbbell_row', 'dumbbell', 'total'),
  '8': metadata('barbell_curl', 'barbell', 'total'),
  '66': metadata('ez_bar_curl', 'barbell', 'total'),
  '67': metadata('dumbbell_curl', 'dumbbell', 'total'),
  '68': metadata('alternating_dumbbell_curl', 'dumbbell', 'total'),
  '69': metadata('seated_dumbbell_curl', 'dumbbell', 'total'),
  '72': metadata('incline_dumbbell_curl', 'dumbbell', 'total'),
  '9': metadata('hammer_curl', 'dumbbell', 'total'),
  '4': metadata('pull_up', 'weighted_bodyweight', 'bodyweight_plus_external'),
  '25': metadata('chin_up', 'weighted_bodyweight', 'bodyweight_plus_external'),
  '22': metadata('chest_dip', 'weighted_bodyweight', 'bodyweight_plus_external'),
  '96': metadata('triceps_dip', 'weighted_bodyweight', 'bodyweight_plus_external'),
};

const metadataByExerciseName: Record<string, ExerciseRankMetadata> = {
  barbell_bench_press: metadataByExerciseId['1'],
  incline_barbell_bench_press: metadataByExerciseId['33'],
  barbell_squat: metadataByExerciseId['13'],
  barbell_back_squat: metadataByExerciseId['13'],
  high_bar_squat: metadataByExerciseId['100'],
  low_bar_squat: metadataByExerciseId['101'],
  front_squat: metadataByExerciseId['28'],
  deadlift: metadataByExerciseId['7'],
  romanian_deadlift: metadataByExerciseId['16'],
  stiff_leg_deadlift: metadataByExerciseId['121'],
  stiff_legged_deadlift: metadataByExerciseId['121'],
  overhead_press: metadataByExerciseId['18'],
  barbell_overhead_press: metadataByExerciseId['18'],
  seated_barbell_shoulder_press: metadataByExerciseId['133'],
  barbell_row: metadataByExerciseId['5'],
  bent_over_row: metadataByExerciseId['5'],
  barbell_bent_over_row: metadataByExerciseId['5'],
  pendlay_row: metadataByExerciseId['48'],
  dumbbell_bench_press: metadataByExerciseId['21'],
  incline_dumbbell_press: metadataByExerciseId['2'],
  incline_dumbbell_bench_press: metadataByExerciseId['2'],
  decline_dumbbell_press: metadataByExerciseId['36'],
  decline_dumbbell_bench_press: metadataByExerciseId['36'],
  dumbbell_shoulder_press: metadataByExerciseId['134'],
  seated_dumbbell_shoulder_press: metadataByExerciseId['135'],
  dumbbell_row: metadataByExerciseId['49'],
  chest_supported_dumbbell_row: metadataByExerciseId['50'],
  barbell_curl: metadataByExerciseId['8'],
  ez_bar_curl: metadataByExerciseId['66'],
  dumbbell_curl: metadataByExerciseId['67'],
  alternating_dumbbell_curl: metadataByExerciseId['68'],
  seated_dumbbell_curl: metadataByExerciseId['69'],
  incline_dumbbell_curl: metadataByExerciseId['72'],
  hammer_curl: metadataByExerciseId['9'],
  pull_up: metadataByExerciseId['4'],
  pull_ups: metadataByExerciseId['4'],
  weighted_pull_up: metadataByExerciseId['4'],
  weighted_pull_ups: metadataByExerciseId['4'],
  chin_up: metadataByExerciseId['25'],
  chin_ups: metadataByExerciseId['25'],
  weighted_chin_up: metadataByExerciseId['25'],
  weighted_chin_ups: metadataByExerciseId['25'],
  dip: metadataByExerciseId['22'],
  chest_dip: metadataByExerciseId['22'],
  chest_dips: metadataByExerciseId['22'],
  triceps_dip: metadataByExerciseId['96'],
  triceps_dips: metadataByExerciseId['96'],
  weighted_dip: metadataByExerciseId['22'],
  weighted_chest_dip: metadataByExerciseId['22'],
  weighted_triceps_dip: metadataByExerciseId['96'],
};

function metadata(
  rankKey: string,
  rankCategory: RankCategory,
  rankLoadMode: ExerciseRankMetadata['rankLoadMode'],
): ExerciseRankMetadata {
  return {
    rankEligible: true,
    rankKey,
    rankCategory,
    rankLoadMode,
  };
}

function normalizeName(name: string) {
  return name
    .trim()
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

export function getRankMetadataByExercise(exercise: { id: string; name: string; equipment?: string } | null | undefined) {
  if (!exercise) return null;
  const byId = metadataByExerciseId[exercise.id];
  if (byId) return byId;

  const normalizedName = normalizeName(exercise.name);
  const byName = metadataByExerciseName[normalizedName];
  if (byName) return byName;

  const lowerName = exercise.name.toLowerCase();
  const equipment = exercise.equipment?.toLowerCase() ?? '';
  const excluded =
    lowerName.includes('machine') ||
    lowerName.includes('smith') ||
    lowerName.includes('cable') ||
    lowerName.includes('assisted') ||
    lowerName.includes('push-up') ||
    equipment.includes('machine') ||
    equipment.includes('smith') ||
    equipment.includes('cable');

  if (excluded) return null;

  return null;
}

export function getRankStandards(rankKey: string | undefined) {
  return rankKey ? exerciseRankStandards[rankKey] ?? null : null;
}
