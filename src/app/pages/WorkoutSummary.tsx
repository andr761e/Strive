import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { ArrowUp, ArrowDown, Check, Clock, Dumbbell, Flame, Minus, Target, TrendingUp } from 'lucide-react';
import { exercises, getExerciseLogging, type ExerciseLog, type MuscleGroup } from '../data/mockData';
import { RankCelebrationOverlay, type WorkoutRankProgressItem } from '../features/exercise-ranks';
import { getExerciseLiftedLoadVolume } from '../utils/workoutVolume';

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
  rankProgress?: WorkoutRankProgressItem[];
  streak?: {
    previous: number;
    current: number;
    didIncrease: boolean;
  };
}

export function WorkoutSummaryPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const summaryData = (location.state as any)?.summaryData as WorkoutSummaryData | undefined;
  const rankProgressItems = summaryData?.rankProgress ?? [];

  const [feeling, setFeeling] = useState<number | null>(null);
  const [rankOverlayOpen, setRankOverlayOpen] = useState(rankProgressItems.length > 0);

  // If no data, redirect to home
  if (!summaryData) {
    navigate('/');
    return null;
  }

  const streak = summaryData.streak;
  const streakUpdated = Boolean(streak?.didIncrease && streak.current > streak.previous);
  const streakMessage = !streak
    ? ''
    : streakUpdated && streak.previous > 0
      ? `Updated from ${streak.previous} to ${streak.current}.`
      : streakUpdated
        ? 'Streak started. Log again within 72 hours to keep it alive.'
        : 'Streak held steady. Log again within 72 hours to keep it alive.';

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
    { value: 1, label: 'Very Easy' },
    { value: 2, label: 'Easy' },
    { value: 3, label: 'Moderate' },
    { value: 4, label: 'Hard' },
    { value: 5, label: 'Very Hard' },
  ];

  const handleDone = () => {
    navigate('/');
  };

  return (
    <div className="screen-shell">
      {rankOverlayOpen && rankProgressItems.length > 0 && (
        <RankCelebrationOverlay items={rankProgressItems} onClose={() => setRankOverlayOpen(false)} />
      )}

      {/* Hero Section */}
      <div className="screen-header pt-12 pb-8 px-4 text-center">
        <div className="mb-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl border border-green-400/30 bg-green-500/15 mb-4">
            <Check className="w-8 h-8 text-green-200" />
          </div>
        </div>
        <h1 className="text-3xl font-semibold mb-2">Workout Complete</h1>
        <p className="text-zinc-400">Session logged and added to your training history.</p>
      </div>

      <div className="px-4 space-y-4">
        {/* Workout Name */}
        <div className="text-center py-2">
          <h2 className="text-2xl font-semibold text-white">{summaryData.workoutName}</h2>
        </div>

        {streak && (
          <div className={`premium-card streak-update-card p-4 ${streakUpdated ? 'is-live' : ''}`}>
            <div className="flex items-center gap-3">
              <div className={`streak-flame-shell ${streakUpdated ? 'is-live' : ''}`}>
                <Flame className="streak-flame-icon h-6 w-6" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-medium uppercase tracking-normal text-orange-300">Day Streak</div>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className={`stat-number text-3xl leading-none ${streakUpdated ? 'streak-count-pop' : ''}`}>
                    {streak.current}
                  </span>
                  <span className="text-sm text-zinc-400">{streak.current === 1 ? 'day' : 'days'}</span>
                </div>
                <p className="mt-1 text-sm text-zinc-400">{streakMessage}</p>
              </div>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="premium-card p-4">
            <div className="flex items-center gap-2 text-blue-400 mb-2">
              <Clock className="w-5 h-5" />
              <span className="text-xs text-zinc-400">Duration</span>
            </div>
            <div className="stat-number text-2xl">{formatTime(summaryData.duration)}</div>
          </div>

          <div className="premium-card p-4">
            <div className="flex items-center gap-2 text-green-400 mb-2">
              <Dumbbell className="w-5 h-5" />
              <span className="text-xs text-zinc-400">Total Sets</span>
            </div>
            <div className="stat-number text-2xl">{summaryData.totalSets}</div>
          </div>

          <div className="premium-card p-4">
            <div className="flex items-center gap-2 text-orange-400 mb-2">
              <Target className="w-5 h-5" />
              <span className="text-xs text-zinc-400">Volume</span>
            </div>
            <div className="stat-number text-2xl">{(summaryData.totalVolume / 1000).toFixed(1)}k</div>
            <div className="text-xs text-zinc-500">kg lifted</div>
          </div>

          <div className="premium-card p-4">
            <div className="flex items-center gap-2 text-purple-400 mb-2">
              <TrendingUp className="w-5 h-5" />
              <span className="text-xs text-zinc-400">Exercises</span>
            </div>
            <div className="stat-number text-2xl">{summaryData.exercises.length}</div>
          </div>
        </div>

        {/* Comparison to Last Workout */}
        {summaryData.comparison && (
          <div className="premium-card p-4">
            <h3 className="text-white font-medium mb-3 flex items-center gap-2">
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
        <div className="premium-card p-4">
          <h3 className="text-white font-medium mb-3">Muscles Trained</h3>
          <div className="flex flex-wrap gap-2">
            {Array.from(new Set(summaryData.musclesTrained)).map((muscle, idx) => (
              <div
                key={idx}
                className="premium-badge px-3 py-1.5 text-sm text-zinc-300"
              >
                {muscle}
              </div>
            ))}
          </div>
        </div>

        {/* How Did It Feel */}
        <div className="premium-card p-4">
          <h3 className="text-white font-medium mb-3">How did this session feel?</h3>
          <div className="grid grid-cols-5 gap-1.5 min-[390px]:gap-2">
            {feelings.map((f) => (
              <button
                key={f.value}
                onClick={() => setFeeling(f.value)}
                className={`premium-button flex min-h-[4.75rem] min-w-0 flex-col items-center justify-center p-1.5 text-center min-[390px]:p-2 ${
                  feeling === f.value
                    ? 'premium-button-primary'
                    : 'premium-button-secondary text-zinc-400'
                }`}
              >
                <div className="stat-number text-lg mb-1">{f.value}</div>
                <div className="max-w-full whitespace-normal break-words text-[10px] leading-tight min-[390px]:text-xs">
                  {f.label}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Exercises Summary */}
        <div className="premium-card p-4">
          <h3 className="text-white font-medium mb-3">Exercises</h3>
          <div className="space-y-2">
            {summaryData.exercises.map((exercise, idx) => {
              const totalVolume = getExerciseLiftedLoadVolume(exercise);
              const logging = getExerciseLogging(exercises.find((item) => item.id === exercise.exerciseId));
              const detail = logging.fields.some((field) => field.key === 'weight') && logging.fields.some((field) => field.key === 'reps')
                ? `${exercise.sets.length} sets - ${(totalVolume / 1000).toFixed(1)}k kg`
                : `${exercise.sets.length} sets - ${logging.label}`;
              return (
                <div key={idx} className="premium-row p-3">
                  <div className="text-white text-sm font-medium mb-1">{exercise.exerciseName}</div>
                  <div className="text-xs text-zinc-400">
                    {detail}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Done Button */}
        <button
          onClick={handleDone}
          className="premium-button premium-button-success w-full py-4 font-semibold"
        >
          Done
        </button>
      </div>
    </div>
  );
}
