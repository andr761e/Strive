import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { ArrowLeft, ChevronDown, ChevronUp, Plus, Save, Repeat } from 'lucide-react';
import { type Exercise, type ExerciseLog, type WorkoutSet, exercises, getPreviousWorkoutData } from '../data/mockData';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';

export function ActiveWorkoutPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const initialExercises = (location.state as any)?.exercises || [];

  const [workoutExercises, setWorkoutExercises] = useState<ExerciseLog[]>(
    initialExercises.map((ex: Exercise) => {
      const previousSets = getPreviousWorkoutData(ex.id);
      return {
        exerciseId: ex.id,
        exerciseName: ex.name,
        mainMuscles: ex.mainMuscles,
        sets: [],
        previousSets: previousSets,
      };
    })
  );

  const [expandedExercise, setExpandedExercise] = useState<string | null>(
    workoutExercises[0]?.exerciseId || null
  );
  const [alternativeDialogOpen, setAlternativeDialogOpen] = useState(false);
  const [selectedExerciseForAlternative, setSelectedExerciseForAlternative] = useState<string | null>(null);

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

  const finishWorkout = () => {
    // In a real app, this would save the workout
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white pb-20">
      {/* Header */}
      <div className="sticky top-0 bg-zinc-950 border-b border-zinc-800 z-10">
        <div className="px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/')} className="text-zinc-400">
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-xl">Active Workout</h1>
              <p className="text-xs text-zinc-400">Monday, April 6</p>
            </div>
          </div>
          <button
            onClick={finishWorkout}
            className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg text-sm flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            Finish
          </button>
        </div>
      </div>

      {/* Exercise List */}
      <div className="px-4 py-4 space-y-3">
        {workoutExercises.map((exercise) => {
          const isExpanded = expandedExercise === exercise.exerciseId;

          return (
            <div
              key={exercise.exerciseId}
              className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden"
            >
              {/* Exercise Header */}
              <div
                className="p-4 flex items-center justify-between cursor-pointer"
                onClick={() =>
                  setExpandedExercise(isExpanded ? null : exercise.exerciseId)
                }
              >
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
                      Last time: {exercise.previousSets.map(set => `${set.weight} kg × ${set.reps}`).join(', ')}
                    </p>
                  )}
                </div>
                {isExpanded ? (
                  <ChevronUp className="w-5 h-5 text-zinc-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-zinc-400" />
                )}
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
                          </tr>
                        </thead>
                        <tbody>
                          {exercise.sets.map((set, idx) => {
                            const prevSet = exercise.previousSets && exercise.previousSets[idx];
                            return (
                              <tr key={idx} className="border-b border-zinc-800">
                                <td className="py-3 px-2 text-zinc-400">{set.setNumber}</td>
                                <td className="py-3 px-2 text-center text-xs text-zinc-500">
                                  {prevSet ? `${prevSet.weight}×${prevSet.reps}` : '-'}
                                </td>
                                <td className="py-3 px-2">
                                  <input
                                    type="number"
                                    value={set.weight}
                                    onChange={(e) =>
                                      updateSet(
                                        exercise.exerciseId,
                                        idx,
                                        'weight',
                                        parseFloat(e.target.value) || 0
                                      )
                                    }
                                    className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-center text-white"
                                  />
                                </td>
                                <td className="py-3 px-2">
                                  <input
                                    type="number"
                                    value={set.reps}
                                    onChange={(e) =>
                                      updateSet(
                                        exercise.exerciseId,
                                        idx,
                                        'reps',
                                        parseInt(e.target.value) || 0
                                      )
                                    }
                                    className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-center text-white"
                                  />
                                </td>
                                <td className="py-3 px-2">
                                  <input
                                    type="number"
                                    value={set.rir || ''}
                                    placeholder="-"
                                    onChange={(e) =>
                                      updateSet(
                                        exercise.exerciseId,
                                        idx,
                                        'rir',
                                        parseInt(e.target.value) || 0
                                      )
                                    }
                                    className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-center text-white placeholder:text-zinc-600"
                                  />
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
                      onClick={() => addSet(exercise.exerciseId)}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      Add Set
                    </button>
                    <button
                      onClick={() => showAlternatives(exercise.exerciseId)}
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
        })}
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
    </div>
  );
}