import { useState } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, Plus, Edit2, Trash2 } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../components/ui/alert-dialog';
import { useAuth } from '../contexts/AuthContext';
import { DataService, type WorkoutRoutine } from '../services/db';

export function ManageRoutinesPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [routines, setRoutines] = useState<WorkoutRoutine[]>(() => (user ? DataService.getRoutinesByUserId(user.id) : []));
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [routineToDelete, setRoutineToDelete] = useState<string | null>(null);

  const handleCreateNew = () => {
    navigate('/edit-routine', { state: { routine: null, returnTo: '/manage-routines' } });
  };

  const handleEdit = (routine: WorkoutRoutine) => {
    navigate('/edit-routine', { state: { routine, returnTo: '/manage-routines' } });
  };

  const handleDeleteConfirm = (routineId: string) => {
    setRoutineToDelete(routineId);
    setDeleteDialogOpen(true);
  };

  const handleDelete = () => {
    if (routineToDelete && user) {
      DataService.deleteRoutine(user.id, routineToDelete);
      setRoutines(DataService.getRoutinesByUserId(user.id));
      setRoutineToDelete(null);
      setDeleteDialogOpen(false);
    }
  };

  return (
    <div className="screen-shell">
      {/* Header */}
      <div className="sticky-header">
        <div className="px-4 py-4 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="premium-button premium-button-secondary w-11 h-11 flex items-center justify-center">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-semibold flex-1">Manage Routines</h1>
          <button
            onClick={handleCreateNew}
            className="premium-button premium-button-primary w-11 h-11 flex items-center justify-center"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Routines List */}
      <div className="px-4 py-4 space-y-3">
        {routines.length === 0 ? (
          <div className="empty-state p-8 text-center">
            <p className="text-sm font-medium text-white mb-1">No routines yet</p>
            <p className="text-sm text-zinc-400 mb-5">Build a reusable workout template for faster sessions.</p>
            <button
              onClick={handleCreateNew}
              className="premium-button premium-button-primary px-6 text-sm font-medium"
            >
              Create Your First Routine
            </button>
          </div>
        ) : (
          routines.map((routine) => (
            <div
              key={routine.id}
              className="premium-card p-4"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="text-white font-medium mb-1">{routine.name}</h3>
                  <p className="text-sm text-zinc-400">
                    {routine.exercises.length} exercises
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(routine)}
                    className="premium-button premium-button-secondary w-10 h-10 flex items-center justify-center"
                  >
                    <Edit2 className="w-4 h-4 text-blue-400" />
                  </button>
                  <button
                    onClick={() => handleDeleteConfirm(routine.id)}
                    className="premium-button premium-button-danger w-10 h-10 flex items-center justify-center"
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
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Routine?</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              This action cannot be undone. The routine will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="premium-button premium-button-secondary border-white/10 text-white">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="premium-button premium-button-danger"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
