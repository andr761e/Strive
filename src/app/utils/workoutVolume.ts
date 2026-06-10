import { exercises, type Exercise, type ExerciseLog, type WorkoutSet } from '../data/mockData';

type VolumeSet = Pick<WorkoutSet, 'weight' | 'reps'>;

type VolumeExercise = Partial<Pick<ExerciseLog, 'exerciseId' | 'exerciseName' | 'sets'>> &
  Partial<Pick<Exercise, 'id' | 'name' | 'equipment'>> & {
    sets?: VolumeSet[];
  };

type VolumeWorkout = {
  exercises: VolumeExercise[];
};

function safeNumber(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function getExerciseReference(exercise: VolumeExercise) {
  const id = exercise.exerciseId ?? exercise.id;
  if (id) {
    const byId = exercises.find((item) => item.id === id);
    if (byId) return byId;
  }

  const name = exercise.exerciseName ?? exercise.name;
  if (!name) return null;
  return exercises.find((item) => item.name.toLowerCase() === name.toLowerCase()) ?? null;
}

export function getExerciseVolumeLoadMultiplier(exercise: VolumeExercise) {
  const reference = getExerciseReference(exercise);
  const equipment = (exercise.equipment ?? reference?.equipment ?? '').toLowerCase();
  const name = (exercise.exerciseName ?? exercise.name ?? reference?.name ?? '').toLowerCase();

  // Dumbbell loads are logged as the weight of one dumbbell. For total session
  // tonnage we convert that logged load into actual lifted load. Do not use this
  // helper for exercise-rank math: dumbbell rank standards intentionally stay
  // based on the per-hand logged load.
  if (equipment.includes('dumbbell') || name.includes('dumbbell')) return 2;

  return 1;
}

export function getSetLiftedLoadVolume(set: VolumeSet, exercise: VolumeExercise) {
  return safeNumber(set.weight) * safeNumber(set.reps) * getExerciseVolumeLoadMultiplier(exercise);
}

export function getExerciseLiftedLoadVolume(exercise: VolumeExercise) {
  return (exercise.sets ?? []).reduce((total, set) => total + getSetLiftedLoadVolume(set, exercise), 0);
}

export function getWorkoutLiftedLoadVolume(workout: VolumeWorkout) {
  return workout.exercises.reduce((total, exercise) => total + getExerciseLiftedLoadVolume(exercise), 0);
}
