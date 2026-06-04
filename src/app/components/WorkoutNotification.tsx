import { Clock, X, Dumbbell, Bell } from 'lucide-react';

interface WorkoutNotificationProps {
  type: 'active' | 'reminder';
  workoutName?: string;
  elapsedTime?: string;
  onDismiss?: () => void;
  onClick?: () => void;
}

export function WorkoutNotification({
  type,
  workoutName,
  elapsedTime,
  onDismiss,
  onClick,
}: WorkoutNotificationProps) {
  if (type === 'active') {
    return (
      <div
        onClick={onClick}
        className="premium-card p-4 cursor-pointer transition-colors hover:border-white/20"
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-sm text-zinc-400">Workout in progress</span>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDismiss?.();
            }}
            className="text-zinc-500 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg border border-blue-400/20 bg-blue-500/10">
            <Dumbbell className="w-5 h-5 text-blue-400" />
          </div>
          <div className="flex-1">
            <div className="text-white mb-0.5">{workoutName || 'Active Workout'}</div>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="w-4 h-4 text-zinc-400" />
              <span className="text-zinc-400">{elapsedTime || '00:00'}</span>
            </div>
          </div>
          <div className="text-xs text-blue-400">Tap to return</div>
        </div>
      </div>
    );
  }

  return (
    <div className="premium-card p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-orange-400" />
          <span className="text-sm text-zinc-400">Workout Reminder</span>
        </div>
        <button onClick={onDismiss} className="text-zinc-500 hover:text-white">
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="space-y-2">
        <div className="text-white">Time to train!</div>
        <div className="text-sm text-zinc-400">
          You have gone a day without training. Start a session when you are ready.
        </div>
      </div>
    </div>
  );
}
