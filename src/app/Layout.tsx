import { Outlet, useLocation } from 'react-router';
import { BottomNav } from './components/BottomNav';
import { PersistentWorkoutBar } from './components/PersistentWorkoutBar';
import { useEffect } from 'react';

export function Layout() {
  const location = useLocation();
  
  // Enable dark mode
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);
  
  // Hide bottom nav on exercise selection, active workout, manage routines, settings, and finish workout pages
  const hideBottomNav = ['/exercise-selection', '/active-workout', '/manage-routines', '/settings', '/finish-workout'].includes(location.pathname);

  return (
    <div className="min-h-screen bg-zinc-950">
      <Outlet />
      <PersistentWorkoutBar />
      {!hideBottomNav && <BottomNav />}
    </div>
  );
}