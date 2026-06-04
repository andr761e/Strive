import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { type Exercise, type ExerciseLog, type WorkoutSet } from '../data/mockData';
import { useSettings } from './SettingsContext';
import {
  startActiveWorkoutNotification,
  stopActiveWorkoutNotification,
  updateActiveWorkoutNotification,
} from '../services/notifications';

const ACTIVE_WORKOUT_STORAGE_KEY = 'strive_active_workout_v1';

interface PersistedActiveWorkout {
  workoutName: string;
  workoutStartTime: string;
  workoutExercises: ExerciseLog[];
  routineId: string | null;
  routineName: string | null;
}

interface WorkoutContextType {
  isWorkoutActive: boolean;
  workoutName: string;
  workoutStartTime: Date | null;
  elapsedSeconds: number;
  workoutExercises: ExerciseLog[];
  isMinimized: boolean;
  routineId: string | null;
  routineName: string | null;
  startWorkout: (name: string, exercises: ExerciseLog[], routineId?: string, routineName?: string) => void;
  finishWorkout: () => void;
  discardWorkout: () => void;
  minimizeWorkout: () => void;
  expandWorkout: () => void;
  updateWorkoutExercises: (exercises: ExerciseLog[]) => void;
}

const WorkoutContext = createContext<WorkoutContextType | undefined>(undefined);

function readPersistedActiveWorkout(): PersistedActiveWorkout | null {
  if (typeof window === 'undefined') return null;

  try {
    const raw = window.localStorage.getItem(ACTIVE_WORKOUT_STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<PersistedActiveWorkout>;
    const startedAt = parsed.workoutStartTime ? new Date(parsed.workoutStartTime) : null;
    if (!parsed.workoutName || !startedAt || Number.isNaN(startedAt.getTime()) || !Array.isArray(parsed.workoutExercises)) {
      return null;
    }

    return {
      workoutName: parsed.workoutName,
      workoutStartTime: startedAt.toISOString(),
      workoutExercises: parsed.workoutExercises,
      routineId: parsed.routineId ?? null,
      routineName: parsed.routineName ?? null,
    };
  } catch {
    return null;
  }
}

function writePersistedActiveWorkout(workout: PersistedActiveWorkout) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(ACTIVE_WORKOUT_STORAGE_KEY, JSON.stringify(workout));
}

function clearPersistedActiveWorkout() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(ACTIVE_WORKOUT_STORAGE_KEY);
}

export function WorkoutProvider({ children }: { children: ReactNode }) {
  const { timerNotifications } = useSettings();
  const [persistedWorkout] = useState(() => readPersistedActiveWorkout());
  const [isWorkoutActive, setIsWorkoutActive] = useState(Boolean(persistedWorkout));
  const [workoutName, setWorkoutName] = useState(persistedWorkout?.workoutName ?? '');
  const [workoutStartTime, setWorkoutStartTime] = useState<Date | null>(() =>
    persistedWorkout ? new Date(persistedWorkout.workoutStartTime) : null,
  );
  const [elapsedSeconds, setElapsedSeconds] = useState(() => {
    if (!persistedWorkout) return 0;
    return Math.max(0, Math.floor((Date.now() - new Date(persistedWorkout.workoutStartTime).getTime()) / 1000));
  });
  const [workoutExercises, setWorkoutExercises] = useState<ExerciseLog[]>(persistedWorkout?.workoutExercises ?? []);
  const [isMinimized, setIsMinimized] = useState(Boolean(persistedWorkout));
  const [routineId, setRoutineId] = useState<string | null>(persistedWorkout?.routineId ?? null);
  const [routineName, setRoutineName] = useState<string | null>(persistedWorkout?.routineName ?? null);

  // Timer effect
  useEffect(() => {
    if (isWorkoutActive && workoutStartTime) {
      const interval = setInterval(() => {
        const now = new Date();
        const elapsed = Math.floor((now.getTime() - workoutStartTime.getTime()) / 1000);
        setElapsedSeconds(elapsed);
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [isWorkoutActive, workoutStartTime]);

  useEffect(() => {
    if (!isWorkoutActive || !workoutStartTime) return;

    if (!timerNotifications) {
      void stopActiveWorkoutNotification();
      return;
    }

    void startActiveWorkoutNotification({
      workoutName,
      startedAt: workoutStartTime.toISOString(),
      elapsedSeconds,
    });
  }, [isWorkoutActive, timerNotifications, workoutName, workoutStartTime]);

  useEffect(() => {
    if (!isWorkoutActive || !workoutStartTime || !timerNotifications || elapsedSeconds <= 0) return;

    if (elapsedSeconds % 60 === 0) {
      void updateActiveWorkoutNotification({
        workoutName,
        startedAt: workoutStartTime.toISOString(),
        elapsedSeconds,
      });
    }
  }, [elapsedSeconds, isWorkoutActive, timerNotifications, workoutName, workoutStartTime]);

  useEffect(() => {
    if (!isWorkoutActive || !workoutStartTime) {
      clearPersistedActiveWorkout();
      return;
    }

    writePersistedActiveWorkout({
      workoutName,
      workoutStartTime: workoutStartTime.toISOString(),
      workoutExercises,
      routineId,
      routineName,
    });
  }, [isWorkoutActive, routineId, routineName, workoutExercises, workoutName, workoutStartTime]);

  const startWorkout = (name: string, exercises: ExerciseLog[], routineId?: string, routineName?: string) => {
    const startedAt = new Date();

    setWorkoutName(name);
    setWorkoutExercises(exercises);
    setWorkoutStartTime(startedAt);
    setElapsedSeconds(0);
    setIsWorkoutActive(true);
    setIsMinimized(false);
    setRoutineId(routineId || null);
    setRoutineName(routineName || null);
  };

  const finishWorkout = () => {
    clearPersistedActiveWorkout();
    void stopActiveWorkoutNotification();
    setIsWorkoutActive(false);
    setWorkoutName('');
    setWorkoutStartTime(null);
    setElapsedSeconds(0);
    setWorkoutExercises([]);
    setIsMinimized(false);
    setRoutineId(null);
    setRoutineName(null);
  };

  const discardWorkout = () => {
    clearPersistedActiveWorkout();
    void stopActiveWorkoutNotification();
    setIsWorkoutActive(false);
    setWorkoutName('');
    setWorkoutStartTime(null);
    setElapsedSeconds(0);
    setWorkoutExercises([]);
    setIsMinimized(false);
    setRoutineId(null);
    setRoutineName(null);
  };

  const minimizeWorkout = () => {
    setIsMinimized(true);
  };

  const expandWorkout = () => {
    setIsMinimized(false);
  };

  const updateWorkoutExercises = (exercises: ExerciseLog[]) => {
    setWorkoutExercises(exercises);
  };

  return (
    <WorkoutContext.Provider
      value={{
        isWorkoutActive,
        workoutName,
        workoutStartTime,
        elapsedSeconds,
        workoutExercises,
        isMinimized,
        routineId,
        routineName,
        startWorkout,
        finishWorkout,
        discardWorkout,
        minimizeWorkout,
        expandWorkout,
        updateWorkoutExercises,
      }}
    >
      {children}
    </WorkoutContext.Provider>
  );
}

export function useWorkout() {
  const context = useContext(WorkoutContext);
  if (context === undefined) {
    throw new Error('useWorkout must be used within a WorkoutProvider');
  }
  return context;
}
