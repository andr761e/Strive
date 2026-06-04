export type SetType = 'normal' | 'warmup' | 'drop' | 'failure';
export type LoggingFieldKey = 'weight' | 'reps' | 'rir' | 'duration' | 'distance' | 'incline';
export type ExerciseLoggingMode =
  | 'load_reps'
  | 'bodyweight_reps'
  | 'assisted_reps'
  | 'time_distance'
  | 'time_distance_incline'
  | 'timed_reps'
  | 'loaded_distance'
  | 'timed_hold'
  | 'mobility';
export type MuscleGroup =
  | 'Chest'
  | 'Back'
  | 'Biceps'
  | 'Triceps'
  | 'Quads'
  | 'Hamstrings'
  | 'Delts'
  | 'Glutes'
  | 'Forearms'
  | 'Abs'
  | 'Calves'
  | 'Cardio'
  | 'Warm-up'
  | 'Core';

export type ExerciseCategory = 'Compound' | 'Isolation' | 'Cardio' | 'Warm-up' | 'Carry';

export interface Exercise {
  id: string;
  name: string;
  mainMuscles: MuscleGroup[];
  equipment?: string;
  category?: ExerciseCategory;
  loggingGuidance?: string;
  logging: ExerciseLoggingSchema;
}

export interface LoggingFieldDefinition {
  key: LoggingFieldKey;
  label: string;
  unit?: string;
  step: number;
  allowDecimal?: boolean;
  required?: boolean;
  max?: number;
}

export interface ExerciseLoggingSchema {
  mode: ExerciseLoggingMode;
  label: string;
  fields: LoggingFieldDefinition[];
  guidance: string;
}

export interface WorkoutSet {
  setNumber: number;
  weight: number;
  reps: number;
  rir?: number;
  duration?: number;
  distance?: number;
  incline?: number;
  previousWeight?: number;
  previousReps?: number;
  completed?: boolean;  // Track if set is completed/locked
  type?: SetType;  // Set type (normal, warmup, drop, failure)
}

export interface ExerciseLog {
  exerciseId: string;
  exerciseName: string;
  mainMuscles: MuscleGroup[];
  sets: WorkoutSet[];
  previousPerformance?: string;
  previousSets?: WorkoutSet[];
}

export interface Workout {
  id: string;
  date: Date;
  exercises: ExerciseLog[];
  duration?: number;
  name?: string;
}

export interface WorkoutTemplate {
  id: string;
  name: string;
  exercises: Exercise[];
  exerciseLogs?: TemplateExerciseLog[];  // New: Store full set structure
  lastPerformed?: Date;
}

export interface TemplateExerciseLog {
  exerciseId: string;
  exerciseName: string;
  mainMuscles: MuscleGroup[];
  sets: TemplateSet[];
}

export interface TemplateSet {
  type: SetType;
  weight: number;
  reps: number;
  rir?: number;
  duration?: number;
  distance?: number;
  incline?: number;
}

export interface ProgressData {
  date: string;
  value: number;
}

export interface Suggestion {
  id: string;
  title: string;
  description: string;
  priority: 'Critical' | 'Important' | 'Suggestion';
  confidence?: number;
  actionLabel?: string;
}

const logGuidanceByEquipment: Record<string, string> = {
  Barbell: 'Log total barbell weight including the bar.',
  Dumbbell: 'Log the weight of one dumbbell only.',
  Cable: 'Log the weight selected on the machine stack.',
  Machine: 'Log the weight selected on the machine stack.',
  'Smith Machine': 'Log the loaded Smith machine weight shown or added at your gym.',
  Kettlebell: 'Log the kettlebell weight used.',
  'Trap Bar': 'Log total trap bar weight including the bar.',
  Plate: 'Log the plate weight used.',
  Bodyweight: 'Log added weight only. Use 0 for bodyweight.',
  Cardio: 'Log duration or distance using the available workout fields.',
  'Warm-up': 'Log this as preparation work if you want it included in the session.',
};

const loadRepsFields: LoggingFieldDefinition[] = [
  { key: 'weight', label: 'Load', unit: 'kg', step: 2.5, allowDecimal: true, required: true },
  { key: 'reps', label: 'Reps', step: 1, required: true },
];

const bodyweightFields: LoggingFieldDefinition[] = [
  { key: 'weight', label: 'Added', unit: 'kg', step: 2.5, allowDecimal: true, required: false },
  { key: 'reps', label: 'Reps', step: 1, required: true },
];

const assistedFields: LoggingFieldDefinition[] = [
  { key: 'weight', label: 'Assist', unit: 'kg', step: 2.5, allowDecimal: true, required: false },
  { key: 'reps', label: 'Reps', step: 1, required: true },
];

const timeDistanceFields: LoggingFieldDefinition[] = [
  { key: 'duration', label: 'Time', unit: 'min', step: 1, allowDecimal: true, required: true, max: 600 },
  { key: 'distance', label: 'Dist', unit: 'km', step: 0.1, allowDecimal: true, required: false, max: 999 },
];

const timeDistanceInclineFields: LoggingFieldDefinition[] = [
  ...timeDistanceFields,
  { key: 'incline', label: 'Incline', unit: '%', step: 0.5, allowDecimal: true, required: false, max: 40 },
];

const timedRepsFields: LoggingFieldDefinition[] = [
  { key: 'duration', label: 'Time', unit: 'min', step: 0.5, allowDecimal: true, required: false, max: 600 },
  { key: 'reps', label: 'Reps', step: 1, required: false },
];

const loadedDistanceFields: LoggingFieldDefinition[] = [
  { key: 'weight', label: 'Load', unit: 'kg', step: 2.5, allowDecimal: true, required: false },
  { key: 'distance', label: 'Dist', unit: 'm', step: 5, required: false, max: 10000 },
  { key: 'duration', label: 'Time', unit: 'min', step: 0.5, allowDecimal: true, required: false, max: 600 },
];

const timedHoldFields: LoggingFieldDefinition[] = [
  { key: 'duration', label: 'Time', unit: 'sec', step: 5, required: true, max: 3600 },
  { key: 'weight', label: 'Added', unit: 'kg', step: 2.5, allowDecimal: true, required: false },
];

const mobilityFields: LoggingFieldDefinition[] = [
  { key: 'duration', label: 'Time', unit: 'min', step: 0.5, allowDecimal: true, required: false, max: 180 },
  { key: 'reps', label: 'Reps', step: 1, required: false },
];

function schema(
  mode: ExerciseLoggingMode,
  label: string,
  fields: LoggingFieldDefinition[],
  guidance: string,
): ExerciseLoggingSchema {
  return { mode, label, fields, guidance };
}

function inferEquipment(name: string) {
  if (name.includes('Warm-Up') || name.includes('Band ') || ['Dynamic Warm-Up', 'Arm Circles', 'Leg Swings', 'Hip Circles', 'Shoulder Dislocates', 'Wall Slide', 'Ankle Rocks', 'Dead Bug', 'Bird Dog', 'Plank', 'Side Plank', 'Hollow Hold'].includes(name)) return 'Warm-up';
  if (['Treadmill Run', 'Treadmill Walk', 'Incline Treadmill Walk', 'Outdoor Run', 'Outdoor Walk', 'Stationary Bike', 'Spin Bike', 'Assault Bike', 'Cycling', 'Rowing Machine', 'SkiErg', 'StairMaster', 'Elliptical', 'Cross Trainer', 'Swimming', 'Hiking', 'Jump Rope', 'Battle Ropes', 'Sled Push', 'Sled Pull', 'Burpees', 'Mountain Climbers', 'High Knees', 'Box Jumps'].includes(name)) return 'Cardio';
  if (name.includes('Smith Machine')) return 'Smith Machine';
  if (name.includes('Dumbbell')) return 'Dumbbell';
  if (name.includes('Barbell') || name.includes('EZ-Bar') || name.includes('Good Morning')) return 'Barbell';
  if (name.includes('Cable') || name.includes('Pushdown') || name.includes('Pulldown') || name.includes('Face Pull') || name.includes('Pallof')) return 'Cable';
  if (name.includes('Machine') || name.includes('Pec Deck') || name.includes('Leg Press') || name.includes('Hack Squat') || name.includes('Pendulum') || name.includes('V-Squat')) return 'Machine';
  if (name.includes('Kettlebell')) return 'Kettlebell';
  if (name.includes('Trap Bar')) return 'Trap Bar';
  if (name.includes('Plate')) return 'Plate';
  if (name.includes('Pull-Up') || name.includes('Chin-Up') || name.includes('Push-Up') || name.includes('Dip') || name.includes('Bodyweight') || name.includes('Dead Hang') || name.includes('Hanging') || name.includes('Inverted Row')) return 'Bodyweight';
  return undefined;
}

function inferCategory(name: string, mainMuscles: MuscleGroup[]): ExerciseCategory {
  if (mainMuscles.includes('Warm-up')) return 'Warm-up';
  if (mainMuscles.includes('Cardio')) return 'Cardio';
  if (name.includes('Walk') || name.includes('Carry') || name.includes('Hold') || name.includes('Hang') || name.includes('Pinch')) return 'Carry';
  if (
    name.includes('Fly') ||
    name.includes('Curl') ||
    name.includes('Pushdown') ||
    name.includes('Extension') ||
    name.includes('Raise') ||
    name.includes('Kickback') ||
    name.includes('Wrist') ||
    name.includes('Calf') ||
    name.includes('Tibialis') ||
    name.includes('Toe Raise')
  ) {
    return 'Isolation';
  }
  return 'Compound';
}

function inferLoggingSchema(name: string, mainMuscles: MuscleGroup[], equipment?: string): ExerciseLoggingSchema {
  if (name.includes('Treadmill')) {
    return schema(
      'time_distance_incline',
      'Time, distance, incline',
      timeDistanceInclineFields,
      'Log treadmill work by time, distance, and incline instead of weight x reps.',
    );
  }

  if (['Outdoor Run', 'Outdoor Walk', 'Cycling', 'Swimming', 'Hiking'].includes(name)) {
    return schema(
      'time_distance',
      'Time and distance',
      timeDistanceFields,
      'Log endurance work by duration and distance.',
    );
  }

  if (
    ['Stationary Bike', 'Spin Bike', 'Assault Bike', 'Rowing Machine', 'SkiErg', 'Elliptical', 'Cross Trainer'].includes(name) ||
    name.includes('Bike Warm-Up') ||
    name.includes('Rowing Warm-Up')
  ) {
    return schema(
      'time_distance',
      'Time and distance',
      timeDistanceFields,
      'Log machine cardio by duration and distance when available.',
    );
  }

  if (name === 'StairMaster') {
    return schema(
      'time_distance',
      'Time and floors',
      [
        { key: 'duration', label: 'Time', unit: 'min', step: 1, allowDecimal: true, required: true, max: 600 },
        { key: 'distance', label: 'Floors', unit: 'floors', step: 1, required: false, max: 999 },
      ],
      'Log StairMaster work by duration and floors climbed.',
    );
  }

  if (
    ['Jump Rope', 'Battle Ropes', 'Burpees', 'Mountain Climbers', 'High Knees', 'Box Jumps'].includes(name) ||
    name.includes('Jump Rope Warm-Up')
  ) {
    return schema(
      'timed_reps',
      'Time and reps',
      timedRepsFields,
      'Log conditioning movements by time, reps, or both.',
    );
  }

  if (name.includes('Sled Push') || name.includes('Sled Pull') || name.includes('Carry') || name.includes("Farmer's Walk")) {
    return schema(
      'loaded_distance',
      'Load, distance, time',
      loadedDistanceFields,
      'Log carries and sled work by load, distance, and optionally time.',
    );
  }

  if (
    name.includes('Hold') ||
    name.includes('Hang') ||
    name.includes('Pinch') ||
    name.includes('Wall Sit') ||
    name.includes('Plank') ||
    name.includes('Hollow Hold') ||
    name.includes('Deep Squat Hold')
  ) {
    return schema(
      'timed_hold',
      'Time hold',
      timedHoldFields,
      'Log holds by time. Add load only when external weight is used.',
    );
  }

  if (mainMuscles.includes('Warm-up')) {
    return schema(
      'mobility',
      'Time or reps',
      mobilityFields,
      'Log warm-up and mobility work by time, reps, or both.',
    );
  }

  if (name.includes('Assisted Pull-Up')) {
    return schema(
      'assisted_reps',
      'Assistance x reps',
      assistedFields,
      'Log assistance weight and reps. Lower assistance over time means progress.',
    );
  }

  if (equipment === 'Bodyweight') {
    return schema(
      'bodyweight_reps',
      'Added weight x reps',
      bodyweightFields,
      'Log added weight only. Use 0 for bodyweight sets.',
    );
  }

  return schema(
    'load_reps',
    'Weight x reps',
    loadRepsFields,
    equipment && logGuidanceByEquipment[equipment]
      ? logGuidanceByEquipment[equipment]
      : 'Log load and reps.',
  );
}

function ex(id: string, name: string, mainMuscles: MuscleGroup[], equipment = inferEquipment(name)): Exercise {
  const logging = inferLoggingSchema(name, mainMuscles, equipment);
  return {
    id,
    name,
    mainMuscles,
    equipment,
    category: inferCategory(name, mainMuscles),
    logging,
    loggingGuidance: logging.guidance,
  };
}

export function getExerciseLogging(exercise?: Pick<Exercise, 'logging'> | null): ExerciseLoggingSchema {
  return exercise?.logging ?? schema('load_reps', 'Weight x reps', loadRepsFields, 'Log load and reps.');
}

export const exercises: Exercise[] = [
  ex('1', 'Barbell Bench Press', ['Chest', 'Triceps', 'Delts']),
  ex('21', 'Dumbbell Bench Press', ['Chest', 'Triceps', 'Delts']),
  ex('31', 'Smith Machine Bench Press', ['Chest', 'Triceps', 'Delts']),
  ex('32', 'Machine Chest Press', ['Chest', 'Triceps', 'Delts']),
  ex('33', 'Incline Barbell Bench Press', ['Chest', 'Triceps', 'Delts']),
  ex('2', 'Incline Dumbbell Bench Press', ['Chest', 'Triceps', 'Delts']),
  ex('34', 'Incline Machine Chest Press', ['Chest', 'Triceps', 'Delts']),
  ex('35', 'Decline Barbell Bench Press', ['Chest', 'Triceps']),
  ex('36', 'Decline Dumbbell Bench Press', ['Chest', 'Triceps']),
  ex('37', 'Push-Up', ['Chest', 'Triceps', 'Delts']),
  ex('38', 'Weighted Push-Up', ['Chest', 'Triceps', 'Delts']),
  ex('22', 'Chest Dip', ['Chest', 'Triceps', 'Delts']),
  ex('39', 'Dumbbell Fly', ['Chest']),
  ex('3', 'Cable Fly', ['Chest']),
  ex('40', 'Pec Deck', ['Chest']),
  ex('41', 'Machine Fly', ['Chest']),
  ex('23', 'Low-to-High Cable Fly', ['Chest']),
  ex('42', 'High-to-Low Cable Fly', ['Chest']),
  ex('4', 'Pull-Up', ['Back', 'Biceps', 'Forearms']),
  ex('25', 'Chin-Up', ['Back', 'Biceps', 'Forearms']),
  ex('43', 'Assisted Pull-Up', ['Back', 'Biceps']),
  ex('6', 'Lat Pulldown', ['Back', 'Biceps']),
  ex('44', 'Close-Grip Lat Pulldown', ['Back', 'Biceps']),
  ex('45', 'Wide-Grip Lat Pulldown', ['Back', 'Biceps']),
  ex('46', 'Neutral-Grip Lat Pulldown', ['Back', 'Biceps']),
  ex('47', 'Single-Arm Lat Pulldown', ['Back', 'Biceps']),
  ex('5', 'Barbell Bent-Over Row', ['Back', 'Biceps', 'Forearms']),
  ex('48', 'Pendlay Row', ['Back', 'Biceps', 'Forearms']),
  ex('49', 'Dumbbell Row', ['Back', 'Biceps', 'Forearms']),
  ex('50', 'Chest-Supported Dumbbell Row', ['Back', 'Biceps']),
  ex('51', 'Chest-Supported Machine Row', ['Back', 'Biceps']),
  ex('52', 'Seated Cable Row', ['Back', 'Biceps']),
  ex('24', 'T-Bar Row', ['Back', 'Biceps', 'Forearms']),
  ex('53', 'Machine Row', ['Back', 'Biceps']),
  ex('54', 'Plate-Loaded Row', ['Back', 'Biceps']),
  ex('55', 'Smith Machine Row', ['Back', 'Biceps']),
  ex('56', 'Inverted Row', ['Back', 'Biceps']),
  ex('57', 'Single-Arm Cable Row', ['Back', 'Biceps']),
  ex('58', 'Meadows Row', ['Back', 'Biceps', 'Forearms']),
  ex('20', 'Face Pull', ['Back', 'Delts']),
  ex('59', 'Dumbbell Pullover', ['Back', 'Chest']),
  ex('60', 'Cable Pullover', ['Back', 'Chest']),
  ex('61', 'Barbell Shrug', ['Back', 'Forearms']),
  ex('62', 'Dumbbell Shrug', ['Back', 'Forearms']),
  ex('63', 'Machine Shrug', ['Back']),
  ex('7', 'Deadlift', ['Back', 'Hamstrings', 'Glutes', 'Forearms']),
  ex('64', 'Rack Pull', ['Back', 'Hamstrings', 'Forearms']),
  ex('65', 'Back Extension', ['Back', 'Hamstrings', 'Glutes']),
  ex('8', 'Barbell Curl', ['Biceps', 'Forearms']),
  ex('66', 'EZ-Bar Curl', ['Biceps', 'Forearms']),
  ex('67', 'Dumbbell Curl', ['Biceps', 'Forearms']),
  ex('68', 'Alternating Dumbbell Curl', ['Biceps', 'Forearms']),
  ex('69', 'Seated Dumbbell Curl', ['Biceps']),
  ex('70', 'Cable Curl', ['Biceps']),
  ex('71', 'Machine Curl', ['Biceps']),
  ex('72', 'Incline Dumbbell Curl', ['Biceps']),
  ex('73', 'Bayesian Cable Curl', ['Biceps']),
  ex('26', 'Preacher Curl', ['Biceps']),
  ex('74', 'Machine Preacher Curl', ['Biceps']),
  ex('75', 'Spider Curl', ['Biceps']),
  ex('76', 'Concentration Curl', ['Biceps']),
  ex('9', 'Hammer Curl', ['Biceps', 'Forearms']),
  ex('77', 'Cross-Body Hammer Curl', ['Biceps', 'Forearms']),
  ex('78', 'Rope Hammer Curl', ['Biceps', 'Forearms']),
  ex('79', 'Reverse Curl', ['Biceps', 'Forearms']),
  ex('80', 'Zottman Curl', ['Biceps', 'Forearms']),
  ex('11', 'Cable Triceps Pushdown', ['Triceps']),
  ex('81', 'Rope Pushdown', ['Triceps']),
  ex('82', 'Straight-Bar Pushdown', ['Triceps']),
  ex('83', 'V-Bar Pushdown', ['Triceps']),
  ex('84', 'Single-Arm Cable Pushdown', ['Triceps']),
  ex('85', 'Reverse-Grip Pushdown', ['Triceps', 'Forearms']),
  ex('86', 'Cable Overhead Triceps Extension', ['Triceps']),
  ex('87', 'Rope Overhead Extension', ['Triceps']),
  ex('12', 'Dumbbell Overhead Triceps Extension', ['Triceps']),
  ex('88', 'Single-Arm Dumbbell Overhead Extension', ['Triceps']),
  ex('89', 'EZ-Bar Overhead Extension', ['Triceps']),
  ex('27', 'EZ-Bar Skullcrusher', ['Triceps']),
  ex('90', 'Dumbbell Skullcrusher', ['Triceps']),
  ex('91', 'Cable Skullcrusher', ['Triceps']),
  ex('92', 'Incline Skullcrusher', ['Triceps']),
  ex('10', 'Close-Grip Bench Press', ['Triceps', 'Chest', 'Delts']),
  ex('93', 'JM Press', ['Triceps', 'Chest']),
  ex('94', 'Machine Dip', ['Triceps', 'Chest']),
  ex('95', 'Bench Dip', ['Triceps', 'Chest', 'Delts']),
  ex('96', 'Triceps Dip', ['Triceps', 'Chest', 'Delts']),
  ex('97', 'Diamond Push-Up', ['Triceps', 'Chest', 'Delts']),
  ex('98', 'Cable Kickback', ['Triceps']),
  ex('99', 'Dumbbell Kickback', ['Triceps']),
  ex('13', 'Barbell Back Squat', ['Quads', 'Hamstrings', 'Glutes']),
  ex('100', 'High-Bar Squat', ['Quads', 'Glutes']),
  ex('101', 'Low-Bar Squat', ['Quads', 'Hamstrings', 'Glutes']),
  ex('28', 'Front Squat', ['Quads', 'Glutes']),
  ex('102', 'Smith Machine Squat', ['Quads', 'Glutes']),
  ex('103', 'Goblet Squat', ['Quads', 'Glutes']),
  ex('104', 'Safety Bar Squat', ['Quads', 'Glutes']),
  ex('105', 'Hack Squat', ['Quads', 'Glutes']),
  ex('106', 'Pendulum Squat', ['Quads', 'Glutes']),
  ex('14', 'Leg Press', ['Quads', 'Hamstrings', 'Glutes']),
  ex('107', 'Belt Squat', ['Quads', 'Glutes']),
  ex('108', 'V-Squat', ['Quads', 'Glutes']),
  ex('15', 'Leg Extension', ['Quads']),
  ex('109', 'Single-Leg Leg Extension', ['Quads']),
  ex('29', 'Bulgarian Split Squat', ['Quads', 'Hamstrings', 'Glutes']),
  ex('110', 'Walking Lunge', ['Quads', 'Hamstrings', 'Glutes']),
  ex('111', 'Reverse Lunge', ['Quads', 'Hamstrings', 'Glutes']),
  ex('112', 'Forward Lunge', ['Quads', 'Hamstrings', 'Glutes']),
  ex('113', 'Step-Up', ['Quads', 'Hamstrings', 'Glutes']),
  ex('114', 'Split Squat', ['Quads', 'Hamstrings', 'Glutes']),
  ex('115', 'Smith Machine Split Squat', ['Quads', 'Hamstrings', 'Glutes']),
  ex('116', 'Sissy Squat', ['Quads']),
  ex('117', 'Wall Sit', ['Quads']),
  ex('118', 'Spanish Squat', ['Quads']),
  ex('16', 'Romanian Deadlift', ['Hamstrings', 'Glutes', 'Back', 'Forearms']),
  ex('119', 'Dumbbell Romanian Deadlift', ['Hamstrings', 'Glutes', 'Back', 'Forearms']),
  ex('120', 'Single-Leg Romanian Deadlift', ['Hamstrings', 'Glutes']),
  ex('121', 'Stiff-Leg Deadlift', ['Hamstrings', 'Glutes', 'Back']),
  ex('122', 'Good Morning', ['Hamstrings', 'Glutes', 'Back']),
  ex('123', 'Seated Good Morning', ['Hamstrings', 'Glutes', 'Back']),
  ex('17', 'Seated Leg Curl', ['Hamstrings']),
  ex('124', 'Lying Leg Curl', ['Hamstrings']),
  ex('125', 'Standing Leg Curl', ['Hamstrings']),
  ex('126', 'Single-Leg Leg Curl', ['Hamstrings']),
  ex('127', 'Nordic Hamstring Curl', ['Hamstrings']),
  ex('128', 'Glute-Ham Raise', ['Hamstrings', 'Glutes']),
  ex('129', 'Cable Pull-Through', ['Hamstrings', 'Glutes']),
  ex('130', 'Kettlebell Swing', ['Hamstrings', 'Glutes', 'Back', 'Cardio']),
  ex('131', 'Reverse Hyperextension', ['Hamstrings', 'Glutes', 'Back']),
  ex('132', '45-Degree Back Extension', ['Hamstrings', 'Glutes', 'Back']),
  ex('30', 'Hip Thrust', ['Glutes', 'Hamstrings']),
  ex('18', 'Barbell Overhead Press', ['Delts', 'Triceps']),
  ex('133', 'Seated Barbell Shoulder Press', ['Delts', 'Triceps']),
  ex('134', 'Dumbbell Shoulder Press', ['Delts', 'Triceps']),
  ex('135', 'Seated Dumbbell Shoulder Press', ['Delts', 'Triceps']),
  ex('136', 'Machine Shoulder Press', ['Delts', 'Triceps']),
  ex('137', 'Smith Machine Shoulder Press', ['Delts', 'Triceps']),
  ex('138', 'Arnold Press', ['Delts', 'Triceps']),
  ex('139', 'Landmine Press', ['Delts', 'Triceps', 'Chest']),
  ex('140', 'Single-Arm Landmine Press', ['Delts', 'Triceps', 'Chest']),
  ex('141', 'Push Press', ['Delts', 'Triceps', 'Quads']),
  ex('19', 'Dumbbell Lateral Raise', ['Delts']),
  ex('142', 'Cable Lateral Raise', ['Delts']),
  ex('143', 'Machine Lateral Raise', ['Delts']),
  ex('144', 'Leaning Cable Lateral Raise', ['Delts']),
  ex('145', 'Seated Dumbbell Lateral Raise', ['Delts']),
  ex('146', 'Behind-the-Back Cable Lateral Raise', ['Delts']),
  ex('147', 'Reverse Pec Deck', ['Delts', 'Back']),
  ex('148', 'Rear Delt Dumbbell Fly', ['Delts', 'Back']),
  ex('149', 'Rear Delt Cable Fly', ['Delts', 'Back']),
  ex('150', 'Bent-Over Rear Delt Raise', ['Delts', 'Back']),
  ex('151', 'Rear Delt Row', ['Delts', 'Back']),
  ex('152', 'Dumbbell Front Raise', ['Delts']),
  ex('153', 'Cable Front Raise', ['Delts']),
  ex('154', 'Plate Front Raise', ['Delts']),
  ex('155', 'Barbell Front Raise', ['Delts']),
  ex('156', 'Standing Calf Raise', ['Calves']),
  ex('157', 'Machine Standing Calf Raise', ['Calves']),
  ex('158', 'Smith Machine Calf Raise', ['Calves']),
  ex('159', 'Dumbbell Standing Calf Raise', ['Calves']),
  ex('160', 'Single-Leg Standing Calf Raise', ['Calves']),
  ex('161', 'Seated Calf Raise', ['Calves']),
  ex('162', 'Machine Seated Calf Raise', ['Calves']),
  ex('163', 'Dumbbell Seated Calf Raise', ['Calves']),
  ex('164', 'Leg Press Calf Raise', ['Calves']),
  ex('165', 'Hack Squat Calf Raise', ['Calves']),
  ex('166', 'Donkey Calf Raise', ['Calves']),
  ex('167', 'Bodyweight Calf Raise', ['Calves']),
  ex('168', 'Single-Leg Bodyweight Calf Raise', ['Calves']),
  ex('169', 'Tibialis Raise', ['Calves']),
  ex('170', 'Toe Raise', ['Calves']),
  ex('171', 'Barbell Wrist Curl', ['Forearms']),
  ex('172', 'Dumbbell Wrist Curl', ['Forearms']),
  ex('173', 'Cable Wrist Curl', ['Forearms']),
  ex('174', 'Reverse Wrist Curl', ['Forearms']),
  ex('175', 'Dumbbell Reverse Wrist Curl', ['Forearms']),
  ex('176', 'Cable Reverse Wrist Curl', ['Forearms']),
  ex('177', 'Wrist Roller', ['Forearms']),
  ex('178', "Farmer's Walk", ['Forearms', 'Back']),
  ex('179', "Dumbbell Farmer's Walk", ['Forearms', 'Back']),
  ex('180', "Trap Bar Farmer's Walk", ['Forearms', 'Back']),
  ex('181', 'Suitcase Carry', ['Forearms', 'Core']),
  ex('182', 'Dead Hang', ['Forearms', 'Back']),
  ex('183', 'Weighted Dead Hang', ['Forearms', 'Back']),
  ex('184', 'Plate Pinch', ['Forearms']),
  ex('185', 'Towel Hang', ['Forearms', 'Back']),
  ex('186', 'Gripper', ['Forearms']),
  ex('187', 'Barbell Hold', ['Forearms', 'Back']),
  ex('188', 'Dumbbell Hold', ['Forearms']),
  ex('189', 'Fat Grip Curl', ['Forearms', 'Biceps']),
  ex('190', 'Treadmill Run', ['Cardio']),
  ex('191', 'Treadmill Walk', ['Cardio']),
  ex('192', 'Incline Treadmill Walk', ['Cardio']),
  ex('193', 'Outdoor Run', ['Cardio']),
  ex('194', 'Outdoor Walk', ['Cardio']),
  ex('195', 'Stationary Bike', ['Cardio']),
  ex('196', 'Spin Bike', ['Cardio']),
  ex('197', 'Assault Bike', ['Cardio']),
  ex('198', 'Cycling', ['Cardio']),
  ex('199', 'Rowing Machine', ['Cardio', 'Back']),
  ex('200', 'SkiErg', ['Cardio', 'Back']),
  ex('201', 'StairMaster', ['Cardio', 'Quads', 'Glutes', 'Calves']),
  ex('202', 'Elliptical', ['Cardio']),
  ex('203', 'Cross Trainer', ['Cardio']),
  ex('204', 'Swimming', ['Cardio']),
  ex('205', 'Hiking', ['Cardio', 'Quads', 'Glutes', 'Calves']),
  ex('206', 'Jump Rope', ['Cardio', 'Calves']),
  ex('207', 'Battle Ropes', ['Cardio', 'Delts']),
  ex('208', 'Sled Push', ['Cardio', 'Quads', 'Glutes', 'Calves']),
  ex('209', 'Sled Pull', ['Cardio', 'Quads', 'Hamstrings', 'Glutes']),
  ex('210', 'Burpees', ['Cardio', 'Chest', 'Quads', 'Delts']),
  ex('211', 'Mountain Climbers', ['Cardio', 'Core']),
  ex('212', 'High Knees', ['Cardio']),
  ex('213', 'Box Jumps', ['Cardio', 'Quads', 'Glutes', 'Calves']),
  ex('214', 'Dynamic Warm-Up', ['Warm-up']),
  ex('215', 'Treadmill Warm-Up', ['Warm-up', 'Cardio']),
  ex('216', 'Bike Warm-Up', ['Warm-up', 'Cardio']),
  ex('217', 'Rowing Warm-Up', ['Warm-up', 'Cardio', 'Back']),
  ex('218', 'Jump Rope Warm-Up', ['Warm-up', 'Cardio', 'Calves']),
  ex('219', 'Band Pull-Apart', ['Warm-up', 'Back', 'Delts']),
  ex('220', 'Band External Rotation', ['Warm-up', 'Delts']),
  ex('221', 'Cable External Rotation', ['Warm-up', 'Delts']),
  ex('222', 'Shoulder Dislocates', ['Warm-up', 'Delts']),
  ex('223', 'Scapular Push-Up', ['Warm-up', 'Chest', 'Delts']),
  ex('224', 'Wall Slide', ['Warm-up', 'Delts', 'Back']),
  ex('225', 'Arm Circles', ['Warm-up', 'Delts']),
  ex('226', 'Y-Raise', ['Warm-up', 'Delts', 'Back']),
  ex('227', 'Bodyweight Squat', ['Warm-up', 'Quads', 'Glutes']),
  ex('228', 'Walking Lunge Warm-Up', ['Warm-up', 'Quads', 'Hamstrings', 'Glutes']),
  ex('229', 'Leg Swings', ['Warm-up', 'Hamstrings', 'Quads']),
  ex('230', 'Hip Circles', ['Warm-up', 'Glutes']),
  ex('231', 'Glute Bridge', ['Warm-up', 'Glutes', 'Hamstrings']),
  ex('232', 'Banded Glute Bridge', ['Warm-up', 'Glutes', 'Hamstrings']),
  ex('233', 'Banded Lateral Walk', ['Warm-up', 'Glutes']),
  ex('234', 'Clamshell', ['Warm-up', 'Glutes']),
  ex('235', 'Cossack Squat', ['Warm-up', 'Quads', 'Hamstrings', 'Glutes']),
  ex('236', 'Deep Squat Hold', ['Warm-up', 'Quads', 'Glutes']),
  ex('237', 'Ankle Rocks', ['Warm-up', 'Calves']),
  ex('238', 'Dead Bug', ['Warm-up', 'Core']),
  ex('239', 'Bird Dog', ['Warm-up', 'Core', 'Back', 'Glutes']),
  ex('240', 'Plank', ['Warm-up', 'Core']),
  ex('241', 'Side Plank', ['Warm-up', 'Core']),
  ex('242', 'Hollow Hold', ['Warm-up', 'Core']),
  ex('243', 'Pallof Press', ['Warm-up', 'Core']),
  ex('244', 'Hanging Leg Raise', ['Core']),
  ex('245', 'Cable Crunch', ['Core']),
];

export const lastWorkout: Workout = {
  id: 'w1',
  date: new Date('2026-04-04'),
  exercises: [
    {
      exerciseId: '1',
      exerciseName: 'Barbell Bench Press',
      mainMuscles: ['Chest', 'Triceps'],
      sets: [
        { setNumber: 1, weight: 80, reps: 10, rir: 2 },
        { setNumber: 2, weight: 80, reps: 9, rir: 1 },
        { setNumber: 3, weight: 80, reps: 8, rir: 0 },
      ],
    },
    {
      exerciseId: '2',
      exerciseName: 'Incline Dumbbell Press',
      mainMuscles: ['Chest', 'Delts'],
      sets: [
        { setNumber: 1, weight: 32, reps: 10 },
        { setNumber: 2, weight: 32, reps: 9 },
        { setNumber: 3, weight: 32, reps: 8 },
      ],
      previousPerformance: '30 kg x 10, 9, 8',
    },
  ],
  duration: 65,
};

export const weeklyVolume = {
  totalSets: 48,
  totalReps: 432,
  totalWeight: 18750,
};

export const muscleGroupStatus = [
  { muscle: 'Chest', status: 'progressing', lastTrained: '2 days ago' },
  { muscle: 'Back', status: 'balanced', lastTrained: '3 days ago' },
  { muscle: 'Biceps', status: 'under-recovered', lastTrained: '1 day ago' },
  { muscle: 'Quads', status: 'balanced', lastTrained: '4 days ago' },
];

export const todayInsights = [
  { text: 'Chest progressing well', icon: 'TrendingUp', color: 'text-blue-400' },
  { text: 'Biceps may be under-recovered', icon: 'AlertTriangle', color: 'text-orange-400' },
  { text: 'Consider increasing squat volume', icon: 'Info', color: 'text-blue-400' },
];

export const progressDataBenchPress: ProgressData[] = [
  { date: '2026-01-15', value: 70 },
  { date: '2026-01-22', value: 72 },
  { date: '2026-01-29', value: 72 },
  { date: '2026-02-05', value: 75 },
  { date: '2026-02-12', value: 75 },
  { date: '2026-02-19', value: 77 },
  { date: '2026-02-26', value: 77 },
  { date: '2026-03-05', value: 78 },
  { date: '2026-03-12', value: 80 },
  { date: '2026-03-19', value: 80 },
  { date: '2026-03-26', value: 82 },
  { date: '2026-04-02', value: 82 },
];

export const progressDataSquat: ProgressData[] = [
  { date: '2026-01-15', value: 90 },
  { date: '2026-01-22', value: 92 },
  { date: '2026-01-29', value: 95 },
  { date: '2026-02-05', value: 95 },
  { date: '2026-02-12', value: 97 },
  { date: '2026-02-19', value: 100 },
  { date: '2026-02-26', value: 100 },
  { date: '2026-03-05', value: 102 },
  { date: '2026-03-12', value: 105 },
  { date: '2026-03-19', value: 105 },
  { date: '2026-03-26', value: 107 },
  { date: '2026-04-02', value: 110 },
];

export const muscleAnalysis = [
  { muscle: 'Chest', status: 'progressing', color: 'bg-blue-500' },
  { muscle: 'Back', status: 'balanced', color: 'bg-green-500' },
  { muscle: 'Biceps', status: 'watch', color: 'bg-yellow-500' },
  { muscle: 'Triceps', status: 'balanced', color: 'bg-green-500' },
  { muscle: 'Quads', status: 'balanced', color: 'bg-green-500' },
  { muscle: 'Hamstrings', status: 'undertrained', color: 'bg-orange-500' },
  { muscle: 'Delts', status: 'progressing', color: 'bg-blue-500' },
];

export const suggestions: Suggestion[] = [
  {
    id: 's1',
    title: 'Chest performance has plateaued',
    description: 'Your bench press weight has remained at 80kg for the last 4 sessions. Consider deload or volume adjustment.',
    priority: 'Important',
    confidence: 87,
    actionLabel: 'View details',
  },
  {
    id: 's2',
    title: 'Move chin-ups earlier in workout',
    description: 'Your chin-up performance drops significantly when done after curls. Try switching the order.',
    priority: 'Suggestion',
    confidence: 92,
    actionLabel: 'Apply to next workout',
  },
  {
    id: 's3',
    title: 'Biceps volume may be too high',
    description: 'You\'re doing 18 sets/week for biceps but progression has stalled. Consider reducing volume by 20%.',
    priority: 'Critical',
    confidence: 78,
  },
  {
    id: 's4',
    title: 'Try increasing reps before load',
    description: 'On incline dumbbell press, you\'ve been stuck at 32kg x 8-10 reps. Try hitting 32kg x 12 before increasing weight.',
    priority: 'Suggestion',
    confidence: 85,
    actionLabel: 'Apply suggestion',
  },
  {
    id: 's5',
    title: 'Hamstrings are undertrained',
    description: 'Your hamstring volume is 40% lower than quad volume. Consider adding Romanian deadlifts or leg curls.',
    priority: 'Important',
    confidence: 91,
    actionLabel: 'Add exercise',
  },
];

export const workoutHistory: Workout[] = [
  {
    id: 'w1',
    date: new Date('2026-04-04'),
    exercises: [
      {
        exerciseId: '1',
        exerciseName: 'Barbell Bench Press',
        mainMuscles: ['Chest', 'Triceps'],
        sets: [
          { setNumber: 1, weight: 80, reps: 10 },
          { setNumber: 2, weight: 80, reps: 9 },
          { setNumber: 3, weight: 80, reps: 8 },
        ],
      },
    ],
    duration: 65,
  },
  {
    id: 'w2',
    date: new Date('2026-04-02'),
    exercises: [
      {
        exerciseId: '13',
        exerciseName: 'Squat',
        mainMuscles: ['Quads', 'Glutes'],
        sets: [
          { setNumber: 1, weight: 110, reps: 8 },
          { setNumber: 2, weight: 110, reps: 7 },
          { setNumber: 3, weight: 110, reps: 6 },
        ],
      },
    ],
    duration: 72,
  },
  {
    id: 'w3',
    date: new Date('2026-03-31'),
    exercises: [
      {
        exerciseId: '4',
        exerciseName: 'Pull-ups',
        mainMuscles: ['Back', 'Biceps'],
        sets: [
          { setNumber: 1, weight: 0, reps: 12 },
          { setNumber: 2, weight: 0, reps: 10 },
          { setNumber: 3, weight: 0, reps: 8 },
        ],
      },
    ],
    duration: 58,
  },
];

export const personalRecords = [
  { exercise: 'Bench Press', weight: 82, reps: 10, date: '2026-03-26', improvement: 2, previousBest: 80 },
  { exercise: 'Squat', weight: 110, reps: 8, date: '2026-04-02', improvement: 5, previousBest: 105 },
  { exercise: 'Deadlift', weight: 140, reps: 5, date: '2026-03-20', improvement: 10, previousBest: 130 },
  { exercise: 'Pull-ups', weight: 10, reps: 8, date: '2026-03-15', improvement: 5, previousBest: 5 },
];

export const userProfile = {
  name: 'Alex Morgan',
  height: 178,
  weight: 82,
  experience: 'Intermediate',
  goal: 'Hypertrophy',
  joinDate: '2025-09-01',
  totalWorkouts: 87,
  weeklyAverage: 4.2,
};

function findExerciseById(id: string) {
  const exercise = exercises.find((item) => item.id === id);
  if (!exercise) {
    throw new Error(`Missing exercise ${id} in mock data`);
  }
  return exercise;
}

function templateSet(weight: number, reps: number, rir = 2, type: SetType = 'normal'): TemplateSet {
  return { type, weight, reps, rir };
}

function templateWarmupSet(reps = 10, duration?: number): TemplateSet {
  return { type: 'warmup', weight: 0, reps, rir: 5, duration };
}

function templateDurationSet(duration: number, type: SetType = 'normal'): TemplateSet {
  return { type, weight: 0, reps: 0, duration };
}

function templateHoldSet(duration: number): TemplateSet {
  return { type: 'normal', weight: 0, reps: 0, duration };
}

function templateDistanceSet(weight: number, distance: number): TemplateSet {
  return { type: 'normal', weight, reps: 0, distance };
}

function templateExerciseLog(exerciseId: string, sets: TemplateSet[]): TemplateExerciseLog {
  const exercise = findExerciseById(exerciseId);
  return {
    exerciseId: exercise.id,
    exerciseName: exercise.name,
    mainMuscles: exercise.mainMuscles,
    sets,
  };
}

function templateFromLogs(id: string, name: string, logs: TemplateExerciseLog[], lastPerformed: string): WorkoutTemplate {
  return {
    id,
    name,
    exercises: logs.map((log) => findExerciseById(log.exerciseId)),
    exerciseLogs: logs,
    lastPerformed: new Date(lastPerformed),
  };
}

const may2026WorkoutTemplates: WorkoutTemplate[] = [
  templateFromLogs(
    'template-may-push-a',
    'Push A',
    [
      templateExerciseLog('214', [templateWarmupSet(10)]),
      templateExerciseLog('1', [
        templateSet(80, 8),
        templateSet(80, 8),
        templateSet(82.5, 6),
        templateSet(75, 10),
      ]),
      templateExerciseLog('2', [templateSet(30, 10), templateSet(30, 9), templateSet(28, 10)]),
      templateExerciseLog('135', [templateSet(24, 10), templateSet(24, 9), templateSet(22, 10)]),
      templateExerciseLog('142', [templateSet(10, 15), templateSet(10, 15), templateSet(10, 14)]),
      templateExerciseLog('40', [templateSet(60, 12), templateSet(60, 12)]),
      templateExerciseLog('81', [templateSet(35, 12), templateSet(35, 12), templateSet(32.5, 14)]),
    ],
    '2026-05-25',
  ),
  templateFromLogs(
    'template-may-pull-a',
    'Pull A',
    [
      templateExerciseLog('219', [templateWarmupSet(20), templateWarmupSet(20)]),
      templateExerciseLog('4', [templateSet(0, 8), templateSet(0, 8), templateSet(0, 7), templateSet(0, 6)]),
      templateExerciseLog('5', [templateSet(70, 8), templateSet(70, 8), templateSet(70, 8), templateSet(65, 10)]),
      templateExerciseLog('6', [templateSet(65, 10), templateSet(65, 10), templateSet(60, 12)]),
      templateExerciseLog('51', [templateSet(70, 10), templateSet(70, 10), templateSet(65, 12)]),
      templateExerciseLog('20', [templateSet(25, 15), templateSet(25, 15), templateSet(25, 15)]),
      templateExerciseLog('66', [templateSet(35, 10), templateSet(35, 10), templateSet(32.5, 12)]),
      templateExerciseLog('9', [templateSet(18, 12), templateSet(18, 10)]),
    ],
    '2026-05-26',
  ),
  templateFromLogs(
    'template-may-legs-a',
    'Legs A',
    [
      templateExerciseLog('216', [templateDurationSet(8, 'warmup')]),
      templateExerciseLog('13', [templateSet(100, 6), templateSet(100, 6), templateSet(95, 8), templateSet(90, 10)]),
      templateExerciseLog('16', [templateSet(90, 8), templateSet(90, 8), templateSet(85, 10), templateSet(85, 10)]),
      templateExerciseLog('14', [templateSet(170, 10), templateSet(170, 10), templateSet(160, 12)]),
      templateExerciseLog('17', [templateSet(55, 12), templateSet(55, 12), templateSet(50, 14)]),
      templateExerciseLog('156', [templateSet(80, 12), templateSet(80, 12), templateSet(75, 14), templateSet(75, 14)]),
      templateExerciseLog('169', [templateSet(15, 15), templateSet(15, 15), templateSet(15, 15)]),
    ],
    '2026-05-27',
  ),
  templateFromLogs(
    'template-may-cardio-warmup',
    'Cardio + Warm-up',
    [
      templateExerciseLog('192', [templateDurationSet(35)]),
      templateExerciseLog('214', [templateWarmupSet(10), templateWarmupSet(10)]),
      templateExerciseLog('219', [templateWarmupSet(20), templateWarmupSet(20)]),
      templateExerciseLog('221', [templateSet(5, 15, 5, 'warmup'), templateSet(5, 15, 5, 'warmup')]),
      templateExerciseLog('227', [templateWarmupSet(15), templateWarmupSet(15)]),
      templateExerciseLog('182', [templateHoldSet(30), templateHoldSet(30)]),
    ],
    '2026-05-28',
  ),
  templateFromLogs(
    'template-may-upper-b',
    'Upper B',
    [
      templateExerciseLog('214', [templateWarmupSet(10)]),
      templateExerciseLog('33', [templateSet(70, 8), templateSet(70, 8), templateSet(67.5, 9), templateSet(65, 10)]),
      templateExerciseLog('25', [templateSet(0, 8), templateSet(0, 8), templateSet(0, 7), templateSet(0, 7)]),
      templateExerciseLog('32', [templateSet(75, 10), templateSet(75, 10), templateSet(70, 12)]),
      templateExerciseLog('52', [templateSet(65, 10), templateSet(65, 10), templateSet(60, 12)]),
      templateExerciseLog('136', [templateSet(55, 10), templateSet(55, 9), templateSet(50, 11)]),
      templateExerciseLog('147', [templateSet(45, 15), templateSet(45, 15), templateSet(40, 16)]),
      templateExerciseLog('86', [templateSet(30, 12), templateSet(30, 12)]),
      templateExerciseLog('72', [templateSet(16, 12), templateSet(16, 10)]),
    ],
    '2026-05-29',
  ),
  templateFromLogs(
    'template-may-legs-b',
    'Legs B',
    [
      templateExerciseLog('216', [templateDurationSet(8, 'warmup')]),
      templateExerciseLog('28', [templateSet(75, 8), templateSet(75, 8), templateSet(72.5, 8), templateSet(70, 10)]),
      templateExerciseLog('124', [templateSet(45, 10), templateSet(45, 10), templateSet(42.5, 12), templateSet(42.5, 12)]),
      templateExerciseLog('105', [templateSet(110, 10), templateSet(110, 10), templateSet(100, 12)]),
      templateExerciseLog('29', [templateSet(24, 10), templateSet(24, 10), templateSet(22, 12)]),
      templateExerciseLog('65', [templateSet(20, 12), templateSet(20, 12)]),
      templateExerciseLog('161', [templateSet(55, 15), templateSet(55, 15), templateSet(50, 16), templateSet(50, 16)]),
      templateExerciseLog('178', [templateDistanceSet(40, 40), templateDistanceSet(40, 40)]),
    ],
    '2026-05-30',
  ),
];

export const workoutTemplates: WorkoutTemplate[] = [
  ...may2026WorkoutTemplates,
  {
    id: 'template1',
    name: 'Push Day A',
    exercises: [
      exercises.find(e => e.id === '1')!,  // Barbell Bench Press
      exercises.find(e => e.id === '2')!,  // Incline Dumbbell Press
      exercises.find(e => e.id === '18')!, // Overhead Press
      exercises.find(e => e.id === '19')!, // Lateral Raise
      exercises.find(e => e.id === '11')!, // Tricep Pushdown
    ],
    exerciseLogs: [
      {
        exerciseId: '1',
        exerciseName: 'Barbell Bench Press',
        mainMuscles: ['Chest', 'Triceps'],
        sets: [
          { type: 'warmup', weight: 60, reps: 10, rir: 5 },
          { type: 'normal', weight: 80, reps: 10, rir: 2 },
          { type: 'normal', weight: 80, reps: 9, rir: 1 },
          { type: 'normal', weight: 80, reps: 8, rir: 0 },
        ],
      },
      {
        exerciseId: '2',
        exerciseName: 'Incline Dumbbell Press',
        mainMuscles: ['Chest', 'Delts'],
        sets: [
          { type: 'normal', weight: 32, reps: 10, rir: 2 },
          { type: 'normal', weight: 32, reps: 9, rir: 1 },
          { type: 'normal', weight: 32, reps: 8, rir: 0 },
        ],
      },
      {
        exerciseId: '18',
        exerciseName: 'Overhead Press',
        mainMuscles: ['Delts', 'Triceps'],
        sets: [
          { type: 'normal', weight: 50, reps: 10, rir: 2 },
          { type: 'normal', weight: 50, reps: 9, rir: 1 },
          { type: 'normal', weight: 50, reps: 8, rir: 1 },
        ],
      },
      {
        exerciseId: '19',
        exerciseName: 'Lateral Raise',
        mainMuscles: ['Delts'],
        sets: [
          { type: 'normal', weight: 12, reps: 15, rir: 2 },
          { type: 'normal', weight: 12, reps: 14, rir: 1 },
          { type: 'normal', weight: 12, reps: 12, rir: 0 },
          { type: 'drop', weight: 8, reps: 15, rir: 0 },
        ],
      },
      {
        exerciseId: '11',
        exerciseName: 'Tricep Pushdown',
        mainMuscles: ['Triceps'],
        sets: [
          { type: 'normal', weight: 40, reps: 12, rir: 2 },
          { type: 'normal', weight: 40, reps: 11, rir: 1 },
          { type: 'normal', weight: 40, reps: 10, rir: 0 },
        ],
      },
    ],
    lastPerformed: new Date('2026-04-04'),
  },
  {
    id: 'template2',
    name: 'Pull Day A',
    exercises: [
      exercises.find(e => e.id === '7')!,  // Deadlift
      exercises.find(e => e.id === '4')!,  // Pull-ups
      exercises.find(e => e.id === '5')!,  // Barbell Row
      exercises.find(e => e.id === '8')!,  // Barbell Curl
      exercises.find(e => e.id === '20')!, // Face Pull
    ],
    exerciseLogs: [
      {
        exerciseId: '7',
        exerciseName: 'Deadlift',
        mainMuscles: ['Back', 'Hamstrings', 'Glutes'],
        sets: [
          { type: 'warmup', weight: 100, reps: 5, rir: 5 },
          { type: 'normal', weight: 140, reps: 5, rir: 2 },
          { type: 'normal', weight: 140, reps: 5, rir: 1 },
          { type: 'normal', weight: 140, reps: 5, rir: 0 },
        ],
      },
      {
        exerciseId: '4',
        exerciseName: 'Pull-ups',
        mainMuscles: ['Back', 'Biceps'],
        sets: [
          { type: 'normal', weight: 0, reps: 12, rir: 2 },
          { type: 'normal', weight: 0, reps: 10, rir: 1 },
          { type: 'normal', weight: 0, reps: 8, rir: 0 },
        ],
      },
      {
        exerciseId: '5',
        exerciseName: 'Barbell Row',
        mainMuscles: ['Back'],
        sets: [
          { type: 'normal', weight: 70, reps: 10, rir: 2 },
          { type: 'normal', weight: 70, reps: 9, rir: 1 },
          { type: 'normal', weight: 70, reps: 8, rir: 1 },
        ],
      },
      {
        exerciseId: '8',
        exerciseName: 'Barbell Curl',
        mainMuscles: ['Biceps'],
        sets: [
          { type: 'normal', weight: 35, reps: 12, rir: 2 },
          { type: 'normal', weight: 35, reps: 10, rir: 1 },
          { type: 'normal', weight: 35, reps: 9, rir: 0 },
        ],
      },
      {
        exerciseId: '20',
        exerciseName: 'Face Pull',
        mainMuscles: ['Delts', 'Back'],
        sets: [
          { type: 'normal', weight: 30, reps: 15, rir: 2 },
          { type: 'normal', weight: 30, reps: 14, rir: 1 },
          { type: 'normal', weight: 30, reps: 13, rir: 1 },
        ],
      },
    ],
    lastPerformed: new Date('2026-04-02'),
  },
  {
    id: 'template3',
    name: 'Leg Day',
    exercises: [
      exercises.find(e => e.id === '13')!, // Squat
      exercises.find(e => e.id === '16')!, // Romanian Deadlift
      exercises.find(e => e.id === '15')!, // Leg Extension
      exercises.find(e => e.id === '17')!, // Leg Curl
      exercises.find(e => e.id === '30')!, // Hip Thrust
    ],
    exerciseLogs: [
      {
        exerciseId: '13',
        exerciseName: 'Squat',
        mainMuscles: ['Quads', 'Glutes'],
        sets: [
          { type: 'warmup', weight: 80, reps: 8, rir: 5 },
          { type: 'normal', weight: 110, reps: 8, rir: 2 },
          { type: 'normal', weight: 110, reps: 7, rir: 1 },
          { type: 'normal', weight: 110, reps: 6, rir: 0 },
        ],
      },
      {
        exerciseId: '16',
        exerciseName: 'Romanian Deadlift',
        mainMuscles: ['Hamstrings', 'Glutes'],
        sets: [
          { type: 'normal', weight: 90, reps: 10, rir: 2 },
          { type: 'normal', weight: 90, reps: 9, rir: 1 },
          { type: 'normal', weight: 90, reps: 8, rir: 1 },
        ],
      },
      {
        exerciseId: '15',
        exerciseName: 'Leg Extension',
        mainMuscles: ['Quads'],
        sets: [
          { type: 'normal', weight: 60, reps: 12, rir: 2 },
          { type: 'normal', weight: 60, reps: 11, rir: 1 },
          { type: 'normal', weight: 60, reps: 10, rir: 0 },
        ],
      },
      {
        exerciseId: '17',
        exerciseName: 'Leg Curl',
        mainMuscles: ['Hamstrings'],
        sets: [
          { type: 'normal', weight: 50, reps: 12, rir: 2 },
          { type: 'normal', weight: 50, reps: 11, rir: 1 },
          { type: 'normal', weight: 50, reps: 10, rir: 1 },
        ],
      },
      {
        exerciseId: '30',
        exerciseName: 'Hip Thrust',
        mainMuscles: ['Glutes', 'Hamstrings'],
        sets: [
          { type: 'normal', weight: 100, reps: 12, rir: 2 },
          { type: 'normal', weight: 100, reps: 11, rir: 1 },
          { type: 'normal', weight: 100, reps: 10, rir: 1 },
        ],
      },
    ],
    lastPerformed: new Date('2026-03-31'),
  },
  {
    id: 'template4',
    name: 'Upper Body',
    exercises: [
      exercises.find(e => e.id === '1')!,  // Barbell Bench Press
      exercises.find(e => e.id === '5')!,  // Barbell Row
      exercises.find(e => e.id === '18')!, // Overhead Press
      exercises.find(e => e.id === '8')!,  // Barbell Curl
      exercises.find(e => e.id === '11')!, // Tricep Pushdown
    ],
    lastPerformed: new Date('2026-03-28'),
  },
  {
    id: 'template5',
    name: 'Full Body',
    exercises: [
      exercises.find(e => e.id === '13')!, // Squat
      exercises.find(e => e.id === '1')!,  // Barbell Bench Press
      exercises.find(e => e.id === '7')!,  // Deadlift
      exercises.find(e => e.id === '18')!, // Overhead Press
      exercises.find(e => e.id === '4')!,  // Pull-ups
    ],
  },
];

// Mock function to get previous workout data for an exercise
export const getPreviousWorkoutData = (exerciseId: string): WorkoutSet[] | null => {
  const previousWorkout = workoutHistory.find(w => 
    w.exercises.some(e => e.exerciseId === exerciseId)
  );
  
  if (previousWorkout) {
    const exerciseLog = previousWorkout.exercises.find(e => e.exerciseId === exerciseId);
    return exerciseLog?.sets || null;
  }
  
  // Return mock data for exercises not in history
  if (exerciseId === '1') {
    return [
      { setNumber: 1, weight: 80, reps: 10 },
      { setNumber: 2, weight: 80, reps: 9 },
      { setNumber: 3, weight: 80, reps: 8 },
    ];
  } else if (exerciseId === '2') {
    return [
      { setNumber: 1, weight: 30, reps: 10 },
      { setNumber: 2, weight: 30, reps: 10 },
      { setNumber: 3, weight: 30, reps: 9 },
    ];
  }
  
  return null;
};
