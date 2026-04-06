import { useNavigate } from 'react-router';
import { ArrowLeft, Plus, Calendar, Dumbbell } from 'lucide-react';
import { workoutTemplates } from '../data/mockData';
import { format } from 'date-fns';

export function WorkoutTemplateSelectionPage() {
  const navigate = useNavigate();

  const selectTemplate = (templateId: string) => {
    const template = workoutTemplates.find(t => t.id === templateId);
    if (template) {
      navigate('/exercise-selection', { state: { template } });
    }
  };

  const createNewWorkout = () => {
    navigate('/exercise-selection');
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white pb-20">
      {/* Header */}
      <div className="sticky top-0 bg-zinc-950 border-b border-zinc-800 z-10">
        <div className="px-4 py-4 flex items-center gap-3">
          <button onClick={() => navigate('/')} className="text-zinc-400">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl flex-1">Start Workout</h1>
        </div>
      </div>

      {/* Quick Action - New Workout */}
      <div className="px-4 py-4">
        <button
          onClick={createNewWorkout}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl flex items-center justify-center gap-3 transition-colors"
        >
          <Plus className="w-6 h-6" />
          <span className="text-lg">Create New Workout</span>
        </button>
      </div>

      {/* Divider */}
      <div className="px-4 py-2">
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-zinc-800" />
          <span className="text-sm text-zinc-500">or choose a saved routine</span>
          <div className="flex-1 h-px bg-zinc-800" />
        </div>
      </div>

      {/* Saved Templates */}
      <div className="px-4 py-4 space-y-3">
        {workoutTemplates.map((template) => (
          <button
            key={template.id}
            onClick={() => selectTemplate(template.id)}
            className="w-full bg-zinc-900 hover:bg-zinc-800 rounded-xl p-4 border border-zinc-800 transition-colors text-left"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-zinc-800 rounded-lg">
                  <Dumbbell className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-white mb-1">{template.name}</h3>
                  <p className="text-sm text-zinc-400">
                    {template.exercises.length} exercises
                  </p>
                </div>
              </div>
            </div>

            {/* Exercise List Preview */}
            <div className="space-y-1 mb-3">
              {template.exercises.slice(0, 3).map((ex, idx) => (
                <div key={idx} className="text-sm text-zinc-400">
                  {idx + 1}. {ex.name}
                </div>
              ))}
              {template.exercises.length > 3 && (
                <div className="text-sm text-zinc-500">
                  +{template.exercises.length - 3} more
                </div>
              )}
            </div>

            {/* Last Performed */}
            {template.lastPerformed && (
              <div className="flex items-center gap-2 pt-3 border-t border-zinc-800">
                <Calendar className="w-4 h-4 text-zinc-500" />
                <span className="text-xs text-zinc-500">
                  Last performed: {format(template.lastPerformed, 'MMM d, yyyy')}
                </span>
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
