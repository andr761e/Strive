import { useNavigate } from 'react-router';
import { Dumbbell, TrendingUp, Calendar, AlertTriangle, Info, Flame, Zap, Plus } from 'lucide-react';
import { lastWorkout, weeklyVolume, muscleGroupStatus, todayInsights, workoutTemplates } from '../data/mockData';
import { format } from 'date-fns';

export function HomePage() {
  const navigate = useNavigate();

  // Get next workout (first template for demo purposes)
  const nextWorkout = workoutTemplates[0];
  const workoutStreak = 4; // Mock data

  const startNextWorkout = () => {
    navigate('/workout-template-selection');
  };

  const quickStartWorkout = () => {
    navigate('/exercise-selection');
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white pb-20">
      {/* Header */}
      <div className="px-4 pt-6 pb-4">
        <h1 className="text-2xl mb-1">Welcome back</h1>
        <p className="text-zinc-400 text-sm">Let's make today count</p>
      </div>

      {/* Streak Section */}
      <div className="px-4 mb-4">
        <div className="bg-gradient-to-r from-orange-600/20 to-orange-500/10 rounded-xl p-4 border border-orange-500/30">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-500/20 rounded-lg">
              <Flame className="w-6 h-6 text-orange-400" />
            </div>
            <div>
              <div className="text-lg text-white mb-0.5">{workoutStreak} Week Streak</div>
              <div className="text-sm text-orange-200/80">Don't break your streak</div>
            </div>
          </div>
        </div>
      </div>

      {/* Next Workout Section */}
      <div className="px-4 mb-6">
        <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
          <div className="p-4 bg-zinc-800/50 border-b border-zinc-800">
            <div className="flex items-center gap-2 mb-1">
              <Dumbbell className="w-5 h-5 text-blue-400" />
              <h2 className="text-lg text-white">Next Workout</h2>
            </div>
            <p className="text-sm text-zinc-400">Ready when you are</p>
          </div>
          
          <div className="p-4">
            <h3 className="text-xl text-white mb-4">{nextWorkout.name}</h3>
            
            {/* Exercise Preview */}
            <div className="space-y-2 mb-4">
              {nextWorkout.exerciseLogs && nextWorkout.exerciseLogs.slice(0, 4).map((exercise) => {
                // Get first working set (non-warmup)
                const workingSet = exercise.sets.find(s => s.type !== 'warmup') || exercise.sets[0];
                return (
                  <div key={exercise.exerciseId} className="flex items-center justify-between py-2 border-b border-zinc-800 last:border-0">
                    <span className="text-sm text-zinc-300">{exercise.exerciseName}</span>
                    {workingSet && (
                      <span className="text-sm text-zinc-400">
                        {workingSet.weight}kg × {workingSet.reps}
                      </span>
                    )}
                  </div>
                );
              })}
              {nextWorkout.exerciseLogs && nextWorkout.exerciseLogs.length > 4 && (
                <div className="text-sm text-zinc-500 py-1">
                  +{nextWorkout.exerciseLogs.length - 4} more exercises
                </div>
              )}
            </div>

            <button
              onClick={startNextWorkout}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded-lg flex items-center justify-center gap-2 transition-colors"
            >
              <Dumbbell className="w-5 h-5" />
              <span>Start Workout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="px-4 mb-6">
        <h2 className="text-sm text-zinc-400 mb-3 uppercase tracking-wide">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={quickStartWorkout}
            className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl p-4 transition-colors"
          >
            <div className="flex flex-col items-center gap-2">
              <div className="p-2 bg-zinc-800 rounded-lg">
                <Zap className="w-5 h-5 text-green-400" />
              </div>
              <span className="text-sm text-white">Quick Start</span>
            </div>
          </button>
          <button
            onClick={() => navigate('/manage-routines')}
            className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl p-4 transition-colors"
          >
            <div className="flex flex-col items-center gap-2">
              <div className="p-2 bg-zinc-800 rounded-lg">
                <Plus className="w-5 h-5 text-blue-400" />
              </div>
              <span className="text-sm text-white">Manage Routines</span>
            </div>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="px-4 space-y-4 mb-6">
        {/* Last Workout */}
        <div className="bg-zinc-900 rounded-xl p-4 border border-zinc-800">
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="w-5 h-5 text-blue-400" />
            <h2 className="text-lg">Last Workout</h2>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-zinc-400 text-sm">Date</span>
              <span className="text-white">{format(lastWorkout.date, 'MMM d, yyyy')}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-zinc-400 text-sm">Exercises</span>
              <span className="text-white">{lastWorkout.exercises.length}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-zinc-400 text-sm">Duration</span>
              <span className="text-white">{lastWorkout.duration} min</span>
            </div>
            <div className="pt-2 border-t border-zinc-800 mt-2">
              {lastWorkout.exercises.map((ex, idx) => (
                <div key={idx} className="text-sm text-zinc-300">
                  {ex.exerciseName} - {ex.sets.length} sets
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Weekly Volume */}
        <div className="bg-zinc-900 rounded-xl p-4 border border-zinc-800">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-5 h-5 text-green-400" />
            <h2 className="text-lg">Weekly Training Volume</h2>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="text-2xl text-white mb-1">{weeklyVolume.totalSets}</div>
              <div className="text-xs text-zinc-400">Total Sets</div>
            </div>
            <div>
              <div className="text-2xl text-white mb-1">{weeklyVolume.totalReps}</div>
              <div className="text-xs text-zinc-400">Total Reps</div>
            </div>
            <div>
              <div className="text-2xl text-white mb-1">{(weeklyVolume.totalWeight / 1000).toFixed(1)}k</div>
              <div className="text-xs text-zinc-400">Volume (kg)</div>
            </div>
          </div>
        </div>

        {/* Muscle Group Status */}
        <div className="bg-zinc-900 rounded-xl p-4 border border-zinc-800">
          <h2 className="text-lg mb-3">Muscle Group Status</h2>
          <div className="space-y-2">
            {muscleGroupStatus.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      item.status === 'progressing'
                        ? 'bg-blue-400'
                        : item.status === 'balanced'
                        ? 'bg-green-400'
                        : 'bg-orange-400'
                    }`}
                  />
                  <span className="text-white">{item.muscle}</span>
                </div>
                <span className="text-xs text-zinc-400">{item.lastTrained}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Today's Insights */}
      <div className="px-4 mb-6">
        <h2 className="text-lg mb-3">Today's Insights</h2>
        <div className="space-y-2">
          {todayInsights.map((insight, idx) => {
            const IconComponent = insight.icon === 'TrendingUp' ? TrendingUp : insight.icon === 'AlertTriangle' ? AlertTriangle : Info;
            return (
              <div key={idx} className="bg-zinc-900 rounded-lg p-3 border border-zinc-800 flex items-center gap-3">
                <IconComponent className={`w-5 h-5 ${insight.color}`} />
                <span className="text-sm text-zinc-200">{insight.text}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}