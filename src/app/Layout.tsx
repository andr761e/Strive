import { Outlet, useLocation } from 'react-router';
import { BottomNav } from './components/BottomNav';
import { useEffect } from 'react';

export function Layout() {
  const location = useLocation();
  
  // Enable dark mode
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);
  
  // Hide bottom nav on exercise selection and active workout pages
  const hideBottomNav = location.pathname === '/exercise-selection' || location.pathname === '/active-workout';

  return (
    <div className="min-h-screen bg-zinc-950">
      <Outlet />
      {!hideBottomNav && <BottomNav />}
    </div>
  );
}