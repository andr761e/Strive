import { RouterProvider } from 'react-router';
import { router } from './routes';
import { useEffect } from 'react';
import { WorkoutProvider } from './contexts/WorkoutContext';

export default function App() {
  useEffect(() => {
    // Set viewport for mobile
    const viewport = document.querySelector('meta[name=viewport]');
    if (viewport) {
      viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
    }
  }, []);

  return (
    <WorkoutProvider>
      <div className="max-w-md mx-auto bg-zinc-950">
        <RouterProvider router={router} />
      </div>
    </WorkoutProvider>
  );
}