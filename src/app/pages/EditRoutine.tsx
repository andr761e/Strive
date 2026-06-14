import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { ArrowLeft, Plus, X, ChevronDown, ChevronUp, Trash2, Save, Lightbulb, Check } from 'lucide-react';
import { exercises, type Exercise, type MuscleGroup, type SetType } from '../data/mockData';
import { ExerciseThumbnail } from '../components/ExerciseThumbnail';
import { SetTypeSelector, getSetTypeStyles } from '../components/SetTypeSelector';
import { BottomInputPanel } from '../components/BottomInputPanel';
import { useSettings } from '../contexts/SettingsContext';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../components/ui/alert-dialog';
import { useAuth } from '../contexts/AuthContext';
import { DataService } from '../services/db';
import type { RoutineEditSuggestion } from '../../lib/insights';
import { ReorderControls } from '../components/ReorderControls';

interface TemplateSet {
  type: SetType;
  weight: number;
  reps: number;
  rir?: number;
}

interface TemplateExercise {
  exerciseId: string;
  exerciseName: string;
  mainMuscles: MuscleGroup[];
  sets: TemplateSet[];
  supersetGroupId?: string;
}

interface InputState {
  exerciseId: string;
  setIndex: number;
  field: 'weight' | 'reps';
  value: number;
}

interface DraggableTemplateExerciseProps {
  exercise: TemplateExercise;
  index: number;
  exerciseCount: number;
  onMoveUp: () => void;
  onMoveDown: () => void;
  showExtras: boolean;
  onToggleExtras: () => void;
  onAddSet: () => void;
  onOpenInput: (setIndex: number, field: 'weight' | 'reps', value: number) => void;
  onDeleteSet: (setIndex: number) => void;
  onSetTypeChange: (setIndex: number, type: SetType) => void;
  onRemoveExercise: () => void;
}

function DraggableTemplateExercise({
  exercise,
  index,
  exerciseCount,
  onMoveUp,
  onMoveDown,
  showExtras,
  onToggleExtras,
  onAddSet,
  onOpenInput,
  onDeleteSet,
  onSetTypeChange,
  onRemoveExercise,
}: DraggableTemplateExerciseProps) {
  const { weightUnit } = useSettings();
  const [setTypeSelectorOpen, setSetTypeSelectorOpen] = useState(false);
  const [selectedSetIndex, setSelectedSetIndex] = useState<number | null>(null);

  const exerciseData = exercises.find(ex => ex.id === exercise.exerciseId);

  const getSetTypeLabel = (setIndex: number) => {
    const set = exercise.sets[setIndex];
    const type = set.type;
    
    if (!type || type === 'normal') {
      // Count only normal sets before this one
      const normalSetsBefore = exercise.sets
        .slice(0, setIndex)
        .filter(s => !s.type || s.type === 'normal').length;
      return (normalSetsBefore + 1).toString();
    }
    if (type === 'warmup') return 'W';
    if (type === 'drop') return 'D';
    if (type === 'failure') return 'F';
    return '#';
  };

  const handleSetTypeClick = (setIndex: number) => {
    setSelectedSetIndex(setIndex);
    setSetTypeSelectorOpen(true);
  };

  const handleSetTypeSelect = (type: SetType) => {
    if (selectedSetIndex !== null) {
      onSetTypeChange(selectedSetIndex, type);
    }
  };

  return (
    <div className="premium-card overflow-hidden">
      {/* Exercise Header */}
      <div className="p-4 flex items-center gap-3 border-b border-white/10">
        {exerciseData && <ExerciseThumbnail exercise={exerciseData} size="md" />}
        
        <div className="flex-1 min-w-0">
          <h3 className="text-white font-medium mb-1 truncate">{exercise.exerciseName}</h3>
          <div className="flex gap-2">
            {exercise.mainMuscles.map((muscle) => (
              <span
                key={muscle}
                className="premium-badge text-xs text-blue-200 px-2 py-0.5"
              >
                {muscle}
              </span>
            ))}
          </div>
        </div>

        <div className="flex shrink-0 items-start gap-2">
          {exerciseCount > 1 && (
            <ReorderControls
              label={exercise.exerciseName}
              canMoveUp={index > 0}
              canMoveDown={index < exerciseCount - 1}
              onMoveUp={onMoveUp}
              onMoveDown={onMoveDown}
            />
          )}
          <button
            onClick={onRemoveExercise}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/[0.035] text-zinc-400 transition-colors hover:border-red-400/30 hover:bg-red-500/10 hover:text-red-300"
            aria-label={`Remove ${exercise.exerciseName}`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Sets Table - Always Visible */}
      <div className="px-4 py-3">
        {exercise.sets.length > 0 && (
          <div className="mb-3">
            <table className="w-full table-fixed text-sm">
              <thead>
                <tr className="text-zinc-400 border-b border-white/10">
                  <th className="text-left py-2 px-2 w-12">Set</th>
                  <th className="text-center py-2 px-2">Weight</th>
                  <th className="text-center py-2 px-2">Reps</th>
                  <th className="text-center py-2 px-2 w-10"></th>
                </tr>
              </thead>
              <tbody>
                {exercise.sets.map((set, idx) => {
                  const setType = set.type || 'normal';
                  const setTypeClass = setType === 'normal'
                    ? 'workout-field hover:border-white/20'
                    : `${getSetTypeStyles(setType).compact} hover:brightness-110`;

                  return (
                    <tr key={idx} className="border-b border-white/10">
                      <td className="py-3 px-2">
                        <button
                          onClick={() => handleSetTypeClick(idx)}
                          className={`${setTypeClass} w-8 h-8 flex items-center justify-center rounded-[9px] text-sm font-bold`}
                        >
                          {getSetTypeLabel(idx)}
                        </button>
                      </td>
                      <td className="py-3 px-2">
                        <button
                          data-bottom-input-switch="true"
                          onClick={() => onOpenInput(idx, 'weight', set.weight)}
                          className="workout-field w-full px-3 py-2 text-center hover:border-white/20"
                        >
                          {set.weight || '-'}
                        </button>
                      </td>
                      <td className="py-3 px-2">
                        <button
                          data-bottom-input-switch="true"
                          onClick={() => onOpenInput(idx, 'reps', set.reps)}
                          className="workout-field w-full px-3 py-2 text-center hover:border-white/20"
                        >
                          {set.reps || '-'}
                        </button>
                      </td>
                      <td className="py-3 px-2">
                        <button
                          onClick={() => onDeleteSet(idx)}
                          className="p-1.5 rounded transition-colors text-zinc-400 hover:text-red-400"
                          title="Delete set"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Add Set Button */}
        <button
          onClick={onAddSet}
          className="premium-button premium-button-primary w-full py-2.5 flex items-center justify-center gap-2 mb-2 font-medium"
        >
          <Plus className="w-4 h-4" />
          Add Set
        </button>

        {/* Toggle Extras */}
        <button
          onClick={onToggleExtras}
          className="w-full text-zinc-400 hover:text-zinc-300 text-sm py-2 flex items-center justify-center gap-2 transition-colors"
        >
          {showExtras ? (
            <>
              <ChevronUp className="w-4 h-4" />
              Hide Info
            </>
          ) : (
            <>
              <ChevronDown className="w-4 h-4" />
              Show Info
            </>
          )}
        </button>
      </div>

      {/* Extras Section (Collapsible) */}
      {showExtras && exerciseData?.loggingGuidance && (
        <div className="px-4 pb-4 border-t border-white/10 pt-3">
          <p className="text-sm text-zinc-400">{exerciseData.loggingGuidance}</p>
        </div>
      )}

      {/* Set Type Selector */}
      <SetTypeSelector
        isOpen={setTypeSelectorOpen}
        onClose={() => setSetTypeSelectorOpen(false)}
        currentType={selectedSetIndex !== null ? (exercise.sets[selectedSetIndex]?.type || 'normal') : 'normal'}
        onSelectType={handleSetTypeSelect}
      />
    </div>
  );
}

export function EditRoutinePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { weightIncrement } = useSettings();
  const { user } = useAuth();
  
  const routeState = (location.state as any) || {};
  const routineData = routeState.routine || null;
  const incomingSuggestion = routeState.routineSuggestion as RoutineEditSuggestion | undefined;
  const insightTitle = routeState.insightTitle as string | undefined;
  const returnTo = routeState.returnTo || '/manage-routines';
  const isNewRoutine = !routineData;

  const [routineName, setRoutineName] = useState(routineData?.name || '');
  const [templateExercises, setTemplateExercises] = useState<TemplateExercise[]>(() => {
    // If we have exerciseLogs in the routine, use those (full set structure)
    if (routineData?.exerciseLogs) {
      return routineData.exerciseLogs.map((log: any) => ({
        exerciseId: log.exerciseId,
        exerciseName: log.exerciseName,
        mainMuscles: log.mainMuscles,
        sets: log.sets,
        supersetGroupId: log.supersetGroupId,
      }));
    }
    // Otherwise, if we just have exercises list, create empty structure
    else if (routineData?.exercises) {
      return routineData.exercises.map((ex: Exercise) => ({
        exerciseId: ex.id,
        exerciseName: ex.name,
        mainMuscles: ex.mainMuscles,
        sets: [],
      }));
    }
    return [];
  });

  const [expandedExtras, setExpandedExtras] = useState<Set<string>>(new Set());
  const [inputState, setInputState] = useState<InputState | null>(null);
  const [deleteExerciseDialogOpen, setDeleteExerciseDialogOpen] = useState(false);
  const [exerciseToDelete, setExerciseToDelete] = useState<string | null>(null);
  const [discardDialogOpen, setDiscardDialogOpen] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState<RoutineEditSuggestion | null>(incomingSuggestion ?? null);

  // Handle adding new exercises from selection page
  useEffect(() => {
    const addExercises = (location.state as any)?.addExercises;
    if (addExercises && addExercises.length > 0) {
      const newExerciseLogs = addExercises.map((ex: Exercise) => ({
        exerciseId: ex.id,
        exerciseName: ex.name,
        mainMuscles: ex.mainMuscles,
        sets: [],
      }));
      setTemplateExercises((prev) => [...prev, ...newExerciseLogs]);
      
      // Clear the state so it doesn't add again on re-render
      navigate('/edit-routine', { replace: true, state: { routine: routineData, returnTo } });
    }
  }, [location.state]);

  useEffect(() => {
    setActiveSuggestion(incomingSuggestion ?? null);
  }, [incomingSuggestion]);

  const toggleExtras = (exerciseId: string) => {
    setExpandedExtras(prev => {
      const newSet = new Set(prev);
      if (newSet.has(exerciseId)) {
        newSet.delete(exerciseId);
      } else {
        newSet.add(exerciseId);
      }
      return newSet;
    });
  };

  const moveExercise = (fromIndex: number, toIndex: number) => {
    setTemplateExercises((current) => {
      if (
        fromIndex === toIndex ||
        fromIndex < 0 ||
        toIndex < 0 ||
        fromIndex >= current.length ||
        toIndex >= current.length
      ) {
        return current;
      }

      const newExercises = [...current];
      const [movedExercise] = newExercises.splice(fromIndex, 1);
      newExercises.splice(toIndex, 0, movedExercise);
      return newExercises;
    });
  };

  const addSet = (exerciseId: string) => {
    setTemplateExercises((prev) =>
      prev.map((ex) =>
        ex.exerciseId === exerciseId
          ? {
              ...ex,
              sets: [
                ...ex.sets,
                {
                  type: 'normal' as SetType,
                  weight: ex.sets.length > 0 ? ex.sets[ex.sets.length - 1].weight : 0,
                  reps: ex.sets.length > 0 ? ex.sets[ex.sets.length - 1].reps : 0,
                  rir: undefined,
                },
              ],
            }
          : ex
      )
    );
  };

  const openInput = (exerciseId: string, setIndex: number, field: 'weight' | 'reps', value: number) => {
    setInputState({ exerciseId, setIndex, field, value });
  };

  const closeInput = () => {
    setInputState(null);
  };

  const handleInputChange = (value: number) => {
    if (!inputState) return;
    
    setTemplateExercises((prev) =>
      prev.map((ex) =>
        ex.exerciseId === inputState.exerciseId
          ? {
              ...ex,
              sets: ex.sets.map((set, idx) =>
                idx === inputState.setIndex ? { ...set, [inputState.field]: value } : set
              ),
            }
          : ex
      )
    );
    
    setInputState({ ...inputState, value });
  };

  const deleteSet = (exerciseId: string, setIndex: number) => {
    setTemplateExercises((prev) =>
      prev.map((ex) =>
        ex.exerciseId === exerciseId
          ? {
              ...ex,
              sets: ex.sets.filter((_, idx) => idx !== setIndex),
            }
          : ex
      )
    );
  };

  const setSetType = (exerciseId: string, setIndex: number, type: SetType) => {
    setTemplateExercises((prev) =>
      prev.map((ex) =>
        ex.exerciseId === exerciseId
          ? {
              ...ex,
              sets: ex.sets.map((set, idx) =>
                idx === setIndex ? { ...set, type } : set
              ),
            }
          : ex
      )
    );
  };

  const confirmRemoveExercise = (exerciseId: string) => {
    setExerciseToDelete(exerciseId);
    setDeleteExerciseDialogOpen(true);
  };

  const removeExercise = () => {
    if (exerciseToDelete) {
      setTemplateExercises((prev) => prev.filter((ex) => ex.exerciseId !== exerciseToDelete));
      setExerciseToDelete(null);
      setDeleteExerciseDialogOpen(false);
    }
  };

  const handleAddExerciseClick = () => {
    // Navigate to exercise selection with a flag to return to routine builder
    navigate('/exercise-selection', {
      replace: true,
      state: { 
        fromEditRoutine: true,
        currentExercises: templateExercises.map(ex => ex.exerciseId),
        routine: buildRoutineDraft(),
        returnTo,
      } 
    });
  };

  const suggestionExercise = activeSuggestion
    ? exercises.find(
        (exercise) =>
          exercise.id === activeSuggestion.exerciseId ||
          exercise.name.toLowerCase() === activeSuggestion.exerciseName?.toLowerCase(),
      )
    : null;

  const createSuggestedSets = (count: number) =>
    Array.from({ length: Math.max(1, Math.min(4, count)) }, () => ({
      type: 'normal' as SetType,
      weight: 0,
      reps: 12,
      rir: undefined,
    }));

  const applyRoutineSuggestion = () => {
    if (!activeSuggestion) return;

    if (activeSuggestion.kind === 'add_exercise' && suggestionExercise) {
      setTemplateExercises((prev) => {
        const existing = prev.find((exercise) => exercise.exerciseId === suggestionExercise.id);
        const addedSets = createSuggestedSets(activeSuggestion.targetSets ?? 3);

        if (existing) {
          return prev.map((exercise) =>
            exercise.exerciseId === suggestionExercise.id
              ? { ...exercise, sets: [...exercise.sets, ...addedSets] }
              : exercise,
          );
        }

        return [
          ...prev,
          {
            exerciseId: suggestionExercise.id,
            exerciseName: suggestionExercise.name,
            mainMuscles: suggestionExercise.mainMuscles,
            sets: addedSets,
          },
        ];
      });
    }

    if (activeSuggestion.kind === 'remove_exercise') {
      setTemplateExercises((prev) =>
        prev.filter(
          (exercise) =>
            exercise.exerciseId !== activeSuggestion.exerciseId &&
            exercise.exerciseName.toLowerCase() !== activeSuggestion.exerciseName?.toLowerCase(),
        ),
      );
    }

    if (activeSuggestion.kind === 'reduce_sets') {
      setTemplateExercises((prev) =>
        prev.map((exercise) => {
          const matches =
            exercise.exerciseId === activeSuggestion.exerciseId ||
            exercise.exerciseName.toLowerCase() === activeSuggestion.exerciseName?.toLowerCase();
          if (!matches) return exercise;

          const setsToRemove = Math.max(1, activeSuggestion.targetSets ?? 1);
          return {
            ...exercise,
            sets: exercise.sets.slice(0, Math.max(1, exercise.sets.length - setsToRemove)),
          };
        }),
      );
    }

    if (activeSuggestion.kind === 'reorder_exercise') {
      setTemplateExercises((prev) => {
        const fromIndex = prev.findIndex(
          (exercise) =>
            exercise.exerciseId === activeSuggestion.exerciseId ||
            exercise.exerciseName.toLowerCase() === activeSuggestion.exerciseName?.toLowerCase(),
        );
        if (fromIndex < 0) return prev;

        const targetIndex = Math.max(0, Math.min(prev.length - 1, (activeSuggestion.targetPosition ?? 1) - 1));
        const next = [...prev];
        const [moved] = next.splice(fromIndex, 1);
        next.splice(targetIndex, 0, moved);
        return next;
      });
    }

    setActiveSuggestion(null);
  };

  const buildRoutineDraft = () => ({
    id: routineData?.id,
    name: routineName,
    exercises: templateExercises
      .map((templateExercise) => exercises.find((exercise) => exercise.id === templateExercise.exerciseId))
      .filter((exercise): exercise is Exercise => Boolean(exercise)),
    exerciseLogs: templateExercises,
  });

  const handleSave = () => {
    if (!user) return;
    if (!routineName.trim()) {
      alert('Please enter a routine name');
      return;
    }
    if (templateExercises.length === 0) {
      alert('Please add at least one exercise');
      return;
    }
    
    const draft = buildRoutineDraft();
    DataService.saveRoutine(user.id, {
      id: draft.id,
      name: draft.name,
      exercises: draft.exercises,
      exerciseLogs: draft.exerciseLogs,
    });
    
    // Navigate back
    navigate('/manage-routines', { replace: true });
  };

  const handleBackClick = () => {
    setDiscardDialogOpen(true);
  };

  const handleDiscard = () => {
    setDiscardDialogOpen(false);
    navigate(returnTo, { replace: true });
  };

  return (
    <div className="screen-shell">
        {/* Header */}
        <div className="sticky-header">
          <div className="grid min-h-[4.75rem] grid-cols-[2.75rem_minmax(0,1fr)_2.75rem] items-center gap-3 px-4 py-3">
            <button
              type="button"
              onClick={handleBackClick}
              className="premium-button premium-button-secondary flex h-11 w-11 items-center justify-center p-0"
              aria-label="Go back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="min-w-0 self-center">
              {isEditingName ? (
                <input
                  type="text"
                  value={routineName}
                  onChange={(e) => setRoutineName(e.target.value)}
                  onBlur={() => setIsEditingName(false)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') setIsEditingName(false);
                  }}
                  autoFocus
                  className="premium-input h-10 w-full min-w-0 rounded-xl px-3 text-lg font-semibold text-white"
                  placeholder="Routine name"
                />
              ) : (
                <button
                  type="button"
                  className="block h-10 w-full min-w-0 rounded-xl px-3 text-left transition-colors hover:bg-white/[0.04]"
                  onClick={() => setIsEditingName(true)}
                >
                  <h1 className="truncate text-lg font-semibold leading-10">
                    {routineName || 'Untitled Routine'}
                  </h1>
                </button>
              )}
              <p className="mt-1 px-3 text-xs text-zinc-500">Template - {templateExercises.length} exercises</p>
            </div>
            <button
              type="button"
              onClick={handleSave}
              className="premium-button premium-button-primary flex h-11 w-11 items-center justify-center p-0"
              aria-label="Save routine"
            >
              <Save className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {activeSuggestion && (
          <div className="px-4 pt-4">
            <div className="premium-card p-4 border-emerald-500/25 bg-emerald-500/[0.04]">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 rounded-lg bg-emerald-500/15 p-2 text-emerald-300">
                  <Lightbulb className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-sm font-semibold text-white">{insightTitle ?? 'Routine suggestion'}</h2>
                  <p className="mt-1 text-sm leading-relaxed text-zinc-300">
                    {activeSuggestion.reason}
                    {activeSuggestion.exerciseName ? ` Suggested exercise: ${activeSuggestion.exerciseName}.` : ''}
                  </p>
                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      onClick={applyRoutineSuggestion}
                      className="premium-button premium-button-primary flex items-center gap-2 px-4 py-2 text-sm"
                    >
                      <Check className="h-4 w-4" />
                      Apply
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveSuggestion(null)}
                      className="premium-button premium-button-secondary px-4 py-2 text-sm"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Exercise List */}
        <div className="px-4 py-4 space-y-3">
          {templateExercises.map((exercise, index) => (
            <DraggableTemplateExercise
              key={exercise.exerciseId}
              exercise={exercise}
              index={index}
              exerciseCount={templateExercises.length}
              onMoveUp={() => moveExercise(index, index - 1)}
              onMoveDown={() => moveExercise(index, index + 1)}
              showExtras={expandedExtras.has(exercise.exerciseId)}
              onToggleExtras={() => toggleExtras(exercise.exerciseId)}
              onAddSet={() => addSet(exercise.exerciseId)}
              onOpenInput={(setIndex, field, value) => openInput(exercise.exerciseId, setIndex, field, value)}
              onDeleteSet={(setIndex) => deleteSet(exercise.exerciseId, setIndex)}
              onSetTypeChange={(setIndex, type) => setSetType(exercise.exerciseId, setIndex, type)}
              onRemoveExercise={() => confirmRemoveExercise(exercise.exerciseId)}
            />
          ))}

          {/* Add Exercise Button */}
          <button
            onClick={handleAddExerciseClick}
            className="empty-state w-full py-4 flex items-center justify-center gap-2 text-zinc-400 transition-colors hover:border-white/25 hover:text-white"
          >
            <Plus className="w-5 h-5" />
            Add Exercise
          </button>
        </div>

        {/* Bottom Input Panel */}
        {inputState && (
          <BottomInputPanel
            isOpen={true}
            onClose={closeInput}
            value={inputState.value}
            onChange={handleInputChange}
            label={inputState.field === 'weight' ? 'Weight' : 'Reps'}
            step={inputState.field === 'weight' ? weightIncrement : 1}
            unit={inputState.field === 'weight' ? 'kg' : ''}
            allowDecimal={inputState.field === 'weight'}
            selectionKey={`${inputState.exerciseId}:${inputState.setIndex}:${inputState.field}`}
          />
        )}

        {/* Delete Exercise Dialog */}
        <AlertDialog open={deleteExerciseDialogOpen} onOpenChange={setDeleteExerciseDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remove Exercise?</AlertDialogTitle>
              <AlertDialogDescription className="text-zinc-400">
                This exercise and all its sets will be removed from the routine.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="premium-button premium-button-secondary border-white/10 text-white">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={removeExercise}
                className="premium-button premium-button-danger"
              >
                Remove
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Discard Changes Dialog */}
        <AlertDialog open={discardDialogOpen} onOpenChange={setDiscardDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Discard Changes?</AlertDialogTitle>
              <AlertDialogDescription className="text-zinc-400">
                You have unsaved changes. Are you sure you want to leave without saving?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="premium-button premium-button-secondary border-white/10 text-white">
                Keep Editing
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDiscard}
                className="premium-button premium-button-danger"
              >
                Discard
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
    </div>
  );
}
