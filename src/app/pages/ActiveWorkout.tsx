import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { ChevronDown, ChevronUp, Plus, ArrowRight, X, GripVertical, Check, Trash2, Clock, Repeat, HelpCircle } from 'lucide-react';
import { type Exercise, type ExerciseLog, type WorkoutSet, type SetType, exercises, getPreviousWorkoutData } from '../data/mockData';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../components/ui/alert-dialog';
import { useWorkout } from '../contexts/WorkoutContext';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { ExerciseThumbnail } from '../components/ExerciseThumbnail';
import { BottomInputPanel } from '../components/BottomInputPanel';
import { SetTypeSelector } from '../components/SetTypeSelector';
import { InfoModal } from '../components/InfoModal';
import { useSettings } from '../contexts/SettingsContext';

interface InputState {
  exerciseId: string;
  setIndex: number;
  field: 'weight' | 'reps' | 'rir';
  value: number;
}

interface DraggableExerciseProps {
  exercise: ExerciseLog;
  index: number;
  moveExercise: (fromIndex: number, toIndex: number) => void;
  showExtras: boolean;
  onToggleExtras: () => void;
  onAddSet: () => void;
  onOpenInput: (setIndex: number, field: 'weight' | 'reps' | 'rir', value: number) => void;
  onToggleSetCompletion: (setIndex: number) => void;
  onDeleteSet: (setIndex: number) => void;
  onSetTypeChange: (setIndex: number, type: SetType) => void;
  onShowAlternatives: () => void;
  onShowHowToLog: () => void;
  onRemoveExercise: () => void;
}

function DraggableExercise({
  exercise,
  index,
  moveExercise,
  showExtras,
  onToggleExtras,
  onAddSet,
  onOpenInput,
  onToggleSetCompletion,
  onDeleteSet,
  onSetTypeChange,
  onShowAlternatives,
  onShowHowToLog,
  onRemoveExercise,
}: DraggableExerciseProps) {
  const { weightUnit } = useSettings();
  const [setTypeSelectorOpen, setSetTypeSelectorOpen] = useState(false);
  const [selectedSetIndex, setSelectedSetIndex] = useState<number | null>(null);

  const [{ isDragging }, drag, preview] = useDrag({
    type: 'exercise',
    item: { index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [, drop] = useDrop({
    accept: 'exercise',
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
          {exercise.previousSets && (
            <p className="text-xs text-zinc-500 mt-2">
              Last: {exercise.previousSets.slice(0, 3).map(set => `${set.weight}×${set.reps}`).join(', ')}
            </p>
          )}
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
                  <th className="text-center py-2 px-2 text-xs">Prev</th>
                  <th className="text-center py-2 px-2">Weight</th>
                  <th className="text-center py-2 px-2">Reps</th>
                  <th className="text-center py-2 px-2">RIR</th>
                  <th className="text-center py-2 px-2 w-10"></th>
                  <th className="text-center py-2 px-2 w-10"></th>
                </tr>
              </thead>
              <tbody>
                {exercise.sets.map((set, idx) => {
                  const prevSet = exercise.previousSets && exercise.previousSets[idx];
                  const isCompleted = set.completed;
                  return (
                    <tr key={idx} className={`border-b border-zinc-800 ${isCompleted ? 'bg-zinc-800/30' : ''}`}>
                      <td className="py-3 px-2">
                        <button
                          onClick={() => !isCompleted && handleSetTypeClick(idx)}
                          disabled={isCompleted}
                          className={`w-8 h-8 rounded flex items-center justify-center text-sm font-bold ${
                            isCompleted
                              ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                              : 'bg-zinc-800 text-white hover:bg-zinc-700 transition-colors'
                          }`}
                        >
                          {getSetTypeLabel(idx)}
                        </button>
                      </td>
                      <td className="py-3 px-2 text-center text-xs text-zinc-500">
                        {prevSet ? `${prevSet.weight}×${prevSet.reps}` : '-'}
                      </td>
                      <td className="py-3 px-2">
                        <button
                          onClick={() => !isCompleted && onOpenInput(idx, 'weight', set.weight)}
                          disabled={isCompleted}
                          className={`w-full px-3 py-2 rounded text-center ${
                            isCompleted
                              ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                              : 'bg-zinc-800 text-white hover:bg-zinc-700 transition-colors'
                          }`}
                        >
                          {set.weight}
                        </button>
                      </td>
                      <td className="py-3 px-2">
                        <button
                          onClick={() => !isCompleted && onOpenInput(idx, 'reps', set.reps)}
                          disabled={isCompleted}
                          className={`w-full px-3 py-2 rounded text-center ${
                            isCompleted
                              ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                              : 'bg-zinc-800 text-white hover:bg-zinc-700 transition-colors'
                          }`}
                        >
                          {set.reps}
                        </button>
                      </td>
                      <td className="py-3 px-2">
                        <button
                          onClick={() => !isCompleted && onOpenInput(idx, 'rir', set.rir || 0)}
                          disabled={isCompleted}
                          className={`w-full px-3 py-2 rounded text-center ${
                            isCompleted
                              ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                              : 'bg-zinc-800 text-white hover:bg-zinc-700 transition-colors'
                          }`}
                        >
                          {set.rir || '-'}
                        </button>
                      </td>
                      <td className="py-3 px-2">
                        <button
                          onClick={() => onToggleSetCompletion(idx)}
                          className={`p-1.5 rounded transition-colors ${
                            isCompleted
                              ? 'bg-green-600 text-white'
                              : 'bg-zinc-700 text-zinc-400 hover:bg-zinc-600'
                          }`}
                          title={isCompleted ? 'Mark as incomplete' : 'Mark as complete'}
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      </td>
                      <td className="py-3 px-2">
                        <button
                          onClick={() => onDeleteSet(idx)}
                          disabled={isCompleted}
                          className={`p-1.5 rounded transition-colors ${
                            isCompleted
                              ? 'text-zinc-600 cursor-not-allowed'
                              : 'text-zinc-400 hover:text-red-400'
                          }`}
                          title={isCompleted ? 'Unmark set to delete' : 'Delete set'}
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
              Hide Options
            </>
          ) : (
            <>
              <ChevronDown className="w-4 h-4" />
              Show Options
            </>
          )}
        </button>
      </div>

      {/* Extras Section (Collapsible) */}
      {showExtras && (
        <div className="px-4 pb-4 border-t border-zinc-800 pt-3 space-y-2">
          <button
            onClick={onShowAlternatives}
            className="w-full px-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors"
          >
            <Repeat className="w-4 h-4" />
            Suggest Alternative
          </button>
          <button
            onClick={onShowHowToLog}
            className="w-full px-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors"
          >
            <HelpCircle className="w-4 h-4" />
            How to Log
          </button>
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

function ActiveWorkoutPageContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const { weightIncrement } = useSettings();
  const { startWorkout, minimizeWorkout, workoutExercises: contextExercises, updateWorkoutExercises, elapsedSeconds } = useWorkout();
  
  const initialExercises = (location.state as any)?.exercises || [];
  const workoutName = (location.state as any)?.workoutName || 'Active Workout';
  const routineId = (location.state as any)?.routineId || null;
  const routineName = (location.state as any)?.routineName || null;

  const [workoutExercises, setWorkoutExercises] = useState<ExerciseLog[]>(() => {
    if (contextExercises.length > 0) {
      return contextExercises;
    }
    // If initialExercises already has ExerciseLog format (with sets), use it directly
    if (initialExercises.length > 0 && initialExercises[0].sets !== undefined) {
      return initialExercises;
    }
    // Otherwise, convert from Exercise format
    return initialExercises.map((ex: Exercise) => {
      const previousSets = getPreviousWorkoutData(ex.id);
      return {
        exerciseId: ex.id,
        exerciseName: ex.name,
        mainMuscles: ex.mainMuscles,
        sets: [],
        previousSets: previousSets,
      };
    });
  });

  const [expandedExtras, setExpandedExtras] = useState<Set<string>>(new Set());
  const [inputState, setInputState] = useState<InputState | null>(null);
  const [alternativeDialogOpen, setAlternativeDialogOpen] = useState(false);
  const [addExerciseDialogOpen, setAddExerciseDialogOpen] = useState(false);
  const [deleteExerciseDialogOpen, setDeleteExerciseDialogOpen] = useState(false);
  const [exerciseToDelete, setExerciseToDelete] = useState<string | null>(null);
  const [selectedExerciseForAlternative, setSelectedExerciseForAlternative] = useState<string | null>(null);
  const [exerciseSearchQuery, setExerciseSearchQuery] = useState('');
  const [infoModalOpen, setInfoModalOpen] = useState(false);
  const [infoModalMessage, setInfoModalMessage] = useState('');
  const [infoModalTitle, setInfoModalTitle] = useState('');
  const [selectedExerciseForHelp, setSelectedExerciseForHelp] = useState<string | null>(null);

  // Initialize workout session
  useEffect(() => {
    if (contextExercises.length === 0 && initialExercises.length > 0) {
      let exerciseLogs: ExerciseLog[];
      
      // If initialExercises already has ExerciseLog format, use it
      if (initialExercises[0].sets !== undefined) {
        exerciseLogs = initialExercises;
      } else {
        // Convert from Exercise format
        exerciseLogs = initialExercises.map((ex: Exercise) => {
          const previousSets = getPreviousWorkoutData(ex.id);
          return {
            exerciseId: ex.id,
            exerciseName: ex.name,
            mainMuscles: ex.mainMuscles,
            sets: [],
            previousSets: previousSets,
          };
        });
      }
      startWorkout(workoutName, exerciseLogs, routineId, routineName);
    }
  }, []);

  // Sync with context whenever local state changes
  useEffect(() => {
    updateWorkoutExercises(workoutExercises);
  }, [workoutExercises]);

  // Handle adding new exercises from selection page
  useEffect(() => {
    const addExercises = (location.state as any)?.addExercises;
    if (addExercises && addExercises.length > 0) {
      const newExerciseLogs = addExercises.map((ex: Exercise) => {
        const previousSets = getPreviousWorkoutData(ex.id);
        return {
          exerciseId: ex.id,
          exerciseName: ex.name,
          mainMuscles: ex.mainMuscles,
          sets: [],
          previousSets: previousSets,
        };
      });
      setWorkoutExercises((prev) => [...prev, ...newExerciseLogs]);
      
      // Clear the state so it doesn't add again on re-render
      navigate('/active-workout', { replace: true, state: {} });
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
    const newExercises = [...workoutExercises];
    const [movedExercise] = newExercises.splice(fromIndex, 1);
    newExercises.splice(toIndex, 0, movedExercise);
    setWorkoutExercises(newExercises);
  };

  const addSet = (exerciseId: string) => {
    setWorkoutExercises((prev) =>
      prev.map((ex) =>
        ex.exerciseId === exerciseId
          ? {
              ...ex,
              sets: [
                ...ex.sets,
                {
                  setNumber: ex.sets.length + 1,
                  weight: ex.sets.length > 0 ? ex.sets[ex.sets.length - 1].weight : 0,
                  reps: ex.sets.length > 0 ? ex.sets[ex.sets.length - 1].reps : 0,
                  completed: false,
                  type: 'normal',
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
    
    setWorkoutExercises((prev) =>
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

  const toggleSetCompletion = (exerciseId: string, setIndex: number) => {
    const exercise = workoutExercises.find(ex => ex.exerciseId === exerciseId);
    const set = exercise?.sets[setIndex];
    
    // If trying to mark as complete, validate weight and reps
    if (set && !set.completed) {
      if (set.weight === 0) {
        setInfoModalTitle('Invalid Weight');
        setInfoModalMessage('Weight cannot be 0');
        setInfoModalOpen(true);
        return;
      }
      if (set.reps === 0) {
        setInfoModalTitle('Invalid Reps');
        setInfoModalMessage('Reps cannot be 0');
        setInfoModalOpen(true);
        return;
      }
    }
    
    setWorkoutExercises((prev) =>
      prev.map((ex) =>
        ex.exerciseId === exerciseId
          ? {
              ...ex,
              sets: ex.sets.map((set, idx) =>
                idx === setIndex ? { ...set, completed: !set.completed } : set
              ),
            }
          : ex
      )
    );
  };

  const deleteSet = (exerciseId: string, setIndex: number) => {
    const exercise = workoutExercises.find(ex => ex.exerciseId === exerciseId);
    const set = exercise?.sets[setIndex];
    
    if (set?.completed) {
      return;
    }

    setWorkoutExercises((prev) =>
      prev.map((ex) =>
        ex.exerciseId === exerciseId
          ? {
              ...ex,
              sets: ex.sets.filter((_, idx) => idx !== setIndex).map((set, idx) => ({
                ...set,
                setNumber: idx + 1,
              })),
            }
          : ex
      )
    );
  };

  const setSetType = (exerciseId: string, setIndex: number, type: SetType) => {
    setWorkoutExercises((prev) =>
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
      setWorkoutExercises((prev) => prev.filter((ex) => ex.exerciseId !== exerciseToDelete));
      setExerciseToDelete(null);
      setDeleteExerciseDialogOpen(false);
    }
  };

  const addNewExercise = (exercise: Exercise) => {
    const previousSets = getPreviousWorkoutData(exercise.id);
    const newExerciseLog: ExerciseLog = {
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      mainMuscles: exercise.mainMuscles,
      sets: [],
      previousSets: previousSets,
    };
    setWorkoutExercises((prev) => [...prev, newExerciseLog]);
    setAddExerciseDialogOpen(false);
    setExerciseSearchQuery('');
  };

  const handleAddExerciseClick = () => {
    // Navigate to exercise selection with a flag to return to active workout
    navigate('/exercise-selection', { 
      state: { 
        fromActiveWorkout: true,
        currentExercises: workoutExercises.map(ex => ex.exerciseId)
      } 
    });
  };

  const showAlternatives = (exerciseId: string) => {
    setSelectedExerciseForAlternative(exerciseId);
    setAlternativeDialogOpen(true);
  };

  const showHowToLog = (exerciseId: string) => {
    const exerciseData = exercises.find(ex => ex.id === exerciseId);
    if (exerciseData && exerciseData.loggingGuidance) {
      setInfoModalTitle('How to Log');
      setInfoModalMessage(exerciseData.loggingGuidance);
      setInfoModalOpen(true);
    }
  };

  const replaceExercise = (newExerciseId: string) => {
    const oldExercise = workoutExercises.find((ex) => ex.exerciseId === selectedExerciseForAlternative);
    const newExercise = exercises.find((ex) => ex.id === newExerciseId);
    
    if (oldExercise && newExercise) {
      setWorkoutExercises((prev) =>
        prev.map((ex) =>
          ex.exerciseId === selectedExerciseForAlternative
            ? {
                exerciseId: newExercise.id,
                exerciseName: newExercise.name,
                mainMuscles: newExercise.mainMuscles,
                sets: [],
                previousSets: getPreviousWorkoutData(newExercise.id),
              }
            : ex
        )
      );
    }
    setAlternativeDialogOpen(false);
  };

  const getAlternativeExercises = (exerciseId: string) => {
    const exercise = workoutExercises.find((ex) => ex.exerciseId === exerciseId);
    if (!exercise) return [];

    return exercises
      .filter(
        (ex) =>
          ex.id !== exerciseId &&
          ex.mainMuscles.some((m) => exercise.mainMuscles.includes(m))
      )
      .slice(0, 6);
  };

  const filteredAddExercises = exercises.filter(
    (ex) =>
      !workoutExercises.find((we) => we.exerciseId === ex.id) &&
      ex.name.toLowerCase().includes(exerciseSearchQuery.toLowerCase())
  );

  const handleFinishClick = () => {
    navigate('/finish-workout');
  };

  const handleMinimize = () => {
    minimizeWorkout();
    navigate('/');
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white pb-20">
      {/* Header */}
      <div className="sticky top-0 bg-zinc-950 border-b border-zinc-800 z-10">
        <div className="px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            <button onClick={handleMinimize} className="text-zinc-400">
              <ChevronDown className="w-6 h-6" />
            </button>
            <div className="flex-1">
              <h1 className="text-xl">{workoutName}</h1>
              <div className="flex items-center gap-2 text-xs text-zinc-400">
                <Clock className="w-3 h-3" />
                <span className="font-mono">{formatTime(elapsedSeconds)}</span>
              </div>
            </div>
          </div>
          <button
            onClick={handleFinishClick}
            className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
          >
            <ArrowRight className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      {/* Exercise List */}
      <div className="px-4 py-4 space-y-3">
        {workoutExercises.map((exercise, index) => (
          <DraggableExercise
            key={exercise.exerciseId}
            exercise={exercise}
            index={index}
            moveExercise={moveExercise}
            showExtras={expandedExtras.has(exercise.exerciseId)}
            onToggleExtras={() => toggleExtras(exercise.exerciseId)}
            onAddSet={() => addSet(exercise.exerciseId)}
            onOpenInput={(setIndex, field, value) => openInput(exercise.exerciseId, setIndex, field, value)}
            onToggleSetCompletion={(setIndex) => toggleSetCompletion(exercise.exerciseId, setIndex)}
            onDeleteSet={(setIndex) => deleteSet(exercise.exerciseId, setIndex)}
            onSetTypeChange={(setIndex, type) => setSetType(exercise.exerciseId, setIndex, type)}
            onShowAlternatives={() => showAlternatives(exercise.exerciseId)}
            onShowHowToLog={() => showHowToLog(exercise.exerciseId)}
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

      {/* Alternative Exercise Dialog */}
      <Dialog open={alternativeDialogOpen} onOpenChange={setAlternativeDialogOpen}>
        <DialogContent className="bg-zinc-900 text-white border-zinc-800 max-w-md">
          <DialogHeader>
            <DialogTitle>Suggest Alternative</DialogTitle>
            <DialogDescription>
              Select a replacement exercise targeting similar muscles
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 mt-4 max-h-96 overflow-y-auto">
            {selectedExerciseForAlternative &&
              getAlternativeExercises(selectedExerciseForAlternative).map((ex) => (
                <button
                  key={ex.id}
                  onClick={() => replaceExercise(ex.id)}
                  className="w-full bg-zinc-800 hover:bg-zinc-700 p-3 rounded-lg text-left transition-colors flex items-center gap-3"
                >
                  <ExerciseThumbnail exercise={ex} size="sm" />
                  <div className="flex-1">
                    <div className="text-white mb-1">{ex.name}</div>
                    <div className="flex gap-2">
                      {ex.mainMuscles.map((muscle) => (
                        <span
                          key={muscle}
                          className="text-xs bg-zinc-900 text-blue-400 px-2 py-0.5 rounded"
                        >
                          {muscle}
                        </span>
                      ))}
                    </div>
                  </div>
                </button>
              ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Exercise Dialog */}
      <Dialog open={addExerciseDialogOpen} onOpenChange={setAddExerciseDialogOpen}>
        <DialogContent className="bg-zinc-900 text-white border-zinc-800 max-w-md max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Add Exercise</DialogTitle>
            <DialogDescription>
              Search and add exercises to your current workout
            </DialogDescription>
          </DialogHeader>
          <input
            type="text"
            placeholder="Search exercises..."
            value={exerciseSearchQuery}
            onChange={(e) => setExerciseSearchQuery(e.target.value)}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white placeholder:text-zinc-500 mb-3"
          />
          <div className="space-y-2 overflow-y-auto flex-1">
            {filteredAddExercises.map((ex) => (
              <button
                key={ex.id}
                onClick={() => addNewExercise(ex)}
                className="w-full bg-zinc-800 hover:bg-zinc-700 p-3 rounded-lg text-left transition-colors flex items-center gap-3"
              >
                <ExerciseThumbnail exercise={ex} size="sm" />
                <div className="flex-1">
                  <div className="text-white mb-1">{ex.name}</div>
                  <div className="flex gap-2">
                    {ex.mainMuscles.map((muscle) => (
                      <span
                        key={muscle}
                        className="text-xs bg-zinc-900 text-blue-400 px-2 py-0.5 rounded"
                      >
                        {muscle}
                      </span>
                    ))}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Exercise Confirmation */}
      <AlertDialog open={deleteExerciseDialogOpen} onOpenChange={setDeleteExerciseDialogOpen}>
        <AlertDialogContent className="bg-zinc-900 text-white border-zinc-800">
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Exercise?</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              This will remove the exercise and all its logged sets from this workout. This action cannot be undone.
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

      {/* Info Modal */}
      <InfoModal
        isOpen={infoModalOpen}
        onClose={() => setInfoModalOpen(false)}
        title={infoModalTitle}
        message={infoModalMessage}
      />
    </div>
  );
}

export function ActiveWorkoutPage() {
  return (
    <DndProvider backend={HTML5Backend}>
      <ActiveWorkoutPageContent />
    </DndProvider>
  );
}