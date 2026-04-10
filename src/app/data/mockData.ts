export type SetType = 'normal' | 'warmup' | 'drop' | 'failure';

export interface WorkoutSet {
  setNumber: number;
  weight: number;
  reps: number;
  rir?: number;
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

export const exercises: Exercise[] = [
  { id: '1', name: 'Barbell Bench Press', mainMuscles: ['Chest', 'Triceps'], equipment: 'Barbell', category: 'Compound', loggingGuidance: 'Log total barbell weight including the bar (typically 20kg)' },
  { id: '2', name: 'Incline Dumbbell Press', mainMuscles: ['Chest', 'Delts'], equipment: 'Dumbbell', category: 'Compound', loggingGuidance: 'Log the weight of one dumbbell only' },
  { id: '3', name: 'Cable Fly', mainMuscles: ['Chest'], equipment: 'Cable', category: 'Isolation', loggingGuidance: 'Log the total weight selected on the machine stack' },
  { id: '4', name: 'Pull-ups', mainMuscles: ['Back', 'Biceps'], equipment: 'Bodyweight', category: 'Compound', loggingGuidance: 'Log added weight only. Use 0 for bodyweight' },
  { id: '5', name: 'Barbell Row', mainMuscles: ['Back'], equipment: 'Barbell', category: 'Compound', loggingGuidance: 'Log total barbell weight including the bar' },
  { id: '6', name: 'Lat Pulldown', mainMuscles: ['Back', 'Biceps'], equipment: 'Cable', category: 'Compound', loggingGuidance: 'Log the weight selected on the machine stack' },
  { id: '7', name: 'Deadlift', mainMuscles: ['Back', 'Hamstrings', 'Glutes'], equipment: 'Barbell', category: 'Compound', loggingGuidance: 'Log total barbell weight including the bar' },
  { id: '8', name: 'Barbell Curl', mainMuscles: ['Biceps'], equipment: 'Barbell', category: 'Isolation', loggingGuidance: 'Log total barbell weight including the bar' },
  { id: '9', name: 'Hammer Curl', mainMuscles: ['Biceps', 'Forearms'], equipment: 'Dumbbell', category: 'Isolation', loggingGuidance: 'Log the weight of one dumbbell only' },
  { id: '10', name: 'Close-Grip Bench Press', mainMuscles: ['Triceps', 'Chest'], equipment: 'Barbell', category: 'Compound', loggingGuidance: 'Log total barbell weight including the bar' },
  { id: '11', name: 'Tricep Pushdown', mainMuscles: ['Triceps'], equipment: 'Cable', category: 'Isolation', loggingGuidance: 'Log the weight selected on the machine stack' },
  { id: '12', name: 'Overhead Tricep Extension', mainMuscles: ['Triceps'], equipment: 'Dumbbell', category: 'Isolation', loggingGuidance: 'Log total dumbbell weight (both hands together) or single dumbbell weight if using one' },
  { id: '13', name: 'Squat', mainMuscles: ['Quads', 'Glutes'], equipment: 'Barbell', category: 'Compound', loggingGuidance: 'Log total barbell weight including the bar' },
  { id: '14', name: 'Leg Press', mainMuscles: ['Quads', 'Glutes'], equipment: 'Machine', category: 'Compound', loggingGuidance: 'Log only the plate weight added, not the sled base weight' },
  { id: '15', name: 'Leg Extension', mainMuscles: ['Quads'], equipment: 'Machine', category: 'Isolation', loggingGuidance: 'Log the weight selected on the machine stack' },
  { id: '16', name: 'Romanian Deadlift', mainMuscles: ['Hamstrings', 'Glutes'], equipment: 'Barbell', category: 'Compound', loggingGuidance: 'Log total barbell weight including the bar' },
  { id: '17', name: 'Leg Curl', mainMuscles: ['Hamstrings'], equipment: 'Machine', category: 'Isolation', loggingGuidance: 'Log the weight selected on the machine stack' },
  { id: '18', name: 'Overhead Press', mainMuscles: ['Delts', 'Triceps'], equipment: 'Barbell', category: 'Compound', loggingGuidance: 'Log total barbell weight including the bar' },
  { id: '19', name: 'Lateral Raise', mainMuscles: ['Delts'], equipment: 'Dumbbell', category: 'Isolation', loggingGuidance: 'Log the weight of one dumbbell only' },
  { id: '20', name: 'Face Pull', mainMuscles: ['Delts', 'Back'], equipment: 'Cable', category: 'Isolation', loggingGuidance: 'Log the weight selected on the machine stack' },
  { id: '21', name: 'Dumbbell Bench Press', mainMuscles: ['Chest', 'Triceps'], equipment: 'Dumbbell', category: 'Compound', loggingGuidance: 'Log the weight of one dumbbell only' },
  { id: '22', name: 'Chest Dips', mainMuscles: ['Chest', 'Triceps'], equipment: 'Bodyweight', category: 'Compound', loggingGuidance: 'Log added weight only. Use 0 for bodyweight' },
  { id: '23', name: 'Cable Crossover', mainMuscles: ['Chest'], equipment: 'Cable', category: 'Isolation', loggingGuidance: 'Log the total weight (both cables combined)' },
  { id: '24', name: 'T-Bar Row', mainMuscles: ['Back'], equipment: 'Barbell', category: 'Compound', loggingGuidance: 'Log only the plate weight added, not the bar weight' },
  { id: '25', name: 'Chin-ups', mainMuscles: ['Back', 'Biceps'], equipment: 'Bodyweight', category: 'Compound', loggingGuidance: 'Log added weight only. Use 0 for bodyweight' },
  { id: '26', name: 'Preacher Curl', mainMuscles: ['Biceps'], equipment: 'Machine', category: 'Isolation', loggingGuidance: 'Log the weight selected on the machine stack' },
  { id: '27', name: 'Skull Crushers', mainMuscles: ['Triceps'], equipment: 'Barbell', category: 'Isolation', loggingGuidance: 'Log total weight including the bar or EZ bar' },
  { id: '28', name: 'Front Squat', mainMuscles: ['Quads', 'Glutes'], equipment: 'Barbell', category: 'Compound', loggingGuidance: 'Log total barbell weight including the bar' },
  { id: '29', name: 'Bulgarian Split Squat', mainMuscles: ['Quads', 'Glutes'], equipment: 'Dumbbell', category: 'Compound', loggingGuidance: 'Log the weight of one dumbbell only' },
  { id: '30', name: 'Hip Thrust', mainMuscles: ['Glutes', 'Hamstrings'], equipment: 'Barbell', category: 'Compound', loggingGuidance: 'Log total barbell weight including the bar' },
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
      previousPerformance: '30 kg × 10, 9, 8',
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
    description: 'On incline dumbbell press, you\'ve been stuck at 32kg × 8-10 reps. Try hitting 32kg × 12 before increasing weight.',
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

export const workoutTemplates: WorkoutTemplate[] = [
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