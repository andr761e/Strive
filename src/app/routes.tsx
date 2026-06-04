import { useLayoutEffect } from 'react';
import type { ComponentType } from 'react';
import { createBrowserRouter, Navigate, Outlet, useLocation } from 'react-router';
import { Layout } from './Layout';
import { AuthLoadingPage } from './pages/AuthLoading';
import { useAuth } from './contexts/AuthContext';

function lazyPage<TModule extends Record<string, ComponentType>>(
  importer: () => Promise<TModule>,
  exportName: keyof TModule,
) {
  return async () => ({
    Component: (await importer())[exportName],
  });
}

function ScrollToTop() {
  const location = useLocation();

  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [location.pathname, location.search, location.key]);

  return null;
}

function ProtectedLayout() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <AuthLoadingPage />;
  }

  if (!user) {
    return <Navigate to="/auth/login" replace />;
  }

  return (
    <>
      <ScrollToTop />
      <Layout />
    </>
  );
}

function AuthLayout() {
  return (
    <>
      <ScrollToTop />
      <Outlet />
    </>
  );
}

export const router = createBrowserRouter([
  {
    path: '/',
    Component: ProtectedLayout,
    children: [
      { index: true, lazy: lazyPage(() => import('./pages/Home'), 'HomePage') },
      {
        path: 'workout-template-selection',
        lazy: lazyPage(() => import('./pages/WorkoutTemplateSelection'), 'WorkoutTemplateSelectionPage'),
      },
      { path: 'exercise-selection', lazy: lazyPage(() => import('./pages/ExerciseSelection'), 'ExerciseSelectionPage') },
      { path: 'active-workout', lazy: lazyPage(() => import('./pages/ActiveWorkout'), 'ActiveWorkoutPage') },
      { path: 'finish-workout', lazy: lazyPage(() => import('./pages/FinishWorkout'), 'FinishWorkoutPage') },
      { path: 'workout-summary', lazy: lazyPage(() => import('./pages/WorkoutSummary'), 'WorkoutSummaryPage') },
      { path: 'manage-routines', lazy: lazyPage(() => import('./pages/ManageRoutines'), 'ManageRoutinesPage') },
      { path: 'edit-routine', lazy: lazyPage(() => import('./pages/EditRoutine'), 'EditRoutinePage') },
      { path: 'progress', lazy: lazyPage(() => import('./pages/Progress'), 'ProgressPage') },
      { path: 'insights', lazy: lazyPage(() => import('./pages/Suggestions'), 'SuggestionsPage') },
      { path: 'suggestions', lazy: lazyPage(() => import('./pages/Suggestions'), 'SuggestionsPage') },
      { path: 'profile', lazy: lazyPage(() => import('./pages/Profile'), 'ProfilePage') },
      { path: 'settings', lazy: lazyPage(() => import('./pages/Settings'), 'SettingsPage') },
    ],
  },
  {
    path: '/auth',
    Component: AuthLayout,
    children: [
      { index: true, element: <Navigate to="/auth/login" replace /> },
      { path: 'login', lazy: lazyPage(() => import('./pages/Login'), 'LoginPage') },
      { path: 'signup', lazy: lazyPage(() => import('./pages/Signup'), 'SignupPage') },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
]);
