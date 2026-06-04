import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { ArrowLeft } from 'lucide-react';
import { exercises, type Exercise } from '../data/mockData';
import { ExerciseFilterPicker } from '../components/ExerciseFilterPicker';

export function ExerciseSelectionPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const template = (location.state as any)?.template;
  const fromActiveWorkout = (location.state as any)?.fromActiveWorkout;
  const fromEditRoutine = (location.state as any)?.fromEditRoutine;
  const currentExercises = (location.state as any)?.currentExercises || [];
  const routine = (location.state as any)?.routine;
  const returnTo = (location.state as any)?.returnTo;
  const initialSearchQuery = (location.state as any)?.searchQuery ?? '';

  const [selectedExercises, setSelectedExercises] = useState<Exercise[]>(
    template?.exercises || []
  );

  const toggleExercise = (exercise: Exercise) => {
    const isSelected = selectedExercises.find((e) => e.id === exercise.id);
    if (isSelected) {
      setSelectedExercises(selectedExercises.filter((e) => e.id !== exercise.id));
    } else {
      setSelectedExercises([...selectedExercises, exercise]);
    }
  };

  // If coming from active workout or routine builder, exclude exercises already added.
  const selectableExercises = exercises.filter(
    (exercise) => (!fromActiveWorkout && !fromEditRoutine) || !currentExercises.includes(exercise.id),
  );

  const startWorkout = () => {
    if (selectedExercises.length > 0) {
      if (fromActiveWorkout) {
        // Return to active workout with new exercises
        navigate('/active-workout', { 
          state: { 
            addExercises: selectedExercises 
          } 
        });
      } else if (fromEditRoutine) {
        // Return to routine builder with new exercises
        navigate('/edit-routine', {
          replace: true,
          state: { 
            routine,
            addExercises: selectedExercises,
            returnTo,
          } 
        });
      } else {
        // Start new workout
        navigate('/active-workout', { state: { exercises: selectedExercises } });
      }
    }
  };

  const getBackPath = () => {
    if (fromActiveWorkout) return '/active-workout';
    if (fromEditRoutine) return '/edit-routine';
    return '/';
  };

  const getTitle = () => {
    if (fromActiveWorkout || fromEditRoutine) return 'Add Exercises';
    return 'Select Exercises';
  };

  const getButtonLabel = () => {
    if (fromActiveWorkout || fromEditRoutine) return `Add (${selectedExercises.length})`;
    return `Start (${selectedExercises.length})`;
  };

  return (
    <div className="screen-shell">
      {/* Header */}
      <div className="sticky-header">
        <div className="px-4 py-4 flex items-center gap-3">
          <button 
            onClick={() =>
              navigate(
                getBackPath(),
                fromEditRoutine ? { replace: true, state: { routine, returnTo } } : undefined,
              )
            }
            className="premium-button premium-button-secondary w-11 h-11 flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-semibold flex-1">
            {getTitle()}
          </h1>
          {selectedExercises.length > 0 && (
            <button
              onClick={startWorkout}
              className="premium-button premium-button-primary px-4 text-sm font-medium"
            >
              {getButtonLabel()}
            </button>
          )}
        </div>

      </div>

      <div className="px-4 py-4">
        <ExerciseFilterPicker
          exercises={selectableExercises}
          selectedExerciseIds={selectedExercises.map((exercise) => exercise.id)}
          onToggleExercise={toggleExercise}
          initialSearchQuery={initialSearchQuery}
          thumbnailSize="md"
          maxMuscleBadges={4}
          listClassName="space-y-3"
          renderExerciseMeta={(exercise) =>
            exercise.equipment ? <div className="mt-2 text-xs text-zinc-500">{exercise.equipment}</div> : null
          }
        />
      </div>
    </div>
  );
}
