import { createBrowserRouter } from 'react-router';
import { HomePage } from './pages/Home';
import { WorkoutTemplateSelectionPage } from './pages/WorkoutTemplateSelection';
import { ExerciseSelectionPage } from './pages/ExerciseSelection';
import { ActiveWorkoutPage } from './pages/ActiveWorkout';
import { ProgressPage } from './pages/Progress';
import { SuggestionsPage } from './pages/Suggestions';
import { ProfilePage } from './pages/Profile';
import { Layout } from './Layout';

export const router = createBrowserRouter([
  {
    path: '/',
    Component: Layout,
    children: [
      { index: true, Component: HomePage },
      { path: 'workout-template-selection', Component: WorkoutTemplateSelectionPage },
      { path: 'exercise-selection', Component: ExerciseSelectionPage },
      { path: 'active-workout', Component: ActiveWorkoutPage },
      { path: 'progress', Component: ProgressPage },
      { path: 'insights', Component: SuggestionsPage },
      { path: 'suggestions', Component: SuggestionsPage }, // Keep old route for compatibility
      { path: 'profile', Component: ProfilePage },
    ],
  },
]);