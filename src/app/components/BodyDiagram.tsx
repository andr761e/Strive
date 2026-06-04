import { useState } from 'react';

interface BodyDiagramProps {
  onMuscleSelect: (muscle: string) => void;
  selectedMuscles: string[];
}

export function BodyDiagram({ onMuscleSelect, selectedMuscles }: BodyDiagramProps) {
  const [view, setView] = useState<'front' | 'back'>('front');

  const frontMuscles = [
    { id: 'Chest', x: 50, y: 30, label: 'Chest' },
    { id: 'Delts', x: 30, y: 28, label: 'Delts', x2: 70 },
    { id: 'Biceps', x: 25, y: 45, label: 'Biceps', x2: 75 },
    { id: 'Abs', x: 50, y: 50, label: 'Abs' },
    { id: 'Quads', x: 45, y: 75, label: 'Quads', x2: 55 },
  ];

  const backMuscles = [
    { id: 'Back', x: 50, y: 35, label: 'Back' },
    { id: 'Triceps', x: 25, y: 45, label: 'Triceps', x2: 75 },
    { id: 'Glutes', x: 50, y: 58, label: 'Glutes' },
    { id: 'Hamstrings', x: 45, y: 75, label: 'Hamstrings', x2: 55 },
    { id: 'Calves', x: 45, y: 88, label: 'Calves', x2: 55 },
  ];

  const muscles = view === 'front' ? frontMuscles : backMuscles;

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button
          onClick={() => setView('front')}
          className={`premium-button flex-1 py-2 text-sm font-medium ${
            view === 'front'
              ? 'premium-button-primary'
              : 'premium-button-secondary text-zinc-400'
          }`}
        >
          Front
        </button>
        <button
          onClick={() => setView('back')}
          className={`premium-button flex-1 py-2 text-sm font-medium ${
            view === 'back'
              ? 'premium-button-primary'
              : 'premium-button-secondary text-zinc-400'
          }`}
        >
          Back
        </button>
      </div>

      <div className="premium-row relative w-full aspect-[3/4] overflow-hidden">
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {/* Simplified body outline */}
          <ellipse cx="50" cy="15" rx="8" ry="10" fill="#27272a" />
          
          {/* Body */}
          <rect x="42" y="25" width="16" height="30" rx="3" fill="#27272a" />
          
          {/* Arms */}
          <rect x="28" y="28" width="10" height="25" rx="5" fill="#27272a" />
          <rect x="62" y="28" width="10" height="25" rx="5" fill="#27272a" />
          
          {/* Legs */}
          <rect x="43" y="57" width="6" height="35" rx="3" fill="#27272a" />
          <rect x="51" y="57" width="6" height="35" rx="3" fill="#27272a" />

          {/* Muscle groups */}
          {muscles.map((muscle) => (
            <g key={muscle.id}>
              <circle
                cx={muscle.x}
                cy={muscle.y}
                r="6"
                fill={selectedMuscles.includes(muscle.id) ? '#3b82f6' : '#52525b'}
                className="cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => onMuscleSelect(muscle.id)}
              />
              {muscle.x2 && (
                <circle
                  cx={muscle.x2}
                  cy={muscle.y}
                  r="6"
                  fill={selectedMuscles.includes(muscle.id) ? '#3b82f6' : '#52525b'}
                  className="cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => onMuscleSelect(muscle.id)}
                />
              )}
            </g>
          ))}
        </svg>

        {/* Muscle labels */}
        <div className="absolute inset-0 pointer-events-none">
          {muscles.map((muscle) => (
            <div
              key={`label-${muscle.id}`}
              className="absolute text-xs text-white"
              style={{
                left: `${muscle.x}%`,
                top: `${muscle.y + 8}%`,
                transform: 'translateX(-50%)',
              }}
            >
              {muscle.label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
