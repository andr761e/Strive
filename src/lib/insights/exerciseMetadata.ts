import { exercises } from '../../app/data/mockData';
import type { ExerciseMetadata } from './types';

const metadataById: Record<string, Omit<ExerciseMetadata, 'id'>> = {
  '1': {
    name: 'Barbell Bench Press',
    primaryMuscles: ['Chest'],
    secondaryMuscles: ['Triceps', 'Delts'],
    movement: 'horizontal press',
    equipment: 'Barbell',
    substitutions: ['Dumbbell Bench Press', 'Chest Dips', 'Cable Fly'],
  },
  '2': {
    name: 'Incline Dumbbell Press',
    primaryMuscles: ['Chest'],
    secondaryMuscles: ['Delts', 'Triceps'],
    movement: 'incline press',
    equipment: 'Dumbbell',
    substitutions: ['Dumbbell Bench Press', 'Cable Crossover', 'Barbell Bench Press'],
  },
  '3': {
    name: 'Cable Fly',
    primaryMuscles: ['Chest'],
    secondaryMuscles: [],
    movement: 'chest fly',
    equipment: 'Cable',
    substitutions: ['Cable Crossover', 'Dumbbell Bench Press'],
  },
  '4': {
    name: 'Pull-ups',
    primaryMuscles: ['Back'],
    secondaryMuscles: ['Biceps'],
    movement: 'vertical pull',
    equipment: 'Bodyweight',
    substitutions: ['Lat Pulldown', 'Chin-ups', 'Barbell Row'],
  },
  '5': {
    name: 'Barbell Row',
    primaryMuscles: ['Back'],
    secondaryMuscles: ['Biceps', 'Delts'],
    movement: 'horizontal pull',
    equipment: 'Barbell',
    substitutions: ['T-Bar Row', 'Lat Pulldown', 'Face Pull'],
  },
  '6': {
    name: 'Lat Pulldown',
    primaryMuscles: ['Back'],
    secondaryMuscles: ['Biceps'],
    movement: 'vertical pull',
    equipment: 'Cable',
    substitutions: ['Pull-ups', 'Chin-ups', 'T-Bar Row'],
  },
  '7': {
    name: 'Deadlift',
    primaryMuscles: ['Hamstrings', 'Glutes', 'Back'],
    secondaryMuscles: ['Forearms'],
    movement: 'hinge',
    equipment: 'Barbell',
    substitutions: ['Romanian Deadlift', 'Hip Thrust', 'T-Bar Row'],
  },
  '8': {
    name: 'Barbell Curl',
    primaryMuscles: ['Biceps'],
    secondaryMuscles: ['Forearms'],
    movement: 'elbow flexion',
    equipment: 'Barbell',
    substitutions: ['Preacher Curl', 'Hammer Curl'],
  },
  '9': {
    name: 'Hammer Curl',
    primaryMuscles: ['Biceps', 'Forearms'],
    secondaryMuscles: [],
    movement: 'elbow flexion',
    equipment: 'Dumbbell',
    substitutions: ['Barbell Curl', 'Preacher Curl'],
  },
  '10': {
    name: 'Close-Grip Bench Press',
    primaryMuscles: ['Triceps'],
    secondaryMuscles: ['Chest', 'Delts'],
    movement: 'horizontal press',
    equipment: 'Barbell',
    substitutions: ['Tricep Pushdown', 'Skull Crushers', 'Chest Dips'],
  },
  '11': {
    name: 'Tricep Pushdown',
    primaryMuscles: ['Triceps'],
    secondaryMuscles: [],
    movement: 'elbow extension',
    equipment: 'Cable',
    substitutions: ['Overhead Tricep Extension', 'Skull Crushers'],
  },
  '12': {
    name: 'Overhead Tricep Extension',
    primaryMuscles: ['Triceps'],
    secondaryMuscles: [],
    movement: 'elbow extension',
    equipment: 'Dumbbell',
    substitutions: ['Tricep Pushdown', 'Skull Crushers'],
  },
  '13': {
    name: 'Squat',
    primaryMuscles: ['Quads', 'Glutes'],
    secondaryMuscles: ['Hamstrings'],
    movement: 'squat',
    equipment: 'Barbell',
    substitutions: ['Leg Press', 'Front Squat', 'Bulgarian Split Squat'],
  },
  '14': {
    name: 'Leg Press',
    primaryMuscles: ['Quads', 'Glutes'],
    secondaryMuscles: ['Hamstrings'],
    movement: 'squat',
    equipment: 'Machine',
    substitutions: ['Squat', 'Front Squat', 'Leg Extension'],
  },
  '15': {
    name: 'Leg Extension',
    primaryMuscles: ['Quads'],
    secondaryMuscles: [],
    movement: 'knee extension',
    equipment: 'Machine',
    substitutions: ['Leg Press', 'Front Squat'],
  },
  '16': {
    name: 'Romanian Deadlift',
    primaryMuscles: ['Hamstrings', 'Glutes'],
    secondaryMuscles: ['Back'],
    movement: 'hinge',
    equipment: 'Barbell',
    substitutions: ['Deadlift', 'Leg Curl', 'Hip Thrust'],
  },
  '17': {
    name: 'Leg Curl',
    primaryMuscles: ['Hamstrings'],
    secondaryMuscles: [],
    movement: 'knee flexion',
    equipment: 'Machine',
    substitutions: ['Romanian Deadlift', 'Hip Thrust'],
  },
  '18': {
    name: 'Overhead Press',
    primaryMuscles: ['Delts'],
    secondaryMuscles: ['Triceps', 'Chest'],
    movement: 'vertical press',
    equipment: 'Barbell',
    substitutions: ['Lateral Raise', 'Face Pull', 'Incline Dumbbell Press'],
  },
  '19': {
    name: 'Lateral Raise',
    primaryMuscles: ['Side delts'],
    secondaryMuscles: ['Delts'],
    movement: 'shoulder abduction',
    equipment: 'Dumbbell',
    substitutions: ['Face Pull', 'Overhead Press'],
  },
  '20': {
    name: 'Face Pull',
    primaryMuscles: ['Delts', 'Back'],
    secondaryMuscles: [],
    movement: 'rear delt pull',
    equipment: 'Cable',
    substitutions: ['Lateral Raise', 'Barbell Row', 'T-Bar Row'],
  },
  '21': {
    name: 'Dumbbell Bench Press',
    primaryMuscles: ['Chest'],
    secondaryMuscles: ['Triceps', 'Delts'],
    movement: 'horizontal press',
    equipment: 'Dumbbell',
    substitutions: ['Barbell Bench Press', 'Chest Dips', 'Cable Fly'],
  },
  '22': {
    name: 'Chest Dips',
    primaryMuscles: ['Chest', 'Triceps'],
    secondaryMuscles: ['Delts'],
    movement: 'dip',
    equipment: 'Bodyweight',
    substitutions: ['Barbell Bench Press', 'Close-Grip Bench Press'],
  },
  '23': {
    name: 'Cable Crossover',
    primaryMuscles: ['Chest'],
    secondaryMuscles: [],
    movement: 'chest fly',
    equipment: 'Cable',
    substitutions: ['Cable Fly', 'Incline Dumbbell Press'],
  },
  '24': {
    name: 'T-Bar Row',
    primaryMuscles: ['Back'],
    secondaryMuscles: ['Biceps'],
    movement: 'horizontal pull',
    equipment: 'Barbell',
    substitutions: ['Barbell Row', 'Lat Pulldown'],
  },
  '25': {
    name: 'Chin-ups',
    primaryMuscles: ['Back'],
    secondaryMuscles: ['Biceps'],
    movement: 'vertical pull',
    equipment: 'Bodyweight',
    substitutions: ['Lat Pulldown', 'Pull-ups', 'Barbell Row'],
  },
  '26': {
    name: 'Preacher Curl',
    primaryMuscles: ['Biceps'],
    secondaryMuscles: [],
    movement: 'elbow flexion',
    equipment: 'Machine',
    substitutions: ['Barbell Curl', 'Hammer Curl'],
  },
  '27': {
    name: 'Skull Crushers',
    primaryMuscles: ['Triceps'],
    secondaryMuscles: [],
    movement: 'elbow extension',
    equipment: 'Barbell',
    substitutions: ['Tricep Pushdown', 'Overhead Tricep Extension'],
  },
  '28': {
    name: 'Front Squat',
    primaryMuscles: ['Quads', 'Glutes'],
    secondaryMuscles: ['Hamstrings'],
    movement: 'squat',
    equipment: 'Barbell',
    substitutions: ['Squat', 'Leg Press', 'Leg Extension'],
  },
  '29': {
    name: 'Bulgarian Split Squat',
    primaryMuscles: ['Quads', 'Glutes'],
    secondaryMuscles: ['Hamstrings'],
    movement: 'single-leg squat',
    equipment: 'Dumbbell',
    substitutions: ['Leg Press', 'Front Squat', 'Leg Extension'],
  },
  '30': {
    name: 'Hip Thrust',
    primaryMuscles: ['Glutes'],
    secondaryMuscles: ['Hamstrings'],
    movement: 'hip extension',
    equipment: 'Barbell',
    substitutions: ['Romanian Deadlift', 'Deadlift', 'Leg Curl'],
  },
};

export const commonInsightMuscles = [
  'Chest',
  'Back',
  'Delts',
  'Biceps',
  'Triceps',
  'Quads',
  'Hamstrings',
  'Glutes',
  'Calves',
  'Forearms',
  'Core',
];

export function getExerciseMetadata(exerciseId: string, exerciseName?: string, fallbackMuscles: string[] = []): ExerciseMetadata {
  const known = metadataById[exerciseId];
  if (known) {
    return { id: exerciseId, ...known };
  }

  const exercise = exercises.find((item) => item.id === exerciseId || item.name === exerciseName);
  const primaryMuscles = exercise?.mainMuscles ?? fallbackMuscles;

  return {
    id: exerciseId,
    name: exercise?.name ?? exerciseName ?? 'Exercise',
    primaryMuscles,
    secondaryMuscles: [],
    movement: exercise?.category?.toLowerCase() ?? 'general',
    equipment: exercise?.equipment,
    substitutions: [],
  };
}

export function getExerciseMetadataByName(exerciseName: string) {
  const known = Object.entries(metadataById).find(([, metadata]) => metadata.name === exerciseName);
  if (!known) return null;
  return { id: known[0], ...known[1] };
}
