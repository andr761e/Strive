import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { type Exercise, type ExerciseLog, type WorkoutSet } from '../data/mockData';

interface WorkoutContextType {
  isWorkoutActive: boolean;
  workoutName: string;
  workoutStartTime: Date | null;
  elapsedSeconds: number;
  workoutExercises: ExerciseLog[];
  isMinimized: boolean;
  startWorkout: (name: string, exercises: ExerciseLog[]) => void;
  finishWorkout: () => void;
  discardWorkout: () => void;
  minimizeWorkout: () => void;
  expandWorkout: () => void;
  updateWorkoutExercises: (exercises: ExerciseLog[]) => void;
}

const WorkoutContext = createContext<WorkoutContextType | undefined>(undefined);

export function WorkoutProvider({ children }: { children: ReactNode }) {
  const [isWorkoutActive, setIsWorkoutActive] = useState(false);
  const [workoutName, setWorkoutName] = useState('');
  const [workoutStartTime, setWorkoutStartTime] = useState<Date | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [workoutExercises, setWorkoutExercises] = useState<ExerciseLog[]>([]);
  const [isMinimized, setIsMinimized] = useState(false);

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

  const startWorkout = (name: string, exercises: ExerciseLog[]) => {
    setWorkoutName(name);
    setWorkoutExercises(exercises);
    setWorkoutStartTime(new Date());
    setElapsedSeconds(0);
    setIsWorkoutActive(true);
    setIsMinimized(false);
  };

  const finishWorkout = () => {
    // In a real app, save the workout here
    setIsWorkoutActive(false);
    setWorkoutName('');
    setWorkoutStartTime(null);
    setElapsedSeconds(0);
    setWorkoutExercises([]);
    setIsMinimized(false);
  };

  const discardWorkout = () => {
    setIsWorkoutActive(false);
    setWorkoutName('');
    setWorkoutStartTime(null);
    setElapsedSeconds(0);
    setWorkoutExercises([]);
    setIsMinimized(false);
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
