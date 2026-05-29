import { seedDatabase } from '../../../db/seed';

const STORAGE_KEY = 'strive_app_database_v1';
const SESSION_KEY = 'strive_app_session_user';

type SetType = 'normal' | 'warmup' | 'drop' | 'failure';

export interface WorkoutSet {
  setNumber: number;
  weight: number;
  reps: number;
  rir?: number;
  type: SetType;
  completed: boolean;
}

export interface ExerciseLog {
  exerciseId: string;
  exerciseName: string;
  mainMuscles: string[];
  sets: WorkoutSet[];
}

export interface WorkoutRecord {
  id: string;
  userId: string;
  workoutName: string;
  date: string;
  duration: number;
  exercises: ExerciseLog[];
  createdAt: string;
  updatedAt: string;
}

export interface DBUser {
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

export interface PersonalRecord {
  exercise: string;
  weight: number;
  reps: number;
  date: string;
}

interface LocalDb {
  users: DBUser[];
  workouts: WorkoutRecord[];
}

function getStorage() {
  return typeof window !== 'undefined' ? window.localStorage : null;
}

function readDatabase(): LocalDb {
  const storage = getStorage();
  if (!storage) {
    return { users: seedDatabase.users, workouts: seedDatabase.workouts };
  }

  const raw = storage.getItem(STORAGE_KEY);
  if (!raw) {
    storage.setItem(STORAGE_KEY, JSON.stringify(seedDatabase));
    return { users: seedDatabase.users, workouts: seedDatabase.workouts };
  }

  try {
    return JSON.parse(raw) as LocalDb;
  } catch {
    storage.setItem(STORAGE_KEY, JSON.stringify(seedDatabase));
    return { users: seedDatabase.users, workouts: seedDatabase.workouts };
  }
}

function writeDatabase(database: LocalDb) {
  const storage = getStorage();
  if (!storage) return;
  storage.setItem(STORAGE_KEY, JSON.stringify(database));
}

function normalizeDate(value: string | Date) {
  const date = typeof value === 'string' ? new Date(value) : value;
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate(),
  ).padStart(2, '0')}`;
}

function sortWorkouts(workouts: WorkoutRecord[]) {
  return [...workouts].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

function getDb() {
  return readDatabase();
}

function saveDb(db: LocalDb) {
  writeDatabase(db);
}

export const DataService = {
  initialize() {
    const storage = getStorage();
    if (!storage) return;
    if (!storage.getItem(STORAGE_KEY)) {
      storage.setItem(STORAGE_KEY, JSON.stringify(seedDatabase));
    }
  },

  getUsers() {
    return getDb().users;
  },

  getUserByUsername(username: string) {
    const users = getDb().users;
    return users.find((user) => user.username.toLowerCase() === username.toLowerCase()) || null;
  },

  getUserById(id: string) {
    const users = getDb().users;
    return users.find((user) => user.id === id) || null;
  },

  validateCredentials(username: string, password: string) {
    const user = this.getUserByUsername(username);
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
  }) {
    const db = getDb();
    const existingUsername = db.users.some((item) => item.username.toLowerCase() === user.username.toLowerCase());

    if (existingUsername) {
      throw new Error('Username already exists. Please choose another.');
    }

    const now = new Date().toISOString();
    const newUser: DBUser = {
      id: crypto.randomUUID(),
      name: user.name,
      username: user.username,
      email: user.email,
      birthday: user.birthday,
      dateJoined: normalizeDate(now),
      password: user.password,
      height: 170,
      weight: 72,
      experience: 'Intermediate',
      goal: 'General Fitness',
      createdAt: now,
      updatedAt: now,
    };

    db.users = [newUser, ...db.users];
    saveDb(db);
    return newUser;
  },

  updateUserSettings(userId: string, updates: Partial<Omit<DBUser, 'id' | 'username' | 'email' | 'password' | 'createdAt'>>) {
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

  getWorkoutsByUserId(userId: string) {
    if (!userId) return [];
    const workouts = getDb().workouts.filter((workout) => workout.userId === userId);
    return sortWorkouts(workouts);
  },

  getLatestWorkout(userId: string) {
    const workouts = this.getWorkoutsByUserId(userId);
    return workouts[0] ?? null;
  },

  getPersonalRecords(userId: string) {
    const workouts = this.getWorkoutsByUserId(userId);
    const records = new Map<string, PersonalRecord>();

    workouts.forEach((workout) => {
      workout.exercises.forEach((exercise) => {
        exercise.sets.forEach((set) => {
          const existing = records.get(exercise.exerciseName);
          if (!existing || set.weight > existing.weight || (set.weight === existing.weight && set.reps > existing.reps)) {
            records.set(exercise.exerciseName, {
              exercise: exercise.exerciseName,
              weight: set.weight,
              reps: set.reps,
              date: workout.date,
            });
          }
        });
      });
    });

    return Array.from(records.values()).sort((a, b) => b.weight - a.weight).slice(0, 8);
  },

  getWorkoutSummary(userId: string) {
    const workouts = this.getWorkoutsByUserId(userId);
    const now = new Date();
    const firstDate = workouts.length ? new Date(workouts[workouts.length - 1].date) : now;
    const daysActive = Math.max(7, Math.ceil((now.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24)));
    const weeksActive = Math.max(1, Math.round(daysActive / 7));
    return {
      totalWorkouts: workouts.length,
      weeklyAverage: Math.round(workouts.length / weeksActive) || 0,
    };
  },

  getWeeklyVolume(userId: string) {
    const workouts = this.getWorkoutsByUserId(userId);
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 7);

    return workouts
      .filter((workout) => new Date(workout.date) >= cutoff)
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
    const workoutDates = new Set(workouts.map((workout) => workout.date));
    const today = new Date();
    let streak = 0;

    for (let i = 0; i < 7; i += 1) {
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() - i);
      const key = normalizeDate(checkDate);
      if (workoutDates.has(key)) {
        streak += 1;
      } else {
        break;
      }
    }

    return streak;
  },

  getExerciseOptions(userId: string) {
    const workouts = this.getWorkoutsByUserId(userId);
    const seen = new Map<string, ExerciseLog>();

    workouts.forEach((workout) => {
      workout.exercises.forEach((exercise) => {
        if (!seen.has(exercise.exerciseId)) {
          seen.set(exercise.exerciseId, {
            exerciseId: exercise.exerciseId,
            exerciseName: exercise.exerciseName,
            mainMuscles: exercise.mainMuscles,
            sets: [],
          });
        }
      });
    });

    return Array.from(seen.values()).sort((a, b) => a.exerciseName.localeCompare(b.exerciseName));
  },

  getProgressSeries(userId: string, exerciseId: string) {
    const workouts = this.getWorkoutsByUserId(userId).slice().reverse();
    const progressData = workouts
      .map((workout) => {
        const exercise = workout.exercises.find((item) => item.exerciseId === exerciseId);
        if (!exercise) return null;
        const bestWeight = Math.max(...exercise.sets.map((set) => set.weight));
        return {
          date: workout.date,
          value: bestWeight,
        };
      })
      .filter((point): point is { date: string; value: number } => point !== null);

    return progressData;
  },

  getMuscleAnalysis(userId: string) {
    const workouts = this.getWorkoutsByUserId(userId);
    const muscleCounts = new Map<string, number>();

    workouts.forEach((workout) => {
      workout.exercises.forEach((exercise) => {
        exercise.mainMuscles.forEach((muscle) => {
          muscleCounts.set(muscle, (muscleCounts.get(muscle) ?? 0) + 1);
        });
      });
    });

    const totals = Array.from(muscleCounts.values());
    const average = totals.length ? totals.reduce((sum, value) => sum + value, 0) / totals.length : 0;

    return Array.from(muscleCounts.entries()).map(([muscle, count]) => {
      const ratio = average ? count / average : 1;
      if (ratio >= 1.2) {
        return { muscle, status: 'progressing', color: 'bg-blue-500' };
      }
      if (ratio >= 0.8) {
        return { muscle, status: 'balanced', color: 'bg-green-500' };
      }
      if (ratio >= 0.6) {
        return { muscle, status: 'watch', color: 'bg-yellow-500' };
      }
      return { muscle, status: 'undertrained', color: 'bg-orange-500' };
    });
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
