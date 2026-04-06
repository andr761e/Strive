import { AlertCircle, Info, AlertTriangle, ArrowRight } from 'lucide-react';
import { suggestions } from '../data/mockData';

export function SuggestionsPage() {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Critical':
        return 'bg-red-500';
      case 'Important':
        return 'bg-orange-500';
      case 'Suggestion':
        return 'bg-blue-500';
      default:
        return 'bg-zinc-500';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'Critical':
        return <AlertCircle className="w-5 h-5" />;
      case 'Important':
        return <AlertTriangle className="w-5 h-5" />;
      case 'Suggestion':
        return <Info className="w-5 h-5" />;
      default:
        return <Info className="w-5 h-5" />;
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white pb-20">
      {/* Header */}
      <div className="px-4 pt-6 pb-4 border-b border-zinc-800">
        <h1 className="text-2xl mb-1">Training Insights</h1>
        <p className="text-zinc-400 text-sm">AI-powered training recommendations</p>
      </div>

      {/* Suggestions List */}
      <div className="px-4 py-4 space-y-3">
        {suggestions.map((suggestion) => (
          <div
            key={suggestion.id}
            className="bg-zinc-900 rounded-xl p-4 border border-zinc-800"
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-start gap-3 flex-1">
                <div className={`p-2 rounded-lg ${getPriorityColor(suggestion.priority)}`}>
                  {getPriorityIcon(suggestion.priority)}
                </div>
                <div className="flex-1">
                  <h3 className="text-white mb-1">{suggestion.title}</h3>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs px-2 py-0.5 rounded ${getPriorityColor(
                        suggestion.priority
                      )}`}
                    >
                      {suggestion.priority}
                    </span>
                    {suggestion.confidence && (
                      <span className="text-xs text-zinc-500">
                        {suggestion.confidence}% confidence
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            <p className="text-sm text-zinc-300 mb-4 leading-relaxed">
              {suggestion.description}
            </p>

            {/* Action Button */}
            {suggestion.actionLabel && (
              <button className="w-full bg-zinc-800 hover:bg-zinc-700 text-white py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors">
                <span>{suggestion.actionLabel}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Info Section */}
      <div className="px-4 py-4">
        <div className="bg-zinc-900 rounded-xl p-4 border border-zinc-800">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-white mb-2">How suggestions work</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Our AI analyzes your workout history, progression patterns, volume distribution,
                and recovery indicators to provide personalized training recommendations. Suggestions
                are ranked by priority and confidence level.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Suggestion Categories */}
      <div className="px-4 py-2 mb-6">
        <h2 className="text-lg mb-3">Insight Categories</h2>
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-zinc-900 rounded-lg p-3 border border-zinc-800">
            <div className="text-2xl text-blue-400 mb-1">2</div>
            <div className="text-sm text-zinc-400">Exercise Order</div>
          </div>
          <div className="bg-zinc-900 rounded-lg p-3 border border-zinc-800">
            <div className="text-2xl text-orange-400 mb-1">1</div>
            <div className="text-sm text-zinc-400">Volume Issues</div>
          </div>
          <div className="bg-zinc-900 rounded-lg p-3 border border-zinc-800">
            <div className="text-2xl text-red-400 mb-1">1</div>
            <div className="text-sm text-zinc-400">Plateaus</div>
          </div>
          <div className="bg-zinc-900 rounded-lg p-3 border border-zinc-800">
            <div className="text-2xl text-green-400 mb-1">1</div>
            <div className="text-sm text-zinc-400">Muscle Balance</div>
          </div>
        </div>
      </div>
    </div>
  );
}