import { type ReactNode, useMemo, useState } from 'react';
import { Check, Plus, Search, Target, X } from 'lucide-react';
import { type Exercise, type MuscleGroup } from '../data/mockData';
import { AnatomicalBodyDiagram } from './AnatomicalBodyDiagram';
import { ExerciseThumbnail } from './ExerciseThumbnail';

type FilterMode = 'tags' | 'diagram';
type PickerIcon = 'plus' | 'x' | 'target';

const muscleGroups: MuscleGroup[] = [
  'Chest',
  'Back',
  'Biceps',
  'Triceps',
  'Quads',
  'Hamstrings',
  'Glutes',
  'Delts',
  'Calves',
  'Forearms',
  'Core',
  'Cardio',
  'Warm-up',
];

interface ExerciseFilterPickerProps<TExercise extends Exercise> {
  exercises: TExercise[];
  selectedExerciseIds: string[];
  onToggleExercise: (exercise: TExercise) => void;
  isExerciseDisabled?: (exercise: TExercise) => boolean;
  renderExerciseMeta?: (exercise: TExercise) => ReactNode;
  initialSearchQuery?: string;
  searchPlaceholder?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  thumbnailSize?: 'sm' | 'md';
  maxMuscleBadges?: number;
  unselectedIcon?: PickerIcon;
  pinSelectedToTop?: boolean;
  className?: string;
  listClassName?: string;
}

function normalizeMuscle(muscle: string) {
  return muscle === 'Abs' ? 'Core' : muscle;
}

function getDominantMuscle(exercise: Pick<Exercise, 'mainMuscles'>) {
  return exercise.mainMuscles[0] ? normalizeMuscle(exercise.mainMuscles[0]) : null;
}

function renderPickerIcon(isSelected: boolean, icon: PickerIcon) {
  if (isSelected) return <Check className="h-4 w-4" />;
  if (icon === 'target') return <Target className="h-4 w-4" />;
  if (icon === 'x') return <X className="h-4 w-4" />;
  return <Plus className="h-4 w-4" />;
}

export function ExerciseFilterPicker<TExercise extends Exercise>({
  exercises,
  selectedExerciseIds,
  onToggleExercise,
  isExerciseDisabled,
  renderExerciseMeta,
  initialSearchQuery = '',
  searchPlaceholder = 'Search exercises...',
  emptyTitle = 'No exercises found',
  emptyDescription = 'Try a different search or muscle filter.',
  thumbnailSize = 'sm',
  maxMuscleBadges = 2,
  unselectedIcon = 'plus',
  pinSelectedToTop = false,
  className = '',
  listClassName = '',
}: ExerciseFilterPickerProps<TExercise>) {
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [selectedMuscles, setSelectedMuscles] = useState<string[]>([]);
  const [filterMode, setFilterMode] = useState<FilterMode>('tags');

  const toggleMuscle = (rawMuscle: string) => {
    const muscle = normalizeMuscle(rawMuscle);
    setSelectedMuscles((current) =>
      current.includes(muscle) ? current.filter((item) => item !== muscle) : [...current, muscle],
    );
  };

  const filteredExercises = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    const matches = exercises.filter((exercise) => {
      const matchesSearch = exercise.name.toLowerCase().includes(normalizedQuery);
      const dominantMuscle = getDominantMuscle(exercise);
      const matchesMuscle =
        selectedMuscles.length === 0 ||
        (dominantMuscle !== null && selectedMuscles.includes(dominantMuscle));

      return matchesSearch && matchesMuscle;
    });

    if (!pinSelectedToTop) return matches;

    return [...matches].sort((a, b) => {
      const aSelected = selectedExerciseIds.includes(a.id);
      const bSelected = selectedExerciseIds.includes(b.id);
      if (aSelected === bSelected) return 0;
      return aSelected ? -1 : 1;
    });
  }, [exercises, pinSelectedToTop, searchQuery, selectedExerciseIds, selectedMuscles]);
  const diagramSelectedMuscles = selectedMuscles.includes('Core') ? [...selectedMuscles, 'Abs'] : selectedMuscles;

  return (
    <div className={`flex min-h-0 flex-col ${className}`}>
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder={searchPlaceholder}
            className="premium-input w-full py-3 pl-9 pr-3 text-white placeholder:text-zinc-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setFilterMode('tags')}
            className={`premium-button py-2 text-sm font-medium ${
              filterMode === 'tags' ? 'premium-button-primary' : 'premium-button-secondary text-zinc-400'
            }`}
          >
            Muscle Tags
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('diagram')}
            className={`premium-button py-2 text-sm font-medium ${
              filterMode === 'diagram' ? 'premium-button-primary' : 'premium-button-secondary text-zinc-400'
            }`}
          >
            Body Diagram
          </button>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-3">
          {filterMode === 'tags' ? (
            <div className="flex flex-wrap gap-2">
              {muscleGroups.map((muscle) => (
                <button
                  key={muscle}
                  type="button"
                  onClick={() => toggleMuscle(muscle)}
                  className={`premium-badge min-h-8 px-3 py-1 text-sm transition-colors ${
                    selectedMuscles.includes(muscle)
                      ? 'border-blue-400/40 bg-blue-500/15 text-blue-100'
                      : 'text-zinc-300 hover:border-white/20 hover:text-white'
                  }`}
                >
                  {muscle}
                </button>
              ))}
            </div>
          ) : (
            <AnatomicalBodyDiagram onMuscleSelect={toggleMuscle} selectedMuscles={diagramSelectedMuscles} />
          )}
        </div>
      </div>

      <div className={`mt-3 min-h-0 flex-1 space-y-2 overflow-y-auto pr-1 ${listClassName}`}>
        {filteredExercises.length === 0 ? (
          <div className="empty-state p-6 text-center">
            <p className="text-sm font-medium text-white">{emptyTitle}</p>
            <p className="mt-1 text-sm text-zinc-400">{emptyDescription}</p>
          </div>
        ) : (
          filteredExercises.map((exercise) => {
            const isSelected = selectedExerciseIds.includes(exercise.id);
            const isDisabled = isExerciseDisabled?.(exercise) ?? false;
            const visibleMuscles = exercise.mainMuscles.slice(0, maxMuscleBadges);
            const hiddenMuscleCount = exercise.mainMuscles.length - visibleMuscles.length;
            const hasHistory = Boolean((exercise as Exercise & { hasHistory?: boolean }).hasHistory);

            return (
              <button
                key={exercise.id}
                type="button"
                onClick={() => !isDisabled && onToggleExercise(exercise)}
                disabled={isDisabled}
                className={`w-full rounded-xl border p-3 text-left transition-colors ${
                  isSelected
                    ? 'border-blue-400/40 bg-blue-500/15 text-white'
                    : isDisabled
                      ? 'cursor-not-allowed border-white/10 bg-white/[0.02] text-zinc-600'
                      : 'border-white/10 bg-white/[0.035] text-white hover:bg-white/[0.06]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <ExerciseThumbnail exercise={exercise} size={thumbnailSize} active={isSelected} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{exercise.name}</div>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {visibleMuscles.map((muscle) => (
                        <span key={muscle} className="premium-badge px-2 py-0.5 text-xs text-blue-200">
                          {muscle}
                        </span>
                      ))}
                      {hiddenMuscleCount > 0 && (
                        <span className="premium-badge px-2 py-0.5 text-xs text-zinc-400">
                          +{hiddenMuscleCount}
                        </span>
                      )}
                      {hasHistory && (
                        <span className="premium-badge border-green-400/30 bg-green-500/10 px-2 py-0.5 text-xs text-green-300">
                          Logged
                        </span>
                      )}
                    </div>
                    {renderExerciseMeta?.(exercise)}
                  </div>
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-black/20 text-zinc-200">
                    {renderPickerIcon(isSelected, unselectedIcon)}
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
