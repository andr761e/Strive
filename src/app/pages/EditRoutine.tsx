import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { ArrowLeft, Plus, GripVertical, X, ChevronDown, ChevronUp, Trash2, Save } from 'lucide-react';
import { exercises, type Exercise, type SetType } from '../data/mockData';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { ExerciseThumbnail } from '../components/ExerciseThumbnail';
import { SetTypeSelector } from '../components/SetTypeSelector';
import { BottomInputPanel } from '../components/BottomInputPanel';
import { useSettings } from '../contexts/SettingsContext';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../components/ui/alert-dialog';

interface TemplateSet {
  type: SetType;
  weight: number;
  reps: number;
  rir?: number;
}

interface TemplateExercise {
  exerciseId: string;
  exerciseName: string;
  mainMuscles: string[];
  sets: TemplateSet[];
}

interface InputState {
  exerciseId: string;
  setIndex: number;
  field: 'weight' | 'reps' | 'rir';
  value: number;
}

interface DraggableTemplateExerciseProps {
  exercise: TemplateExercise;
  index: number;
  moveExercise: (fromIndex: number, toIndex: number) => void;
  showExtras: boolean;
  onToggleExtras: () => void;
  onAddSet: () => void;
  onOpenInput: (setIndex: number, field: 'weight' | 'reps' | 'rir', value: number) => void;
  onDeleteSet: (setIndex: number) => void;
  onSetTypeChange: (setIndex: number, type: SetType) => void;
  onRemoveExercise: () => void;
}

function DraggableTemplateExercise({
  exercise,
  index,
  moveExercise,
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

  const [{ isDragging }, drag, preview] = useDrag({
    type: 'template-exercise',
    item: { index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [, drop] = useDrop({
    accept: 'template-exercise',
    hover: (item: { index: number }) => {
      if (item.index !== index) {
        moveExercise(item.index, index);
        item.index = index;
      }
    },
  });

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
    <div
      ref={(node) => preview(drop(node))}
      className={`bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden ${
        isDragging ? 'opacity-50' : ''
      }`}
    >
      {/* Exercise Header */}
      <div className="p-4 flex items-center gap-3 border-b border-zinc-800">
        <div
          ref={drag}
          className="cursor-grab active:cursor-grabbing touch-none"
        >
          <GripVertical className="w-5 h-5 text-zinc-500" />
        </div>
        
        {exerciseData && <ExerciseThumbnail exercise={exerciseData} size="md" />}
        
        <div className="flex-1">
          <h3 className="text-white mb-1">{exercise.exerciseName}</h3>
          <div className="flex gap-2">
            {exercise.mainMuscles.map((muscle) => (
              <span
                key={muscle}
                className="text-xs bg-zinc-800 text-blue-400 px-2 py-0.5 rounded"
              >
                {muscle}
              </span>
            ))}
          </div>
        </div>

        <button
          onClick={onRemoveExercise}
          className="p-2 text-zinc-400 hover:text-red-400 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Sets Table - Always Visible */}
      <div className="px-4 py-3">
        {exercise.sets.length > 0 && (
          <div className="mb-3 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-zinc-400 border-b border-zinc-800">
                  <th className="text-left py-2 px-2 w-12">Set</th>
                  <th className="text-center py-2 px-2">Weight</th>
                  <th className="text-center py-2 px-2">Reps</th>
                  <th className="text-center py-2 px-2">RIR</th>
                  <th className="text-center py-2 px-2 w-10"></th>
                </tr>
              </thead>
              <tbody>
                {exercise.sets.map((set, idx) => {
                  return (
                    <tr key={idx} className="border-b border-zinc-800">
                      <td className="py-3 px-2">
                        <button
                          onClick={() => handleSetTypeClick(idx)}
                          className="w-8 h-8 rounded flex items-center justify-center text-sm font-bold bg-zinc-800 text-white hover:bg-zinc-700 transition-colors"
                        >
                          {getSetTypeLabel(idx)}
                        </button>
                      </td>
                      <td className="py-3 px-2">
                        <button
                          onClick={() => onOpenInput(idx, 'weight', set.weight)}
                          className="w-full px-3 py-2 rounded text-center bg-zinc-800 text-white hover:bg-zinc-700 transition-colors"
                        >
                          {set.weight || '-'}
                        </button>
                      </td>
                      <td className="py-3 px-2">
                        <button
                          onClick={() => onOpenInput(idx, 'reps', set.reps)}
                          className="w-full px-3 py-2 rounded text-center bg-zinc-800 text-white hover:bg-zinc-700 transition-colors"
                        >
                          {set.reps || '-'}
                        </button>
                      </td>
                      <td className="py-3 px-2">
                        <button
                          onClick={() => onOpenInput(idx, 'rir', set.rir || 0)}
                          className="w-full px-3 py-2 rounded text-center bg-zinc-800 text-white hover:bg-zinc-700 transition-colors"
                        >
                          {set.rir || '-'}
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
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors mb-2"
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
        <div className="px-4 pb-4 border-t border-zinc-800 pt-3">
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
  
  const routineData = (location.state as any)?.routine || null;
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
      navigate('/edit-routine', { replace: true, state: { routine: routineData } });
    }
  }, [location.state]);

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
    const newExercises = [...templateExercises];
    const [movedExercise] = newExercises.splice(fromIndex, 1);
    newExercises.splice(toIndex, 0, movedExercise);
    setTemplateExercises(newExercises);
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
                  rir: ex.sets.length > 0 ? ex.sets[ex.sets.length - 1].rir : 0,
                },
              ],
            }
          : ex
      )
    );
  };

  const openInput = (exerciseId: string, setIndex: number, field: 'weight' | 'reps' | 'rir', value: number) => {
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
      state: { 
        fromEditRoutine: true,
        currentExercises: templateExercises.map(ex => ex.exerciseId),
        routine: routineData
      } 
    });
  };

  const handleSave = () => {
    if (!routineName.trim()) {
      alert('Please enter a routine name');
      return;
    }
    if (templateExercises.length === 0) {
      alert('Please add at least one exercise');
      return;
    }
    
    // Save routine logic would go here
    console.log('Saving routine:', { name: routineName, exercises: templateExercises });
    
    // Navigate back
    navigate('/manage-routines');
  };

  const handleBackClick = () => {
    setDiscardDialogOpen(true);
  };

  const handleDiscard = () => {
    setDiscardDialogOpen(false);
    navigate(-1);
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="min-h-screen bg-zinc-950 text-white pb-20">
        {/* Header */}
        <div className="sticky top-0 bg-zinc-950 border-b border-zinc-800 z-10">
          <div className="px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1">
              <button onClick={handleBackClick} className="text-zinc-400">
                <ArrowLeft className="w-6 h-6" />
              </button>
              <div className="flex-1">
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
                    className="text-xl bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-white w-full"
                    placeholder="Routine Name"
                  />
                ) : (
                  <h1 
                    className="text-xl cursor-pointer hover:text-zinc-300"
                    onClick={() => setIsEditingName(true)}
                  >
                    {routineName || 'Untitled Routine'}
                  </h1>
                )}
                <p className="text-xs text-zinc-500 mt-0.5">Template • {templateExercises.length} exercises</p>
              </div>
            </div>
            <button
              onClick={handleSave}
              className="p-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              <Save className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {/* Exercise List */}
        <div className="px-4 py-4 space-y-3">
          {templateExercises.map((exercise, index) => (
            <DraggableTemplateExercise
              key={exercise.exerciseId}
              exercise={exercise}
              index={index}
              moveExercise={moveExercise}
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
            className="w-full bg-zinc-900 hover:bg-zinc-800 border-2 border-dashed border-zinc-700 rounded-xl py-4 flex items-center justify-center gap-2 text-zinc-400 transition-colors"
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
            label={inputState.field === 'weight' ? 'Weight' : inputState.field === 'reps' ? 'Reps' : 'RIR'}
            step={inputState.field === 'weight' ? weightIncrement : 1}
            unit={inputState.field === 'weight' ? 'kg' : ''}
            allowDecimal={inputState.field === 'weight'}
          />
        )}

        {/* Delete Exercise Dialog */}
        <AlertDialog open={deleteExerciseDialogOpen} onOpenChange={setDeleteExerciseDialogOpen}>
          <AlertDialogContent className="bg-zinc-900 text-white border-zinc-800">
            <AlertDialogHeader>
              <AlertDialogTitle>Remove Exercise?</AlertDialogTitle>
              <AlertDialogDescription className="text-zinc-400">
                This exercise and all its sets will be removed from the routine.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="bg-zinc-800 text-white border-zinc-700">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={removeExercise}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Remove
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Discard Changes Dialog */}
        <AlertDialog open={discardDialogOpen} onOpenChange={setDiscardDialogOpen}>
          <AlertDialogContent className="bg-zinc-900 text-white border-zinc-800">
            <AlertDialogHeader>
              <AlertDialogTitle>Discard Changes?</AlertDialogTitle>
              <AlertDialogDescription className="text-zinc-400">
                You have unsaved changes. Are you sure you want to leave without saving?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="bg-zinc-800 text-white border-zinc-700">
                Keep Editing
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDiscard}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Discard
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DndProvider>
  );
}