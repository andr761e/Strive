import { useState } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, Plus, Edit2, Trash2 } from 'lucide-react';
import { workoutTemplates, type WorkoutTemplate } from '../data/mockData';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../components/ui/alert-dialog';

export function ManageRoutinesPage() {
  const navigate = useNavigate();
  const [routines, setRoutines] = useState<WorkoutTemplate[]>(workoutTemplates);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [routineToDelete, setRoutineToDelete] = useState<string | null>(null);

  const handleCreateNew = () => {
    navigate('/edit-routine', { state: { routine: null } });
  };

  const handleEdit = (routine: WorkoutTemplate) => {
    navigate('/edit-routine', { state: { routine } });
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
