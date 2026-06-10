import { useState } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, Save, XCircle, Clock, TrendingUp, Dumbbell, CheckCircle2, ClipboardList } from 'lucide-react';
import { useWorkout } from '../contexts/WorkoutContext';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../components/ui/alert-dialog';
import { ExerciseThumbnail } from '../components/ExerciseThumbnail';
import {
  canCompleteLoggedSet,
  exercises,
  getExerciseLogging,
  getLoggingCompletionHint,
  type ExerciseLog,
} from '../data/mockData';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import { DataService } from '../services/db';
import { schedulePostWorkoutReminders } from '../services/notifications';
import { getWorkoutRankProgressItems } from '../features/exercise-ranks';

export function FinishWorkoutPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { workoutReminders } = useSettings();
  const { workoutName, workoutExercises, elapsedSeconds, finishWorkout, discardWorkout, routineId, routineName } = useWorkout();

  const [notes, setNotes] = useState('');
  const [sessionFeeling, setSessionFeeling] = useState<number | null>(null);
  const [discardDialogOpen, setDiscardDialogOpen] = useState(false);
  const [confirmDiscardDialogOpen, setConfirmDiscardDialogOpen] = useState(false);
  const [validationDialogOpen, setValidationDialogOpen] = useState(false);
  const [validationMessage, setValidationMessage] = useState('');
  const [validationTitle, setValidationTitle] = useState('');
  const [uncompletedSetsDialogOpen, setUncompletedSetsDialogOpen] = useState(false);
  const [routineUpdateDialogOpen, setRoutineUpdateDialogOpen] = useState(false);
  const [saveAsRoutine, setSaveAsRoutine] = useState(false);
  const [newRoutineName, setNewRoutineName] = useState(() =>
    workoutName && workoutName !== 'Active Workout' ? `${workoutName} Routine` : 'New Routine',
  );
  const [pendingRoutineUpdate, setPendingRoutineUpdate] = useState<{
    routineId: string;
    routineName: string | null;
    exercises: ExerciseLog[];
  } | null>(null);
  const [pendingSummaryData, setPendingSummaryData] = useState<any>(null);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m ${secs}s`;
  };

  const totalSets = workoutExercises.reduce((acc, ex) => acc + ex.sets.length, 0);
  const completedSets = workoutExercises.reduce((acc, ex) => acc + ex.sets.filter((set) => set.completed).length, 0);
  const totalWeightLifted = workoutExercises.reduce(
    (acc, exercise) => acc + exercise.sets.reduce((setAcc, set) => setAcc + set.weight * set.reps, 0),
    0,
  );

  const summaryStats = [
    {
      label: 'Duration',
      value: formatTime(elapsedSeconds),
      icon: Clock,
      color: 'text-blue-400',
    },
    {
      label: 'Total Sets',
      value: totalSets.toString(),
      icon: TrendingUp,
      color: 'text-green-400',
    },
    {
      label: 'Completed',
      value: `${completedSets}/${totalSets}`,
      icon: CheckCircle2,
      color: 'text-zinc-300',
    },
    {
      label: 'Total Kg',
      value: Math.round(totalWeightLifted).toLocaleString(),
      icon: Dumbbell,
      color: 'text-orange-400',
    },
  ];

  const showValidation = (title: string, message: string) => {
    setValidationTitle(title);
    setValidationMessage(message);
    setValidationDialogOpen(true);
  };

  const buildRoutineFromWorkout = (name: string, sourceExercises: ExerciseLog[]) => {
    const routineExercises = sourceExercises
      .map((exerciseLog) => exercises.find((exercise) => exercise.id === exerciseLog.exerciseId))
      .filter((exercise): exercise is (typeof exercises)[number] => Boolean(exercise));
    const exerciseLogs = sourceExercises.map((exerciseLog) => ({
      exerciseId: exerciseLog.exerciseId,
      exerciseName: exerciseLog.exerciseName,
      mainMuscles: exerciseLog.mainMuscles,
      supersetGroupId: exerciseLog.supersetGroupId,
      sets: exerciseLog.sets.map((set) => ({
        type: set.type ?? 'normal',
        weight: set.weight,
        reps: set.reps,
        duration: set.duration,
        distance: set.distance,
        incline: set.incline,
      })),
    }));

    return {
      name: name.trim(),
      exercises: routineExercises,
      exerciseLogs,
    };
  };

  const handleLogWorkout = () => {
    const exercisesWithNoSets = workoutExercises.filter((exercise) => exercise.sets.length === 0);
    if (exercisesWithNoSets.length > 0) {
      showValidation(
        'Cannot Log Workout',
        'Every exercise must contain at least one set, or be removed before finishing.',
      );
      return;
    }

    for (const exercise of workoutExercises) {
      const exerciseMeta = exercises.find((item) => item.id === exercise.exerciseId);
      const logging = getExerciseLogging(exerciseMeta);

      for (const set of exercise.sets) {
        if (!canCompleteLoggedSet(set, logging)) {
          showValidation(
            'Invalid Set Data',
            `${exercise.exerciseName}: ${getLoggingCompletionHint(logging)}`,
          );
          return;
        }
      }
    }

    if (!routineId && saveAsRoutine && !newRoutineName.trim()) {
      showValidation('Routine Name Required', 'Enter a routine name before saving this workout as a routine.');
      return;
    }

    const allSetsCompleted = workoutExercises.every((exercise) => exercise.sets.every((set) => set.completed));
    if (!allSetsCompleted) {
      setUncompletedSetsDialogOpen(true);
      return;
    }

    completeWorkout();
  };

  const completeWorkout = () => {
    const updatedExercises = workoutExercises.map((exercise) => ({
      ...exercise,
      sets: exercise.sets.map((set) => ({ ...set, completed: true })),
    }));

    const previousWorkouts = user ? DataService.getWorkoutsByUserId(user.id) : [];
    const totalLoggedSets = updatedExercises.reduce((acc, exercise) => acc + exercise.sets.length, 0);
    const totalVolume = updatedExercises.reduce(
      (acc, exercise) => acc + exercise.sets.reduce((setAcc, set) => setAcc + set.weight * set.reps, 0),
      0,
    );
    const musclesTrained = updatedExercises.flatMap((exercise) => exercise.mainMuscles);
    const comparison = user
      ? DataService.getWorkoutComparison(user.id, totalVolume, totalLoggedSets)
      : { volumeChange: 0, setsChange: 0 };
    const savedWorkout = user
      ? DataService.saveWorkout(user.id, {
          workoutName,
          durationSeconds: elapsedSeconds,
          exercises: updatedExercises,
          bodyweightKg: user.weight,
          notes,
          sessionFeeling,
          sourceRoutineId: routineId,
        })
      : null;

    if (user && !routineId && saveAsRoutine) {
      DataService.saveRoutine(user.id, buildRoutineFromWorkout(newRoutineName, updatedExercises));
    }

    if (user && savedWorkout && workoutReminders) {
      void schedulePostWorkoutReminders({
        userId: user.id,
        workoutId: savedWorkout.id,
        workoutName,
        completedAt: savedWorkout.createdAt,
      });
    }

    const performedExercises = Array.from(new Set(updatedExercises.map((exercise) => exercise.exerciseId)))
      .map((exerciseId) => exercises.find((exercise) => exercise.id === exerciseId))
      .filter((exercise): exercise is (typeof exercises)[number] => Boolean(exercise));
    const rankProgress =
      user && savedWorkout
        ? getWorkoutRankProgressItems({
            performedExercises,
            previousWorkouts,
            workoutsWithCompletedWorkout: [savedWorkout, ...previousWorkouts],
            completedWorkoutId: savedWorkout.id,
            fallbackBodyweightKg: user.weight,
          })
        : [];

    const summaryData = {
      workoutId: savedWorkout?.id,
      workoutName,
      duration: elapsedSeconds,
      totalSets: totalLoggedSets,
      totalVolume,
      musclesTrained,
      exercises: updatedExercises,
      comparison,
      rankProgress,
    };

    setPendingSummaryData(summaryData);
    if (routineId) {
      setPendingRoutineUpdate({
        routineId,
        routineName,
        exercises: updatedExercises,
      });
    }

    finishWorkout();

    if (routineId) {
      setRoutineUpdateDialogOpen(true);
    } else {
      navigate('/workout-summary', { state: { summaryData } });
    }
  };

  const handleFinishAnyway = () => {
    setUncompletedSetsDialogOpen(false);
    completeWorkout();
  };

  const handleUpdateRoutine = () => {
    if (user && pendingRoutineUpdate) {
      DataService.updateRoutineFromWorkout(user.id, pendingRoutineUpdate.routineId, pendingRoutineUpdate.exercises);
    }
    setRoutineUpdateDialogOpen(false);
    navigate('/workout-summary', { state: { summaryData: pendingSummaryData } });
  };

  const handleKeepRoutine = () => {
    setRoutineUpdateDialogOpen(false);
    navigate('/workout-summary', { state: { summaryData: pendingSummaryData } });
  };

  const handleFinalDiscard = () => {
    discardWorkout();
    navigate('/');
  };

  const feelings = [
    { value: 1, labelLines: ['Very', 'Easy'] },
    { value: 2, labelLines: ['', 'Easy'] },
    { value: 3, labelLines: ['', 'Moderate'] },
    { value: 4, labelLines: ['', 'Hard'] },
    { value: 5, labelLines: ['Very', 'Hard'] },
  ];

  return (
    <div className="screen-shell">
      <div className="sticky-header">
        <div className="px-3 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate('/active-workout')}
            className="premium-button premium-button-secondary px-3 flex items-center gap-2 text-zinc-300"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm">Back</span>
          </button>
          <h1 className="text-lg font-semibold">Finish Workout</h1>
          <button
            onClick={handleLogWorkout}
            className="premium-button premium-button-success px-4 flex items-center gap-2 text-sm font-medium"
          >
            <Save className="w-4 h-4" />
            Log
          </button>
        </div>
        <div className="px-3 pb-4 flex justify-center">
          <button
            onClick={() => setDiscardDialogOpen(true)}
            className="flex items-center gap-2 text-sm text-red-400"
          >
            <XCircle className="w-4 h-4" />
            <span>Discard Workout</span>
          </button>
        </div>
      </div>

      <div className="px-2.5 py-5 space-y-5 sm:px-4 sm:py-6 sm:space-y-6">
        <div className="premium-card p-3.5 sm:p-5">
          <h2 className="text-xl font-semibold text-white mb-4">{workoutName}</h2>

          <div className="mb-4 grid grid-cols-2 gap-2 min-[380px]:grid-cols-4">
            {summaryStats.map((stat) => {
              const Icon = stat.icon;

              return (
                <div key={stat.label} className="premium-row flex min-h-[5rem] min-w-0 flex-col justify-between p-2">
                  <div className={`flex min-h-5 min-w-0 items-start gap-1 ${stat.color}`}>
                    <Icon className="h-3 w-3 shrink-0" />
                    <span className="min-w-0 text-[10px] leading-tight">{stat.label}</span>
                  </div>
                  <div className="stat-number truncate text-base leading-none min-[380px]:text-lg">{stat.value}</div>
                </div>
              );
            })}
          </div>

          <div className="space-y-2">
            {workoutExercises.map((exercise) => {
              const exerciseData = exercises.find((item) => item.id === exercise.exerciseId);
              const completedCount = exercise.sets.filter((set) => set.completed).length;

              return (
                <div key={exercise.exerciseId} className="premium-row p-3 flex items-center gap-3">
                  {exerciseData && <ExerciseThumbnail exercise={exerciseData} size="sm" />}
                  <div className="flex-1">
                    <div className="text-white text-sm font-medium mb-1">{exercise.exerciseName}</div>
                    <div className="text-xs text-zinc-400">
                      {completedCount} / {exercise.sets.length} sets completed
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {!routineId && (
          <div className="premium-card p-3.5 sm:p-5">
            <button
              type="button"
              onClick={() => setSaveAsRoutine((current) => !current)}
              className="flex w-full items-start gap-3 text-left"
            >
              <div
                className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${
                  saveAsRoutine
                    ? 'border-blue-400/40 bg-blue-500/15 text-blue-200'
                    : 'border-white/10 bg-white/[0.035] text-zinc-400'
                }`}
              >
                <ClipboardList className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-white font-medium">Save as Routine</h3>
                  <div
                    className={`h-6 w-11 shrink-0 rounded-full border p-0.5 transition-colors ${
                      saveAsRoutine ? 'border-blue-400/40 bg-blue-500/30' : 'border-white/10 bg-black/20'
                    }`}
                    aria-hidden="true"
                  >
                    <div
                      className={`h-4.5 w-4.5 rounded-full bg-white transition-transform ${
                        saveAsRoutine ? 'translate-x-5' : ''
                      }`}
                    />
                  </div>
                </div>
                <p className="mt-1 text-sm leading-relaxed text-zinc-400">
                  Turn this custom workout into a reusable routine after it is logged.
                </p>
              </div>
            </button>
            {saveAsRoutine && (
              <div className="mt-4">
                <label className="mb-2 block text-xs font-medium uppercase tracking-normal text-zinc-500">
                  Routine Name
                </label>
                <input
                  type="text"
                  value={newRoutineName}
                  onChange={(event) => setNewRoutineName(event.target.value)}
                  className="premium-input w-full px-3 py-3 text-white outline-none"
                  placeholder="Routine name"
                />
              </div>
            )}
          </div>
        )}

        <div className="premium-card p-3.5 sm:p-5">
          <h3 className="text-white font-medium mb-3">How did this session feel?</h3>
          <div className="grid grid-cols-5 gap-1.5 min-[380px]:gap-2">
            {feelings.map((feeling) => (
              <button
                key={feeling.value}
                onClick={() => setSessionFeeling(feeling.value)}
                className={`premium-button flex min-h-[4.75rem] min-w-0 flex-col items-center justify-center gap-1 p-1.5 text-center min-[380px]:p-2 ${
                  sessionFeeling === feeling.value ? 'premium-button-primary' : 'premium-button-secondary text-zinc-400'
                }`}
              >
                <div className="stat-number flex h-6 items-center justify-center text-lg leading-none">{feeling.value}</div>
                <div className="flex h-8 w-full flex-col items-center justify-center text-[10px] leading-tight min-[380px]:text-xs">
                  {feeling.labelLines.map((line, index) => (
                    <span key={`${feeling.value}-${index}`} className="block h-3.5 whitespace-nowrap">
                      {line || '\u00A0'}
                    </span>
                  ))}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="premium-card p-3.5 sm:p-5">
          <h3 className="text-white font-medium mb-3">Workout Notes</h3>
          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value.slice(0, 500))}
            placeholder="How did you feel? Any observations or adjustments for next time..."
            className="premium-input w-full h-32 px-3 py-2 text-white placeholder:text-zinc-500 resize-none"
          />
          <p className="text-xs text-zinc-500 mt-2">{notes.length} / 500 characters</p>
        </div>
      </div>

      <AlertDialog open={discardDialogOpen} onOpenChange={setDiscardDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard Workout?</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              This will delete all logged sets and exercises from this workout session. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="premium-button premium-button-secondary border-white/10 text-white">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setDiscardDialogOpen(false);
                setConfirmDiscardDialogOpen(true);
              }}
              className="premium-button premium-button-danger"
            >
              Continue to Discard
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmDiscardDialogOpen} onOpenChange={setConfirmDiscardDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              You completed {completedSets} sets during this {formatTime(elapsedSeconds)} workout. All progress will be permanently lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="premium-button premium-button-secondary border-white/10 text-white">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleFinalDiscard} className="premium-button premium-button-danger">
              Yes, Discard Workout
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={validationDialogOpen} onOpenChange={setValidationDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{validationTitle}</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">{validationMessage}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="premium-button premium-button-secondary border-white/10 text-white">Close</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={uncompletedSetsDialogOpen} onOpenChange={setUncompletedSetsDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Uncompleted Sets</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              Some sets are not currently marked as completed. Finishing now will mark all valid sets as done and log the workout.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="premium-button premium-button-secondary border-white/10 text-white">Go Back</AlertDialogCancel>
            <AlertDialogAction onClick={handleFinishAnyway} className="premium-button premium-button-success">
              Finish Anyway
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={routineUpdateDialogOpen} onOpenChange={setRoutineUpdateDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Update Routine?</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              Would you like to update "{pendingRoutineUpdate?.routineName ?? routineName}" to match the workout you just completed?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleKeepRoutine} className="premium-button premium-button-secondary border-white/10 text-white">
              Keep Existing Routine
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleUpdateRoutine} className="premium-button premium-button-primary">
              Update Routine
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
