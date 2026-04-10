import { type Exercise } from '../data/mockData';

interface ExerciseThumbnailProps {
  exercise: Exercise;
  size?: 'sm' | 'md';
}

export function ExerciseThumbnail({ exercise, size = 'md' }: ExerciseThumbnailProps) {
  const sizeClasses = {
    sm: 'w-10 h-10',
    md: 'w-12 h-12',
  };

  // Generate SVG based on exercise name
  const getExerciseSVG = () => {
    const name = exercise.name.toLowerCase();
    
    // Bench Press variations
    if (name.includes('bench press')) {
      return (
        <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="8" y="18" width="32" height="4" fill="currentColor" opacity="0.3" />
          <rect x="18" y="24" width="12" height="2" fill="currentColor" />
          <circle cx="24" cy="30" r="3" fill="currentColor" opacity="0.5" />
          <rect x="14" y="30" width="3" height="8" fill="currentColor" />
          <rect x="31" y="30" width="3" height="8" fill="currentColor" />
          <line x1="12" y1="14" x2="36" y2="14" stroke="currentColor" strokeWidth="2" />
        </svg>
      );
    }
    
    // Squat variations
    if (name.includes('squat')) {
      return (
        <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="24" cy="10" r="3" fill="currentColor" opacity="0.5" />
          <rect x="22" y="14" width="4" height="10" fill="currentColor" />
          <rect x="18" y="24" width="5" height="10" fill="currentColor" />
          <rect x="25" y="24" width="5" height="10" fill="currentColor" />
          <line x1="16" y1="16" x2="32" y2="16" stroke="currentColor" strokeWidth="2" />
        </svg>
      );
    }
    
    // Deadlift variations
    if (name.includes('deadlift')) {
      return (
        <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="24" cy="8" r="3" fill="currentColor" opacity="0.5" />
          <rect x="22" y="12" width="4" height="14" fill="currentColor" />
          <rect x="20" y="26" width="8" height="12" fill="currentColor" />
          <line x1="14" y1="38" x2="34" y2="38" stroke="currentColor" strokeWidth="2" />
        </svg>
      );
    }
    
    // Pull-up / Chin-up variations
    if (name.includes('pull') || name.includes('chin')) {
      return (
        <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <line x1="12" y1="6" x2="36" y2="6" stroke="currentColor" strokeWidth="2" />
          <circle cx="24" cy="14" r="3" fill="currentColor" opacity="0.5" />
          <rect x="22" y="18" width="4" height="8" fill="currentColor" />
          <rect x="14" y="12" width="4" height="10" fill="currentColor" />
          <rect x="30" y="12" width="4" height="10" fill="currentColor" />
        </svg>
      );
    }
    
    // Row variations
    if (name.includes('row')) {
      return (
        <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="20" cy="12" r="3" fill="currentColor" opacity="0.5" />
          <rect x="18" y="16" width="4" height="12" fill="currentColor" />
          <rect x="16" y="28" width="8" height="8" fill="currentColor" />
          <line x1="24" y1="20" x2="36" y2="20" stroke="currentColor" strokeWidth="2" />
        </svg>
      );
    }
    
    // Overhead Press variations
    if (name.includes('overhead press') || name.includes('shoulder press')) {
      return (
        <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="24" cy="18" r="3" fill="currentColor" opacity="0.5" />
          <rect x="22" y="22" width="4" height="10" fill="currentColor" />
          <rect x="20" y="32" width="8" height="8" fill="currentColor" />
          <line x1="18" y1="12" x2="30" y2="12" stroke="currentColor" strokeWidth="2" />
          <rect x="14" y="14" width="4" height="6" fill="currentColor" />
          <rect x="30" y="14" width="4" height="6" fill="currentColor" />
        </svg>
      );
    }
    
    // Curl variations
    if (name.includes('curl')) {
      return (
        <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="24" cy="10" r="3" fill="currentColor" opacity="0.5" />
          <rect x="22" y="14" width="4" height="10" fill="currentColor" />
          <rect x="14" y="20" width="6" height="2" fill="currentColor" />
          <rect x="28" y="20" width="6" height="2" fill="currentColor" />
          <circle cx="17" cy="26" r="3" fill="currentColor" opacity="0.3" />
          <circle cx="31" cy="26" r="3" fill="currentColor" opacity="0.3" />
        </svg>
      );
    }
    
    // Leg Press / Leg Extension
    if (name.includes('leg press') || name.includes('leg extension')) {
      return (
        <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="20" y="12" width="8" height="12" fill="currentColor" />
          <rect x="18" y="24" width="5" height="12" fill="currentColor" />
          <rect x="25" y="24" width="5" height="12" fill="currentColor" />
          <rect x="14" y="10" width="20" height="2" fill="currentColor" opacity="0.3" />
        </svg>
      );
    }
    
    // Lateral Raise
    if (name.includes('lateral raise') || name.includes('side raise')) {
      return (
        <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="24" cy="12" r="3" fill="currentColor" opacity="0.5" />
          <rect x="22" y="16" width="4" height="12" fill="currentColor" />
          <line x1="10" y1="20" x2="18" y2="20" stroke="currentColor" strokeWidth="2" />
          <line x1="30" y1="20" x2="38" y2="20" stroke="currentColor" strokeWidth="2" />
          <circle cx="8" cy="20" r="2" fill="currentColor" opacity="0.3" />
          <circle cx="40" cy="20" r="2" fill="currentColor" opacity="0.3" />
        </svg>
      );
    }
    
    // Default generic exercise
    return (
      <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="24" cy="12" r="4" fill="currentColor" opacity="0.5" />
        <rect x="22" y="18" width="4" height="14" fill="currentColor" />
        <rect x="20" y="32" width="8" height="8" fill="currentColor" />
      </svg>
    );
  };

  return (
    <div className={`${sizeClasses[size]} flex items-center justify-center text-zinc-500 flex-shrink-0`}>
      {getExerciseSVG()}
    </div>
  );
}
