import { useState } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, Plus, Edit2, Trash2, GripVertical, X } from 'lucide-react';
import { workoutTemplates, exercises, type Exercise, type WorkoutTemplate } from '../data/mockData';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../components/ui/alert-dialog';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

interface DraggableRoutineExerciseProps {
  exercise: Exercise;
  index: number;
  moveExercise: (fromIndex: number, toIndex: number) => void;
  onRemove: () => void;
}

function DraggableRoutineExercise({ exercise, index, moveExercise, onRemove }: DraggableRoutineExerciseProps) {
  const [{ isDragging }, drag, preview] = useDrag({
    type: 'routine-exercise',
    item: { index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [, drop] = useDrop({
    accept: 'routine-exercise',
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
      className={`bg-zinc-800 rounded-lg p-3 flex items-center gap-3 ${
        isDragging ? 'opacity-50' : ''
      }`}
    >
      <div
        ref={drag}
        className="cursor-grab active:cursor-grabbing touch-none"
      >
        <GripVertical className="w-5 h-5 text-zinc-500" />
      </div>
      <div className="flex-1">
        <div className="text-white text-sm">{exercise.name}</div>
        <div className="flex gap-1 mt-1">
          {exercise.mainMuscles.map((muscle) => (
            <span
              key={muscle}
              className="text-xs bg-zinc-900 text-blue-400 px-1.5 py-0.5 rounded"
            >
              {muscle}
            </span>
          ))}
        </div>
      </div>
      <button
        onClick={onRemove}
        className="p-1 text-zinc-400 hover:text-red-400 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

function EditRoutineDialog({
  open,
  onOpenChange,
  routine,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  routine: WorkoutTemplate | null;
  onSave: (name: string, exercises: Exercise[]) => void;
}) {
  const [name, setName] = useState(routine?.name || '');
  const [selectedExercises, setSelectedExercises] = useState<Exercise[]>(routine?.exercises || []);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredExercises = exercises.filter(
    (ex) =>
      !selectedExercises.find((se) => se.id === ex.id) &&
      ex.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const moveExercise = (fromIndex: number, toIndex: number) => {
    const newExercises = [...selectedExercises];
    const [movedExercise] = newExercises.splice(fromIndex, 1);
    newExercises.splice(toIndex, 0, movedExercise);
    setSelectedExercises(newExercises);
  };

  const addExercise = (exercise: Exercise) => {
    setSelectedExercises([...selectedExercises, exercise]);
    setSearchQuery('');
  };

  const removeExercise = (index: number) => {
    setSelectedExercises(selectedExercises.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    if (name.trim() && selectedExercises.length > 0) {
      onSave(name.trim(), selectedExercises);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-900 text-white border-zinc-800 max-w-md max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{routine ? 'Edit Routine' : 'Create Routine'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 overflow-y-auto flex-1">
          {/* Routine Name */}
          <div>
            <label className="text-sm text-zinc-400 mb-2 block">Routine Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Push Day A"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white placeholder:text-zinc-500"
            />
          </div>

          {/* Selected Exercises */}
          <div>
            <label className="text-sm text-zinc-400 mb-2 block">Exercises ({selectedExercises.length})</label>
            <DndProvider backend={HTML5Backend}>
              <div className="space-y-2">
                {selectedExercises.map((exercise, index) => (
                  <DraggableRoutineExercise
                    key={exercise.id}
                    exercise={exercise}
                    index={index}
                    moveExercise={moveExercise}
                    onRemove={() => removeExercise(index)}
                  />
                ))}
              </div>
            </DndProvider>
          </div>

          {/* Add Exercise */}
          <div>
            <label className="text-sm text-zinc-400 mb-2 block">Add Exercise</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search exercises..."
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white placeholder:text-zinc-500 mb-2"
            />
            {searchQuery && (
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {filteredExercises.slice(0, 10).map((exercise) => (
                  <button
                    key={exercise.id}
                    onClick={() => addExercise(exercise)}
                    className="w-full bg-zinc-800 hover:bg-zinc-700 p-2 rounded text-left transition-colors"
                  >
                    <div className="text-white text-sm">{exercise.name}</div>
                    <div className="flex gap-1 mt-1">
                      {exercise.mainMuscles.map((muscle) => (
                        <span
                          key={muscle}
                          className="text-xs bg-zinc-900 text-blue-400 px-1.5 py-0.5 rounded"
                        >
                          {muscle}
                        </span>
                      ))}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-4 border-t border-zinc-800">
          <button
            onClick={() => onOpenChange(false)}
            className="flex-1 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!name.trim() || selectedExercises.length === 0}
            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Save
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function ManageRoutinesPage() {
  const navigate = useNavigate();
  const [routines, setRoutines] = useState<WorkoutTemplate[]>(workoutTemplates);
  const [editingRoutine, setEditingRoutine] = useState<WorkoutTemplate | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [routineToDelete, setRoutineToDelete] = useState<string | null>(null);

  const handleCreateNew = () => {
    setEditingRoutine(null);
    setEditDialogOpen(true);
  };

  const handleEdit = (routine: WorkoutTemplate) => {
    setEditingRoutine(routine);
    setEditDialogOpen(true);
  };

  const handleSave = (name: string, exercises: Exercise[]) => {
    if (editingRoutine) {
      // Update existing routine
      setRoutines(
        routines.map((r) =>
          r.id === editingRoutine.id ? { ...r, name, exercises } : r
        )
      );
    } else {
      // Create new routine
      const newRoutine: WorkoutTemplate = {
        id: `template${routines.length + 1}`,
        name,
        exercises,
      };
      setRoutines([...routines, newRoutine]);
    }
  };

  const handleDeleteConfirm = (routineId: string) => {
    setRoutineToDelete(routineId);
    setDeleteDialogOpen(true);
  };

  const handleDelete = () => {
    if (routineToDelete) {
      setRoutines(routines.filter((r) => r.id !== routineToDelete));
      setRoutineToDelete(null);
      setDeleteDialogOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white pb-20">
      {/* Header */}
      <div className="sticky top-0 bg-zinc-950 border-b border-zinc-800 z-10">
        <div className="px-4 py-4 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-zinc-400">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl flex-1">Manage Routines</h1>
          <button
            onClick={handleCreateNew}
            className="p-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Routines List */}
      <div className="px-4 py-4 space-y-3">
        {routines.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-zinc-400 mb-4">No routines yet</p>
            <button
              onClick={handleCreateNew}
              className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg transition-colors"
            >
              Create Your First Routine
            </button>
          </div>
        ) : (
          routines.map((routine) => (
            <div
              key={routine.id}
              className="bg-zinc-900 rounded-xl p-4 border border-zinc-800"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="text-white mb-1">{routine.name}</h3>
                  <p className="text-sm text-zinc-400">
                    {routine.exercises.length} exercises
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(routine)}
                    className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-4 h-4 text-blue-400" />
                  </button>
                  <button
                    onClick={() => handleDeleteConfirm(routine.id)}
                    className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </button>
                </div>
              </div>

              {/* Exercise List */}
              <div className="space-y-1">
                {routine.exercises.map((ex, idx) => (
                  <div key={idx} className="text-sm text-zinc-400">
                    {idx + 1}. {ex.name}
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Edit/Create Dialog */}
      <EditRoutineDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        routine={editingRoutine}
        onSave={handleSave}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-zinc-900 text-white border-zinc-800">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Routine?</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              This action cannot be undone. The routine will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-zinc-800 text-white border-zinc-700">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
