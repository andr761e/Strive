import { ChevronUp, Clock } from 'lucide-react';
import { formatDurationClock } from '../utils/timeFormatting';

interface WorkoutCollapsedHeaderProps {
  workoutName: string;
  elapsedSeconds: number;
  restRemainingSeconds?: number;
  preview?: boolean;
}

export function WorkoutCollapsedHeader({
  workoutName,
  elapsedSeconds,
  restRemainingSeconds,
  preview = false,
}: WorkoutCollapsedHeaderProps) {
  const hasRestTimer = typeof restRemainingSeconds === 'number' && restRemainingSeconds > 0;

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
            <div className="mt-0.5 truncate text-xs text-zinc-400">Active</div>
          </div>
        </div>
        <div className="flex h-9 shrink-0 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.045] px-2.5 text-white">
          {hasRestTimer && (
            <>
              <span className="rest-timer-chip flex h-5 items-center rounded-lg px-2 py-0 text-[11px] font-semibold leading-none">
                Rest {formatDurationClock(restRemainingSeconds)}
              </span>
              <span className="h-4 w-px bg-white/10" />
            </>
          )}
          <Clock className="h-4 w-4 text-blue-300" />
          <span className="font-mono text-sm">{formatDurationClock(elapsedSeconds)}</span>
        </div>
      </div>
    </div>
  );
}
