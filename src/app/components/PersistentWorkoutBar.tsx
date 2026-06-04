import { useNavigate, useLocation } from 'react-router';
import { ChevronUp, Clock } from 'lucide-react';
import { useWorkout } from '../contexts/WorkoutContext';

export function PersistentWorkoutBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isWorkoutActive, workoutName, elapsedSeconds, isMinimized, expandWorkout } = useWorkout();

  // Don't show if not active, not minimized, or already on active workout page
  if (!isWorkoutActive || !isMinimized || location.pathname === '/active-workout') {
    return null;
  }

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const handleExpand = () => {
    expandWorkout();
    navigate('/active-workout');
  };

  return (
    <div
      onClick={handleExpand}
      className="fixed bottom-[68px] left-0 right-0 cursor-pointer z-40 border-t border-blue-400/30 bg-blue-600/90 backdrop-blur-xl transition-colors hover:bg-blue-600/95"
    >
      <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between shadow-2xl">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-white/12 flex items-center justify-center flex-shrink-0">
            <ChevronUp className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-white text-sm font-semibold truncate">{workoutName || 'Active Workout'}</div>
            <div className="text-blue-100 text-xs">Tap to resume</div>
          </div>
        </div>
        <div className="flex items-center gap-2 text-white flex-shrink-0 rounded-lg bg-white/10 px-2.5 py-1.5">
          <Clock className="w-4 h-4" />
          <span className="text-sm font-mono">{formatTime(elapsedSeconds)}</span>
        </div>
      </div>
    </div>
  );
}
