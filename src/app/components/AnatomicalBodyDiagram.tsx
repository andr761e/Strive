interface AnatomicalBodyDiagramProps {
  onMuscleSelect: (muscle: string) => void;
  selectedMuscles: string[];
  colorMode?: 'selection' | 'status';
  muscleStatuses?: Record<string, { status: string; color: string }>;
}

export function AnatomicalBodyDiagram({ 
  onMuscleSelect, 
  selectedMuscles,
  colorMode = 'selection',
  muscleStatuses 
}: AnatomicalBodyDiagramProps) {
  
  const getMuscleColor = (muscleId: string) => {
    if (colorMode === 'status' && muscleStatuses && muscleStatuses[muscleId]) {
      const status = muscleStatuses[muscleId].status;
      switch (status) {
        case 'progressing':
          return '#3b82f6'; // blue
        case 'balanced':
          return '#22c55e'; // green
        case 'watch':
          return '#eab308'; // yellow
        case 'undertrained':
          return '#f97316'; // orange
        default:
          return '#52525b'; // zinc-600
      }
    }
    return selectedMuscles.includes(muscleId) ? '#3b82f6' : '#52525b';
  };

  const getMuscleFill = (muscleId: string) => {
    if (colorMode === 'status' && muscleStatuses && muscleStatuses[muscleId]) {
      return getMuscleColor(muscleId);
    }
    return selectedMuscles.includes(muscleId) ? '#3b82f6' : '#27272a';
  };

  const getStrokeColor = (muscleId: string) => {
    return getMuscleColor(muscleId);
  };

  return (
    <div className="w-full">
      <div className="grid grid-cols-2 gap-4">
        {/* Front View */}
        <div className="flex flex-col items-center">
          <h3 className="text-sm text-zinc-400 mb-2">Front</h3>
          <svg viewBox="0 0 200 400" className="w-full h-auto max-h-96">
            {/* Head */}
            <ellipse cx="100" cy="30" rx="20" ry="25" fill="#27272a" stroke="#52525b" strokeWidth="2" />
            
            {/* Neck */}
            <rect x="90" y="52" width="20" height="18" fill="#27272a" stroke="#52525b" strokeWidth="2" />
            
            {/* Shoulders/Delts (Front) */}
            <g 
              onClick={() => onMuscleSelect('Delts')}
              className="cursor-pointer hover:opacity-80 transition-opacity"
            >
              <ellipse cx="65" cy="85" rx="20" ry="18" 
                fill={getMuscleFill('Delts')} 
                stroke={getStrokeColor('Delts')} 
                strokeWidth="2" 
              />
              <ellipse cx="135" cy="85" rx="20" ry="18" 
                fill={getMuscleFill('Delts')} 
                stroke={getStrokeColor('Delts')} 
                strokeWidth="2" 
              />
            </g>
            
            {/* Chest */}
            <g 
              onClick={() => onMuscleSelect('Chest')}
              className="cursor-pointer hover:opacity-80 transition-opacity"
            >
              <path 
                d="M 75 95 Q 85 105 100 110 Q 115 105 125 95 L 125 125 Q 115 130 100 132 Q 85 130 75 125 Z" 
                fill={getMuscleFill('Chest')} 
                stroke={getStrokeColor('Chest')} 
                strokeWidth="2" 
              />
            </g>
            
            {/* Abs */}
            <g 
              onClick={() => onMuscleSelect('Abs')}
              className="cursor-pointer hover:opacity-80 transition-opacity"
            >
              <rect x="82" y="135" width="36" height="60" rx="5" 
                fill={getMuscleFill('Abs')} 
                stroke={getStrokeColor('Abs')} 
                strokeWidth="2" 
              />
              {/* Ab detail lines */}
              <line x1="100" y1="135" x2="100" y2="195" stroke="#18181b" strokeWidth="2" />
              <line x1="82" y1="155" x2="118" y2="155" stroke="#18181b" strokeWidth="1" />
              <line x1="82" y1="175" x2="118" y2="175" stroke="#18181b" strokeWidth="1" />
            </g>
            
            {/* Biceps */}
            <g 
              onClick={() => onMuscleSelect('Biceps')}
              className="cursor-pointer hover:opacity-80 transition-opacity"
            >
              <ellipse cx="50" cy="125" rx="12" ry="30" 
                fill={getMuscleFill('Biceps')} 
                stroke={getStrokeColor('Biceps')} 
                strokeWidth="2" 
              />
              <ellipse cx="150" cy="125" rx="12" ry="30" 
                fill={getMuscleFill('Biceps')} 
                stroke={getStrokeColor('Biceps')} 
                strokeWidth="2" 
              />
            </g>
            
            {/* Forearms */}
            <g 
              onClick={() => onMuscleSelect('Forearms')}
              className="cursor-pointer hover:opacity-80 transition-opacity"
            >
              <rect x="42" y="160" width="16" height="50" rx="8" 
                fill={getMuscleFill('Forearms')} 
                stroke={getStrokeColor('Forearms')} 
                strokeWidth="2" 
              />
              <rect x="142" y="160" width="16" height="50" rx="8" 
                fill={getMuscleFill('Forearms')} 
                stroke={getStrokeColor('Forearms')} 
                strokeWidth="2" 
              />
            </g>
            
            {/* Hip/Pelvis */}
            <rect x="78" y="195" width="44" height="25" rx="5" fill="#27272a" stroke="#52525b" strokeWidth="2" />
            
            {/* Quads */}
            <g 
              onClick={() => onMuscleSelect('Quads')}
              className="cursor-pointer hover:opacity-80 transition-opacity"
            >
              <path 
                d="M 80 220 L 78 300 L 90 300 L 92 220 Z" 
                fill={getMuscleFill('Quads')} 
                stroke={getStrokeColor('Quads')} 
                strokeWidth="2" 
              />
              <path 
                d="M 108 220 L 110 300 L 122 300 L 120 220 Z" 
                fill={getMuscleFill('Quads')} 
                stroke={getStrokeColor('Quads')} 
                strokeWidth="2" 
              />
            </g>
            
            {/* Shins/Calves (Front) */}
            <g 
              onClick={() => onMuscleSelect('Calves')}
              className="cursor-pointer hover:opacity-80 transition-opacity"
            >
              <rect x="80" y="305" width="10" height="65" rx="5" 
                fill={getMuscleFill('Calves')} 
                stroke={getStrokeColor('Calves')} 
                strokeWidth="2" 
              />
              <rect x="110" y="305" width="10" height="65" rx="5" 
                fill={getMuscleFill('Calves')} 
                stroke={getStrokeColor('Calves')} 
                strokeWidth="2" 
              />
            </g>
          </svg>
        </div>

        {/* Back View */}
        <div className="flex flex-col items-center">
          <h3 className="text-sm text-zinc-400 mb-2">Back</h3>
          <svg viewBox="0 0 200 400" className="w-full h-auto max-h-96">
            {/* Head */}
            <ellipse cx="100" cy="30" rx="20" ry="25" fill="#27272a" stroke="#52525b" strokeWidth="2" />
            
            {/* Neck */}
            <rect x="90" y="52" width="20" height="18" fill="#27272a" stroke="#52525b" strokeWidth="2" />
            
            {/* Shoulders/Delts (Back) */}
            <g 
              onClick={() => onMuscleSelect('Delts')}
              className="cursor-pointer hover:opacity-80 transition-opacity"
            >
              <ellipse cx="65" cy="85" rx="20" ry="18" 
                fill={getMuscleFill('Delts')} 
                stroke={getStrokeColor('Delts')} 
                strokeWidth="2" 
              />
              <ellipse cx="135" cy="85" rx="20" ry="18" 
                fill={getMuscleFill('Delts')} 
                stroke={getStrokeColor('Delts')} 
                strokeWidth="2" 
              />
            </g>
            
            {/* Upper Back/Traps */}
            <path 
              d="M 80 75 L 70 90 L 80 100 L 120 100 L 130 90 L 120 75 Z" 
              fill="#27272a" 
              stroke="#52525b" 
              strokeWidth="2" 
            />
            
            {/* Back/Lats */}
            <g 
              onClick={() => onMuscleSelect('Back')}
              className="cursor-pointer hover:opacity-80 transition-opacity"
            >
              <path 
                d="M 70 100 Q 65 120 68 150 L 80 180 L 100 175 L 120 180 L 132 150 Q 135 120 130 100 Z" 
                fill={getMuscleFill('Back')} 
                stroke={getStrokeColor('Back')} 
                strokeWidth="2" 
              />
              {/* Spine line */}
              <line x1="100" y1="100" x2="100" y2="175" stroke="#18181b" strokeWidth="2" />
            </g>
            
            {/* Triceps */}
            <g 
              onClick={() => onMuscleSelect('Triceps')}
              className="cursor-pointer hover:opacity-80 transition-opacity"
            >
              <ellipse cx="50" cy="125" rx="11" ry="28" 
                fill={getMuscleFill('Triceps')} 
                stroke={getStrokeColor('Triceps')} 
                strokeWidth="2" 
              />
              <ellipse cx="150" cy="125" rx="11" ry="28" 
                fill={getMuscleFill('Triceps')} 
                stroke={getStrokeColor('Triceps')} 
                strokeWidth="2" 
              />
            </g>
            
            {/* Forearms */}
            <rect x="42" y="158" width="16" height="52" rx="8" fill="#27272a" stroke="#52525b" strokeWidth="2" />
            <rect x="142" y="158" width="16" height="52" rx="8" fill="#27272a" stroke="#52525b" strokeWidth="2" />
            
            {/* Lower Back */}
            <rect x="82" y="180" width="36" height="30" rx="5" fill="#27272a" stroke="#52525b" strokeWidth="2" />
            
            {/* Glutes */}
            <g 
              onClick={() => onMuscleSelect('Glutes')}
              className="cursor-pointer hover:opacity-80 transition-opacity"
            >
              <ellipse cx="88" cy="220" rx="14" ry="20" 
                fill={getMuscleFill('Glutes')} 
                stroke={getStrokeColor('Glutes')} 
                strokeWidth="2" 
              />
              <ellipse cx="112" cy="220" rx="14" ry="20" 
                fill={getMuscleFill('Glutes')} 
                stroke={getStrokeColor('Glutes')} 
                strokeWidth="2" 
              />
            </g>
            
            {/* Hamstrings */}
            <g 
              onClick={() => onMuscleSelect('Hamstrings')}
              className="cursor-pointer hover:opacity-80 transition-opacity"
            >
              <path 
                d="M 80 240 L 78 300 L 90 300 L 92 240 Z" 
                fill={getMuscleFill('Hamstrings')} 
                stroke={getStrokeColor('Hamstrings')} 
                strokeWidth="2" 
              />
              <path 
                d="M 108 240 L 110 300 L 122 300 L 120 240 Z" 
                fill={getMuscleFill('Hamstrings')} 
                stroke={getStrokeColor('Hamstrings')} 
                strokeWidth="2" 
              />
            </g>
            
            {/* Calves (Back) */}
            <g 
              onClick={() => onMuscleSelect('Calves')}
              className="cursor-pointer hover:opacity-80 transition-opacity"
            >
              <ellipse cx="84" cy="330" rx="8" ry="35" 
                fill={getMuscleFill('Calves')} 
                stroke={getStrokeColor('Calves')} 
                strokeWidth="2" 
              />
              <ellipse cx="116" cy="330" rx="8" ry="35" 
                fill={getMuscleFill('Calves')} 
                stroke={getStrokeColor('Calves')} 
                strokeWidth="2" 
              />
            </g>
          </svg>
        </div>
      </div>

      {/* Legend for status mode */}
      {colorMode === 'status' && (
        <div className="mt-4 flex flex-wrap gap-3 text-xs justify-center">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <span className="text-zinc-300">Progressing</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-zinc-300">Balanced</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <span className="text-zinc-300">Watch</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-orange-500" />
            <span className="text-zinc-300">Undertrained</span>
          </div>
        </div>
      )}
    </div>
  );
}
