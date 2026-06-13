import { useMemo } from 'react';
import { useNavigate } from 'react-router';
import { Dumbbell, TrendingUp, Calendar, AlertTriangle, Info, Flame, Zap, Plus, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';
import { DataService } from '../services/db';
import { useWorkout } from '../contexts/WorkoutContext';

export function HomePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isWorkoutActive, expandWorkout } = useWorkout();

  const dashboard = useMemo(() => {
    if (!user) return null;
    const routines = DataService.getRoutinesByUserId(user.id);
    const latestWorkout = DataService.getLatestWorkout(user.id);
    const weeklyVolume = DataService.getWeeklyVolume(user.id);
    const muscleStatus = DataService.getMuscleAnalysis(user.id);
    const streak = DataService.getWorkoutStreak(user.id);
    const nextRoutine =
      [...routines].sort((a, b) => {
        if (!a.lastPerformed && !b.lastPerformed) return 0;
        if (!a.lastPerformed) return -1;
        if (!b.lastPerformed) return 1;
        return new Date(a.lastPerformed).getTime() - new Date(b.lastPerformed).getTime();
      })[0] ?? null;

    return { routines, latestWorkout, weeklyVolume, muscleStatus, streak, nextRoutine };
  }, [user]);

  const focusItems = useMemo(() => {
    if (!dashboard) return [];
    const urgent = dashboard.muscleStatus
      .filter((item) => ['undertrained', 'overtrained', 'recovering', 'watch'].includes(item.status))
      .slice(0, 3);

    if (urgent.length > 0) return urgent;
    return dashboard.muscleStatus.slice(0, 3);
  }, [dashboard]);

  if (!user || !dashboard) {
    return null;
  }

  const startWorkout = () => {
    if (isWorkoutActive) {
      expandWorkout();
      return;
    }
    navigate('/workout-template-selection');
  };

  const quickStartWorkout = () => {
    if (isWorkoutActive) {
      expandWorkout();
      return;
    }
    navigate('/exercise-selection');
  };

  const streakLabel = dashboard.streak > 0 ? `${dashboard.streak} day streak` : 'Ready to start';
  const hasTrainingData = Boolean(dashboard.latestWorkout);

  return (
    <div className="screen-shell">
      <div className="screen-header">
        <p className="text-zinc-400 text-sm">Welcome back</p>
        <h1 className="text-3xl font-semibold leading-tight mb-1">{user.name.split(' ')[0]}</h1>
        <p className="text-zinc-400 text-sm">Your training log is ready when you are.</p>
      </div>

      <div className="px-4 mt-4 mb-4">
        <div className="premium-card p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-500/15 rounded-lg">
              <Flame className="w-6 h-6 text-orange-400" />
            </div>
            <div className="flex-1">
              <div className="text-lg text-white mb-0.5">{streakLabel}</div>
              <div className="text-sm text-zinc-400">
                {dashboard.latestWorkout ? `Last session: ${dashboard.latestWorkout.workoutName}` : 'Log your first workout to build momentum'}
              </div>
            </div>
            <button
              onClick={quickStartWorkout}
              className="premium-button premium-button-secondary p-2"
              aria-label="Quick start workout"
            >
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="px-4 mb-6">
        <h2 className="section-label mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={quickStartWorkout}
            className="premium-card-muted hover:bg-zinc-800/80 p-4 transition-colors"
          >
            <div className="flex flex-col items-center gap-2">
              <div className="p-2 bg-zinc-800/80 rounded-lg">
                <Zap className="w-5 h-5 text-green-400" />
              </div>
              <span className="text-sm text-white">Log New Workout</span>
            </div>
          </button>
          <button
            onClick={startWorkout}
            className="premium-card-muted hover:bg-zinc-800/80 p-4 transition-colors"
          >
            <div className="flex flex-col items-center gap-2">
              <div className="p-2 bg-zinc-800/80 rounded-lg">
                <Dumbbell className="w-5 h-5 text-blue-400" />
              </div>
              <span className="text-sm text-white">Log Routine</span>
            </div>
          </button>
        </div>
      </div>

      <div className="px-4 mb-6">
        <div className="premium-card overflow-hidden">
          <div className="p-4 border-b border-white/10 bg-white/[0.03]">
            <div className="flex items-center gap-2 mb-1">
              <Dumbbell className="w-5 h-5 text-blue-400" />
              <h2 className="text-lg text-white">Suggested Routine</h2>
            </div>
            <p className="text-sm text-zinc-400">Pick up from your saved templates</p>
          </div>

          <div className="p-4">
            {dashboard.nextRoutine ? (
              <>
                <h3 className="text-xl text-white mb-4">{dashboard.nextRoutine.name}</h3>
                <div className="space-y-2 mb-4">
                  {(dashboard.nextRoutine.exerciseLogs ?? []).slice(0, 4).map((exercise) => {
                    const workingSet = exercise.sets.find((set) => set.type !== 'warmup') || exercise.sets[0];
                    return (
                      <div key={exercise.exerciseId} className="flex items-center justify-between py-2 border-b border-white/10 last:border-0">
                        <span className="text-sm text-zinc-300">{exercise.exerciseName}</span>
                        {workingSet ? (
                          <span className="text-sm text-zinc-400">
                            {workingSet.weight}kg x {workingSet.reps}
                          </span>
                        ) : (
                          <span className="text-sm text-zinc-500">Open sets</span>
                        )}
                      </div>
                    );
                  })}
                </div>
                <button
                  onClick={startWorkout}
                  className="premium-button premium-button-primary w-full py-3.5 flex items-center justify-center gap-2"
                >
                  <Dumbbell className="w-5 h-5" />
                  <span>Choose Workout</span>
                </button>
                <button
                  onClick={() => navigate('/manage-routines')}
                  className="premium-button premium-button-secondary mt-3 w-full py-3 flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Manage Routines</span>
                </button>
              </>
            ) : (
              <button
                onClick={() => navigate('/manage-routines')}
                className="premium-button premium-button-primary w-full py-3.5 flex items-center justify-center gap-2"
              >
                <Plus className="w-5 h-5" />
                <span>Create Routine</span>
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="px-4 space-y-4 mb-6">
        <div className="premium-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="w-5 h-5 text-blue-400" />
            <h2 className="text-lg">Last Workout</h2>
          </div>
          {dashboard.latestWorkout ? (
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-zinc-400 text-sm">Date</span>
                <span className="text-white">{format(new Date(`${dashboard.latestWorkout.date}T00:00:00`), 'MMM d, yyyy')}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-400 text-sm">Exercises</span>
                <span className="text-white">{dashboard.latestWorkout.exercises.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-400 text-sm">Duration</span>
                <span className="text-white">{dashboard.latestWorkout.duration} min</span>
              </div>
              <div className="pt-2 border-t border-white/10 mt-2 space-y-1">
                {dashboard.latestWorkout.exercises.slice(0, 4).map((exercise) => (
                  <div key={exercise.exerciseId} className="text-sm text-zinc-300">
                    {exercise.exerciseName} - {exercise.sets.length} sets
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="empty-state p-4 text-center">
              <p className="text-sm font-medium text-white">No workouts logged yet</p>
              <p className="mt-1 text-sm text-zinc-400">Start with a routine or log a fresh workout to build your history.</p>
              <button
                type="button"
                onClick={quickStartWorkout}
                className="premium-button premium-button-primary mt-4 min-h-11 px-4 text-sm font-medium"
              >
                Log New Workout
              </button>
            </div>
          )}
        </div>

        <div className="premium-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-5 h-5 text-green-400" />
            <h2 className="text-lg">This Week</h2>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="stat-number text-2xl mb-1">{dashboard.weeklyVolume.totalSets}</div>
              <div className="text-xs text-zinc-400">Sets</div>
            </div>
            <div>
              <div className="stat-number text-2xl mb-1">{dashboard.weeklyVolume.totalReps}</div>
              <div className="text-xs text-zinc-400">Reps</div>
            </div>
            <div>
              <div className="stat-number text-2xl mb-1">{(dashboard.weeklyVolume.totalWeight / 1000).toFixed(1)}k</div>
              <div className="text-xs text-zinc-400">Kg</div>
            </div>
          </div>
        </div>

        <div className="premium-card p-4">
          <h2 className="text-lg mb-3">Training Balance</h2>
          {hasTrainingData ? (
            <div className="space-y-2">
              {dashboard.muscleStatus.slice(0, 6).map((item) => (
                <div key={item.muscle} className="premium-row flex items-center justify-between px-3 py-2">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${item.color}`} />
                    <span className="text-white">{item.muscle}</span>
                  </div>
                  <span className="text-xs text-zinc-400">{item.weeklySets} eff. sets/wk</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state p-4 text-sm text-zinc-400">
              Training balance appears after your first logged workout, then improves as you repeat exercises.
            </div>
          )}
        </div>
      </div>

      <div className="px-4 mb-6">
        <h2 className="text-lg mb-3">Today</h2>
        {hasTrainingData ? (
          <div className="space-y-2">
            {focusItems.map((item) => {
              const IconComponent = item.status === 'undertrained' || item.status === 'overtrained' ? AlertTriangle : Info;
              return (
                <div key={item.muscle} className="premium-row p-3 flex items-center gap-3">
                  <IconComponent className={`w-5 h-5 ${item.status === 'balanced' ? 'text-green-400' : 'text-blue-400'}`} />
                  <span className="text-sm text-zinc-200">
                    {item.muscle}: {item.signal.toLowerCase()}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="empty-state p-4 text-sm text-zinc-400">
            No training signals yet. Once you log sessions, this area will show what needs attention today.
          </div>
        )}
      </div>
    </div>
  );
}
