import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { ArrowLeft, ChevronDown, ChevronUp, Plus, Save, Repeat, X, GripVertical, Check, Trash2, Clock, XCircle } from 'lucide-react';
import { type Exercise, type ExerciseLog, type WorkoutSet, exercises, getPreviousWorkoutData } from '../data/mockData';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../components/ui/alert-dialog';
import { useWorkout } from '../contexts/WorkoutContext';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

interface DraggableExerciseProps {
  exercise: ExerciseLog;
  index: number;
  moveExercise: (fromIndex: number, toIndex: number) => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onAddSet: () => void;
  onUpdateSet: (setIndex: number, field: 'weight' | 'reps' | 'rir', value: number) => void;
  onToggleSetCompletion: (setIndex: number) => void;
  onDeleteSet: (setIndex: number) => void;
  onShowAlternatives: () => void;
  onRemoveExercise: () => void;
}

function DraggableExercise({
  exercise,
  index,
  moveExercise,
  isExpanded,
  onToggleExpand,
  onAddSet,
  onUpdateSet,
  onToggleSetCompletion,
  onDeleteSet,
  onShowAlternatives,
  onRemoveExercise,
}: DraggableExerciseProps) {
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

  return (
    <div
      ref={(node) => preview(drop(node))}
      className={`bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden ${
        isDragging ? 'opacity-50' : ''
      }`}
    >
      {/* Exercise Header */}
      <div className="p-4 flex items-center gap-3">
        <div
          ref={drag}
          className="cursor-grab active:cursor-grabbing touch-none"
        >
          <GripVertical className="w-5 h-5 text-zinc-500" />
        </div>
        
        <div
          className="flex-1 cursor-pointer"
          onClick={onToggleExpand}
        >
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
              Last: {exercise.previousSets.map(set => `${set.weight}kg×${set.reps}`).join(', ')}
            </p>
          )}
        </div>

        <button
          onClick={onRemoveExercise}
          className="p-2 text-zinc-400 hover:text-red-400 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <button onClick={onToggleExpand} className="text-zinc-400">
          {isExpanded ? (
            <ChevronUp className="w-5 h-5" />
          ) : (
            <ChevronDown className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Exercise Details */}
      {isExpanded && (
        <div className="px-4 pb-4 border-t border-zinc-800">
          {/* Sets Table */}
          {exercise.sets.length > 0 && (
            <div className="mt-4 mb-3 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-zinc-400 border-b border-zinc-800">
                    <th className="text-left py-2 px-2 w-10">Set</th>
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
                      <tr key={idx} className={`border-b border-zinc-800 ${isCompleted ? 'bg-zinc-800/50' : ''}`}>
                        <td className="py-3 px-2 text-zinc-400">{set.setNumber}</td>
                        <td className="py-3 px-2 text-center text-xs text-zinc-500">
                          {prevSet ? `${prevSet.weight}×${prevSet.reps}` : '-'}
                        </td>
                        <td className="py-3 px-2">
                          <input
                            type="number"
                            value={set.weight}
                            disabled={isCompleted}
                            onChange={(e) =>
                              onUpdateSet(idx, 'weight', parseFloat(e.target.value) || 0)
                            }
                            className={`w-full border rounded px-2 py-1 text-center text-white ${
                              isCompleted
                                ? 'bg-zinc-800 border-zinc-700 cursor-not-allowed'
                                : 'bg-zinc-800 border-zinc-700'
                            }`}
                          />
                        </td>
                        <td className="py-3 px-2">
                          <input
                            type="number"
                            value={set.reps}
                            disabled={isCompleted}
                            onChange={(e) =>
                              onUpdateSet(idx, 'reps', parseInt(e.target.value) || 0)
                            }
                            className={`w-full border rounded px-2 py-1 text-center text-white ${
                              isCompleted
                                ? 'bg-zinc-800 border-zinc-700 cursor-not-allowed'
                                : 'bg-zinc-800 border-zinc-700'
                            }`}
                          />
                        </td>
                        <td className="py-3 px-2">
                          <input
                            type="number"
                            value={set.rir || ''}
                            placeholder="-"
                            disabled={isCompleted}
                            onChange={(e) =>
                              onUpdateSet(idx, 'rir', parseInt(e.target.value) || 0)
                            }
                            className={`w-full border rounded px-2 py-1 text-center text-white placeholder:text-zinc-600 ${
                              isCompleted
                                ? 'bg-zinc-800 border-zinc-700 cursor-not-allowed'
                                : 'bg-zinc-800 border-zinc-700'
                            }`}
                          />
                        </td>
                        <td className="py-3 px-2">
                          <button
                            onClick={() => onToggleSetCompletion(idx)}
                            className={`p-1 rounded transition-colors ${
                              isCompleted
                                ? 'bg-green-600 text-white'
                                : 'bg-zinc-700 text-zinc-400 hover:bg-zinc-600'
                            }`}
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        </td>
                        <td className="py-3 px-2">
                          <button
                            onClick={() => onDeleteSet(idx)}
                            className="p-1 text-zinc-400 hover:text-red-400 transition-colors"
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

          {/* Action Buttons */}
          <div className="flex gap-2 mt-4">
            <button
              onClick={onAddSet}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Set
            </button>
            <button
              onClick={onShowAlternatives}
              className="px-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 py-2.5 rounded-lg flex items-center gap-2 transition-colors"
            >
              <Repeat className="w-4 h-4" />
              Alternative
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ActiveWorkoutPageContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const { startWorkout, finishWorkout, discardWorkout, minimizeWorkout, workoutExercises: contextExercises, updateWorkoutExercises, elapsedSeconds } = useWorkout();
  
  const initialExercises = (location.state as any)?.exercises || [];
  const workoutName = (location.state as any)?.workoutName || 'Active Workout';

  const [workoutExercises, setWorkoutExercises] = useState<ExerciseLog[]>(() => {
    // If there are context exercises, use those (resuming workout)
    if (contextExercises.length > 0) {
      return contextExercises;
    }
    // Otherwise initialize from passed exercises (new workout)
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

  const [expandedExercise, setExpandedExercise] = useState<string | null>(
    workoutExercises[0]?.exerciseId || null
  );
  const [alternativeDialogOpen, setAlternativeDialogOpen] = useState(false);
  const [addExerciseDialogOpen, setAddExerciseDialogOpen] = useState(false);
  const [finishDialogOpen, setFinishDialogOpen] = useState(false);
  const [selectedExerciseForAlternative, setSelectedExerciseForAlternative] = useState<string | null>(null);
  const [exerciseSearchQuery, setExerciseSearchQuery] = useState('');

  // Initialize workout session
  useEffect(() => {
    if (contextExercises.length === 0 && initialExercises.length > 0) {
      // New workout
      const exerciseLogs = initialExercises.map((ex: Exercise) => {
        const previousSets = getPreviousWorkoutData(ex.id);
        return {
          exerciseId: ex.id,
          exerciseName: ex.name,
          mainMuscles: ex.mainMuscles,
          sets: [],
          previousSets: previousSets,
        };
      });
      startWorkout(workoutName, exerciseLogs);
    }
  }, []);

  // Sync with context whenever local state changes
  useEffect(() => {
    updateWorkoutExercises(workoutExercises);
  }, [workoutExercises]);

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
                },
              ],
            }
          : ex
      )
    );
  };

  const updateSet = (exerciseId: string, setIndex: number, field: 'weight' | 'reps' | 'rir', value: number) => {
    setWorkoutExercises((prev) =>
      prev.map((ex) =>
        ex.exerciseId === exerciseId
          ? {
              ...ex,
              sets: ex.sets.map((set, idx) =>
                idx === setIndex ? { ...set, [field]: value } : set
              ),
            }
          : ex
      )
    );
  };

  const toggleSetCompletion = (exerciseId: string, setIndex: number) => {
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

  const removeExercise = (exerciseId: string) => {
    setWorkoutExercises((prev) => prev.filter((ex) => ex.exerciseId !== exerciseId));
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

  const showAlternatives = (exerciseId: string) => {
    setSelectedExerciseForAlternative(exerciseId);
    setAlternativeDialogOpen(true);
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
      .slice(0, 4);
  };

  const filteredAddExercises = exercises.filter(
    (ex) =>
      !workoutExercises.find((we) => we.exerciseId === ex.id) &&
      ex.name.toLowerCase().includes(exerciseSearchQuery.toLowerCase())
  );

  const handleFinishWorkout = () => {
    finishWorkout();
    navigate('/');
  };

  const handleDiscardWorkout = () => {
    discardWorkout();
    navigate('/');
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
          <div className="flex gap-2">
            <button
              onClick={() => setFinishDialogOpen(true)}
              className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg text-sm flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              Finish
            </button>
          </div>
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
            isExpanded={expandedExercise === exercise.exerciseId}
            onToggleExpand={() =>
              setExpandedExercise(expandedExercise === exercise.exerciseId ? null : exercise.exerciseId)
            }
            onAddSet={() => addSet(exercise.exerciseId)}
            onUpdateSet={(setIndex, field, value) => updateSet(exercise.exerciseId, setIndex, field, value)}
            onToggleSetCompletion={(setIndex) => toggleSetCompletion(exercise.exerciseId, setIndex)}
            onDeleteSet={(setIndex) => deleteSet(exercise.exerciseId, setIndex)}
            onShowAlternatives={() => showAlternatives(exercise.exerciseId)}
            onRemoveExercise={() => removeExercise(exercise.exerciseId)}
          />
        ))}

        {/* Add Exercise Button */}
        <button
          onClick={() => setAddExerciseDialogOpen(true)}
          className="w-full bg-zinc-900 hover:bg-zinc-800 border-2 border-dashed border-zinc-700 rounded-xl py-4 flex items-center justify-center gap-2 text-zinc-400 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Exercise
        </button>
      </div>

      {/* Alternative Exercise Dialog */}
      <Dialog open={alternativeDialogOpen} onOpenChange={setAlternativeDialogOpen}>
        <DialogContent className="bg-zinc-900 text-white border-zinc-800 max-w-md">
          <DialogHeader>
            <DialogTitle>Suggest Alternative</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 mt-4">
            {selectedExerciseForAlternative &&
              getAlternativeExercises(selectedExerciseForAlternative).map((ex) => (
                <button
                  key={ex.id}
                  onClick={() => replaceExercise(ex.id)}
                  className="w-full bg-zinc-800 hover:bg-zinc-700 p-3 rounded-lg text-left transition-colors"
                >
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
                className="w-full bg-zinc-800 hover:bg-zinc-700 p-3 rounded-lg text-left transition-colors"
              >
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
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Finish Workout Confirmation */}
      <AlertDialog open={finishDialogOpen} onOpenChange={setFinishDialogOpen}>
        <AlertDialogContent className="bg-zinc-900 text-white border-zinc-800">
          <AlertDialogHeader>
            <AlertDialogTitle>Finish Workout?</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              Save this workout to your history. You can review your progress later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-zinc-800 text-white border-zinc-700">Cancel</AlertDialogCancel>
            <button
              onClick={handleDiscardWorkout}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-md transition-colors"
            >
              <div className="flex items-center gap-2">
                <XCircle className="w-4 h-4" />
                Discard
              </div>
            </button>
            <AlertDialogAction
              onClick={handleFinishWorkout}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <div className="flex items-center gap-2">
                <Save className="w-4 h-4" />
                Save Workout
              </div>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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
