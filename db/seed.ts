export interface SeedUser {
  id: string;
  name: string;
  username: string;
  email: string;
  birthday: string;
  dateJoined: string;
  password: string;
  height: number;
  weight: number;
  experience: string;
  goal: string;
  createdAt: string;
  updatedAt: string;
}

export interface SeedWorkoutSet {
  setNumber: number;
  weight: number;
  reps: number;
  rir?: number;
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

export const seedWorkouts: SeedWorkout[] = [
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

export const seedDatabase = {
  users: seedUsers,
  workouts: seedWorkouts,
};
