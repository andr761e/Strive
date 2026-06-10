import { Outlet, useLocation } from 'react-router';
import { BottomNav } from './components/BottomNav';
import { PersistentWorkoutBar } from './components/PersistentWorkoutBar';
import { useEffect } from 'react';
import { ActiveWorkoutOverlay } from './pages/ActiveWorkout';
import { useWorkout } from './contexts/WorkoutContext';

export function Layout() {
  const location = useLocation();
  const { isWorkoutActive, isMinimized } = useWorkout();
  
  // Enable dark mode
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);
  
  // Hide bottom nav on exercise selection, active workout, manage routines, settings, and finish workout pages
  const hideBottomNav = ['/exercise-selection', '/active-workout', '/manage-routines', '/settings', '/finish-workout'].includes(location.pathname);
  const reserveMinimizedWorkoutSpace = isWorkoutActive && isMinimized && !hideBottomNav;

  return (
    <div className={`app-runtime-shell min-h-screen ${reserveMinimizedWorkoutSpace ? 'has-minimized-workout-bar' : ''}`}>
      <Outlet />
      <ActiveWorkoutOverlay />
      <PersistentWorkoutBar />
      {!hideBottomNav && <BottomNav />}
    </div>
  );
}
