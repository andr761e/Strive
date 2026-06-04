import { RouterProvider } from 'react-router';
import { router } from './routes';
import { useEffect } from 'react';
import { WorkoutProvider } from './contexts/WorkoutContext';
import { SettingsProvider } from './contexts/SettingsContext';
import { AuthProvider } from './contexts/AuthContext';

export default function App() {
  useEffect(() => {
    // Set viewport for mobile
    const viewport = document.querySelector('meta[name=viewport]');
    if (viewport) {
      viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
    }
  }, []);

  return (
    <AuthProvider>
      <SettingsProvider>
        <WorkoutProvider>
          <div className="strive-app max-w-md mx-auto">
            <RouterProvider router={router} />
          </div>
        </WorkoutProvider>
      </SettingsProvider>
    </AuthProvider>
  );
}
