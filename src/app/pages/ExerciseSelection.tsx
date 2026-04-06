import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { Search, Filter, ArrowLeft, Plus } from 'lucide-react';
import { exercises, type Exercise, type MuscleGroup } from '../data/mockData';
import { AnatomicalBodyDiagram } from '../components/AnatomicalBodyDiagram';

export function ExerciseSelectionPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const template = (location.state as any)?.template;

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMuscles, setSelectedMuscles] = useState<string[]>([]);
  const [filterMode, setFilterMode] = useState<'tags' | 'diagram'>('tags');
  const [selectedExercises, setSelectedExercises] = useState<Exercise[]>(
    template?.exercises || []
  );

  const muscleGroups: MuscleGroup[] = ['Chest', 'Back', 'Biceps', 'Triceps', 'Quads', 'Hamstrings', 'Delts'];

  const toggleMuscle = (muscle: string) => {
    setSelectedMuscles((prev) =>
      prev.includes(muscle) ? prev.filter((m) => m !== muscle) : [...prev, muscle]
    );
  };

  const filteredExercises = exercises.filter((ex) => {
    const matchesSearch = ex.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesMuscle =
      selectedMuscles.length === 0 ||
      ex.mainMuscles.some((m) => selectedMuscles.includes(m));
    return matchesSearch && matchesMuscle;
  });

  const addExercise = (exercise: Exercise) => {
    if (!selectedExercises.find((e) => e.id === exercise.id)) {
      setSelectedExercises([...selectedExercises, exercise]);
    }
  };

  const startWorkout = () => {
    if (selectedExercises.length > 0) {
      navigate('/active-workout', { state: { exercises: selectedExercises } });
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white pb-20">
      {/* Header */}
      <div className="sticky top-0 bg-zinc-950 border-b border-zinc-800 z-10">
        <div className="px-4 py-4 flex items-center gap-3">
          <button onClick={() => navigate('/')} className="text-zinc-400">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl flex-1">Select Exercises</h1>
          {selectedExercises.length > 0 && (
            <button
              onClick={startWorkout}
              className="bg-blue-600 px-4 py-2 rounded-lg text-sm"
            >
              Start ({selectedExercises.length})
            </button>
          )}
        </div>

        {/* Search Bar */}
        <div className="px-4 pb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
            <input
              type="text"
              placeholder="Search exercises..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-10 pr-4 py-3 text-white placeholder:text-zinc-500"
            />
          </div>
        </div>

        {/* Filter Mode Toggle */}
        <div className="px-4 pb-4 flex gap-2">
          <button
            onClick={() => setFilterMode('tags')}
            className={`flex-1 py-2 rounded-lg transition-colors ${
              filterMode === 'tags'
                ? 'bg-blue-600 text-white'
                : 'bg-zinc-900 text-zinc-400'
            }`}
          >
            Muscle Tags
          </button>
          <button
            onClick={() => setFilterMode('diagram')}
            className={`flex-1 py-2 rounded-lg transition-colors ${
              filterMode === 'diagram'
                ? 'bg-blue-600 text-white'
                : 'bg-zinc-900 text-zinc-400'
            }`}
          >
            Body Diagram
          </button>
        </div>
      </div>

      {/* Filter Section */}
      <div className="px-4 py-4 border-b border-zinc-800">
        {filterMode === 'tags' ? (
          <div className="flex flex-wrap gap-2">
            {muscleGroups.map((muscle) => (
              <button
                key={muscle}
                onClick={() => toggleMuscle(muscle)}
                className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                  selectedMuscles.includes(muscle)
                    ? 'bg-blue-600 text-white'
                    : 'bg-zinc-800 text-zinc-300'
                }`}
              >
                {muscle}
              </button>
            ))}
          </div>
        ) : (
          <AnatomicalBodyDiagram
            onMuscleSelect={toggleMuscle}
            selectedMuscles={selectedMuscles}
          />
        )}
      </div>

      {/* Exercise List */}
      <div className="px-4 py-4 space-y-2">
        {filteredExercises.map((exercise) => {
          const isSelected = selectedExercises.find((e) => e.id === exercise.id);
          return (
            <div
              key={exercise.id}
              className="bg-zinc-900 rounded-lg p-4 border border-zinc-800 flex items-start justify-between"
            >
              <div className="flex-1">
                <h3 className="text-white mb-1">{exercise.name}</h3>
                <div className="flex flex-wrap gap-2 mb-2">
                  {exercise.mainMuscles.map((muscle) => (
                    <span
                      key={muscle}
                      className="text-xs bg-zinc-800 text-blue-400 px-2 py-0.5 rounded"
                    >
                      {muscle}
                    </span>
                  ))}
                </div>
                {exercise.equipment && (
                  <div className="text-xs text-zinc-500">{exercise.equipment}</div>
                )}
              </div>
              <button
                onClick={() => addExercise(exercise)}
                disabled={!!isSelected}
                className={`ml-3 p-2 rounded-lg transition-colors ${
                  isSelected
                    ? 'bg-green-600 text-white'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}