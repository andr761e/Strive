export interface SeedUser {
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

export interface SeedWorkoutSet {
  setNumber: number;
  weight: number;
  reps: number;
  rir?: number;
  duration?: number;
  distance?: number;
  incline?: number;
  type: 'normal' | 'warmup' | 'drop' | 'failure';
  completed: boolean;
}

export interface SeedExerciseLog {
  exerciseId: string;
  exerciseName: string;
  mainMuscles: string[];
  sets: SeedWorkoutSet[];
}

export interface SeedWorkout {
  id: string;
  userId: string;
  workoutName: string;
  date: string;
  duration: number;
  bodyweightKg?: number;
  exercises: SeedExerciseLog[];
  createdAt: string;
  updatedAt: string;
}

export const seedUsers: SeedUser[] = [
  {
    id: '6fcb7a80-f6e7-4e4e-88da-15d4b9bcf502',
    name: 'Alex Jones',
    username: 'alexj',
    email: 'alex.jones@striveapp.com',
    birthday: '1993-08-12',
    gender: 'Male',
    dateJoined: '2024-05-18',
    password: 'Strive2026!',
    height: 183,
    weight: 84,
    experience: 'Intermediate',
    goal: 'Strength',
    createdAt: '2024-05-18T09:00:00.000Z',
    updatedAt: '2026-04-01T08:00:00.000Z',
  },
  {
    id: 'f4e3d2b1-c5a9-4197-96ee-54d5f8c7fb01',
    name: 'Maria Chen',
    username: 'mariaC',
    email: 'maria.chen@striveapp.com',
    birthday: '1996-02-23',
    gender: 'Female',
    dateJoined: '2025-01-12',
    password: 'StrongStart25$',
    height: 168,
    weight: 62,
    experience: 'Intermediate',
    goal: 'Hypertrophy',
    createdAt: '2025-01-12T10:30:00.000Z',
    updatedAt: '2026-04-02T12:30:00.000Z',
  },
  {
    id: 'e7c17cf9-46bb-4ef2-9324-d204d8d92c73',
    name: 'Noah Smith',
    username: 'noah_s',
    email: 'noah.smith@striveapp.com',
    birthday: '1990-11-04',
    gender: 'Male',
    dateJoined: '2025-10-03',
    password: 'RunLiftRepeat1',
    height: 176,
    weight: 76,
    experience: 'Advanced',
    goal: 'Endurance',
    createdAt: '2025-10-03T07:45:00.000Z',
    updatedAt: '2026-04-05T07:45:00.000Z',
  },
];

const ALEX_USER_ID = '6fcb7a80-f6e7-4e4e-88da-15d4b9bcf502';

type SeedSetInput =
  | [number, number, number?]
  | {
      weight?: number;
      reps?: number;
      rir?: number;
      duration?: number;
      distance?: number;
      incline?: number;
      type?: SeedWorkoutSet['type'];
    };

function set(weight: number, reps: number, rir = 2): SeedSetInput {
  return { weight, reps, rir, type: 'normal' };
}

function warmupSet(reps = 10, duration?: number): SeedSetInput {
  return { weight: 0, reps, duration, rir: 5, type: 'warmup' };
}

function durationSet(duration: number, type: SeedWorkoutSet['type'] = 'normal'): SeedSetInput {
  return { weight: 0, reps: 0, duration, type };
}

function holdSet(duration: number): SeedSetInput {
  return { weight: 0, reps: 0, duration, type: 'normal' };
}

function distanceSet(weight: number, distance: number): SeedSetInput {
  return { weight, reps: 0, distance, type: 'normal' };
}

function normalizeSetInput(input: SeedSetInput): Exclude<SeedSetInput, [number, number, number?]> {
  if (Array.isArray(input)) {
    return {
      weight: input[0],
      reps: input[1],
      rir: input[2] ?? 2,
      type: 'normal',
    };
  }

  return input;
}

function completedSet(setNumber: number, input: SeedSetInput): SeedWorkoutSet {
  const normalized = normalizeSetInput(input);
  return {
    setNumber,
    weight: Number(normalized.weight) || 0,
    reps: Number(normalized.reps) || 0,
    rir: normalized.rir,
    duration: normalized.duration,
    distance: normalized.distance,
    incline: normalized.incline,
    type: normalized.type ?? 'normal',
    completed: true,
  };
}

function exerciseLog(
  exerciseId: string,
  exerciseName: string,
  mainMuscles: string[],
  sets: SeedSetInput[],
): SeedExerciseLog {
  return {
    exerciseId,
    exerciseName,
    mainMuscles,
    sets: sets.map((input, index) => completedSet(index + 1, input)),
  };
}

function alexWorkout(
  id: string,
  workoutName: string,
  date: string,
  duration: number,
  exercises: SeedExerciseLog[],
): SeedWorkout {
  return {
    id,
    userId: ALEX_USER_ID,
    workoutName,
    date,
    duration,
    bodyweightKg: 84,
    exercises,
    createdAt: `${date}T17:30:00.000Z`,
    updatedAt: `${date}T18:40:00.000Z`,
  };
}

type AlexProgramDay = 'upperA' | 'lowerA' | 'upperB' | 'lowerB';

function roundedLoad(value: number, step = 1) {
  return Number((Math.round(value / step) * step).toFixed(1));
}

function progressiveSets(
  week: number,
  baseWeight: number,
  reps: number,
  setCount: 2 | 3,
  weeklyIncrease: number,
  step = 1,
): Array<[number, number, number?]> {
  const topWeight = roundedLoad(baseWeight + week * weeklyIncrease, step);
  const backoffWeight = roundedLoad(topWeight * 0.95, step);
  const sets: Array<[number, number, number?]> = [
    [topWeight, reps, 2],
    [topWeight, Math.max(1, reps - 1), 1],
  ];

  if (setCount === 3) {
    sets.push([backoffWeight, reps + 1, 2]);
  }

  return sets;
}

function upperA(week: number) {
  return [
    exerciseLog('1', 'Barbell Bench Press', ['Chest', 'Triceps', 'Delts'], progressiveSets(week, 80, 6, 3, 1.5)),
    exerciseLog('5', 'Barbell Bent-Over Row', ['Back', 'Biceps', 'Forearms'], progressiveSets(week, 82, 8, 3, 1.5)),
    exerciseLog('2', 'Incline Dumbbell Bench Press', ['Chest', 'Triceps', 'Delts'], progressiveSets(week, 30, 10, 2, 0.75)),
    exerciseLog('6', 'Lat Pulldown', ['Back', 'Biceps'], progressiveSets(week, 66, 10, 2, 1)),
    exerciseLog('19', 'Dumbbell Lateral Raise', ['Delts'], progressiveSets(week, 10, 15, 3, 0.25)),
    exerciseLog('11', 'Cable Triceps Pushdown', ['Triceps'], progressiveSets(week, 36, 12, 2, 0.75)),
    exerciseLog('70', 'Cable Curl', ['Biceps'], progressiveSets(week, 32, 12, 2, 0.5)),
  ];
}

function lowerA(week: number) {
  return [
    exerciseLog('13', 'Barbell Back Squat', ['Quads', 'Hamstrings', 'Glutes'], progressiveSets(week, 100, 6, 3, 2)),
    exerciseLog('16', 'Romanian Deadlift', ['Hamstrings', 'Glutes', 'Back', 'Forearms'], progressiveSets(week, 88, 8, 3, 1.5)),
    exerciseLog('14', 'Leg Press', ['Quads', 'Hamstrings', 'Glutes'], progressiveSets(week, 210, 10, 2, 4)),
    exerciseLog('17', 'Seated Leg Curl', ['Hamstrings'], progressiveSets(week, 48, 12, 2, 1)),
    exerciseLog('156', 'Standing Calf Raise', ['Calves'], progressiveSets(week, 70, 12, 3, 1.5)),
    exerciseLog('243', 'Pallof Press', ['Core'], progressiveSets(week, 18, 12, 3, 0.5)),
  ];
}

function upperB(week: number) {
  return [
    exerciseLog('25', 'Chin-Up', ['Back', 'Biceps', 'Forearms'], progressiveSets(week, 4, 8, 3, 0.75)),
    exerciseLog('21', 'Dumbbell Bench Press', ['Chest', 'Triceps', 'Delts'], progressiveSets(week, 32, 10, 3, 0.75)),
    exerciseLog('24', 'T-Bar Row', ['Back', 'Biceps', 'Forearms'], progressiveSets(week, 72, 9, 3, 1.5)),
    exerciseLog('18', 'Barbell Overhead Press', ['Delts', 'Triceps'], progressiveSets(week, 48, 6, 2, 1)),
    exerciseLog('20', 'Face Pull', ['Back', 'Delts'], progressiveSets(week, 30, 15, 2, 0.75)),
    exerciseLog('9', 'Hammer Curl', ['Biceps', 'Forearms'], progressiveSets(week, 24, 10, 2, 0.5)),
    exerciseLog('27', 'EZ-Bar Skullcrusher', ['Triceps'], progressiveSets(week, 28, 10, 2, 0.5)),
  ];
}

function lowerB(week: number) {
  return [
    exerciseLog('7', 'Deadlift', ['Back', 'Hamstrings', 'Glutes', 'Forearms'], progressiveSets(week, 135, 5, 2, 3)),
    exerciseLog('28', 'Front Squat', ['Quads', 'Glutes'], progressiveSets(week, 82, 6, 3, 1.5)),
    exerciseLog('30', 'Hip Thrust', ['Glutes', 'Hamstrings'], progressiveSets(week, 105, 10, 3, 2.5)),
    exerciseLog('15', 'Leg Extension', ['Quads'], progressiveSets(week, 58, 12, 2, 1)),
    exerciseLog('17', 'Seated Leg Curl', ['Hamstrings'], progressiveSets(week, 50, 12, 2, 1)),
    exerciseLog('156', 'Standing Calf Raise', ['Calves'], progressiveSets(week, 72, 12, 3, 1.5)),
    exerciseLog('181', 'Suitcase Carry', ['Forearms', 'Core'], progressiveSets(week, 30, 1, 2, 0.75)),
    exerciseLog('243', 'Pallof Press', ['Core'], progressiveSets(week, 18, 12, 3, 0.5)),
  ];
}

const alexProgram: Record<AlexProgramDay, { name: string; duration: number; exercises: (week: number) => SeedExerciseLog[] }> = {
  upperA: { name: 'Upper A - Press & Row', duration: 72, exercises: upperA },
  lowerA: { name: 'Lower A - Squat & Hinge', duration: 76, exercises: lowerA },
  upperB: { name: 'Upper B - Pull & Shoulders', duration: 70, exercises: upperB },
  lowerB: { name: 'Lower B - Posterior & Accessories', duration: 78, exercises: lowerB },
};

const alexBalancedSchedule: Array<{ date: string; day: AlexProgramDay; week: number }> = [
  { date: '2026-04-04', day: 'upperA', week: 0 },
  { date: '2026-04-06', day: 'lowerA', week: 0 },
  { date: '2026-04-08', day: 'upperB', week: 0 },
  { date: '2026-04-10', day: 'lowerB', week: 0 },
  { date: '2026-04-11', day: 'upperA', week: 1 },
  { date: '2026-04-13', day: 'lowerA', week: 1 },
  { date: '2026-04-15', day: 'upperB', week: 1 },
  { date: '2026-04-17', day: 'lowerB', week: 1 },
  { date: '2026-04-18', day: 'upperA', week: 2 },
  { date: '2026-04-20', day: 'lowerA', week: 2 },
  { date: '2026-04-22', day: 'upperB', week: 2 },
  { date: '2026-04-24', day: 'lowerB', week: 2 },
  { date: '2026-04-25', day: 'upperA', week: 3 },
  { date: '2026-04-27', day: 'lowerA', week: 3 },
  { date: '2026-04-29', day: 'upperB', week: 3 },
  { date: '2026-05-01', day: 'lowerB', week: 3 },
  { date: '2026-05-02', day: 'upperA', week: 4 },
  { date: '2026-05-04', day: 'lowerA', week: 4 },
  { date: '2026-05-06', day: 'upperB', week: 4 },
  { date: '2026-05-08', day: 'lowerB', week: 4 },
  { date: '2026-05-09', day: 'upperA', week: 5 },
  { date: '2026-05-11', day: 'lowerA', week: 5 },
  { date: '2026-05-13', day: 'upperB', week: 5 },
  { date: '2026-05-15', day: 'lowerB', week: 5 },
  { date: '2026-05-16', day: 'upperA', week: 6 },
  { date: '2026-05-18', day: 'lowerA', week: 6 },
  { date: '2026-05-20', day: 'upperB', week: 6 },
  { date: '2026-05-22', day: 'lowerB', week: 6 },
  { date: '2026-05-23', day: 'upperA', week: 7 },
  { date: '2026-05-25', day: 'lowerA', week: 7 },
  { date: '2026-05-27', day: 'upperB', week: 7 },
  { date: '2026-05-29', day: 'lowerB', week: 7 },
];

const alexBalancedWorkouts: SeedWorkout[] = alexBalancedSchedule.map(({ date, day, week }) => {
  const programDay = alexProgram[day];
  return alexWorkout(
    `alex-balanced-${date}-${day}`,
    programDay.name,
    date,
    programDay.duration,
    programDay.exercises(week),
  );
});

type MayProgramDay = 'pushA' | 'pullA' | 'legsA' | 'cardioWarmup' | 'upperB' | 'legsB';

function lightCardioWarmup() {
  return [
    exerciseLog('192', 'Incline Treadmill Walk', ['Cardio'], [durationSet(30)]),
    exerciseLog('214', 'Dynamic Warm-Up', ['Warm-up'], [warmupSet(10), warmupSet(10)]),
    exerciseLog('219', 'Band Pull-Apart', ['Warm-up', 'Back', 'Delts'], [warmupSet(20), warmupSet(20)]),
    exerciseLog('227', 'Bodyweight Squat', ['Warm-up', 'Quads'], [warmupSet(15), warmupSet(15)]),
    exerciseLog('225', 'Arm Circles', ['Warm-up', 'Delts'], [warmupSet(20), warmupSet(20)]),
  ];
}

function pushAMay() {
  return [
    exerciseLog('214', 'Dynamic Warm-Up', ['Warm-up'], [warmupSet(10)]),
    exerciseLog('1', 'Barbell Bench Press', ['Chest', 'Triceps', 'Delts'], [
      set(80, 8),
      set(80, 8),
      set(82.5, 6),
      set(75, 10),
    ]),
    exerciseLog('2', 'Incline Dumbbell Bench Press', ['Chest', 'Triceps', 'Delts'], [
      set(30, 10),
      set(30, 9),
      set(28, 10),
    ]),
    exerciseLog('135', 'Seated Dumbbell Shoulder Press', ['Delts', 'Triceps'], [
      set(24, 10),
      set(24, 9),
      set(22, 10),
    ]),
    exerciseLog('142', 'Cable Lateral Raise', ['Delts'], [set(10, 15), set(10, 15), set(10, 14)]),
    exerciseLog('40', 'Pec Deck', ['Chest'], [set(60, 12), set(60, 12)]),
    exerciseLog('81', 'Rope Pushdown', ['Triceps'], [set(35, 12), set(35, 12), set(32.5, 14)]),
  ];
}

function pullAMay() {
  return [
    exerciseLog('219', 'Band Pull-Apart', ['Warm-up', 'Back', 'Delts'], [warmupSet(20), warmupSet(20)]),
    exerciseLog('4', 'Pull-Up', ['Back', 'Biceps', 'Forearms'], [set(0, 8), set(0, 8), set(0, 7), set(0, 6)]),
    exerciseLog('5', 'Barbell Bent-Over Row', ['Back', 'Biceps', 'Forearms'], [
      set(70, 8),
      set(70, 8),
      set(70, 8),
      set(65, 10),
    ]),
    exerciseLog('6', 'Lat Pulldown', ['Back', 'Biceps'], [set(65, 10), set(65, 10), set(60, 12)]),
    exerciseLog('51', 'Chest-Supported Machine Row', ['Back', 'Biceps'], [
      set(70, 10),
      set(70, 10),
      set(65, 12),
    ]),
    exerciseLog('20', 'Face Pull', ['Back', 'Delts'], [set(25, 15), set(25, 15), set(25, 15)]),
    exerciseLog('66', 'EZ-Bar Curl', ['Biceps', 'Forearms'], [set(35, 10), set(35, 10), set(32.5, 12)]),
    exerciseLog('9', 'Hammer Curl', ['Biceps', 'Forearms'], [set(18, 12), set(18, 10)]),
  ];
}

function legsAMay() {
  return [
    exerciseLog('216', 'Bike Warm-Up', ['Warm-up', 'Cardio'], [durationSet(8, 'warmup')]),
    exerciseLog('13', 'Barbell Back Squat', ['Quads', 'Hamstrings'], [
      set(100, 6),
      set(100, 6),
      set(95, 8),
      set(90, 10),
    ]),
    exerciseLog('16', 'Romanian Deadlift', ['Hamstrings', 'Back', 'Forearms'], [
      set(90, 8),
      set(90, 8),
      set(85, 10),
      set(85, 10),
    ]),
    exerciseLog('14', 'Leg Press', ['Quads', 'Hamstrings'], [set(170, 10), set(170, 10), set(160, 12)]),
    exerciseLog('17', 'Seated Leg Curl', ['Hamstrings'], [set(55, 12), set(55, 12), set(50, 14)]),
    exerciseLog('156', 'Standing Calf Raise', ['Calves'], [
      set(80, 12),
      set(80, 12),
      set(75, 14),
      set(75, 14),
    ]),
    exerciseLog('169', 'Tibialis Raise', ['Calves'], [set(15, 15), set(15, 15), set(15, 15)]),
  ];
}

function cardioWarmupMay() {
  return [
    exerciseLog('192', 'Incline Treadmill Walk', ['Cardio'], [durationSet(35)]),
    exerciseLog('214', 'Dynamic Warm-Up', ['Warm-up'], [warmupSet(10), warmupSet(10)]),
    exerciseLog('219', 'Band Pull-Apart', ['Warm-up', 'Back', 'Delts'], [warmupSet(20), warmupSet(20)]),
    exerciseLog('221', 'Cable External Rotation', ['Warm-up', 'Delts'], [
      { weight: 5, reps: 15, rir: 5, type: 'warmup' },
      { weight: 5, reps: 15, rir: 5, type: 'warmup' },
    ]),
    exerciseLog('227', 'Bodyweight Squat', ['Warm-up', 'Quads'], [warmupSet(15), warmupSet(15)]),
    exerciseLog('182', 'Dead Hang', ['Forearms', 'Back'], [holdSet(30), holdSet(30)]),
  ];
}

function upperBMay() {
  return [
    exerciseLog('214', 'Dynamic Warm-Up', ['Warm-up'], [warmupSet(10)]),
    exerciseLog('33', 'Incline Barbell Bench Press', ['Chest', 'Triceps', 'Delts'], [
      set(70, 8),
      set(70, 8),
      set(67.5, 9),
      set(65, 10),
    ]),
    exerciseLog('25', 'Chin-Up', ['Back', 'Biceps', 'Forearms'], [set(0, 8), set(0, 8), set(0, 7), set(0, 7)]),
    exerciseLog('32', 'Machine Chest Press', ['Chest', 'Triceps', 'Delts'], [
      set(75, 10),
      set(75, 10),
      set(70, 12),
    ]),
    exerciseLog('52', 'Seated Cable Row', ['Back', 'Biceps'], [set(65, 10), set(65, 10), set(60, 12)]),
    exerciseLog('136', 'Machine Shoulder Press', ['Delts', 'Triceps'], [set(55, 10), set(55, 9), set(50, 11)]),
    exerciseLog('147', 'Reverse Pec Deck', ['Delts', 'Back'], [set(45, 15), set(45, 15), set(40, 16)]),
    exerciseLog('86', 'Cable Overhead Triceps Extension', ['Triceps'], [set(30, 12), set(30, 12)]),
    exerciseLog('72', 'Incline Dumbbell Curl', ['Biceps'], [set(16, 12), set(16, 10)]),
  ];
}

function legsBMay() {
  return [
    exerciseLog('216', 'Bike Warm-Up', ['Warm-up', 'Cardio'], [durationSet(8, 'warmup')]),
    exerciseLog('28', 'Front Squat', ['Quads', 'Hamstrings'], [set(75, 8), set(75, 8), set(72.5, 8), set(70, 10)]),
    exerciseLog('124', 'Lying Leg Curl', ['Hamstrings'], [
      set(45, 10),
      set(45, 10),
      set(42.5, 12),
      set(42.5, 12),
    ]),
    exerciseLog('105', 'Hack Squat', ['Quads'], [set(110, 10), set(110, 10), set(100, 12)]),
    exerciseLog('29', 'Bulgarian Split Squat', ['Quads', 'Hamstrings'], [
      set(24, 10),
      set(24, 10),
      set(22, 12),
    ]),
    exerciseLog('65', 'Back Extension', ['Back', 'Hamstrings'], [set(20, 12), set(20, 12)]),
    exerciseLog('161', 'Seated Calf Raise', ['Calves'], [
      set(55, 15),
      set(55, 15),
      set(50, 16),
      set(50, 16),
    ]),
    exerciseLog('178', "Farmer's Walk", ['Forearms', 'Back'], [distanceSet(40, 40), distanceSet(40, 40)]),
  ];
}

const alexMayProgram: Record<MayProgramDay, { name: string; duration: number; exercises: () => SeedExerciseLog[] }> = {
  pushA: { name: 'Push A', duration: 76, exercises: pushAMay },
  pullA: { name: 'Pull A', duration: 78, exercises: pullAMay },
  legsA: { name: 'Legs A', duration: 80, exercises: legsAMay },
  cardioWarmup: { name: 'Cardio + Warm-up', duration: 50, exercises: cardioWarmupMay },
  upperB: { name: 'Upper B', duration: 82, exercises: upperBMay },
  legsB: { name: 'Legs B', duration: 82, exercises: legsBMay },
};

const alexMaySchedule: Array<{ date: string; day: MayProgramDay }> = [
  { date: '2026-05-04', day: 'pushA' },
  { date: '2026-05-05', day: 'pullA' },
  { date: '2026-05-06', day: 'legsA' },
  { date: '2026-05-07', day: 'cardioWarmup' },
  { date: '2026-05-08', day: 'upperB' },
  { date: '2026-05-09', day: 'legsB' },
  { date: '2026-05-11', day: 'pushA' },
  { date: '2026-05-12', day: 'pullA' },
  { date: '2026-05-13', day: 'legsA' },
  { date: '2026-05-14', day: 'cardioWarmup' },
  { date: '2026-05-15', day: 'upperB' },
  { date: '2026-05-16', day: 'legsB' },
  { date: '2026-05-18', day: 'pushA' },
  { date: '2026-05-19', day: 'pullA' },
  { date: '2026-05-20', day: 'legsA' },
  { date: '2026-05-21', day: 'cardioWarmup' },
  { date: '2026-05-22', day: 'upperB' },
  { date: '2026-05-23', day: 'legsB' },
  { date: '2026-05-25', day: 'pushA' },
  { date: '2026-05-26', day: 'pullA' },
  { date: '2026-05-27', day: 'legsA' },
  { date: '2026-05-28', day: 'cardioWarmup' },
  { date: '2026-05-29', day: 'upperB' },
  { date: '2026-05-30', day: 'legsB' },
];

const alexMay2026Workouts: SeedWorkout[] = [
  alexWorkout('alex-may-2026-05-01-light-cardio-warmup', 'Light Cardio + Warm-up', '2026-05-01', 44, lightCardioWarmup()),
  ...alexMaySchedule.map(({ date, day }) => {
    const programDay = alexMayProgram[day];
    return alexWorkout(`alex-may-${date}-${day}`, programDay.name, date, programDay.duration, programDay.exercises());
  }),
];

// Demo-only rank coverage workout for Alex. Each exercise uses one valid 1-10 rep set
// calibrated against Alex's 84 kg bodyweight so the rank modal can display every rank label.
const alexRankShowcaseWorkout = alexWorkout('alex-rank-showcase-2026-06-01', 'Rank Showcase', '2026-06-01', 118, [
  exerciseLog('21', 'Dumbbell Bench Press', ['Chest', 'Triceps', 'Delts'], [set(10, 5)]), // Unranked
  exerciseLog('36', 'Decline Dumbbell Bench Press', ['Chest', 'Triceps'], [set(13, 5)]), // Iron I
  exerciseLog('48', 'Pendlay Row', ['Back', 'Biceps', 'Forearms'], [set(40, 5)]), // Iron II
  exerciseLog('49', 'Dumbbell Row', ['Back', 'Biceps', 'Forearms'], [set(23.5, 5)]), // Iron III
  exerciseLog('50', 'Chest-Supported Dumbbell Row', ['Back', 'Biceps'], [set(25.5, 5)]), // Bronze I
  exerciseLog('7', 'Deadlift', ['Back', 'Hamstrings', 'Glutes', 'Forearms'], [set(84.5, 5)]), // Bronze II
  exerciseLog('8', 'Barbell Curl', ['Biceps', 'Forearms'], [set(22, 5)]), // Bronze III
  exerciseLog('67', 'Dumbbell Curl', ['Biceps', 'Forearms'], [set(14.5, 5)]), // Silver I
  exerciseLog('68', 'Alternating Dumbbell Curl', ['Biceps', 'Forearms'], [set(15.5, 5)]), // Silver II
  exerciseLog('69', 'Seated Dumbbell Curl', ['Biceps'], [set(16.5, 5)]), // Silver III
  exerciseLog('72', 'Incline Dumbbell Curl', ['Biceps'], [set(18, 5)]), // Gold I
  exerciseLog('96', 'Triceps Dip', ['Triceps', 'Chest', 'Delts'], [set(30, 5)]), // Gold II
  exerciseLog('100', 'High-Bar Squat', ['Quads', 'Glutes'], [set(113, 5)]), // Gold III
  exerciseLog('101', 'Low-Bar Squat', ['Quads', 'Hamstrings', 'Glutes'], [set(119.5, 5)]), // Platinum I
  exerciseLog('121', 'Stiff-Leg Deadlift', ['Hamstrings', 'Glutes', 'Back'], [set(111, 5)]), // Platinum II
  exerciseLog('18', 'Barbell Overhead Press', ['Delts', 'Triceps'], [set(64.5, 5)]), // Platinum III
  exerciseLog('133', 'Seated Barbell Shoulder Press', ['Delts', 'Triceps'], [set(68, 5)]), // Diamond I
  exerciseLog('134', 'Dumbbell Shoulder Press', ['Delts', 'Triceps'], [set(30.5, 5)]), // Diamond II
  exerciseLog('1', 'Barbell Bench Press', ['Chest', 'Triceps', 'Delts'], [set(110.5, 5)]), // Diamond III
  exerciseLog('33', 'Incline Barbell Bench Press', ['Chest', 'Triceps', 'Delts'], [set(100.5, 5)]), // Ascendant I
  exerciseLog('2', 'Incline Dumbbell Bench Press', ['Chest', 'Triceps', 'Delts'], [set(52.5, 5)]), // Ascendant II
  exerciseLog('135', 'Seated Dumbbell Shoulder Press', ['Delts', 'Triceps'], [set(37, 5)]), // Ascendant III
  exerciseLog('5', 'Barbell Bent-Over Row', ['Back', 'Biceps', 'Forearms'], [set(118.5, 5)]), // Titan I
  exerciseLog('13', 'Barbell Back Squat', ['Quads', 'Hamstrings', 'Glutes'], [set(184, 5)]), // Titan II
  exerciseLog('16', 'Romanian Deadlift', ['Hamstrings', 'Glutes', 'Back', 'Forearms'], [set(166, 5)]), // Titan III
  exerciseLog('28', 'Front Squat', ['Quads', 'Glutes'], [set(157.5, 5)]), // Apex
]);

const alexExtraWorkouts: SeedWorkout[] = [
  alexWorkout('alex-2026-05-28-upper-strength', 'Upper Strength', '2026-05-28', 64, [
    exerciseLog('1', 'Barbell Bench Press', ['Chest', 'Triceps'], [[90, 5, 1], [90, 4, 1], [86, 6, 1]]),
    exerciseLog('5', 'Barbell Row', ['Back'], [[100, 7, 1], [100, 7, 1], [95, 9, 2]]),
    exerciseLog('18', 'Overhead Press', ['Delts', 'Triceps'], [[58, 5, 1], [56, 6, 1]]),
  ]),
  alexWorkout('alex-2026-05-25-leg-power', 'Leg Power', '2026-05-25', 72, [
    exerciseLog('13', 'Squat', ['Quads', 'Glutes'], [[122, 5, 1], [122, 4, 1], [116, 6, 2]]),
    exerciseLog('16', 'Romanian Deadlift', ['Hamstrings', 'Glutes'], [[104, 8, 2], [104, 7, 1]]),
    exerciseLog('15', 'Leg Extension', ['Quads'], [[68, 12, 2], [68, 11, 1]]),
  ]),
  alexWorkout('alex-2026-05-22-pull-heavy', 'Pull Heavy', '2026-05-22', 68, [
    exerciseLog('7', 'Deadlift', ['Back', 'Hamstrings', 'Glutes'], [[162, 3, 1], [155, 4, 1], [145, 6, 2]]),
    exerciseLog('4', 'Pull-ups', ['Back', 'Biceps'], [[8, 7, 1], [8, 6, 1], [0, 10, 2]]),
    exerciseLog('8', 'Barbell Curl', ['Biceps'], [[42, 8, 1], [40, 9, 1]]),
  ]),
  alexWorkout('alex-2026-05-19-push-volume', 'Push Volume', '2026-05-19', 59, [
    exerciseLog('2', 'Incline Dumbbell Press', ['Chest', 'Delts'], [[38, 8, 1], [36, 9, 1], [34, 11, 2]]),
    exerciseLog('19', 'Lateral Raise', ['Delts'], [[14, 14, 2], [14, 13, 2], [12, 16, 1]]),
    exerciseLog('11', 'Tricep Pushdown', ['Triceps'], [[46, 11, 1], [44, 12, 2]]),
  ]),
  alexWorkout('alex-2026-05-16-lower-accessory', 'Lower Accessory', '2026-05-16', 61, [
    exerciseLog('14', 'Leg Press', ['Quads', 'Glutes'], [[250, 9, 1], [240, 10, 1], [230, 12, 2]]),
    exerciseLog('17', 'Leg Curl', ['Hamstrings'], [[58, 11, 1], [56, 12, 2]]),
    exerciseLog('30', 'Hip Thrust', ['Glutes', 'Hamstrings'], [[128, 8, 1], [124, 9, 1]]),
  ]),
  alexWorkout('alex-2026-05-13-upper-strength', 'Upper Strength', '2026-05-13', 66, [
    exerciseLog('1', 'Barbell Bench Press', ['Chest', 'Triceps'], [[88, 5, 1], [86, 6, 1], [82, 8, 2]]),
    exerciseLog('24', 'T-Bar Row', ['Back'], [[82, 8, 1], [80, 9, 2]]),
    exerciseLog('10', 'Close-Grip Bench Press', ['Triceps', 'Chest'], [[74, 7, 1], [72, 8, 2]]),
  ]),
  alexWorkout('alex-2026-05-10-leg-power', 'Leg Power', '2026-05-10', 74, [
    exerciseLog('13', 'Squat', ['Quads', 'Glutes'], [[120, 5, 1], [118, 5, 1], [112, 7, 2]]),
    exerciseLog('16', 'Romanian Deadlift', ['Hamstrings', 'Glutes'], [[102, 8, 1], [100, 8, 2]]),
    exerciseLog('14', 'Leg Press', ['Quads', 'Glutes'], [[240, 10, 1], [230, 11, 2]]),
  ]),
  alexWorkout('alex-2026-05-07-pull-heavy', 'Pull Heavy', '2026-05-07', 69, [
    exerciseLog('7', 'Deadlift', ['Back', 'Hamstrings', 'Glutes'], [[158, 4, 1], [150, 5, 1], [142, 6, 2]]),
    exerciseLog('6', 'Lat Pulldown', ['Back', 'Biceps'], [[76, 9, 1], [74, 10, 2]]),
    exerciseLog('8', 'Barbell Curl', ['Biceps'], [[40, 9, 1], [38, 10, 2]]),
  ]),
  alexWorkout('alex-2026-05-04-push-volume', 'Push Volume', '2026-05-04', 57, [
    exerciseLog('1', 'Barbell Bench Press', ['Chest', 'Triceps'], [[86, 6, 1], [84, 7, 1], [80, 9, 2]]),
    exerciseLog('3', 'Cable Fly', ['Chest'], [[22, 13, 2], [22, 12, 2]]),
    exerciseLog('19', 'Lateral Raise', ['Delts'], [[14, 12, 2], [12, 15, 2]]),
  ]),
  alexWorkout('alex-2026-05-01-lower-accessory', 'Lower Accessory', '2026-05-01', 60, [
    exerciseLog('28', 'Front Squat', ['Quads', 'Glutes'], [[90, 6, 1], [88, 7, 2]]),
    exerciseLog('17', 'Leg Curl', ['Hamstrings'], [[56, 12, 2], [54, 12, 2]]),
    exerciseLog('30', 'Hip Thrust', ['Glutes', 'Hamstrings'], [[124, 9, 1], [120, 10, 2]]),
  ]),
  alexWorkout('alex-2026-04-28-upper-strength', 'Upper Strength', '2026-04-28', 65, [
    exerciseLog('1', 'Barbell Bench Press', ['Chest', 'Triceps'], [[86, 5, 1], [84, 6, 1], [80, 8, 2]]),
    exerciseLog('5', 'Barbell Row', ['Back'], [[98, 7, 1], [95, 8, 2]]),
    exerciseLog('18', 'Overhead Press', ['Delts', 'Triceps'], [[56, 5, 1], [54, 6, 2]]),
  ]),
  alexWorkout('alex-2026-04-24-leg-power', 'Leg Power', '2026-04-24', 71, [
    exerciseLog('13', 'Squat', ['Quads', 'Glutes'], [[118, 5, 1], [116, 5, 1], [110, 7, 2]]),
    exerciseLog('16', 'Romanian Deadlift', ['Hamstrings', 'Glutes'], [[100, 8, 1], [98, 8, 2]]),
    exerciseLog('15', 'Leg Extension', ['Quads'], [[66, 12, 2], [64, 12, 2]]),
  ]),
  alexWorkout('alex-2026-04-20-pull-heavy', 'Pull Heavy', '2026-04-20', 67, [
    exerciseLog('7', 'Deadlift', ['Back', 'Hamstrings', 'Glutes'], [[155, 4, 1], [148, 5, 1], [140, 6, 2]]),
    exerciseLog('25', 'Chin-ups', ['Back', 'Biceps'], [[6, 7, 1], [5, 8, 2]]),
    exerciseLog('26', 'Preacher Curl', ['Biceps'], [[32, 10, 1], [30, 11, 2]]),
  ]),
  alexWorkout('alex-2026-04-16-push-volume', 'Push Volume', '2026-04-16', 58, [
    exerciseLog('2', 'Incline Dumbbell Press', ['Chest', 'Delts'], [[36, 8, 1], [34, 10, 2]]),
    exerciseLog('11', 'Tricep Pushdown', ['Triceps'], [[44, 12, 1], [42, 12, 2]]),
    exerciseLog('20', 'Face Pull', ['Delts', 'Back'], [[34, 15, 2], [32, 16, 2]]),
  ]),
  alexWorkout('alex-2026-04-12-lower-accessory', 'Lower Accessory', '2026-04-12', 63, [
    exerciseLog('14', 'Leg Press', ['Quads', 'Glutes'], [[235, 10, 1], [225, 11, 2]]),
    exerciseLog('17', 'Leg Curl', ['Hamstrings'], [[54, 12, 2], [52, 13, 2]]),
    exerciseLog('30', 'Hip Thrust', ['Glutes', 'Hamstrings'], [[120, 10, 2], [116, 11, 2]]),
  ]),
];

const alexInsightWorkouts: SeedWorkout[] = [
  alexWorkout('alex-2026-05-30-bench-arms', 'Bench & Arms', '2026-05-30', 73, [
    exerciseLog('1', 'Barbell Bench Press', ['Chest', 'Triceps'], [[89, 5, 1], [88, 5, 1], [84, 7, 2]]),
    exerciseLog('5', 'Barbell Row', ['Back', 'Biceps'], [[100, 8, 1], [98, 8, 2]]),
    exerciseLog('70', 'Cable Curl', ['Biceps'], [[42, 12, 1], [42, 11, 1], [40, 12, 2]]),
    exerciseLog('8', 'Barbell Curl', ['Biceps', 'Forearms'], [[42, 8, 1], [42, 8, 1], [40, 9, 2]]),
    exerciseLog('26', 'Preacher Curl', ['Biceps'], [[32, 10, 1], [30, 11, 2]]),
  ]),
  alexWorkout('alex-2026-05-27-pull-chin-early', 'Pull Priority', '2026-05-27', 70, [
    exerciseLog('25', 'Chin-Up', ['Back', 'Biceps', 'Forearms'], [[10, 8, 1], [8, 8, 1]]),
    exerciseLog('24', 'T-Bar Row', ['Back', 'Biceps'], [[84, 8, 1], [82, 9, 2]]),
    exerciseLog('8', 'Barbell Curl', ['Biceps', 'Forearms'], [[42, 8, 1], [40, 9, 1], [40, 8, 2]]),
    exerciseLog('9', 'Hammer Curl', ['Biceps', 'Forearms'], [[28, 10, 1], [26, 11, 2], [26, 10, 2]]),
  ]),
  alexWorkout('alex-2026-05-24-pull-chin-late', 'Pull & Arms', '2026-05-24', 76, [
    exerciseLog('6', 'Lat Pulldown', ['Back', 'Biceps'], [[78, 9, 1], [76, 10, 2]]),
    exerciseLog('52', 'Seated Cable Row', ['Back', 'Biceps'], [[78, 10, 1], [76, 10, 2]]),
    exerciseLog('8', 'Barbell Curl', ['Biceps', 'Forearms'], [[42, 8, 1], [40, 9, 2], [40, 8, 2]]),
    exerciseLog('25', 'Chin-Up', ['Back', 'Biceps', 'Forearms'], [[2, 6, 1], [0, 7, 1]]),
    exerciseLog('70', 'Cable Curl', ['Biceps'], [[42, 11, 1], [40, 12, 2], [40, 11, 2]]),
  ]),
  alexWorkout('alex-2026-05-21-bench-arm-volume', 'Bench Arm Volume', '2026-05-21', 71, [
    exerciseLog('1', 'Barbell Bench Press', ['Chest', 'Triceps'], [[89, 5, 1], [87, 5, 1], [84, 7, 2]]),
    exerciseLog('2', 'Incline Dumbbell Press', ['Chest', 'Delts', 'Triceps'], [[38, 8, 1], [36, 9, 2]]),
    exerciseLog('8', 'Barbell Curl', ['Biceps', 'Forearms'], [[42, 8, 1], [42, 7, 1], [40, 9, 2]]),
    exerciseLog('70', 'Cable Curl', ['Biceps'], [[42, 12, 1], [40, 12, 2], [40, 11, 2]]),
    exerciseLog('26', 'Preacher Curl', ['Biceps'], [[32, 10, 1], [30, 11, 2]]),
  ]),
  alexWorkout('alex-2026-05-18-chin-early-arms', 'Chin-Up Priority', '2026-05-18', 68, [
    exerciseLog('25', 'Chin-Up', ['Back', 'Biceps', 'Forearms'], [[10, 8, 1], [8, 9, 1]]),
    exerciseLog('5', 'Barbell Row', ['Back', 'Biceps'], [[100, 7, 1], [98, 8, 2]]),
    exerciseLog('8', 'Barbell Curl', ['Biceps', 'Forearms'], [[42, 8, 1], [40, 9, 2], [40, 8, 2]]),
    exerciseLog('26', 'Preacher Curl', ['Biceps'], [[32, 10, 1], [30, 11, 2], [30, 10, 2]]),
  ]),
  alexWorkout('alex-2026-05-15-arm-volume', 'Arm Volume', '2026-05-15', 58, [
    exerciseLog('8', 'Barbell Curl', ['Biceps', 'Forearms'], [[42, 8, 1], [42, 8, 1], [40, 9, 2]]),
    exerciseLog('9', 'Hammer Curl', ['Biceps', 'Forearms'], [[28, 10, 1], [26, 11, 2], [26, 10, 2]]),
    exerciseLog('70', 'Cable Curl', ['Biceps'], [[42, 12, 1], [40, 12, 2], [40, 11, 2]]),
    exerciseLog('11', 'Tricep Pushdown', ['Triceps'], [[46, 12, 1], [44, 12, 2]]),
  ]),
  alexWorkout('alex-2026-05-12-chin-late', 'Back Then Chin-Ups', '2026-05-12', 72, [
    exerciseLog('24', 'T-Bar Row', ['Back', 'Biceps'], [[82, 9, 1], [80, 10, 2]]),
    exerciseLog('6', 'Lat Pulldown', ['Back', 'Biceps'], [[76, 10, 1], [74, 10, 2]]),
    exerciseLog('8', 'Barbell Curl', ['Biceps', 'Forearms'], [[42, 8, 1], [40, 9, 2], [40, 8, 2]]),
    exerciseLog('25', 'Chin-Up', ['Back', 'Biceps', 'Forearms'], [[0, 7, 1], [0, 6, 1]]),
    exerciseLog('9', 'Hammer Curl', ['Biceps', 'Forearms'], [[28, 10, 1], [26, 11, 2], [26, 10, 2]]),
  ]),
  alexWorkout('alex-2026-05-09-bench-arms', 'Bench & Curl Work', '2026-05-09', 68, [
    exerciseLog('1', 'Barbell Bench Press', ['Chest', 'Triceps'], [[89, 5, 1], [86, 6, 1], [84, 7, 2]]),
    exerciseLog('18', 'Overhead Press', ['Delts', 'Triceps'], [[58, 5, 1], [56, 6, 2]]),
    exerciseLog('8', 'Barbell Curl', ['Biceps', 'Forearms'], [[42, 8, 1], [40, 9, 2], [40, 8, 2]]),
    exerciseLog('70', 'Cable Curl', ['Biceps'], [[40, 12, 1], [40, 12, 2], [38, 13, 2]]),
  ]),
  alexWorkout('alex-2026-05-06-arm-pump', 'Arm Pump', '2026-05-06', 55, [
    exerciseLog('8', 'Barbell Curl', ['Biceps', 'Forearms'], [[42, 8, 1], [42, 7, 1], [40, 9, 2], [38, 10, 2]]),
    exerciseLog('26', 'Preacher Curl', ['Biceps'], [[32, 10, 1], [30, 11, 2], [30, 10, 2], [28, 12, 2]]),
    exerciseLog('70', 'Cable Curl', ['Biceps'], [[40, 12, 1], [40, 11, 2], [38, 13, 2], [38, 12, 2]]),
  ]),
  alexWorkout('alex-2026-05-03-chin-early-volume', 'Chin-Up Volume', '2026-05-03', 66, [
    exerciseLog('25', 'Chin-Up', ['Back', 'Biceps', 'Forearms'], [[8, 9, 1], [6, 9, 1]]),
    exerciseLog('52', 'Seated Cable Row', ['Back', 'Biceps'], [[76, 10, 1], [74, 11, 2]]),
    exerciseLog('8', 'Barbell Curl', ['Biceps', 'Forearms'], [[40, 9, 1], [40, 8, 2], [38, 10, 2]]),
    exerciseLog('9', 'Hammer Curl', ['Biceps', 'Forearms'], [[26, 11, 1], [26, 10, 2], [24, 12, 2]]),
  ]),
];

const alexFoundationWorkouts: SeedWorkout[] = [
  alexWorkout('alex-2026-03-30-upper-base', 'Upper Base', '2026-03-30', 62, [
    exerciseLog('1', 'Barbell Bench Press', ['Chest', 'Triceps'], [[84, 6, 1], [82, 7, 2], [80, 8, 2]]),
    exerciseLog('5', 'Barbell Row', ['Back', 'Biceps'], [[94, 8, 1], [92, 9, 2]]),
    exerciseLog('18', 'Overhead Press', ['Delts', 'Triceps'], [[54, 6, 1], [52, 7, 2]]),
  ]),
  alexWorkout('alex-2026-03-27-lower-base', 'Lower Base', '2026-03-27', 70, [
    exerciseLog('13', 'Squat', ['Quads', 'Glutes'], [[110, 6, 1], [108, 6, 2], [104, 8, 2]]),
    exerciseLog('16', 'Romanian Deadlift', ['Hamstrings', 'Glutes'], [[94, 8, 1], [92, 9, 2]]),
    exerciseLog('15', 'Leg Extension', ['Quads'], [[62, 12, 2], [60, 13, 2]]),
  ]),
  alexWorkout('alex-2026-03-23-pull-base', 'Pull Base', '2026-03-23', 66, [
    exerciseLog('7', 'Deadlift', ['Back', 'Hamstrings', 'Glutes'], [[146, 5, 1], [140, 6, 2]]),
    exerciseLog('25', 'Chin-Up', ['Back', 'Biceps', 'Forearms'], [[6, 8, 1], [4, 9, 2]]),
    exerciseLog('8', 'Barbell Curl', ['Biceps', 'Forearms'], [[38, 9, 1], [36, 10, 2]]),
  ]),
  alexWorkout('alex-2026-03-18-upper-base', 'Upper Base', '2026-03-18', 63, [
    exerciseLog('1', 'Barbell Bench Press', ['Chest', 'Triceps'], [[83, 6, 1], [81, 7, 2], [78, 8, 2]]),
    exerciseLog('2', 'Incline Dumbbell Press', ['Chest', 'Delts', 'Triceps'], [[34, 9, 1], [32, 10, 2]]),
    exerciseLog('11', 'Tricep Pushdown', ['Triceps'], [[40, 12, 2], [38, 13, 2]]),
  ]),
  alexWorkout('alex-2026-03-14-lower-base', 'Lower Base', '2026-03-14', 71, [
    exerciseLog('13', 'Squat', ['Quads', 'Glutes'], [[108, 6, 1], [106, 7, 2], [102, 8, 2]]),
    exerciseLog('14', 'Leg Press', ['Quads', 'Glutes'], [[220, 10, 1], [210, 12, 2]]),
    exerciseLog('17', 'Leg Curl', ['Hamstrings'], [[50, 12, 2], [48, 13, 2]]),
  ]),
  alexWorkout('alex-2026-03-10-pull-base', 'Pull Base', '2026-03-10', 64, [
    exerciseLog('7', 'Deadlift', ['Back', 'Hamstrings', 'Glutes'], [[142, 5, 1], [136, 6, 2]]),
    exerciseLog('6', 'Lat Pulldown', ['Back', 'Biceps'], [[70, 10, 1], [68, 11, 2]]),
    exerciseLog('8', 'Barbell Curl', ['Biceps', 'Forearms'], [[38, 8, 1], [36, 10, 2]]),
  ]),
  alexWorkout('alex-2026-03-05-upper-base', 'Upper Base', '2026-03-05', 61, [
    exerciseLog('1', 'Barbell Bench Press', ['Chest', 'Triceps'], [[82, 6, 1], [80, 7, 2], [78, 8, 2]]),
    exerciseLog('5', 'Barbell Row', ['Back', 'Biceps'], [[92, 8, 1], [90, 9, 2]]),
    exerciseLog('18', 'Overhead Press', ['Delts', 'Triceps'], [[52, 6, 1], [50, 7, 2]]),
  ]),
  alexWorkout('alex-2026-02-28-lower-base', 'Lower Base', '2026-02-28', 69, [
    exerciseLog('13', 'Squat', ['Quads', 'Glutes'], [[104, 6, 1], [102, 7, 2], [98, 8, 2]]),
    exerciseLog('16', 'Romanian Deadlift', ['Hamstrings', 'Glutes'], [[90, 8, 1], [88, 9, 2]]),
    exerciseLog('30', 'Hip Thrust', ['Glutes', 'Hamstrings'], [[110, 10, 2], [106, 11, 2]]),
  ]),
  alexWorkout('alex-2026-02-24-pull-base', 'Pull Base', '2026-02-24', 65, [
    exerciseLog('7', 'Deadlift', ['Back', 'Hamstrings', 'Glutes'], [[138, 5, 1], [132, 6, 2]]),
    exerciseLog('25', 'Chin-Up', ['Back', 'Biceps', 'Forearms'], [[4, 8, 1], [2, 9, 2]]),
    exerciseLog('26', 'Preacher Curl', ['Biceps'], [[28, 11, 2], [26, 12, 2]]),
  ]),
  alexWorkout('alex-2026-02-19-upper-base', 'Upper Base', '2026-02-19', 60, [
    exerciseLog('1', 'Barbell Bench Press', ['Chest', 'Triceps'], [[80, 6, 1], [78, 7, 2], [76, 8, 2]]),
    exerciseLog('2', 'Incline Dumbbell Press', ['Chest', 'Delts', 'Triceps'], [[32, 10, 1], [30, 11, 2]]),
    exerciseLog('19', 'Dumbbell Lateral Raise', ['Delts'], [[12, 14, 2], [10, 16, 2]]),
  ]),
  alexWorkout('alex-2026-02-14-lower-base', 'Lower Base', '2026-02-14', 67, [
    exerciseLog('13', 'Squat', ['Quads', 'Glutes'], [[100, 6, 1], [98, 7, 2], [94, 8, 2]]),
    exerciseLog('14', 'Leg Press', ['Quads', 'Glutes'], [[205, 11, 1], [195, 12, 2]]),
    exerciseLog('17', 'Leg Curl', ['Hamstrings'], [[48, 12, 2], [46, 13, 2]]),
  ]),
  alexWorkout('alex-2026-02-10-pull-base', 'Pull Base', '2026-02-10', 62, [
    exerciseLog('7', 'Deadlift', ['Back', 'Hamstrings', 'Glutes'], [[134, 5, 1], [128, 6, 2]]),
    exerciseLog('6', 'Lat Pulldown', ['Back', 'Biceps'], [[68, 10, 1], [66, 11, 2]]),
    exerciseLog('8', 'Barbell Curl', ['Biceps', 'Forearms'], [[36, 9, 1], [34, 10, 2]]),
  ]),
];

const legacySeedWorkouts: SeedWorkout[] = [
  {
    id: '1006a775-19f4-4b2f-aa05-d116dc6d1a0d',
    userId: '6fcb7a80-f6e7-4e4e-88da-15d4b9bcf502',
    workoutName: 'Upper Strength',
    date: '2026-04-09',
    duration: 62,
    exercises: [
      {
        exerciseId: '1',
        exerciseName: 'Barbell Bench Press',
        mainMuscles: ['Chest', 'Triceps'],
        sets: [
          { setNumber: 1, weight: 82, reps: 8, rir: 2, type: 'normal', completed: true },
          { setNumber: 2, weight: 82, reps: 7, rir: 1, type: 'normal', completed: true },
          { setNumber: 3, weight: 82, reps: 6, rir: 0, type: 'normal', completed: true },
        ],
      },
      {
        exerciseId: '2',
        exerciseName: 'Incline Dumbbell Press',
        mainMuscles: ['Chest', 'Delts'],
        sets: [
          { setNumber: 1, weight: 34, reps: 10, type: 'normal', completed: true },
          { setNumber: 2, weight: 34, reps: 9, type: 'normal', completed: true },
          { setNumber: 3, weight: 34, reps: 8, type: 'normal', completed: true },
        ],
      },
      {
        exerciseId: '3',
        exerciseName: 'Cable Fly',
        mainMuscles: ['Chest'],
        sets: [
          { setNumber: 1, weight: 18, reps: 12, type: 'normal', completed: true },
          { setNumber: 2, weight: 18, reps: 12, type: 'normal', completed: true },
          { setNumber: 3, weight: 18, reps: 12, type: 'normal', completed: true },
        ],
      },
    ],
    createdAt: '2026-04-09T18:45:00.000Z',
    updatedAt: '2026-04-09T19:50:00.000Z',
  },
  {
    id: '14b8c15f-1e72-48a0-bd76-273d7a3caf8b',
    userId: '6fcb7a80-f6e7-4e4e-88da-15d4b9bcf502',
    workoutName: 'Leg Power',
    date: '2026-04-06',
    duration: 70,
    exercises: [
      {
        exerciseId: '13',
        exerciseName: 'Squat',
        mainMuscles: ['Quads', 'Glutes'],
        sets: [
          { setNumber: 1, weight: 112, reps: 6, rir: 1, type: 'normal', completed: true },
          { setNumber: 2, weight: 112, reps: 6, rir: 1, type: 'normal', completed: true },
          { setNumber: 3, weight: 112, reps: 5, rir: 0, type: 'normal', completed: true },
        ],
      },
      {
        exerciseId: '16',
        exerciseName: 'Romanian Deadlift',
        mainMuscles: ['Hamstrings', 'Glutes'],
        sets: [
          { setNumber: 1, weight: 95, reps: 8, type: 'normal', completed: true },
          { setNumber: 2, weight: 95, reps: 8, type: 'normal', completed: true },
        ],
      },
      {
        exerciseId: '14',
        exerciseName: 'Leg Press',
        mainMuscles: ['Quads', 'Glutes'],
        sets: [
          { setNumber: 1, weight: 220, reps: 10, type: 'normal', completed: true },
          { setNumber: 2, weight: 220, reps: 10, type: 'normal', completed: true },
        ],
      },
    ],
    createdAt: '2026-04-06T17:10:00.000Z',
    updatedAt: '2026-04-06T18:25:00.000Z',
  },
  {
    id: 'a551a17b-4f17-4bda-8ccd-4706b4f814da',
    userId: '6fcb7a80-f6e7-4e4e-88da-15d4b9bcf502',
    workoutName: 'Pull & Hinge',
    date: '2026-04-03',
    duration: 67,
    exercises: [
      {
        exerciseId: '7',
        exerciseName: 'Deadlift',
        mainMuscles: ['Back', 'Hamstrings', 'Glutes'],
        sets: [
          { setNumber: 1, weight: 150, reps: 5, rir: 1, type: 'normal', completed: true },
          { setNumber: 2, weight: 150, reps: 5, rir: 1, type: 'normal', completed: true },
          { setNumber: 3, weight: 150, reps: 4, rir: 0, type: 'normal', completed: true },
        ],
      },
      {
        exerciseId: '4',
        exerciseName: 'Pull-ups',
        mainMuscles: ['Back', 'Biceps'],
        sets: [
          { setNumber: 1, weight: 0, reps: 10, type: 'normal', completed: true },
          { setNumber: 2, weight: 0, reps: 9, type: 'normal', completed: true },
        ],
      },
      {
        exerciseId: '5',
        exerciseName: 'Barbell Row',
        mainMuscles: ['Back'],
        sets: [
          { setNumber: 1, weight: 95, reps: 8, type: 'normal', completed: true },
          { setNumber: 2, weight: 95, reps: 8, type: 'normal', completed: true },
        ],
      },
    ],
    createdAt: '2026-04-03T16:00:00.000Z',
    updatedAt: '2026-04-03T17:10:00.000Z',
  },
  {
    id: '4c3b3f56-2a95-4895-9fd2-6a0b1c0c9c2e',
    userId: 'f4e3d2b1-c5a9-4197-96ee-54d5f8c7fb01',
    workoutName: 'Push Hypertrophy',
    date: '2026-04-08',
    duration: 58,
    exercises: [
      {
        exerciseId: '18',
        exerciseName: 'Overhead Press',
        mainMuscles: ['Delts', 'Triceps'],
        sets: [
          { setNumber: 1, weight: 42, reps: 8, rir: 2, type: 'normal', completed: true },
          { setNumber: 2, weight: 42, reps: 7, rir: 1, type: 'normal', completed: true },
        ],
      },
      {
        exerciseId: '19',
        exerciseName: 'Lateral Raise',
        mainMuscles: ['Delts'],
        sets: [
          { setNumber: 1, weight: 10, reps: 15, type: 'normal', completed: true },
          { setNumber: 2, weight: 10, reps: 15, type: 'normal', completed: true },
        ],
      },
      {
        exerciseId: '11',
        exerciseName: 'Tricep Pushdown',
        mainMuscles: ['Triceps'],
        sets: [
          { setNumber: 1, weight: 34, reps: 12, type: 'normal', completed: true },
          { setNumber: 2, weight: 34, reps: 12, type: 'normal', completed: true },
        ],
      },
    ],
    createdAt: '2026-04-08T17:45:00.000Z',
    updatedAt: '2026-04-08T18:40:00.000Z',
  },
  {
    id: '1786a1f3-8b8f-4f5d-9d55-4e3dccf10f6d',
    userId: 'f4e3d2b1-c5a9-4197-96ee-54d5f8c7fb01',
    workoutName: 'Pull & Arms',
    date: '2026-04-05',
    duration: 55,
    exercises: [
      {
        exerciseId: '5',
        exerciseName: 'Barbell Row',
        mainMuscles: ['Back'],
        sets: [
          { setNumber: 1, weight: 70, reps: 10, type: 'normal', completed: true },
          { setNumber: 2, weight: 70, reps: 10, type: 'normal', completed: true },
        ],
      },
      {
        exerciseId: '8',
        exerciseName: 'Barbell Curl',
        mainMuscles: ['Biceps'],
        sets: [
          { setNumber: 1, weight: 34, reps: 10, type: 'normal', completed: true },
          { setNumber: 2, weight: 34, reps: 10, type: 'normal', completed: true },
        ],
      },
      {
        exerciseId: '26',
        exerciseName: 'Preacher Curl',
        mainMuscles: ['Biceps'],
        sets: [
          { setNumber: 1, weight: 26, reps: 12, type: 'normal', completed: true },
          { setNumber: 2, weight: 26, reps: 12, type: 'normal', completed: true },
        ],
      },
    ],
    createdAt: '2026-04-05T16:00:00.000Z',
    updatedAt: '2026-04-05T17:00:00.000Z',
  },
  {
    id: '73b2f9d7-4a85-4d13-bb0f-528f0c52c5b7',
    userId: 'e7c17cf9-46bb-4ef2-9324-d204d8d92c73',
    workoutName: 'Endurance Conditioning',
    date: '2026-04-07',
    duration: 45,
    exercises: [
      {
        exerciseId: '4',
        exerciseName: 'Pull-ups',
        mainMuscles: ['Back', 'Biceps'],
        sets: [
          { setNumber: 1, weight: 0, reps: 8, type: 'normal', completed: true },
          { setNumber: 2, weight: 0, reps: 8, type: 'normal', completed: true },
          { setNumber: 3, weight: 0, reps: 7, type: 'normal', completed: true },
        ],
      },
      {
        exerciseId: '22',
        exerciseName: 'Chest Dips',
        mainMuscles: ['Chest', 'Triceps'],
        sets: [
          { setNumber: 1, weight: 0, reps: 12, type: 'normal', completed: true },
          { setNumber: 2, weight: 0, reps: 12, type: 'normal', completed: true },
        ],
      },
    ],
    createdAt: '2026-04-07T07:30:00.000Z',
    updatedAt: '2026-04-07T08:20:00.000Z',
  },
  {
    id: 'b1d9d1ae-b8ad-4a4d-b4e7-34f4910b0a28',
    userId: 'e7c17cf9-46bb-4ef2-9324-d204d8d92c73',
    workoutName: 'Core & Accessory',
    date: '2026-04-04',
    duration: 52,
    exercises: [
      {
        exerciseId: '27',
        exerciseName: 'Skull Crushers',
        mainMuscles: ['Triceps'],
        sets: [
          { setNumber: 1, weight: 28, reps: 10, type: 'normal', completed: true },
          { setNumber: 2, weight: 28, reps: 10, type: 'normal', completed: true },
        ],
      },
      {
        exerciseId: '20',
        exerciseName: 'Face Pull',
        mainMuscles: ['Delts', 'Back'],
        sets: [
          { setNumber: 1, weight: 24, reps: 15, type: 'normal', completed: true },
          { setNumber: 2, weight: 24, reps: 15, type: 'normal', completed: true },
        ],
      },
    ],
    createdAt: '2026-04-04T06:50:00.000Z',
    updatedAt: '2026-04-04T07:45:00.000Z',
  },
];

export const seedWorkouts: SeedWorkout[] = [
  alexRankShowcaseWorkout,
  ...alexMay2026Workouts,
  // Keep the other demo profiles intact while replacing Alex's old seed history.
  ...legacySeedWorkouts.filter((workout) => workout.userId !== ALEX_USER_ID),
];

export const seedDatabase = {
  users: seedUsers,
  workouts: seedWorkouts,
};
