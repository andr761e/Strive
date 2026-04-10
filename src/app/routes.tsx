import { createBrowserRouter } from 'react-router';
import { HomePage } from './pages/Home';
import { WorkoutTemplateSelectionPage } from './pages/WorkoutTemplateSelection';
import { ExerciseSelectionPage } from './pages/ExerciseSelection';
import { ActiveWorkoutPage } from './pages/ActiveWorkout';
import { FinishWorkoutPage } from './pages/FinishWorkout';
import { WorkoutSummaryPage } from './pages/WorkoutSummary';
import { ProgressPage } from './pages/Progress';
import { SuggestionsPage } from './pages/Suggestions';
import { ProfilePage } from './pages/Profile';
import { ManageRoutinesPage } from './pages/ManageRoutines';
import { EditRoutinePage } from './pages/EditRoutine';
import { SettingsPage } from './pages/Settings';
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
      { path: 'finish-workout', Component: FinishWorkoutPage },
      { path: 'workout-summary', Component: WorkoutSummaryPage },
      { path: 'manage-routines', Component: ManageRoutinesPage },
      { path: 'edit-routine', Component: EditRoutinePage },
      { path: 'progress', Component: ProgressPage },
      { path: 'insights', Component: SuggestionsPage },
      { path: 'suggestions', Component: SuggestionsPage }, // Keep old route for compatibility
      { path: 'profile', Component: ProfilePage },
      { path: 'settings', Component: SettingsPage },
    ],
  },
]);