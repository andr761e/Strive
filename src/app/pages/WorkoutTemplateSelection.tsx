import { useNavigate } from 'react-router';
import { ArrowLeft, Plus, Calendar, Dumbbell, Settings } from 'lucide-react';
import { type Exercise, type ExerciseLog } from '../data/mockData';
import { format } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';
import { DataService } from '../services/db';
import { useWorkout } from '../contexts/WorkoutContext';

export function WorkoutTemplateSelectionPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isWorkoutActive, expandWorkout } = useWorkout();
  const workoutTemplates = user ? DataService.getRoutinesByUserId(user.id) : [];

  const selectTemplate = (templateId: string) => {
    if (isWorkoutActive) {
      expandWorkout();
      navigate('/');
      return;
    }

    if (!user) return;
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
          supersetGroupId: log.supersetGroupId,
          sets: log.sets.map((set, idx) => ({
            setNumber: idx + 1,
            weight: set.weight,
            reps: set.reps,
            rir: set.rir,
            duration: set.duration,
            distance: set.distance,
            incline: set.incline,
            type: set.type,
            completed: false,
          })),
          previousSets: DataService.getPreviousWorkoutSets(user.id, log.exerciseId) || undefined,
        }));
      } else {
        // Old template format - just exercises list, create empty sets
        exerciseLogs = template.exercises.map(ex => ({
          exerciseId: ex.id,
          exerciseName: ex.name,
          mainMuscles: ex.mainMuscles,
          sets: [],
          previousSets: DataService.getPreviousWorkoutSets(user.id, ex.id) || undefined,
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
    if (isWorkoutActive) {
      expandWorkout();
      navigate('/');
      return;
    }

    navigate('/exercise-selection');
  };

  const manageRoutines = () => {
    navigate('/manage-routines');
  };

  return (
    <div className="screen-shell">
      {/* Header */}
      <div className="sticky-header">
        <div className="px-4 py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-1">
            <button onClick={() => navigate('/')} className="premium-button premium-button-secondary w-11 h-11 flex items-center justify-center">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-semibold">Start Workout</h1>
          </div>
          <button
            onClick={manageRoutines}
            className="premium-button premium-button-secondary w-11 h-11 flex items-center justify-center text-zinc-300"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Quick Action - New Workout */}
      <div className="px-4 py-4">
        <button
          onClick={createNewWorkout}
          className="premium-button premium-button-primary w-full py-4 flex items-center justify-center gap-3 font-semibold"
        >
          <Plus className="w-6 h-6" />
          <span className="text-lg">Create New Workout</span>
        </button>
      </div>

      {/* Divider */}
      <div className="px-4 py-2">
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-white/10" />
          <span className="text-sm text-zinc-500">or choose a saved routine</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>
      </div>

      {/* Saved Templates */}
      <div className="px-4 py-4 space-y-3">
        {workoutTemplates.length === 0 ? (
          <div className="empty-state p-8 text-center">
            <Dumbbell className="mx-auto mb-3 h-7 w-7 text-zinc-500" />
            <p className="text-sm font-medium text-white">No saved routines yet</p>
            <p className="mt-1 text-sm text-zinc-400">Create a workout now or build reusable routines from the manager.</p>
          </div>
        ) : workoutTemplates.map((template) => (
          <button
            key={template.id}
            onClick={() => selectTemplate(template.id)}
            className="premium-card w-full p-4 transition-colors text-left hover:border-white/20 hover:bg-white/[0.035]"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg border border-blue-400/20 bg-blue-500/10">
                  <Dumbbell className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-white font-medium mb-1">{template.name}</h3>
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
              <div className="flex items-center gap-2 pt-3 border-t border-white/10">
                <Calendar className="w-4 h-4 text-zinc-500" />
                <span className="text-xs text-zinc-500">
                  Last performed: {format(new Date(`${template.lastPerformed}T00:00:00`), 'MMM d, yyyy')}
                </span>
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
