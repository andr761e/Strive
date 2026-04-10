import { useState } from 'react';
import { useNavigate } from 'react-router';
import { User, Calendar, TrendingUp, Award, Settings, Target, Edit2, ArrowUp } from 'lucide-react';
import { userProfile, workoutHistory, personalRecords, exercises } from '../data/mockData';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../components/ui/dialog';

export function ProfilePage() {
  const navigate = useNavigate();
  const [prList, setPrList] = useState(personalRecords);
  const [editPRDialogOpen, setEditPRDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredExercises = exercises.filter(ex => 
    ex.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const addPR = (exerciseName: string) => {
    const newPR = {
      exercise: exerciseName,
      weight: 0,
      reps: 0,
      date: format(new Date(), 'yyyy-MM-dd'),
    };
    setPrList([...prList, newPR]);
    setEditPRDialogOpen(false);
    setSearchQuery('');
  };

  const removePR = (index: number) => {
    setPrList(prList.filter((_, i) => i !== index));
  };

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
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg flex items-center gap-2">
            <Award className="w-5 h-5 text-yellow-400" />
            Personal Records
          </h2>
          <button
            onClick={() => setEditPRDialogOpen(true)}
            className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
          >
            <Edit2 className="w-4 h-4 text-blue-400" />
          </button>
        </div>
        <div className="space-y-2">
          {prList.map((record, idx) => (
            <div
              key={idx}
              className="bg-zinc-900 rounded-lg p-4 border border-zinc-800"
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1">
                  <div className="text-white mb-1">{record.exercise}</div>
                  <div className="text-xs text-zinc-500">{record.date}</div>
                </div>
                <div className="text-right">
                  <div className="text-xl text-blue-400 mb-1">
                    {record.weight > 0 ? `${record.weight} kg` : 'BW'}
                  </div>
                  <div className="text-xs text-zinc-400">{record.reps} reps</div>
                </div>
              </div>
              {(record as any).improvement && (
                <div className="flex items-center gap-2 pt-2 border-t border-zinc-800">
                  <ArrowUp className="w-4 h-4 text-green-400" />
                  <span className="text-sm text-green-400">+{(record as any).improvement} kg</span>
                  <span className="text-xs text-zinc-500">
                    (from {(record as any).previousBest} kg)
                  </span>
                </div>
              )}
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
        <button 
          onClick={() => navigate('/settings')}
          className="w-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl p-4 flex items-center justify-between transition-colors"
        >
          <div className="flex items-center gap-3">
            <Settings className="w-5 h-5 text-zinc-400" />
            <span className="text-white">Settings & Preferences</span>
          </div>
          <div className="text-zinc-400">→</div>
        </button>
      </div>

      {/* Edit PR Dialog */}
      <Dialog open={editPRDialogOpen} onOpenChange={setEditPRDialogOpen}>
        <DialogContent className="bg-zinc-900 text-white border-zinc-800 max-w-md max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Customize Personal Records</DialogTitle>
            <DialogDescription>
              Select exercises to track as your personal records. You can add or remove exercises.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-3">
            {/* Current PRs */}
            {prList.length > 0 && (
              <div>
                <label className="text-sm text-zinc-400 mb-2 block">Current Records</label>
                <div className="space-y-2">
                  {prList.map((record, idx) => (
                    <div
                      key={idx}
                      className="bg-zinc-800 rounded-lg p-3 flex items-center justify-between"
                    >
                      <span className="text-white text-sm">{record.exercise}</span>
                      <button
                        onClick={() => removePR(idx)}
                        className="text-xs text-red-400 hover:text-red-300"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Add Exercise */}
            <div>
              <label className="text-sm text-zinc-400 mb-2 block">Add Exercise</label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search exercises..."
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white placeholder:text-zinc-500 mb-2"
              />
            </div>
          </div>

          {searchQuery && (
            <div className="space-y-1 overflow-y-auto flex-1">
              {filteredExercises
                .filter(ex => !prList.find(pr => pr.exercise === ex.name))
                .slice(0, 10)
                .map((ex) => (
                  <button
                    key={ex.id}
                    onClick={() => addPR(ex.name)}
                    className="w-full bg-zinc-800 hover:bg-zinc-700 p-2 rounded text-left transition-colors"
                  >
                    <div className="text-white text-sm">{ex.name}</div>
                    <div className="flex gap-1 mt-1">
                      {ex.mainMuscles.map((muscle) => (
                        <span
                          key={muscle}
                          className="text-xs bg-zinc-900 text-blue-400 px-1.5 py-0.5 rounded"
                        >
                          {muscle}
                        </span>
                      ))}
                    </div>
                  </button>
                ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}