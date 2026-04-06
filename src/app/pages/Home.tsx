import { useNavigate } from 'react-router';
import { Dumbbell, TrendingUp, Calendar, AlertTriangle, Info } from 'lucide-react';
import { lastWorkout, weeklyVolume, muscleGroupStatus, todayInsights } from '../data/mockData';
import { format } from 'date-fns';

export function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-zinc-950 text-white pb-20">
      {/* Header */}
      <div className="px-4 pt-6 pb-4">
        <h1 className="text-2xl mb-1">Welcome back</h1>
        <p className="text-zinc-400 text-sm">Let's make today count</p>
      </div>

      {/* Start Workout Button */}
      <div className="px-4 mb-6">
        <button
          onClick={() => navigate('/workout-template-selection')}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl flex items-center justify-center gap-3 transition-colors"
        >
          <Dumbbell className="w-6 h-6" />
          <span className="text-lg">Start Workout</span>
        </button>
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