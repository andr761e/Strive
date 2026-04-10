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
  onClick 
}: WorkoutNotificationProps) {
  if (type === 'active') {
    return (
      <div 
        onClick={onClick}
        className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 shadow-lg cursor-pointer hover:bg-zinc-800 transition-colors"
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
          <div className="p-2 bg-blue-600/20 rounded-lg">
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
    <div 
      className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 shadow-lg"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-orange-400" />
          <span className="text-sm text-zinc-400">Workout Reminder</span>
        </div>
        <button
          onClick={onDismiss}
          className="text-zinc-500 hover:text-white"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="space-y-2">
        <div className="text-white">Time to train!</div>
        <div className="text-sm text-zinc-400">
          It's already been a day — go workout!
        </div>
      </div>
    </div>
  );
}
