import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { Check, Clock, TrendingUp, Dumbbell, Target, ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { type ExerciseLog, type MuscleGroup } from '../data/mockData';

interface WorkoutSummaryData {
  workoutName: string;
  duration: number;
  totalSets: number;
  totalVolume: number;
  musclesTrained: MuscleGroup[];
  exercises: ExerciseLog[];
  comparison?: {
    volumeChange: number; // percentage change
    setsChange: number;
  };
}

export function WorkoutSummaryPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const summaryData = (location.state as any)?.summaryData as WorkoutSummaryData | undefined;

  const [feeling, setFeeling] = useState<number | null>(null);

  // If no data, redirect to home
  if (!summaryData) {
    navigate('/');
    return null;
  }

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m ${secs}s`;
  };

  const feelings = [
    { value: 1, label: 'Very Easy', emoji: '😊' },
    { value: 2, label: 'Easy', emoji: '🙂' },
    { value: 3, label: 'Moderate', emoji: '😐' },
    { value: 4, label: 'Hard', emoji: '😅' },
    { value: 5, label: 'Very Hard', emoji: '😰' },
  ];

  const handleDone = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white pb-20">
      {/* Hero Section */}
      <div className="bg-gradient-to-b from-green-600/20 to-zinc-950 pt-12 pb-8 px-4 text-center">
        <div className="mb-4">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-600 rounded-full mb-4">
            <Check className="w-8 h-8 text-white" />
          </div>
        </div>
        <h1 className="text-3xl mb-2">Workout Complete!</h1>
        <p className="text-zinc-400">Great job crushing your workout</p>
      </div>

      <div className="px-4 space-y-4">
        {/* Workout Name */}
        <div className="text-center py-2">
          <h2 className="text-2xl text-white">{summaryData.workoutName}</h2>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-zinc-900 rounded-xl p-4 border border-zinc-800">
            <div className="flex items-center gap-2 text-blue-400 mb-2">
              <Clock className="w-5 h-5" />
              <span className="text-xs text-zinc-400">Duration</span>
            </div>
            <div className="text-2xl text-white">{formatTime(summaryData.duration)}</div>
          </div>

          <div className="bg-zinc-900 rounded-xl p-4 border border-zinc-800">
            <div className="flex items-center gap-2 text-green-400 mb-2">
              <Dumbbell className="w-5 h-5" />
              <span className="text-xs text-zinc-400">Total Sets</span>
            </div>
            <div className="text-2xl text-white">{summaryData.totalSets}</div>
          </div>

          <div className="bg-zinc-900 rounded-xl p-4 border border-zinc-800">
            <div className="flex items-center gap-2 text-orange-400 mb-2">
              <Target className="w-5 h-5" />
              <span className="text-xs text-zinc-400">Volume</span>
            </div>
            <div className="text-2xl text-white">{(summaryData.totalVolume / 1000).toFixed(1)}k</div>
            <div className="text-xs text-zinc-500">kg lifted</div>
          </div>

          <div className="bg-zinc-900 rounded-xl p-4 border border-zinc-800">
            <div className="flex items-center gap-2 text-purple-400 mb-2">
              <TrendingUp className="w-5 h-5" />
              <span className="text-xs text-zinc-400">Exercises</span>
            </div>
            <div className="text-2xl text-white">{summaryData.exercises.length}</div>
          </div>
        </div>

        {/* Comparison to Last Workout */}
        {summaryData.comparison && (
          <div className="bg-zinc-900 rounded-xl p-4 border border-zinc-800">
            <h3 className="text-white mb-3 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-400" />
              Compared to Last Workout
            </h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-400">Volume Change</span>
                <div className="flex items-center gap-2">
                  {summaryData.comparison.volumeChange > 0 ? (
                    <>
                      <ArrowUp className="w-4 h-4 text-green-400" />
                      <span className="text-green-400">+{summaryData.comparison.volumeChange.toFixed(1)}%</span>
                    </>
                  ) : summaryData.comparison.volumeChange < 0 ? (
                    <>
                      <ArrowDown className="w-4 h-4 text-red-400" />
                      <span className="text-red-400">{summaryData.comparison.volumeChange.toFixed(1)}%</span>
                    </>
                  ) : (
                    <>
                      <Minus className="w-4 h-4 text-zinc-400" />
                      <span className="text-zinc-400">No change</span>
                    </>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-400">Sets Change</span>
                <div className="flex items-center gap-2">
                  {summaryData.comparison.setsChange > 0 ? (
                    <>
                      <ArrowUp className="w-4 h-4 text-green-400" />
                      <span className="text-green-400">+{summaryData.comparison.setsChange}</span>
                    </>
                  ) : summaryData.comparison.setsChange < 0 ? (
                    <>
                      <ArrowDown className="w-4 h-4 text-red-400" />
                      <span className="text-red-400">{summaryData.comparison.setsChange}</span>
                    </>
                  ) : (
                    <>
                      <Minus className="w-4 h-4 text-zinc-400" />
                      <span className="text-zinc-400">Same</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Muscles Trained */}
        <div className="bg-zinc-900 rounded-xl p-4 border border-zinc-800">
          <h3 className="text-white mb-3">Muscles Trained</h3>
          <div className="flex flex-wrap gap-2">
            {Array.from(new Set(summaryData.musclesTrained)).map((muscle, idx) => (
              <div
                key={idx}
                className="px-3 py-1.5 bg-zinc-800 rounded-full text-sm text-zinc-300"
              >
                {muscle}
              </div>
            ))}
          </div>
        </div>

        {/* How Did It Feel */}
        <div className="bg-zinc-900 rounded-xl p-4 border border-zinc-800">
          <h3 className="text-white mb-3">How did this session feel?</h3>
          <div className="grid grid-cols-5 gap-2">
            {feelings.map((f) => (
              <button
                key={f.value}
                onClick={() => setFeeling(f.value)}
                className={`p-3 rounded-lg text-center transition-colors ${
                  feeling === f.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                }`}
              >
                <div className="text-2xl mb-1">{f.emoji}</div>
                <div className="text-xs leading-tight">{f.label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Exercises Summary */}
        <div className="bg-zinc-900 rounded-xl p-4 border border-zinc-800">
          <h3 className="text-white mb-3">Exercises</h3>
          <div className="space-y-2">
            {summaryData.exercises.map((exercise, idx) => {
              const totalVolume = exercise.sets.reduce((acc, set) => acc + (set.weight * set.reps), 0);
              return (
                <div key={idx} className="bg-zinc-800 rounded-lg p-3">
                  <div className="text-white text-sm mb-1">{exercise.exerciseName}</div>
                  <div className="text-xs text-zinc-400">
                    {exercise.sets.length} sets • {(totalVolume / 1000).toFixed(1)}k kg
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Done Button */}
        <button
          onClick={handleDone}
          className="w-full bg-green-600 hover:bg-green-700 text-white py-4 rounded-xl transition-colors"
        >
          Done
        </button>
      </div>
    </div>
  );
}
