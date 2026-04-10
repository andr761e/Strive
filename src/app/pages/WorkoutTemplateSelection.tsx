import { useNavigate } from 'react-router';
import { ArrowLeft, Plus, Calendar, Dumbbell, Settings } from 'lucide-react';
import { workoutTemplates, getPreviousWorkoutData, type Exercise, type ExerciseLog } from '../data/mockData';
import { format } from 'date-fns';

export function WorkoutTemplateSelectionPage() {
  const navigate = useNavigate();

  const selectTemplate = (templateId: string) => {
    const template = workoutTemplates.find(t => t.id === templateId);
    if (template) {
      // If template has full set structure (exerciseLogs), convert to ExerciseLog format
      let exerciseLogs: ExerciseLog[] = [];
      
      if (template.exerciseLogs && template.exerciseLogs.length > 0) {
        // Template has full set structure - use it
        exerciseLogs = template.exerciseLogs.map(log => ({
          exerciseId: log.exerciseId,
          exerciseName: log.exerciseName,
          mainMuscles: log.mainMuscles,
          sets: log.sets.map((set, idx) => ({
            setNumber: idx + 1,
            weight: set.weight,
            reps: set.reps,
            rir: set.rir,
            type: set.type,
            completed: false,
          })),
          previousSets: getPreviousWorkoutData(log.exerciseId) || undefined,
        }));
      } else {
        // Old template format - just exercises list, create empty sets
        exerciseLogs = template.exercises.map(ex => ({
          exerciseId: ex.id,
          exerciseName: ex.name,
          mainMuscles: ex.mainMuscles,
          sets: [],
          previousSets: getPreviousWorkoutData(ex.id) || undefined,
        }));
      }

      // Go to active workout with routine info
      navigate('/active-workout', { 
        state: { 
          exercises: exerciseLogs,
          workoutName: template.name,
          routineId: template.id,
          routineName: template.name,
        } 
      });
    }
  };

  const createNewWorkout = () => {
    navigate('/exercise-selection');
  };

  const manageRoutines = () => {
    navigate('/manage-routines');
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white pb-20">
      {/* Header */}
      <div className="sticky top-0 bg-zinc-950 border-b border-zinc-800 z-10">
        <div className="px-4 py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-1">
            <button onClick={() => navigate('/')} className="text-zinc-400">
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h1 className="text-xl">Start Workout</h1>
          </div>
          <button
            onClick={manageRoutines}
            className="p-2 text-zinc-400 hover:text-white transition-colors"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Quick Action - New Workout */}
      <div className="px-4 py-4">
        <button
          onClick={createNewWorkout}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl flex items-center justify-center gap-3 transition-colors"
        >
          <Plus className="w-6 h-6" />
          <span className="text-lg">Create New Workout</span>
        </button>
      </div>

      {/* Divider */}
      <div className="px-4 py-2">
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-zinc-800" />
          <span className="text-sm text-zinc-500">or choose a saved routine</span>
          <div className="flex-1 h-px bg-zinc-800" />
        </div>
      </div>

      {/* Saved Templates */}
      <div className="px-4 py-4 space-y-3">
        {workoutTemplates.map((template) => (
          <button
            key={template.id}
            onClick={() => selectTemplate(template.id)}
            className="w-full bg-zinc-900 hover:bg-zinc-800 rounded-xl p-4 border border-zinc-800 transition-colors text-left"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-zinc-800 rounded-lg">
                  <Dumbbell className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-white mb-1">{template.name}</h3>
                  <p className="text-sm text-zinc-400">
                    {template.exercises.length} exercises
                  </p>
                </div>
              </div>
            </div>

            {/* Exercise List Preview */}
            <div className="space-y-1 mb-3">
              {template.exercises.slice(0, 3).map((ex, idx) => (
                <div key={idx} className="text-sm text-zinc-400">
                  {idx + 1}. {ex.name}
                </div>
              ))}
              {template.exercises.length > 3 && (
                <div className="text-sm text-zinc-500">
                  +{template.exercises.length - 3} more
                </div>
              )}
            </div>

            {/* Last Performed */}
            {template.lastPerformed && (
              <div className="flex items-center gap-2 pt-3 border-t border-zinc-800">
                <Calendar className="w-4 h-4 text-zinc-500" />
                <span className="text-xs text-zinc-500">
                  Last performed: {format(template.lastPerformed, 'MMM d, yyyy')}
                </span>
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}