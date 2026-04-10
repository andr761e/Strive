import { useState } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, Save, XCircle, Clock, TrendingUp } from 'lucide-react';
import { useWorkout } from '../contexts/WorkoutContext';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../components/ui/alert-dialog';
import { ExerciseThumbnail } from '../components/ExerciseThumbnail';
import { InfoModal } from '../components/InfoModal';
import { exercises } from '../data/mockData';

export function FinishWorkoutPage() {
  const navigate = useNavigate();
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
  const completedSets = workoutExercises.reduce((acc, ex) => 
    acc + ex.sets.filter(set => set.completed).length, 0
  );

  const handleLogWorkout = () => {
    // Step A: Check if any exercise has zero sets
    const exercisesWithNoSets = workoutExercises.filter(ex => ex.sets.length === 0);
    if (exercisesWithNoSets.length > 0) {
      setValidationTitle('Cannot Log Workout');
      setValidationMessage('Every exercise must contain at least one set, or be removed before finishing. Please add sets or remove empty exercises.');
      setValidationDialogOpen(true);
      return;
    }

    // Step B: Check if any set has invalid values
    let hasInvalidWeight = false;
    let hasInvalidReps = false;
    
    for (const exercise of workoutExercises) {
      for (const set of exercise.sets) {
        if (set.weight === 0) {
          hasInvalidWeight = true;
          break;
        }
        if (set.reps === 0) {
          hasInvalidReps = true;
          break;
        }
      }
      if (hasInvalidWeight || hasInvalidReps) break;
    }

    if (hasInvalidWeight) {
      setValidationTitle('Invalid Set Data');
      setValidationMessage('All sets must have a weight greater than 0. Please fix or remove invalid sets before finishing.');
      setValidationDialogOpen(true);
      return;
    }

    if (hasInvalidReps) {
      setValidationTitle('Invalid Set Data');
      setValidationMessage('All sets must have reps greater than 0. Please fix or remove invalid sets before finishing.');
      setValidationDialogOpen(true);
      return;
    }

    // Step C: Check if all sets are marked as done
    const allSetsCompleted = workoutExercises.every(ex => 
      ex.sets.every(set => set.completed)
    );

    if (!allSetsCompleted) {
      // Show confirmation dialog
      setUncompletedSetsDialogOpen(true);
      return;
    }

    // All validation passed, log the workout
    completeWorkout();
  };

  const completeWorkout = () => {
    // Mark all valid sets as completed if they aren't already
    const updatedExercises = workoutExercises.map(ex => ({
      ...ex,
      sets: ex.sets.map(set => ({ ...set, completed: true }))
    }));

    // In real app, save workout with notes and feeling
    finishWorkout();
    
    // Check if workout was started from a routine
    const isFromRoutine = !!routineId;
    
    if (isFromRoutine) {
      setRoutineUpdateDialogOpen(true);
    } else {
      navigateToSummary();
    }
  };

  const handleFinishAnyway = () => {
    setUncompletedSetsDialogOpen(false);
    completeWorkout();
  };

  const handleUpdateRoutine = () => {
    // In real app, update the routine with current workout data
    setRoutineUpdateDialogOpen(false);
    navigateToSummary();
  };

  const handleKeepRoutine = () => {
    setRoutineUpdateDialogOpen(false);
    navigateToSummary();
  };

  const navigateToSummary = () => {
    // Calculate total volume
    const totalVolume = workoutExercises.reduce((acc, ex) => 
      acc + ex.sets.reduce((setAcc, set) => setAcc + (set.weight * set.reps), 0), 0
    );

    // Get all muscles trained
    const musclesTrained = workoutExercises.flatMap(ex => ex.mainMuscles);

    // Mock comparison data (in real app, compare to actual previous workout)
    const summaryData = {
      workoutName,
      duration: elapsedSeconds,
      totalSets: workoutExercises.reduce((acc, ex) => acc + ex.sets.length, 0),
      totalVolume,
      musclesTrained,
      exercises: workoutExercises,
      comparison: {
        volumeChange: 5.2, // Mock: +5.2% volume increase
        setsChange: 2, // Mock: +2 sets
      },
    };

    navigate('/workout-summary', { state: { summaryData } });
  };

  const handleDiscardClick = () => {
    setDiscardDialogOpen(true);
  };

  const handleDiscardConfirm = () => {
    setDiscardDialogOpen(false);
    setConfirmDiscardDialogOpen(true);
  };

  const handleFinalDiscard = () => {
    discardWorkout();
    navigate('/');
  };

  const feelings = [
    { value: 1, label: 'Very Easy', emoji: '😊' },
    { value: 2, label: 'Easy', emoji: '🙂' },
    { value: 3, label: 'Moderate', emoji: '😐' },
    { value: 4, label: 'Hard', emoji: '😅' },
    { value: 5, label: 'Very Hard', emoji: '😰' },
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-white pb-20">
      {/* Header */}
      <div className="sticky top-0 bg-zinc-950 border-b border-zinc-800 z-10">
        <div className="px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate('/active-workout')}
            className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm">Back</span>
          </button>
          <h1 className="text-lg">Finish Workout</h1>
          <button
            onClick={handleLogWorkout}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg text-sm transition-colors"
          >
            <Save className="w-4 h-4" />
            Log
          </button>
        </div>
        <div className="px-4 pb-4 flex justify-center">
          <button
            onClick={handleDiscardClick}
            className="flex items-center gap-2 text-zinc-500 hover:text-red-400 text-sm transition-colors"
          >
            <XCircle className="w-4 h-4" />
            <span>Discard Workout</span>
          </button>
        </div>
      </div>

      <div className="px-4 py-6 space-y-6">
        {/* Workout Summary */}
        <div className="bg-zinc-900 rounded-xl p-5 border border-zinc-800">
          <h2 className="text-xl text-white mb-4">{workoutName}</h2>
          
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="bg-zinc-800 rounded-lg p-3">
              <div className="flex items-center gap-2 text-blue-400 mb-1">
                <Clock className="w-4 h-4" />
                <span className="text-xs">Duration</span>
              </div>
              <div className="text-lg text-white">{formatTime(elapsedSeconds)}</div>
            </div>
            <div className="bg-zinc-800 rounded-lg p-3">
              <div className="flex items-center gap-2 text-green-400 mb-1">
                <TrendingUp className="w-4 h-4" />
                <span className="text-xs">Total Sets</span>
              </div>
              <div className="text-lg text-white">{totalSets}</div>
            </div>
            <div className="bg-zinc-800 rounded-lg p-3">
              <div className="text-xs text-zinc-400 mb-1">Completed</div>
              <div className="text-lg text-white">{completedSets}/{totalSets}</div>
            </div>
          </div>

          {/* Exercise Summary */}
          <div className="space-y-2">
            {workoutExercises.map((exercise) => {
              const exerciseData = exercises.find(ex => ex.id === exercise.exerciseId);
              const completedCount = exercise.sets.filter(s => s.completed).length;
              
              return (
                <div key={exercise.exerciseId} className="bg-zinc-800 rounded-lg p-3 flex items-center gap-3">
                  {exerciseData && <ExerciseThumbnail exercise={exerciseData} size="sm" />}
                  <div className="flex-1">
                    <div className="text-white text-sm mb-1">{exercise.exerciseName}</div>
                    <div className="text-xs text-zinc-400">
                      {completedCount} / {exercise.sets.length} sets completed
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Session Feeling */}
        <div className="bg-zinc-900 rounded-xl p-5 border border-zinc-800">
          <h3 className="text-white mb-3">How did this session feel?</h3>
          <div className="grid grid-cols-5 gap-2">
            {feelings.map((feeling) => (
              <button
                key={feeling.value}
                onClick={() => setSessionFeeling(feeling.value)}
                className={`p-3 rounded-lg text-center transition-colors ${
                  sessionFeeling === feeling.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                }`}
              >
                <div className="text-2xl mb-1">{feeling.emoji}</div>
                <div className="text-xs">{feeling.label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Workout Notes */}
        <div className="bg-zinc-900 rounded-xl p-5 border border-zinc-800">
          <h3 className="text-white mb-3">Workout Notes</h3>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="How did you feel? Any observations or adjustments for next time..."
            className="w-full h-32 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white placeholder:text-zinc-500 resize-none focus:outline-none focus:border-blue-500"
          />
          <p className="text-xs text-zinc-500 mt-2">
            {notes.length} / 500 characters
          </p>
        </div>
      </div>

      {/* Discard Confirmation - First Step */}
      <AlertDialog open={discardDialogOpen} onOpenChange={setDiscardDialogOpen}>
        <AlertDialogContent className="bg-zinc-900 text-white border-zinc-800">
          <AlertDialogHeader>
            <AlertDialogTitle>Discard Workout?</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              This will delete all logged sets and exercises from this workout session. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-zinc-800 text-white border-zinc-700">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDiscardConfirm}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Continue to Discard
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Discard Confirmation - Second Step */}
      <AlertDialog open={confirmDiscardDialogOpen} onOpenChange={setConfirmDiscardDialogOpen}>
        <AlertDialogContent className="bg-zinc-900 text-white border-zinc-800">
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              You completed {completedSets} sets during this {formatTime(elapsedSeconds)} workout. All progress will be permanently lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-zinc-800 text-white border-zinc-700">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleFinalDiscard}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Yes, Discard Workout
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Validation Dialog */}
      <AlertDialog open={validationDialogOpen} onOpenChange={setValidationDialogOpen}>
        <AlertDialogContent className="bg-zinc-900 text-white border-zinc-800">
          <AlertDialogHeader>
            <AlertDialogTitle>{validationTitle}</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              {validationMessage}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-zinc-800 text-white border-zinc-700">
              Cancel
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Uncompleted Sets Dialog */}
      <AlertDialog open={uncompletedSetsDialogOpen} onOpenChange={setUncompletedSetsDialogOpen}>
        <AlertDialogContent className="bg-zinc-900 text-white border-zinc-800">
          <AlertDialogHeader>
            <AlertDialogTitle>Uncompleted Sets</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              Some sets are not currently marked as completed. Finishing the workout now will automatically mark all valid sets as done and then log the workout.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-zinc-800 text-white border-zinc-700">
              Go Back
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleFinishAnyway}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              Finish Anyway
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Routine Update Dialog */}
      <AlertDialog open={routineUpdateDialogOpen} onOpenChange={setRoutineUpdateDialogOpen}>
        <AlertDialogContent className="bg-zinc-900 text-white border-zinc-800">
          <AlertDialogHeader>
            <AlertDialogTitle>Update Routine?</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              Would you like to update "{routineName}" to match the workout you just completed? This will save your current exercise list, set structure, reps, weights, and exercise order.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleKeepRoutine} className="bg-zinc-800 text-white border-zinc-700">
              Keep Existing Routine
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleUpdateRoutine}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Update Routine
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}