import { ChevronUp, Clock } from 'lucide-react';
import { formatDurationClock } from '../utils/timeFormatting';

interface WorkoutCollapsedHeaderProps {
  workoutName: string;
  elapsedSeconds: number;
  exerciseCount: number;
  preview?: boolean;
}

export function WorkoutCollapsedHeader({
  workoutName,
  elapsedSeconds,
  exerciseCount,
  preview = false,
}: WorkoutCollapsedHeaderProps) {
  return (
    <div
      className={`persistent-workout-minimized-header h-[68px] overflow-hidden ${
        preview ? 'rounded-t-[1.35rem] border-b border-white/10' : 'rounded-t-[1.1rem] border border-white/10'
      }`}
    >
      <div className="mx-auto flex h-full max-w-md items-center justify-between gap-3 px-4 py-3">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.045] text-blue-200">
            <ChevronUp className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold text-white">{workoutName || 'Active Workout'}</div>
            <div className="mt-0.5 flex items-center gap-2 text-xs text-zinc-400">
              <span>{exerciseCount} exercises</span>
              <span className="text-zinc-600">-</span>
              <span>Active</span>
            </div>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.045] px-2.5 py-1.5 text-white">
          <Clock className="h-4 w-4 text-blue-300" />
          <span className="font-mono text-sm">{formatDurationClock(elapsedSeconds)}</span>
        </div>
      </div>
    </div>
  );
}
