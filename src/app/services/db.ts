import { seedDatabase } from '../../../db/seed';
import {
  exercises,
  type Exercise,
  type ExerciseLog as AppExerciseLog,
  type MuscleGroup,
  type SetType,
} from '../data/mockData';
import { isStrongPassword, isValidEmail, isValidUsername } from '../utils/authValidation';

const STORAGE_KEY = 'strive_app_database_v2';
const LEGACY_STORAGE_KEY = 'strive_app_database_v1';
const SESSION_KEY = 'strive_app_session_user';
const ALEX_SEED_USER_ID = '6fcb7a80-f6e7-4e4e-88da-15d4b9bcf502';

const DEFAULT_TRACKED_EXERCISE_IDS = ['1', '13', '7'];
const DEFAULT_PERSONAL_RECORD_EXERCISE_IDS = ['1', '13', '7', '18'];

export type ProgressSectionKey =
  | 'strengthChart'
  | 'muscleBalance'
  | 'bodyMap'
  | 'bestMovers'
  | 'plateauWatch'
  | 'recentRecords';

export const progressSections: { key: ProgressSectionKey; label: string }[] = [
  { key: 'strengthChart', label: 'Strength chart' },
  { key: 'muscleBalance', label: 'Muscle balance' },
  { key: 'bodyMap', label: 'Body map' },
  { key: 'bestMovers', label: 'Best movers' },
  { key: 'plateauWatch', label: 'Plateau watch' },
  { key: 'recentRecords', label: 'Recent records' },
];

export const progressMuscleGroups: MuscleGroup[] = [
  'Chest',
  'Back',
  'Delts',
  'Biceps',
  'Triceps',
  'Quads',
  'Hamstrings',
  'Glutes',
  'Forearms',
  'Calves',
  'Core',
  'Cardio',
  'Warm-up',
  'Abs',
];

export interface WorkoutSet {
  setNumber: number;
  weight: number;
  reps: number;
  rir?: number;
  duration?: number;
  distance?: number;
  incline?: number;
  type: SetType;
  completed: boolean;
}

export interface ExerciseLog {
  exerciseId: string;
  exerciseName: string;
  mainMuscles: MuscleGroup[];
  sets: WorkoutSet[];
}

export interface WorkoutRecord {
  id: string;
  userId: string;
  workoutName: string;
  date: string;
  duration: number;
  bodyweightKg?: number;
  exercises: ExerciseLog[];
  notes?: string;
  sessionFeeling?: number | null;
  sourceRoutineId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DBUser {
  id: string;
  name: string;
  username: string;
  email: string;
  birthday: string;
  gender: string;
  dateJoined: string;
  password: string;
  height: number;
  weight: number;
  experience: string;
  goal: string;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RoutineSet {
  type: SetType;
  weight: number;
  reps: number;
  rir?: number;
  duration?: number;
  distance?: number;
  incline?: number;
}

export interface RoutineExerciseLog {
  exerciseId: string;
  exerciseName: string;
  mainMuscles: MuscleGroup[];
  sets: RoutineSet[];
}

export interface WorkoutRoutine {
  id: string;
  userId: string;
  name: string;
  exercises: Exercise[];
  exerciseLogs?: RoutineExerciseLog[];
  lastPerformed?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProgressPreference {
  userId: string;
  trackedExerciseIds: string[];
  visibleSections: Record<ProgressSectionKey, boolean>;
  sectionOrder: ProgressSectionKey[];
  visibleMuscleGroups: MuscleGroup[];
  personalRecordExerciseIds: string[];
  currentGoals: CurrentGoalPreference[];
}

export interface CurrentGoalPreference {
  exerciseId: string;
  targetWeight: number;
}

export interface PersonalRecord {
  exerciseId: string;
  exercise: string;
  weight: number;
  reps: number;
  date: string;
  estimatedOneRepMax: number;
  hasRecord: boolean;
}

export interface MuscleAnalysisItem {
  muscle: MuscleGroup;
  status: 'progressing' | 'balanced' | 'watch' | 'undertrained' | 'overtrained' | 'recovering';
  color: string;
  weeklySets: number;
  lastTrained: string;
  signal: string;
}

export interface ExerciseProgressOption extends Exercise {
  hasHistory: boolean;
}

interface LocalDb {
  users: DBUser[];
  workouts: WorkoutRecord[];
  routines: WorkoutRoutine[];
  progressPreferences: ProgressPreference[];
}

interface SaveWorkoutInput {
  workoutName: string;
  durationSeconds: number;
  exercises: AppExerciseLog[];
  bodyweightKg?: number | null;
  notes?: string;
  sessionFeeling?: number | null;
  sourceRoutineId?: string | null;
}

interface SaveRoutineInput {
  id?: string;
  name: string;
  exercises: Exercise[];
  exerciseLogs?: RoutineExerciseLog[];
}

let cachedDatabase: LocalDb | null = null;

function getStorage() {
  return typeof window !== 'undefined' ? window.localStorage : null;
}

function createId(prefix: string) {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function normalizeDate(value: string | Date) {
  const date = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) {
    return normalizeDate(new Date());
  }
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate(),
  ).padStart(2, '0')}`;
}

function normalizeBodyweightKg(value: unknown) {
  const bodyweight = Number(value);
  if (!Number.isFinite(bodyweight) || bodyweight <= 0) return undefined;
  return Math.max(30, Math.min(300, Math.round(bodyweight * 10) / 10));
}

function getDateOnly(date = new Date()) {
  return normalizeDate(date);
}

function daysBetween(from: string, to = new Date()) {
  const fromDate = new Date(`${from}T00:00:00`);
  const toDate = new Date(`${normalizeDate(to)}T00:00:00`);
  return Math.round((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24));
}

function formatLastTrained(date: string | null) {
  if (!date) return 'No recent work';
  const days = daysBetween(date);
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  return `${days} days ago`;
}

function sortWorkouts(workouts: WorkoutRecord[]) {
  return [...workouts].sort((a, b) => {
    const dateDiff = new Date(b.date).getTime() - new Date(a.date).getTime();
    if (dateDiff !== 0) return dateDiff;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

const staleAlexSeedWorkoutIds = new Set([
  '1006a775-19f4-4b2f-aa05-d116dc6d1a0d',
  '14b8c15f-1e72-48a0-bd76-273d7a3caf8b',
  'a551a17b-4f17-4bda-8ccd-4706b4f814da',
]);

function isStaleAlexSeedWorkout(workout: Partial<Pick<WorkoutRecord, 'id' | 'userId'>>) {
  const id = workout.id ?? '';
  return (
    workout.userId === ALEX_SEED_USER_ID &&
    (staleAlexSeedWorkoutIds.has(id) || id.startsWith('alex-2026-') || id.startsWith('alex-balanced-'))
  );
}

function getDefaultVisibleSections(): Record<ProgressSectionKey, boolean> {
  return {
    strengthChart: true,
    muscleBalance: true,
    bodyMap: true,
    bestMovers: true,
    plateauWatch: true,
    recentRecords: true,
  };
}

function getDefaultSectionOrder(): ProgressSectionKey[] {
  return progressSections.map((section) => section.key);
}

function getDefaultProgressMuscles(): MuscleGroup[] {
  return progressMuscleGroups.filter((muscle) => muscle !== 'Cardio' && muscle !== 'Warm-up' && muscle !== 'Abs');
}

function getDefaultProgressPreference(userId: string): ProgressPreference {
  return {
    userId,
    trackedExerciseIds: DEFAULT_TRACKED_EXERCISE_IDS,
    personalRecordExerciseIds: DEFAULT_PERSONAL_RECORD_EXERCISE_IDS,
    currentGoals: DEFAULT_TRACKED_EXERCISE_IDS.slice(0, 3).map((exerciseId) => ({
      exerciseId,
      targetWeight: 0,
    })),
    visibleSections: getDefaultVisibleSections(),
    sectionOrder: getDefaultSectionOrder(),
    visibleMuscleGroups: getDefaultProgressMuscles(),
  };
}

interface StarterRoutineExerciseSpec {
  exerciseId: string;
  sets: number;
  reps?: number;
  duration?: number;
}

const starterRoutineSpecs: { name: string; exercises: StarterRoutineExerciseSpec[] }[] = [
  {
    name: 'Full Body A',
    exercises: [
      { exerciseId: '13', sets: 3, reps: 8 },
      { exerciseId: '1', sets: 3, reps: 10 },
      { exerciseId: '6', sets: 3, reps: 12 },
      { exerciseId: '134', sets: 2, reps: 12 },
      { exerciseId: '67', sets: 2, reps: 15 },
      { exerciseId: '240', sets: 3, duration: 60 },
    ],
  },
  {
    name: 'Full Body B',
    exercises: [
      { exerciseId: '16', sets: 3, reps: 10 },
      { exerciseId: '18', sets: 3, reps: 8 },
      { exerciseId: '52', sets: 3, reps: 12 },
      { exerciseId: '14', sets: 3, reps: 15 },
      { exerciseId: '11', sets: 2, reps: 15 },
      { exerciseId: '244', sets: 3, reps: 15 },
    ],
  },
  {
    name: 'Full Body C',
    exercises: [
      { exerciseId: '7', sets: 3, reps: 6 },
      { exerciseId: '2', sets: 3, reps: 12 },
      { exerciseId: '4', sets: 3, reps: 10 },
      { exerciseId: '17', sets: 3, reps: 15 },
      { exerciseId: '19', sets: 2, reps: 20 },
      { exerciseId: '245', sets: 3, reps: 15 },
    ],
  },
  {
    name: 'Upper Body A',
    exercises: [
      { exerciseId: '1', sets: 4, reps: 8 },
      { exerciseId: '5', sets: 4, reps: 10 },
      { exerciseId: '2', sets: 3, reps: 12 },
      { exerciseId: '6', sets: 3, reps: 12 },
      { exerciseId: '19', sets: 3, reps: 20 },
      { exerciseId: '11', sets: 2, reps: 15 },
      { exerciseId: '67', sets: 2, reps: 15 },
    ],
  },
  {
    name: 'Upper Body B',
    exercises: [
      { exerciseId: '18', sets: 4, reps: 8 },
      { exerciseId: '4', sets: 4, reps: 10 },
      { exerciseId: '32', sets: 3, reps: 12 },
      { exerciseId: '52', sets: 3, reps: 12 },
      { exerciseId: '20', sets: 3, reps: 20 },
      { exerciseId: '10', sets: 2, reps: 10 },
      { exerciseId: '9', sets: 2, reps: 15 },
    ],
  },
  {
    name: 'Lower Body A',
    exercises: [
      { exerciseId: '13', sets: 4, reps: 8 },
      { exerciseId: '16', sets: 3, reps: 10 },
      { exerciseId: '14', sets: 3, reps: 15 },
      { exerciseId: '17', sets: 3, reps: 15 },
      { exerciseId: '156', sets: 4, reps: 15 },
      { exerciseId: '245', sets: 3, reps: 15 },
    ],
  },
  {
    name: 'Lower Body B',
    exercises: [
      { exerciseId: '7', sets: 3, reps: 6 },
      { exerciseId: '28', sets: 3, reps: 10 },
      { exerciseId: '29', sets: 3, reps: 12 },
      { exerciseId: '15', sets: 3, reps: 15 },
      { exerciseId: '161', sets: 4, reps: 20 },
      { exerciseId: '240', sets: 3, duration: 60 },
    ],
  },
  {
    name: 'Push',
    exercises: [
      { exerciseId: '1', sets: 4, reps: 8 },
      { exerciseId: '134', sets: 3, reps: 12 },
      { exerciseId: '2', sets: 3, reps: 12 },
      { exerciseId: '19', sets: 4, reps: 20 },
      { exerciseId: '3', sets: 3, reps: 15 },
      { exerciseId: '11', sets: 3, reps: 15 },
      { exerciseId: '86', sets: 2, reps: 15 },
    ],
  },
  {
    name: 'Pull',
    exercises: [
      { exerciseId: '4', sets: 4, reps: 10 },
      { exerciseId: '5', sets: 4, reps: 10 },
      { exerciseId: '6', sets: 3, reps: 12 },
      { exerciseId: '52', sets: 3, reps: 12 },
      { exerciseId: '20', sets: 3, reps: 20 },
      { exerciseId: '67', sets: 3, reps: 15 },
      { exerciseId: '9', sets: 2, reps: 15 },
    ],
  },
  {
    name: 'Legs',
    exercises: [
      { exerciseId: '13', sets: 4, reps: 8 },
      { exerciseId: '16', sets: 3, reps: 10 },
      { exerciseId: '14', sets: 3, reps: 15 },
      { exerciseId: '17', sets: 3, reps: 15 },
      { exerciseId: '15', sets: 3, reps: 15 },
      { exerciseId: '156', sets: 4, reps: 15 },
      { exerciseId: '244', sets: 3, reps: 15 },
    ],
  },
];

function createStarterRoutineSet(spec: StarterRoutineExerciseSpec): RoutineSet {
  return {
    type: 'normal',
    weight: 0,
    reps: spec.reps ?? 0,
    duration: spec.duration,
  };
}

function createStarterRoutinesForUser(userId: string, now = new Date().toISOString()): WorkoutRoutine[] {
  return starterRoutineSpecs.map((routine) => {
    const routineExercises = routine.exercises
      .map((spec) => exercises.find((exercise) => exercise.id === spec.exerciseId))
      .filter((exercise): exercise is Exercise => Boolean(exercise));
    const exerciseLogs = routine.exercises
      .map((spec) => {
        const exercise = exercises.find((item) => item.id === spec.exerciseId);
        if (!exercise) return null;

        return {
          exerciseId: exercise.id,
          exerciseName: exercise.name,
          mainMuscles: exercise.mainMuscles,
          sets: Array.from({ length: spec.sets }, () => createStarterRoutineSet(spec)),
        };
      })
      .filter((log): log is RoutineExerciseLog => Boolean(log));

    return {
      id: `${userId}-starter-${routine.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
      userId,
      name: routine.name,
      exercises: routineExercises,
      exerciseLogs,
      createdAt: now,
      updatedAt: now,
    };
  });
}

function createSampleRoutineSet(exercise: Exercise): RoutineSet {
  const set: RoutineSet = {
    type: 'normal',
    weight: 0,
    reps: 0,
    duration: undefined,
    distance: undefined,
    incline: undefined,
  };

  exercise.logging.fields.forEach((field) => {
    if (field.key === 'weight') set.weight = 0;
    if (field.key === 'reps') set.reps = 10;
    if (field.key === 'duration') set.duration = exercise.logging.mode === 'timed_hold' ? 30 : 10;
    if (field.key === 'distance') set.distance = field.unit === 'm' ? 40 : 1;
    if (field.key === 'incline') set.incline = 5;
  });

  return set;
}

function createAlexAllExercisesRoutine(now = new Date().toISOString()): WorkoutRoutine {
  return {
    id: `${ALEX_SEED_USER_ID}-utility-all-exercises`,
    userId: ALEX_SEED_USER_ID,
    name: 'ALL',
    exercises,
    exerciseLogs: exercises.map((exercise) => ({
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      mainMuscles: exercise.mainMuscles,
      sets: [createSampleRoutineSet(exercise)],
    })),
    createdAt: now,
    updatedAt: now,
  };
}

function coerceSet(set: Partial<WorkoutSet>, index: number): WorkoutSet {
  return {
    setNumber: index + 1,
    weight: Number(set.weight) || 0,
    reps: Number(set.reps) || 0,
    rir: set.rir === undefined ? undefined : Number(set.rir),
    duration: set.duration === undefined ? undefined : Number(set.duration) || 0,
    distance: set.distance === undefined ? undefined : Number(set.distance) || 0,
    incline: set.incline === undefined ? undefined : Number(set.incline) || 0,
    type: set.type ?? 'normal',
    completed: set.completed ?? true,
  };
}

function coerceExerciseLog(log: Partial<ExerciseLog>): ExerciseLog {
  const exercise = exercises.find((item) => item.id === log.exerciseId);
  const sets = Array.isArray(log.sets) ? log.sets.map(coerceSet) : [];

  return {
    exerciseId: log.exerciseId ?? exercise?.id ?? createId('exercise'),
    exerciseName: log.exerciseName ?? exercise?.name ?? 'Exercise',
    mainMuscles: (log.mainMuscles ?? exercise?.mainMuscles ?? []) as MuscleGroup[],
    sets,
  };
}

function coerceRoutineSet(set: Partial<RoutineSet>): RoutineSet {
  return {
    type: set.type ?? 'normal',
    weight: Number(set.weight) || 0,
    reps: Number(set.reps) || 0,
    rir: set.rir === undefined ? undefined : Number(set.rir),
    duration: set.duration === undefined ? undefined : Number(set.duration) || 0,
    distance: set.distance === undefined ? undefined : Number(set.distance) || 0,
    incline: set.incline === undefined ? undefined : Number(set.incline) || 0,
  };
}

function normalizeRoutine(raw: Partial<WorkoutRoutine>, userId: string, fallbackIndex: number): WorkoutRoutine {
  const now = new Date().toISOString();
  const logs = raw.exerciseLogs?.map((log) => ({
    exerciseId: log.exerciseId,
    exerciseName: log.exerciseName,
    mainMuscles: log.mainMuscles,
    sets: log.sets.map(coerceRoutineSet),
  }));
  const routineExercises = raw.exercises?.filter(Boolean) ?? [];

  return {
    id: raw.id ?? `${userId}-routine-${fallbackIndex}`,
    userId: raw.userId ?? userId,
    name: raw.name?.trim() || 'Untitled Routine',
    exercises: routineExercises,
    exerciseLogs: logs,
    lastPerformed: raw.lastPerformed ? normalizeDate(raw.lastPerformed) : undefined,
    createdAt: raw.createdAt ?? now,
    updatedAt: raw.updatedAt ?? now,
  };
}

function normalizePreference(raw: Partial<ProgressPreference> | undefined, userId: string): ProgressPreference {
  const defaults = getDefaultProgressPreference(userId);
  const validSectionKeys = progressSections.map((section) => section.key);
  const rawSectionOrder = raw?.sectionOrder?.filter((key): key is ProgressSectionKey =>
    validSectionKeys.includes(key as ProgressSectionKey),
  );
  const sectionOrder = Array.from(
    new Set([...(rawSectionOrder?.length ? rawSectionOrder : defaults.sectionOrder), ...defaults.sectionOrder]),
  );
  const rawVisibleMuscles = raw?.visibleMuscleGroups?.filter((muscle): muscle is MuscleGroup =>
    progressMuscleGroups.includes(muscle as MuscleGroup),
  );
  const visibleMuscleGroups = Array.from(
    new Set(rawVisibleMuscles?.length ? rawVisibleMuscles : defaults.visibleMuscleGroups),
  );

  return {
    userId,
    trackedExerciseIds:
      raw?.trackedExerciseIds?.filter((id) => exercises.some((exercise) => exercise.id === id)) ??
      defaults.trackedExerciseIds,
    personalRecordExerciseIds:
      raw?.personalRecordExerciseIds?.filter((id) => exercises.some((exercise) => exercise.id === id)) ??
      defaults.personalRecordExerciseIds,
    currentGoals:
      raw?.currentGoals
        ?.filter((goal) => exercises.some((exercise) => exercise.id === goal.exerciseId))
        .slice(0, 3)
        .map((goal) => ({
          exerciseId: goal.exerciseId,
          targetWeight: Math.max(0, Number(goal.targetWeight) || 0),
        })) ?? defaults.currentGoals,
    visibleSections: {
      ...defaults.visibleSections,
      ...(raw?.visibleSections ?? {}),
    },
    sectionOrder,
    visibleMuscleGroups,
  };
}

function normalizeDatabase(input: Partial<LocalDb> | null | undefined) {
  const rawUsers = (Array.isArray(input?.users) ? input.users : seedDatabase.users) as Array<Partial<DBUser>>;
  const users = rawUsers.map((user) => ({
    ...user,
    gender: typeof user.gender === 'string' && user.gender.trim() ? user.gender.trim() : 'Prefer not to say',
  })) as DBUser[];
  const userIds = new Set(users.map((user) => user.id));
  const rawInputWorkouts = Array.isArray(input?.workouts) ? input.workouts : seedDatabase.workouts;
  const inputWorkouts = rawInputWorkouts.filter((workout) => !isStaleAlexSeedWorkout(workout));
  const existingWorkoutIds = new Set(inputWorkouts.map((workout) => workout.id));
  const workouts = [
    ...inputWorkouts,
    ...(!Array.isArray(input?.workouts)
      ? seedDatabase.workouts.filter((workout) => !existingWorkoutIds.has(workout.id))
      : []),
  ]
    .filter((workout) => userIds.has(workout.userId))
    .map((workout) => ({
      ...workout,
      date: normalizeDate(workout.date),
      bodyweightKg:
        normalizeBodyweightKg((workout as Partial<WorkoutRecord>).bodyweightKg) ??
        normalizeBodyweightKg(users.find((user) => user.id === workout.userId)?.weight),
      exercises: workout.exercises.map(coerceExerciseLog),
    })) as WorkoutRecord[];

  let routines = Array.isArray(input?.routines) ? input.routines : [];
  const normalizedRoutines = routines
    .map((routine, index) => normalizeRoutine(routine, routine.userId, index))
    .filter((routine) => userIds.has(routine.userId));

  const alexUserExists = users.some((user) => user.id === ALEX_SEED_USER_ID);
  if (alexUserExists) {
    const alexAllRoutine = createAlexAllExercisesRoutine();
    routines = [
      alexAllRoutine,
      ...normalizedRoutines.filter(
        (routine) =>
          routine.id !== alexAllRoutine.id &&
          !(routine.userId === ALEX_SEED_USER_ID && routine.name.trim().toLowerCase() === 'all'),
      ),
    ];
  } else {
    routines = normalizedRoutines;
  }

  const progressPreferences = users.map((user) => {
    const existing = input?.progressPreferences?.find((preference) => preference.userId === user.id);
    return normalizePreference(existing, user.id);
  });

  return {
    users,
    workouts,
    routines,
    progressPreferences,
  };
}

function readDatabase(): LocalDb {
  if (cachedDatabase) {
    return cachedDatabase;
  }

  const storage = getStorage();
  if (!storage) {
    cachedDatabase = normalizeDatabase(seedDatabase);
    return cachedDatabase;
  }

  const raw = storage.getItem(STORAGE_KEY) ?? storage.getItem(LEGACY_STORAGE_KEY);
  if (!raw) {
    const database = normalizeDatabase(seedDatabase);
    cachedDatabase = database;
    storage.setItem(STORAGE_KEY, JSON.stringify(database));
    return database;
  }

  try {
    const database = normalizeDatabase(JSON.parse(raw) as Partial<LocalDb>);
    cachedDatabase = database;
    storage.setItem(STORAGE_KEY, JSON.stringify(database));
    return database;
  } catch {
    const database = normalizeDatabase(seedDatabase);
    cachedDatabase = database;
    storage.setItem(STORAGE_KEY, JSON.stringify(database));
    return database;
  }
}

function writeDatabase(database: LocalDb) {
  const normalizedDatabase = normalizeDatabase(database);
  cachedDatabase = normalizedDatabase;

  const storage = getStorage();
  if (!storage) return;
  storage.setItem(STORAGE_KEY, JSON.stringify(normalizedDatabase));
}

function getDb() {
  return readDatabase();
}

function saveDb(db: LocalDb) {
  writeDatabase(db);
}

function exerciseVolume(exercise: ExerciseLog) {
  return exercise.sets.reduce((total, set) => total + set.weight * set.reps, 0);
}

function workoutVolume(workout: WorkoutRecord) {
  return workout.exercises.reduce((total, exercise) => total + exerciseVolume(exercise), 0);
}

const defaultMuscleContributionWeights = [1, 0.5, 0.35, 0.25];

function normalizeExerciseName(name: string) {
  return name.toLowerCase();
}

function contributionMap(entries: Array<[MuscleGroup, number]>, fallbackMuscles: MuscleGroup[]) {
  const contributions = new Map<MuscleGroup, number>();

  fallbackMuscles.forEach((muscle, index) => {
    contributions.set(muscle, defaultMuscleContributionWeights[index] ?? 0.25);
  });

  entries.forEach(([muscle, weight]) => {
    contributions.set(muscle, weight);
  });

  return contributions;
}

function getMuscleSetContributions(exercise: ExerciseLog) {
  const name = normalizeExerciseName(exercise.exerciseName);
  const muscles = exercise.mainMuscles;

  // Effective sets are weighted by likely contribution instead of giving every listed muscle
  // a full set. This keeps compound lifts from over-crediting secondary muscle groups.
  if (muscles.includes('Warm-up')) {
    return contributionMap(
      muscles.map((muscle) => [muscle, muscle === 'Warm-up' ? 1 : muscle === 'Cardio' ? 0.5 : 0] as [MuscleGroup, number]),
      muscles,
    );
  }

  if (name.includes('run') || name.includes('walk') || name.includes('bike') || name.includes('cycling') || name.includes('stairmaster')) {
    return contributionMap([['Cardio', 1]], muscles);
  }

  if (name.includes('close-grip') || name.includes('jm press') || name.includes('triceps dip') || name.includes('bench dip')) {
    return contributionMap(
      [
        ['Triceps', 1],
        ['Chest', 0.5],
        ['Delts', 0.25],
      ],
      muscles,
    );
  }

  if (name.includes('fly') || name.includes('pec deck')) {
    return contributionMap(
      [
        ['Chest', 1],
        ['Delts', 0],
        ['Triceps', 0],
      ],
      muscles,
    );
  }

  if (name.includes('bench press') || name.includes('chest press') || name.includes('push-up') || name.includes('chest dip')) {
    return contributionMap(
      [
        ['Chest', 1],
        ['Triceps', 0.5],
        ['Delts', 0.25],
      ],
      muscles,
    );
  }

  if (
    name.includes('overhead press') ||
    name.includes('shoulder press') ||
    name.includes('arnold press') ||
    name.includes('landmine press') ||
    name.includes('push press')
  ) {
    return contributionMap(
      [
        ['Delts', 1],
        ['Triceps', 0.5],
        ['Chest', 0],
        ['Quads', name.includes('push press') ? 0.25 : 0],
      ],
      muscles,
    );
  }

  if (name.includes('lateral raise') || name.includes('front raise') || name.includes('rear delt raise')) {
    return contributionMap([['Delts', 1]], muscles);
  }

  if (name.includes('face pull') || name.includes('reverse pec deck') || name.includes('rear delt row')) {
    return contributionMap(
      [
        ['Delts', 0.75],
        ['Back', 0.5],
        ['Biceps', 0],
        ['Forearms', 0],
      ],
      muscles,
    );
  }

  if (name.includes('pull-up') || name.includes('chin-up') || name.includes('pulldown')) {
    return contributionMap(
      [
        ['Back', 1],
        ['Biceps', 0.5],
        ['Forearms', 0.25],
      ],
      muscles,
    );
  }

  if (name.includes('row') || name.includes('pullover')) {
    return contributionMap(
      [
        ['Back', 1],
        ['Biceps', 0.5],
        ['Forearms', 0.25],
        ['Delts', 0.25],
      ],
      muscles,
    );
  }

  if (name.includes('curl')) {
    return contributionMap(
      [
        ['Biceps', 1],
        ['Forearms', name.includes('hammer') || name.includes('reverse') ? 0.5 : 0.25],
      ],
      muscles,
    );
  }

  if (name.includes('pushdown') || name.includes('skullcrusher') || name.includes('triceps extension') || name.includes('kickback')) {
    return contributionMap([['Triceps', 1]], muscles);
  }

  if (name.includes('leg extension') || name.includes('sissy squat') || name.includes('spanish squat')) {
    return contributionMap([['Quads', 1]], muscles);
  }

  if (name.includes('leg curl') || name.includes('nordic hamstring')) {
    return contributionMap([['Hamstrings', 1]], muscles);
  }

  if (name.includes('squat') || name.includes('leg press') || name.includes('lunge') || name.includes('step-up')) {
    return contributionMap(
      [
        ['Quads', 1],
        ['Hamstrings', 0.5],
        ['Glutes', muscles.includes('Glutes') ? 0.25 : 0],
      ],
      muscles,
    );
  }

  if (name.includes('hip thrust') || name.includes('glute bridge')) {
    return contributionMap(
      [
        ['Glutes', 1],
        ['Hamstrings', 0.5],
      ],
      muscles,
    );
  }

  if (
    name.includes('deadlift') ||
    name.includes('good morning') ||
    name.includes('back extension') ||
    name.includes('glute-ham') ||
    name.includes('pull-through') ||
    name.includes('kettlebell swing')
  ) {
    return contributionMap(
      [
        ['Hamstrings', 1],
        ['Glutes', muscles.includes('Glutes') ? 0.75 : 0],
        ['Back', name.includes('back extension') ? 0.5 : 0.25],
        ['Forearms', name.includes('deadlift') || name.includes('romanian') ? 0.25 : 0],
      ],
      muscles,
    );
  }

  if (name.includes('carry') || name.includes("farmer's walk") || name.includes('sled')) {
    return contributionMap(
      [
        ['Forearms', 1],
        ['Core', 0.5],
        ['Back', 0.25],
        ['Quads', name.includes('sled') ? 0.65 : 0.2],
        ['Glutes', name.includes('sled') ? 0.65 : 0.2],
        ['Hamstrings', name.includes('sled pull') ? 0.55 : 0.15],
      ],
      muscles,
    );
  }

  if (name.includes('calf raise') || name.includes('tibialis') || name.includes('toe raise')) {
    return contributionMap([['Calves', 1]], muscles);
  }

  if (name.includes('pallof') || name.includes('plank') || name.includes('hollow') || name.includes('dead bug')) {
    return contributionMap([['Core', 1]], muscles);
  }

  if (name.includes('dead hang')) {
    return contributionMap(
      [
        ['Forearms', 0.75],
        ['Back', 0.5],
      ],
      muscles,
    );
  }

  return contributionMap([], muscles);
}

function estimatedOneRepMax(weight: number, reps: number) {
  if (weight <= 0) return reps;
  return Math.round(weight * (1 + reps / 30));
}

function getBestSetForExercise(workouts: WorkoutRecord[], exerciseId: string) {
  let best: { weight: number; reps: number; score: number; date: string } | null = null;

  workouts.forEach((workout) => {
    workout.exercises
      .filter((exercise) => exercise.exerciseId === exerciseId)
      .forEach((exercise) => {
        exercise.sets.forEach((set) => {
          const score = estimatedOneRepMax(set.weight, set.reps);
          if (!best || score > best.score || (score === best.score && set.weight > best.weight)) {
            best = {
              weight: set.weight,
              reps: set.reps,
              score,
              date: workout.date,
            };
          }
        });
      });
  });

  return best;
}

function getExerciseIdsFromWorkouts(workouts: WorkoutRecord[]) {
  return Array.from(
    new Set(workouts.flatMap((workout) => workout.exercises.map((exercise) => exercise.exerciseId))),
  );
}

export const DataService = {
  initialize() {
    readDatabase();
  },

  getUsers() {
    return getDb().users;
  },

  getUserByUsername(username: string) {
    const users = getDb().users;
    return users.find((user) => user.username.toLowerCase() === username.toLowerCase()) || null;
  },

  getUserByEmail(email: string) {
    const users = getDb().users;
    return users.find((user) => user.email.toLowerCase() === email.toLowerCase()) || null;
  },

  getUserById(id: string) {
    const users = getDb().users;
    return users.find((user) => user.id === id) || null;
  },

  validateCredentials(identifier: string, password: string) {
    const normalizedIdentifier = identifier.trim().toLowerCase();
    const users = getDb().users;
    const user = users.find(
      (item) =>
        item.username.toLowerCase() === normalizedIdentifier ||
        item.email.toLowerCase() === normalizedIdentifier,
    );
    if (!user || user.password !== password) {
      return null;
    }
    return user;
  },

  createUser(user: {
    name: string;
    username: string;
    email: string;
    password: string;
    birthday: string;
    gender: string;
    height?: number;
    weight?: number;
    experience?: string;
    goal?: string;
  }) {
    const db = getDb();
    const name = user.name.trim();
    const username = user.username.trim();
    const email = user.email.trim().toLowerCase();
    const existingUsername = db.users.some((item) => item.username.toLowerCase() === username.toLowerCase());
    const existingEmail = db.users.some((item) => item.email.toLowerCase() === email);

    if (!name) {
      throw new Error('Please enter your name.');
    }
    if (!isValidUsername(username)) {
      throw new Error('Username must be 3-20 characters and use only letters, numbers, or underscores.');
    }
    if (!isValidEmail(email)) {
      throw new Error('Please enter a valid email address.');
    }
    if (!isStrongPassword(user.password)) {
      throw new Error('Password does not meet the strength requirements.');
    }
    if (!user.birthday || Number.isNaN(new Date(`${user.birthday}T00:00:00`).getTime())) {
      throw new Error('Please enter a valid birthday.');
    }
    if (!user.gender?.trim()) {
      throw new Error('Please select a gender.');
    }

    if (existingUsername) {
      throw new Error('Username already exists. Please choose another.');
    }
    if (existingEmail) {
      throw new Error('Email already exists. Please sign in instead.');
    }

    const now = new Date().toISOString();
    const newUser: DBUser = {
      id: createId('user'),
      name,
      username,
      email,
      birthday: user.birthday,
      gender: user.gender.trim(),
      dateJoined: normalizeDate(now),
      password: user.password,
      height: Math.max(100, Math.min(250, Math.round(Number(user.height) || 170))),
      weight: Math.max(30, Math.min(300, Math.round(Number(user.weight) || 72))),
      experience: user.experience || 'Intermediate',
      goal: user.goal || 'General Fitness',
      createdAt: now,
      updatedAt: now,
    };

    db.users = [newUser, ...db.users];
    db.routines = [...createStarterRoutinesForUser(newUser.id, now), ...db.routines];
    db.progressPreferences = [getDefaultProgressPreference(newUser.id), ...db.progressPreferences];
    saveDb(db);
    return newUser;
  },

  updateUserSettings(userId: string, updates: Partial<Omit<DBUser, 'id' | 'username' | 'createdAt'>>) {
    const db = getDb();
    const userIndex = db.users.findIndex((item) => item.id === userId);
    if (userIndex < 0) return null;

    const updatedUser = {
      ...db.users[userIndex],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    db.users[userIndex] = updatedUser;
    saveDb(db);
    return updatedUser;
  },

  resetUserData(userId: string) {
    const db = getDb();
    const userIndex = db.users.findIndex((item) => item.id === userId);
    if (userIndex < 0) return null;

    const now = new Date().toISOString();
    db.workouts = db.workouts.filter((workout) => workout.userId !== userId);
    db.routines = [
      ...createStarterRoutinesForUser(userId, now),
      ...db.routines.filter((routine) => routine.userId !== userId),
    ];
    db.progressPreferences = [
      getDefaultProgressPreference(userId),
      ...db.progressPreferences.filter((preference) => preference.userId !== userId),
    ];
    db.users[userIndex] = {
      ...db.users[userIndex],
      updatedAt: now,
    };

    saveDb(db);
    return db.users[userIndex];
  },

  deleteUserProfile(userId: string) {
    const db = getDb();
    const existingUser = db.users.find((item) => item.id === userId);
    if (!existingUser) return false;

    db.users = db.users.filter((item) => item.id !== userId);
    db.workouts = db.workouts.filter((workout) => workout.userId !== userId);
    db.routines = db.routines.filter((routine) => routine.userId !== userId);
    db.progressPreferences = db.progressPreferences.filter((preference) => preference.userId !== userId);

    saveDb(db);
    return true;
  },

  getWorkoutsByUserId(userId: string) {
    if (!userId) return [];
    const workouts = getDb().workouts.filter((workout) => workout.userId === userId);
    return sortWorkouts(workouts);
  },

  getLatestWorkout(userId: string) {
    const workouts = this.getWorkoutsByUserId(userId);
    return workouts[0] ?? null;
  },

  saveWorkout(userId: string, input: SaveWorkoutInput) {
    const db = getDb();
    const now = new Date().toISOString();
    const user = db.users.find((item) => item.id === userId);
    const exercisesToSave = input.exercises
      .map((exercise) => coerceExerciseLog(exercise as ExerciseLog))
      .filter((exercise) => exercise.sets.length > 0);

    const newWorkout: WorkoutRecord = {
      id: createId('workout'),
      userId,
      workoutName: input.workoutName.trim() || 'Workout',
      date: getDateOnly(),
      duration: Math.max(1, Math.round(input.durationSeconds / 60)),
      bodyweightKg: normalizeBodyweightKg(input.bodyweightKg) ?? normalizeBodyweightKg(user?.weight),
      exercises: exercisesToSave,
      notes: input.notes?.trim() || undefined,
      sessionFeeling: input.sessionFeeling ?? null,
      sourceRoutineId: input.sourceRoutineId ?? null,
      createdAt: now,
      updatedAt: now,
    };

    db.workouts = [newWorkout, ...db.workouts];

    if (input.sourceRoutineId) {
      db.routines = db.routines.map((routine) =>
        routine.id === input.sourceRoutineId && routine.userId === userId
          ? { ...routine, lastPerformed: newWorkout.date, updatedAt: now }
          : routine,
      );
    }

    saveDb(db);
    return newWorkout;
  },

  getPreviousWorkoutSets(userId: string, exerciseId: string) {
    const workout = this.getWorkoutsByUserId(userId).find((item) =>
      item.exercises.some((exercise) => exercise.exerciseId === exerciseId),
    );
    return workout?.exercises.find((exercise) => exercise.exerciseId === exerciseId)?.sets ?? null;
  },

  getRoutinesByUserId(userId: string) {
    const routines = getDb().routines.filter((routine) => routine.userId === userId);
    return [...routines].sort((a, b) => a.name.localeCompare(b.name));
  },

  getRoutineById(userId: string, routineId: string) {
    return getDb().routines.find((routine) => routine.userId === userId && routine.id === routineId) ?? null;
  },

  saveRoutine(userId: string, input: SaveRoutineInput) {
    const db = getDb();
    const now = new Date().toISOString();
    const existingIndex = input.id
      ? db.routines.findIndex((routine) => routine.id === input.id && routine.userId === userId)
      : -1;
    const routine: WorkoutRoutine = {
      id: existingIndex >= 0 ? db.routines[existingIndex].id : createId('routine'),
      userId,
      name: input.name.trim(),
      exercises: input.exercises,
      exerciseLogs: input.exerciseLogs,
      lastPerformed: existingIndex >= 0 ? db.routines[existingIndex].lastPerformed : undefined,
      createdAt: existingIndex >= 0 ? db.routines[existingIndex].createdAt : now,
      updatedAt: now,
    };

    if (existingIndex >= 0) {
      db.routines[existingIndex] = routine;
    } else {
      db.routines = [routine, ...db.routines];
    }

    saveDb(db);
    return routine;
  },

  deleteRoutine(userId: string, routineId: string) {
    const db = getDb();
    db.routines = db.routines.filter((routine) => !(routine.userId === userId && routine.id === routineId));
    saveDb(db);
  },

  updateRoutineFromWorkout(userId: string, routineId: string, workoutExercises: AppExerciseLog[]) {
    const existing = this.getRoutineById(userId, routineId);
    if (!existing) return null;

    const routineExercises = workoutExercises
      .map((exerciseLog) => exercises.find((exercise) => exercise.id === exerciseLog.exerciseId))
      .filter((exercise): exercise is Exercise => Boolean(exercise));
    const exerciseLogs = workoutExercises.map((exerciseLog) => ({
      exerciseId: exerciseLog.exerciseId,
      exerciseName: exerciseLog.exerciseName,
      mainMuscles: exerciseLog.mainMuscles,
      sets: exerciseLog.sets.map((set) => ({
        type: set.type ?? 'normal',
        weight: set.weight,
        reps: set.reps,
        duration: set.duration,
        distance: set.distance,
        incline: set.incline,
      })),
    }));

    return this.saveRoutine(userId, {
      id: routineId,
      name: existing.name,
      exercises: routineExercises,
      exerciseLogs,
    });
  },

  getPersonalRecords(userId: string) {
    const workouts = this.getWorkoutsByUserId(userId);
    const records = new Map<string, PersonalRecord>();

    workouts.forEach((workout) => {
      workout.exercises.forEach((exercise) => {
        exercise.sets.forEach((set) => {
          const score = estimatedOneRepMax(set.weight, set.reps);
          const existing = records.get(exercise.exerciseId);
          const isHeavier = !existing || set.weight > existing.weight;
          const isSameWeightMoreReps = existing && set.weight === existing.weight && set.reps > existing.reps;
          const isSameSetNewer =
            existing &&
            set.weight === existing.weight &&
            set.reps === existing.reps &&
            new Date(`${workout.date}T00:00:00`).getTime() > new Date(`${existing.date}T00:00:00`).getTime();

          if (isHeavier || isSameWeightMoreReps || isSameSetNewer) {
            records.set(exercise.exerciseId, {
              exerciseId: exercise.exerciseId,
              exercise: exercise.exerciseName,
              weight: set.weight,
              reps: set.reps,
              estimatedOneRepMax: score,
              date: workout.date,
              hasRecord: true,
            });
          }
        });
      });
    });

    return Array.from(records.values())
      .sort((a, b) => {
        if (b.weight !== a.weight) return b.weight - a.weight;
        if (b.reps !== a.reps) return b.reps - a.reps;
        return b.estimatedOneRepMax - a.estimatedOneRepMax;
      });
  },

  getPersonalRecordsForExercises(userId: string, exerciseIds: string[]) {
    const records = new Map(this.getPersonalRecords(userId).map((record) => [record.exerciseId, record]));

    return exerciseIds
      .map((exerciseId) => {
        const record = records.get(exerciseId);
        if (record) return record;

        const exercise = exercises.find((item) => item.id === exerciseId);
        if (!exercise) return null;

        return {
          exerciseId: exercise.id,
          exercise: exercise.name,
          weight: 0,
          reps: 0,
          estimatedOneRepMax: 0,
          date: '',
          hasRecord: false,
        };
      })
      .filter((record): record is PersonalRecord => Boolean(record));
  },

  getWorkoutSummary(userId: string) {
    const workouts = this.getWorkoutsByUserId(userId);
    const now = new Date();
    const firstDate = workouts.length ? new Date(`${workouts[workouts.length - 1].date}T00:00:00`) : now;
    const daysActive = Math.max(7, Math.ceil((now.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24)));
    const weeksActive = Math.max(1, daysActive / 7);
    return {
      totalWorkouts: workouts.length,
      weeklyAverage: Number((workouts.length / weeksActive).toFixed(1)),
    };
  },

  getWeeklyVolume(userId: string) {
    const workouts = this.getWorkoutsByUserId(userId);
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 7);

    return workouts
      .filter((workout) => new Date(`${workout.date}T00:00:00`) >= cutoff)
      .reduce(
        (acc, workout) => {
          const workoutSets = workout.exercises.flatMap((exercise) => exercise.sets);
          const weight = workoutSets.reduce((total, set) => total + set.weight * set.reps, 0);
          const reps = workoutSets.reduce((total, set) => total + set.reps, 0);
          return {
            totalSets: acc.totalSets + workoutSets.length,
            totalReps: acc.totalReps + reps,
            totalWeight: acc.totalWeight + weight,
          };
        },
        { totalSets: 0, totalReps: 0, totalWeight: 0 },
      );
  },

  getWorkoutStreak(userId: string) {
    const workouts = this.getWorkoutsByUserId(userId);
    if (!workouts.length) return 0;

    const workoutDates = new Set(workouts.map((workout) => workout.date));
    const latestDate = workouts[0].date;
    let cursor = new Date(`${latestDate}T00:00:00`);
    let streak = 0;

    while (workoutDates.has(normalizeDate(cursor))) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    }

    return streak;
  },

  getProgressExerciseOptions(userId: string): ExerciseProgressOption[] {
    const historyIds = new Set(getExerciseIdsFromWorkouts(this.getWorkoutsByUserId(userId)));
    return exercises.map((exercise) => ({
      ...exercise,
      hasHistory: historyIds.has(exercise.id),
    }));
  },

  getProgressPreferences(userId: string) {
    const db = getDb();
    const preference = db.progressPreferences.find((item) => item.userId === userId);
    if (preference) return normalizePreference(preference, userId);

    const nextPreference = getDefaultProgressPreference(userId);
    db.progressPreferences = [nextPreference, ...db.progressPreferences];
    saveDb(db);
    return nextPreference;
  },

  updateProgressPreferences(userId: string, updates: Partial<Omit<ProgressPreference, 'userId'>>) {
    const db = getDb();
    const current = normalizePreference(
      db.progressPreferences.find((item) => item.userId === userId),
      userId,
    );
    const next = normalizePreference({ ...current, ...updates, userId }, userId);
    const index = db.progressPreferences.findIndex((item) => item.userId === userId);

    if (index >= 0) {
      db.progressPreferences[index] = next;
    } else {
      db.progressPreferences = [next, ...db.progressPreferences];
    }

    saveDb(db);
    return next;
  },

  getProgressSeries(userId: string, exerciseId: string) {
    const workouts = this.getWorkoutsByUserId(userId).slice().reverse();
    return workouts
      .map((workout) => {
        const exercise = workout.exercises.find((item) => item.exerciseId === exerciseId);
        if (!exercise || !exercise.sets.length) return null;
        const bestSet = exercise.sets.reduce((best, set) => {
          const bestScore = estimatedOneRepMax(best.weight, best.reps);
          const nextScore = estimatedOneRepMax(set.weight, set.reps);
          return nextScore > bestScore ? set : best;
        }, exercise.sets[0]);
        return {
          date: workout.date,
          value: estimatedOneRepMax(bestSet.weight, bestSet.reps),
          weight: bestSet.weight,
          reps: bestSet.reps,
        };
      })
      .filter((point): point is { date: string; value: number; weight: number; reps: number } => point !== null);
  },

  getMuscleAnalysis(userId: string): MuscleAnalysisItem[] {
    const workouts = this.getWorkoutsByUserId(userId);
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 14);
    const recentWorkouts = workouts.filter((workout) => new Date(`${workout.date}T00:00:00`) >= cutoff);

    return progressMuscleGroups.map((muscle) => {
      const fortnightSets = recentWorkouts.reduce((total, workout) => {
        return (
          total +
          workout.exercises.reduce((exerciseTotal, exercise) => {
            const contribution = getMuscleSetContributions(exercise).get(muscle) ?? 0;
            if (contribution <= 0) return exerciseTotal;
            const workingSets = exercise.sets.filter((set) => set.type !== 'warmup').length;
            return exerciseTotal + workingSets * contribution;
          }, 0)
        );
      }, 0);
      const weeklySets = Number((fortnightSets / 2).toFixed(1));
      const lastWorkout = workouts.find((workout) =>
        workout.exercises.some((exercise) => {
          const contribution = getMuscleSetContributions(exercise).get(muscle) ?? 0;
          return contribution > 0 && exercise.sets.some((set) => set.type !== 'warmup');
        }),
      );
      const daysSince = lastWorkout ? daysBetween(lastWorkout.date) : null;

      let status: MuscleAnalysisItem['status'] = 'balanced';
      let color = 'bg-green-500';
      let signal = 'Balanced weekly dose';

      if (weeklySets >= 16) {
        status = 'overtrained';
        color = 'bg-red-500';
        signal = 'High effective volume';
      } else if (weeklySets >= 10) {
        status = daysSince !== null && daysSince <= 1 ? 'recovering' : 'progressing';
        color = status === 'recovering' ? 'bg-purple-500' : 'bg-blue-500';
        signal = status === 'recovering' ? 'Fresh fatigue signal' : 'Strong stimulus';
      } else if (weeklySets >= 6) {
        status = 'balanced';
      } else if (weeklySets >= 3) {
        status = 'watch';
        color = 'bg-yellow-500';
        signal = 'Could use a little more';
      } else {
        status = 'undertrained';
        color = 'bg-orange-500';
        signal = 'Low recent volume';
      }

      return {
        muscle,
        status,
        color,
        weeklySets,
        lastTrained: formatLastTrained(lastWorkout?.date ?? null),
        signal,
      };
    });
  },

  getMostImprovedExercises(userId: string) {
    const workouts = this.getWorkoutsByUserId(userId).slice().reverse();
    const exerciseIds = getExerciseIdsFromWorkouts(workouts);

    return exerciseIds
      .map((exerciseId) => {
        const points = workouts
          .map((workout) => {
            const exercise = workout.exercises.find((item) => item.exerciseId === exerciseId);
            if (!exercise) return null;
            const best = getBestSetForExercise([workout], exerciseId);
            if (!best) return null;
            return {
              date: workout.date,
              value: best.score,
              weight: best.weight,
              reps: best.reps,
            };
          })
          .filter((point): point is { date: string; value: number; weight: number; reps: number } => point !== null);

        if (points.length < 2) return null;
        const first = points[0];
        const last = points[points.length - 1];
        const changePercent = first.value ? ((last.value - first.value) / first.value) * 100 : 0;
        const exercise = exercises.find((item) => item.id === exerciseId);
        return {
          exerciseId,
          exerciseName: exercise?.name ?? 'Exercise',
          changePercent,
          from: first.value,
          to: last.value,
        };
      })
      .filter((item): item is { exerciseId: string; exerciseName: string; changePercent: number; from: number; to: number } =>
        Boolean(item) && item.changePercent > 0,
      )
      .sort((a, b) => b.changePercent - a.changePercent)
      .slice(0, 4);
  },

  getPotentialPlateaus(userId: string) {
    const workouts = this.getWorkoutsByUserId(userId).slice().reverse();
    const exerciseIds = getExerciseIdsFromWorkouts(workouts);

    return exerciseIds
      .map((exerciseId) => {
        const points = this.getProgressSeries(userId, exerciseId).slice(-4);
        if (points.length < 3) return null;
        const values = points.map((point) => point.value);
        const spread = Math.max(...values) - Math.min(...values);
        const latest = values[values.length - 1];
        if (latest === 0 || spread / latest > 0.03) return null;
        const exercise = exercises.find((item) => item.id === exerciseId);
        return {
          exerciseId,
          exerciseName: exercise?.name ?? 'Exercise',
          sessions: points.length,
          value: latest,
        };
      })
      .filter((item): item is { exerciseId: string; exerciseName: string; sessions: number; value: number } =>
        Boolean(item),
      )
      .slice(0, 4);
  },

  getWorkoutComparison(userId: string, totalVolume: number, totalSets: number) {
    const latestWorkout = this.getLatestWorkout(userId);
    if (!latestWorkout) {
      return { volumeChange: 0, setsChange: 0 };
    }

    const previousVolume = workoutVolume(latestWorkout);
    const previousSets = latestWorkout.exercises.reduce((total, exercise) => total + exercise.sets.length, 0);

    return {
      volumeChange: previousVolume ? ((totalVolume - previousVolume) / previousVolume) * 100 : 0,
      setsChange: totalSets - previousSets,
    };
  },
};

export function setSessionUser(userId: string | null) {
  const storage = getStorage();
  if (!storage) return;

  if (userId) {
    storage.setItem(SESSION_KEY, userId);
  } else {
    storage.removeItem(SESSION_KEY);
  }
}

export function getSessionUser() {
  const storage = getStorage();
  if (!storage) return null;
  return storage.getItem(SESSION_KEY);
}

export function clearSessionUser() {
  const storage = getStorage();
  if (!storage) return;
  storage.removeItem(SESSION_KEY);
}
