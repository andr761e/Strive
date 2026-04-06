import { User, Calendar, TrendingUp, Award, Settings, Target } from 'lucide-react';
import { userProfile, workoutHistory, personalRecords } from '../data/mockData';
import { format } from 'date-fns';

export function ProfilePage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white pb-20">
      {/* Header with Profile Info */}
      <div className="px-4 pt-6 pb-4 border-b border-zinc-800">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center">
            <User className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl">{userProfile.name}</h1>
            <p className="text-zinc-400 text-sm">
              Member since {format(new Date(userProfile.joinDate), 'MMM yyyy')}
            </p>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="px-4 py-4">
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-zinc-900 rounded-xl p-3 border border-zinc-800">
            <div className="text-2xl text-white mb-1">{userProfile.totalWorkouts}</div>
            <div className="text-xs text-zinc-400">Total Workouts</div>
          </div>
          <div className="bg-zinc-900 rounded-xl p-3 border border-zinc-800">
            <div className="text-2xl text-white mb-1">{userProfile.weeklyAverage}</div>
            <div className="text-xs text-zinc-400">Weekly Avg</div>
          </div>
          <div className="bg-zinc-900 rounded-xl p-3 border border-zinc-800">
            <div className="text-2xl text-white mb-1">28</div>
            <div className="text-xs text-zinc-400">Week Streak</div>
          </div>
        </div>
      </div>

      {/* Personal Stats */}
      <div className="px-4 py-2">
        <h2 className="text-lg mb-3">Personal Stats</h2>
        <div className="bg-zinc-900 rounded-xl p-4 border border-zinc-800 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-zinc-400">Height</span>
            <span className="text-white">{userProfile.height} cm</span>
          </div>
          <div className="h-px bg-zinc-800" />
          <div className="flex justify-between items-center">
            <span className="text-zinc-400">Weight</span>
            <span className="text-white">{userProfile.weight} kg</span>
          </div>
          <div className="h-px bg-zinc-800" />
          <div className="flex justify-between items-center">
            <span className="text-zinc-400">Experience</span>
            <span className="text-white">{userProfile.experience}</span>
          </div>
          <div className="h-px bg-zinc-800" />
          <div className="flex justify-between items-center">
            <span className="text-zinc-400">Primary Goal</span>
            <span className="text-white">{userProfile.goal}</span>
          </div>
        </div>
      </div>

      {/* Personal Records */}
      <div className="px-4 py-4">
        <h2 className="text-lg mb-3 flex items-center gap-2">
          <Award className="w-5 h-5 text-yellow-400" />
          Personal Records
        </h2>
        <div className="space-y-2">
          {personalRecords.map((record, idx) => (
            <div
              key={idx}
              className="bg-zinc-900 rounded-lg p-4 border border-zinc-800 flex justify-between items-center"
            >
              <div>
                <div className="text-white mb-1">{record.exercise}</div>
                <div className="text-xs text-zinc-500">{record.date}</div>
              </div>
              <div className="text-right">
                <div className="text-xl text-blue-400">
                  {record.weight > 0 ? `${record.weight} kg` : 'BW'}
                </div>
                <div className="text-xs text-zinc-400">{record.reps} reps</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Workout History */}
      <div className="px-4 py-2">
        <h2 className="text-lg mb-3 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-blue-400" />
          Recent Workouts
        </h2>
        <div className="space-y-2">
          {workoutHistory.map((workout) => (
            <div
              key={workout.id}
              className="bg-zinc-900 rounded-lg p-4 border border-zinc-800"
            >
              <div className="flex justify-between items-start mb-2">
                <span className="text-white">{format(workout.date, 'MMM d, yyyy')}</span>
                <span className="text-xs text-zinc-400">{workout.duration} min</span>
              </div>
              <div className="space-y-1">
                {workout.exercises.map((ex, idx) => (
                  <div key={idx} className="text-sm text-zinc-400">
                    {ex.exerciseName} - {ex.sets.length} sets
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Goals Section */}
      <div className="px-4 py-4">
        <h2 className="text-lg mb-3 flex items-center gap-2">
          <Target className="w-5 h-5 text-green-400" />
          Current Goals
        </h2>
        <div className="space-y-2">
          <div className="bg-zinc-900 rounded-lg p-4 border border-zinc-800">
            <div className="flex justify-between items-center mb-2">
              <span className="text-white">Bench Press</span>
              <span className="text-blue-400">82 / 100 kg</span>
            </div>
            <div className="w-full bg-zinc-800 rounded-full h-2">
              <div className="bg-blue-600 h-2 rounded-full" style={{ width: '82%' }} />
            </div>
          </div>
          <div className="bg-zinc-900 rounded-lg p-4 border border-zinc-800">
            <div className="flex justify-between items-center mb-2">
              <span className="text-white">Squat</span>
              <span className="text-blue-400">110 / 140 kg</span>
            </div>
            <div className="w-full bg-zinc-800 rounded-full h-2">
              <div className="bg-blue-600 h-2 rounded-full" style={{ width: '78.5%' }} />
            </div>
          </div>
        </div>
      </div>

      {/* Settings */}
      <div className="px-4 py-2 mb-6">
        <button className="w-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl p-4 flex items-center justify-between transition-colors">
          <div className="flex items-center gap-3">
            <Settings className="w-5 h-5 text-zinc-400" />
            <span className="text-white">Settings & Preferences</span>
          </div>
          <div className="text-zinc-400">→</div>
        </button>
      </div>
    </div>
  );
}
