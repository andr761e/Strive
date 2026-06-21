import { createContext, useContext, useState, type ReactNode, useEffect, type Dispatch, type SetStateAction } from 'react';
import { exercises, type ExerciseLog } from '../data/mockData';
import { useSettings } from './SettingsContext';
import {
  type ActiveWorkoutNotificationPayload,
  startActiveWorkoutNotification,
  stopActiveWorkoutNotification,
  updateActiveWorkoutNotification,
} from '../services/notifications';

const ACTIVE_WORKOUT_STORAGE_KEY = 'strive_active_workout_v1';
const EXERCISE_ID_ALIASES: Record<string, string> = {
  '38': '37',
  '45': '6',
  '46': '6',
  '54': '53',
  '191': '190',
  '192': '190',
  '193': '190',
  '194': '190',
};

export interface RestTimerState {
  exerciseId: string;
  exerciseName: string;
  durationSeconds: number;
  endsAt: number;
  completedNotified?: boolean;
}

interface PersistedActiveWorkout {
  workoutName: string;
  workoutStartTime: string;
  workoutExercises: ExerciseLog[];
  routineId: string | null;
  routineName: string | null;
  activeRestTimer?: RestTimerState | null;
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
  workoutSheetOffset: number | null;
  isWorkoutSheetOffsetDragging: boolean;
  activeRestTimer: RestTimerState | null;
  startWorkout: (name: string, exercises: ExerciseLog[], routineId?: string, routineName?: string) => boolean;
  finishWorkout: () => void;
  discardWorkout: () => void;
  minimizeWorkout: () => void;
  expandWorkout: () => void;
  updateWorkoutExercises: (exercises: ExerciseLog[]) => void;
  setWorkoutSheetOffset: (offset: number | null, isDragging?: boolean) => void;
  setActiveRestTimer: Dispatch<SetStateAction<RestTimerState | null>>;
}

const WorkoutContext = createContext<WorkoutContextType | undefined>(undefined);

function normalizePersistedExerciseLog(log: ExerciseLog): ExerciseLog | null {
  const exerciseId = EXERCISE_ID_ALIASES[log.exerciseId] ?? log.exerciseId;
  const exercise = exercises.find((item) => item.id === exerciseId);
  if (!exercise) return null;

  return {
    ...log,
    exerciseId: exercise.id,
    exerciseName: exercise.name,
    mainMuscles: exercise.mainMuscles,
  };
}

function isExerciseLog(log: ExerciseLog | null): log is ExerciseLog {
  return Boolean(log);
}

function normalizePersistedRestTimer(restTimer: RestTimerState | null): RestTimerState | null {
  if (!restTimer) return null;
  const exerciseId = EXERCISE_ID_ALIASES[restTimer.exerciseId] ?? restTimer.exerciseId;
  const exercise = exercises.find((item) => item.id === exerciseId);
  if (!exercise) return null;

  return {
    ...restTimer,
    exerciseId: exercise.id,
    exerciseName: exercise.name,
  };
}

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
      workoutExercises: parsed.workoutExercises.map(normalizePersistedExerciseLog).filter(isExerciseLog),
      routineId: parsed.routineId ?? null,
      routineName: parsed.routineName ?? null,
      activeRestTimer: normalizePersistedRestTimer(
        parsed.activeRestTimer &&
        typeof parsed.activeRestTimer.exerciseId === 'string' &&
        typeof parsed.activeRestTimer.exerciseName === 'string' &&
        typeof parsed.activeRestTimer.durationSeconds === 'number' &&
        typeof parsed.activeRestTimer.endsAt === 'number'
          ? {
              exerciseId: parsed.activeRestTimer.exerciseId,
              exerciseName: parsed.activeRestTimer.exerciseName,
              durationSeconds: parsed.activeRestTimer.durationSeconds,
              endsAt: parsed.activeRestTimer.endsAt,
              completedNotified: Boolean(parsed.activeRestTimer.completedNotified),
            }
          : null,
      ),
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

function buildActiveWorkoutNotificationPayload({
  workoutName,
  workoutStartTime,
  elapsedSeconds,
  activeRestTimer,
}: {
  workoutName: string;
  workoutStartTime: Date;
  elapsedSeconds: number;
  activeRestTimer: RestTimerState | null;
}): ActiveWorkoutNotificationPayload {
  return {
    workoutName,
    startedAt: workoutStartTime.toISOString(),
    elapsedSeconds,
    restTimer: activeRestTimer
      ? {
          exerciseName: activeRestTimer.exerciseName,
          endsAt: activeRestTimer.endsAt,
        }
      : undefined,
  };
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
  const [workoutSheetOffset, setWorkoutSheetOffsetValue] = useState<number | null>(null);
  const [isWorkoutSheetOffsetDragging, setIsWorkoutSheetOffsetDragging] = useState(false);
  const [activeRestTimer, setActiveRestTimer] = useState<RestTimerState | null>(
    persistedWorkout?.activeRestTimer ?? null,
  );

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

    void startActiveWorkoutNotification(buildActiveWorkoutNotificationPayload({
      workoutName,
      workoutStartTime,
      elapsedSeconds,
      activeRestTimer,
    }));
  }, [activeRestTimer?.endsAt, activeRestTimer?.exerciseName, isWorkoutActive, timerNotifications, workoutName, workoutStartTime]);

  useEffect(() => {
    if (!isWorkoutActive || !workoutStartTime || !timerNotifications || elapsedSeconds <= 0) return;

    if (elapsedSeconds % 60 === 0) {
      void updateActiveWorkoutNotification(buildActiveWorkoutNotificationPayload({
        workoutName,
        workoutStartTime,
        elapsedSeconds,
        activeRestTimer,
      }));
    }
  }, [activeRestTimer, elapsedSeconds, isWorkoutActive, timerNotifications, workoutName, workoutStartTime]);

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
      activeRestTimer,
    });
  }, [activeRestTimer, isWorkoutActive, routineId, routineName, workoutExercises, workoutName, workoutStartTime]);

  const startWorkout = (name: string, exercises: ExerciseLog[], routineId?: string, routineName?: string) => {
    if (isWorkoutActive) {
      setWorkoutSheetOffsetValue(null);
      setIsWorkoutSheetOffsetDragging(false);
      setIsMinimized(false);
      return false;
    }

    const startedAt = new Date();

    setWorkoutName(name);
    setWorkoutExercises(exercises);
    setWorkoutStartTime(startedAt);
    setElapsedSeconds(0);
    setIsWorkoutActive(true);
    setIsMinimized(false);
    setWorkoutSheetOffsetValue(null);
    setIsWorkoutSheetOffsetDragging(false);
    setActiveRestTimer(null);
    setRoutineId(routineId || null);
    setRoutineName(routineName || null);
    return true;
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
    setWorkoutSheetOffsetValue(null);
    setIsWorkoutSheetOffsetDragging(false);
    setActiveRestTimer(null);
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
    setWorkoutSheetOffsetValue(null);
    setIsWorkoutSheetOffsetDragging(false);
    setActiveRestTimer(null);
    setRoutineId(null);
    setRoutineName(null);
  };

  const minimizeWorkout = () => {
    setWorkoutSheetOffsetValue(null);
    setIsWorkoutSheetOffsetDragging(false);
    setIsMinimized(true);
  };

  const expandWorkout = () => {
    setIsMinimized(false);
  };

  const updateWorkoutExercises = (exercises: ExerciseLog[]) => {
    setWorkoutExercises(exercises);
  };

  const setWorkoutSheetOffset = (offset: number | null, isDragging = false) => {
    setWorkoutSheetOffsetValue(offset);
    setIsWorkoutSheetOffsetDragging(Boolean(offset !== null && isDragging));
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
        workoutSheetOffset,
        isWorkoutSheetOffsetDragging,
        activeRestTimer,
        startWorkout,
        finishWorkout,
        discardWorkout,
        minimizeWorkout,
        expandWorkout,
        updateWorkoutExercises,
        setWorkoutSheetOffset,
        setActiveRestTimer,
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
