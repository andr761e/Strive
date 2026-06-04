import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Brain,
  CalendarClock,
  CheckCircle2,
  Dumbbell,
  Gauge,
  Info,
  Loader2,
  MoveUp,
  RefreshCw,
  Sparkles,
  Target,
  TrendingUp,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { DataService } from '../services/db';
import { ExerciseThumbnail } from '../components/ExerciseThumbnail';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { exercises, type Exercise } from '../data/mockData';
import { generateInsights, type InsightAnalysisResult, type InsightPriority, type InsightType, type TrainingInsight } from '../../lib/insights';
import { getExerciseMetadataByName } from '../../lib/insights/exerciseMetadata';

function priorityLabel(priority: InsightPriority) {
  return priority.slice(0, 1).toUpperCase() + priority.slice(1);
}

function getPriorityStyles(priority: InsightPriority) {
  switch (priority) {
    case 'critical':
      return {
        iconWrap: 'bg-red-500/15 text-red-300',
        badge: 'bg-red-500/15 text-red-300 border-red-500/30',
      };
    case 'important':
      return {
        iconWrap: 'bg-orange-500/15 text-orange-300',
        badge: 'bg-orange-500/15 text-orange-300 border-orange-500/30',
      };
    case 'positive':
      return {
        iconWrap: 'bg-green-500/15 text-green-300',
        badge: 'bg-green-500/15 text-green-300 border-green-500/30',
      };
    default:
      return {
        iconWrap: 'bg-blue-500/15 text-blue-300',
        badge: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
      };
  }
}

function getInsightIcon(type: InsightType, priority: InsightPriority) {
  if (priority === 'critical') return AlertCircle;
  if (priority === 'important') return AlertTriangle;

  switch (type) {
    case 'progression':
    case 'exercise_roi':
      return TrendingUp;
    case 'exercise_order':
      return MoveUp;
    case 'exercise_rotation':
      return RefreshCw;
    case 'progression_recommendation':
    case 'pr_opportunity':
      return Target;
    case 'routine_adjustment':
    case 'movement_gap':
    case 'push_pull_balance':
      return Dumbbell;
    case 'recovery_fatigue':
    case 'rir_warning':
      return Gauge;
    case 'consistency':
      return CalendarClock;
    case 'session_quality':
      return Activity;
    case 'warmup_readiness':
      return Sparkles;
    case 'undertrained_muscle':
    case 'high_volume':
      return AlertTriangle;
    default:
      return Info;
  }
}

interface AlternativeOption {
  name: string;
  exercise?: Exercise;
}

function findExerciseByName(name: string) {
  const normalizedName = name.toLowerCase();
  return exercises.find((exercise) => exercise.name.toLowerCase() === normalizedName);
}

function getAlternativeOptions(insight: TrainingInsight | null): AlternativeOption[] {
  const relatedExercise = insight?.relatedExercise;
  if (!relatedExercise) return [];

  const sourceExercise = findExerciseByName(relatedExercise);
  const metadata = getExerciseMetadataByName(relatedExercise);
  const suggestedNames = metadata?.substitutions ?? [];
  const similarMuscleOptions = sourceExercise
    ? exercises
        .filter(
          (exercise) =>
            exercise.id !== sourceExercise.id &&
            exercise.mainMuscles.some((muscle) => sourceExercise.mainMuscles.includes(muscle)),
        )
        .map((exercise) => exercise.name)
    : [];
  const uniqueNames = Array.from(new Set([...suggestedNames, ...similarMuscleOptions]));

  return uniqueNames
    .filter((name) => name.toLowerCase() !== relatedExercise.toLowerCase())
    .slice(0, 6)
    .map((name) => ({ name, exercise: findExerciseByName(name) }));
}

function InsightCard({
  insight,
  onAction,
}: {
  insight: TrainingInsight;
  onAction: (insight: TrainingInsight) => void;
}) {
  const styles = getPriorityStyles(insight.priority);
  const Icon = getInsightIcon(insight.type, insight.priority);

  return (
    <div className="premium-card p-4">
      <div className="flex items-start gap-3 mb-3">
        <div className={`p-2 rounded-lg ${styles.iconWrap}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-white mb-2 leading-snug">{insight.title}</h3>
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-xs px-2 py-0.5 rounded-full border ${styles.badge}`}>{priorityLabel(insight.priority)}</span>
            <span className="text-xs text-zinc-500">{insight.confidence}% confidence</span>
          </div>
        </div>
      </div>

      <p className="text-sm text-zinc-300 leading-relaxed mb-4">{insight.message}</p>

      {(insight.relatedExercise || insight.relatedMuscleGroup || insight.relatedRoutineName) && (
        <div className="flex gap-2 flex-wrap mb-4">
          {insight.relatedExercise && (
            <span className="premium-badge text-xs px-2 py-1 text-blue-300">{insight.relatedExercise}</span>
          )}
          {insight.relatedMuscleGroup && (
            <span className="premium-badge text-xs px-2 py-1 text-zinc-300">{insight.relatedMuscleGroup}</span>
          )}
          {insight.relatedRoutineName && (
            <span className="premium-badge text-xs px-2 py-1 text-emerald-300">{insight.relatedRoutineName}</span>
          )}
        </div>
      )}

      {insight.actionLabel && (
        <button
          type="button"
          onClick={() => onAction(insight)}
          className="premium-button premium-button-secondary w-full py-2.5 flex items-center justify-center gap-2"
        >
          <span>{insight.actionLabel}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

export function SuggestionsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const workouts = useMemo(() => (user ? DataService.getWorkoutsByUserId(user.id) : []), [user]);
  const routines = useMemo(() => (user ? DataService.getRoutinesByUserId(user.id) : []), [user]);
  const [analysis, setAnalysis] = useState<InsightAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(true);
  const [alternativeInsight, setAlternativeInsight] = useState<TrainingInsight | null>(null);

  useEffect(() => {
    if (!user) return;

    setIsAnalyzing(true);
    const timer = window.setTimeout(() => {
      setAnalysis(generateInsights({ userId: user.id, workouts, routines }));
      setIsAnalyzing(false);
    }, 200);

    return () => window.clearTimeout(timer);
  }, [user, workouts, routines]);

  const categoryCounts = useMemo(() => {
    const insights = analysis?.insights ?? [];
    return {
      critical: insights.filter((insight) => insight.priority === 'critical').length,
      important: insights.filter((insight) => insight.priority === 'important').length,
      suggestion: insights.filter((insight) => insight.priority === 'suggestion').length,
      positive: insights.filter((insight) => insight.priority === 'positive').length,
    };
  }, [analysis]);
  const emptyStateCopy = analysis?.stats.hasEnoughData
    ? {
        title: 'No major training flags right now',
        message:
          'Strive did not find a clear plateau, volume imbalance, or exercise order issue. Keep logging workouts so the signal stays fresh.',
      }
    : {
        title: 'Not enough training data yet',
        message:
          'Log a few more workouts with repeated exercises and Strive will start generating personalized insights.',
      };
  const alternativeOptions = useMemo(() => getAlternativeOptions(alternativeInsight), [alternativeInsight]);

  const handleInsightAction = (insight: TrainingInsight) => {
    if (user && (insight.relatedRoutineId || insight.routineSuggestion)) {
      const routine = insight.relatedRoutineId ? DataService.getRoutineById(user.id, insight.relatedRoutineId) : null;
      if (routine) {
        navigate('/edit-routine', {
          state: {
            routine,
            routineSuggestion: insight.routineSuggestion,
            insightTitle: insight.title,
            returnTo: '/insights',
          },
        });
        return;
      }

      navigate('/manage-routines');
      return;
    }

    if (insight.type === 'exercise_rotation') {
      setAlternativeInsight(insight);
      return;
    }

    if (insight.type === 'exercise_order') {
      navigate('/manage-routines');
      return;
    }

    if ((insight.type === 'high_volume' || insight.type === 'undertrained_muscle') && insight.relatedMuscleGroup) {
      navigate('/progress', { state: { focusMuscleGroup: insight.relatedMuscleGroup } });
      return;
    }

    if (insight.relatedExercise) {
      navigate('/progress', { state: { focusExerciseName: insight.relatedExercise } });
      return;
    }

    if (insight.relatedMuscleGroup) {
      navigate('/progress', { state: { focusMuscleGroup: insight.relatedMuscleGroup } });
      return;
    }

    navigate('/progress');
  };

  const openExerciseLibrary = (searchQuery?: string) => {
    setAlternativeInsight(null);
    navigate('/exercise-selection', { state: { searchQuery: searchQuery ?? alternativeInsight?.relatedExercise ?? '' } });
  };

  if (!user) return null;

  return (
    <div className="screen-shell">
      <div className="screen-header">
        <h1 className="text-3xl font-semibold leading-tight mb-1">Insights</h1>
        <p className="text-zinc-400 text-sm">Rule-based training feedback from your logged workouts.</p>
      </div>

      {isAnalyzing && (
        <div className="px-4 py-12 flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-xl bg-blue-500/15 flex items-center justify-center mb-4">
            <Loader2 className="w-7 h-7 text-blue-400 animate-spin" />
          </div>
          <h2 className="text-xl mb-2">Analyzing training data</h2>
          <p className="text-sm text-zinc-400 max-w-xs">
            Strive is checking performance trends, muscle volume, plateaus, and exercise order effects.
          </p>
        </div>
      )}

      {!isAnalyzing && analysis && (
        <>
          <div className="px-4 py-5">
            <div className="premium-card p-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-500/15 rounded-lg">
                  <Brain className="w-6 h-6 text-blue-400" />
                </div>
                <div className="flex-1">
                  <h2 className="text-lg mb-1">Analysis Summary</h2>
                  <p className="text-sm text-zinc-400 leading-relaxed">
                    {analysis.stats.workoutsAnalyzed} workouts, {analysis.stats.exercisesAnalyzed} exercises, and{' '}
                    {analysis.stats.musclesAnalyzed} muscle groups analyzed.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {analysis.insights.length > 0 ? (
            <>
              <div className="px-4 pb-2 grid grid-cols-4 gap-2">
                <div className="premium-card-muted p-3">
                  <div className="stat-number text-xl text-red-400">{categoryCounts.critical}</div>
                  <div className="text-xs text-zinc-500">Critical</div>
                </div>
                <div className="premium-card-muted p-3">
                  <div className="stat-number text-xl text-orange-400">{categoryCounts.important}</div>
                  <div className="text-xs text-zinc-500">Important</div>
                </div>
                <div className="premium-card-muted p-3">
                  <div className="stat-number text-xl text-blue-400">{categoryCounts.suggestion}</div>
                  <div className="text-xs text-zinc-500">Ideas</div>
                </div>
                <div className="premium-card-muted p-3">
                  <div className="stat-number text-xl text-green-400">{categoryCounts.positive}</div>
                  <div className="text-xs text-zinc-500">Good</div>
                </div>
              </div>

              <div className="px-4 py-4 space-y-3">
                {analysis.insights.map((insight) => (
                  <InsightCard key={insight.id} insight={insight} onAction={handleInsightAction} />
                ))}
              </div>
            </>
          ) : (
            <div className="px-4 py-10">
              <div className="empty-state p-6 text-center">
                <div className="w-14 h-14 rounded-xl bg-zinc-800 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-7 h-7 text-zinc-400" />
                </div>
                <h2 className="text-xl mb-2">{emptyStateCopy.title}</h2>
                <p className="text-sm text-zinc-400 leading-relaxed">{emptyStateCopy.message}</p>
              </div>
            </div>
          )}

          <div className="px-4 py-2 mb-6">
            <div className="premium-card p-4">
              <div className="flex items-center gap-3 mb-3">
                <Info className="w-5 h-5 text-blue-400" />
                <h2 className="text-lg">How Strive Thinks</h2>
              </div>
          <p className="text-sm text-zinc-400 leading-relaxed">
                The model compares rolling exercise performance, weighted weekly muscle sets, routine structure, set effort,
                movement-pattern coverage, and early versus late exercise placement. It favors practical suggestions over
                certainty when data is limited.
              </p>
            </div>
          </div>
        </>
      )}

      <Dialog open={Boolean(alternativeInsight)} onOpenChange={(open) => !open && setAlternativeInsight(null)}>
        <DialogContent className="max-w-md max-h-[84vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Exercise Alternatives</DialogTitle>
            <DialogDescription>
              Similar movements you can rotate in when {alternativeInsight?.relatedExercise ?? 'this exercise'} has been
              flat for several sessions.
            </DialogDescription>
          </DialogHeader>

          <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
            {alternativeOptions.length > 0 ? (
              alternativeOptions.map((option) => (
                <button
                  key={option.name}
                  type="button"
                  onClick={() => openExerciseLibrary(option.name)}
                  className="w-full rounded-xl border border-white/10 bg-white/[0.035] p-3 text-left text-white transition-colors hover:bg-white/[0.06]"
                >
                  <div className="flex items-center gap-3">
                    {option.exercise ? (
                      <ExerciseThumbnail exercise={option.exercise} size="sm" />
                    ) : (
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-black/20 text-zinc-400">
                        <RefreshCw className="h-4 w-4" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">{option.name}</div>
                      <div className="mt-1 text-xs text-zinc-500">
                        {option.exercise?.equipment ?? 'Similar movement'}
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-zinc-500" />
                  </div>
                </button>
              ))
            ) : (
              <div className="empty-state p-5 text-center">
                <p className="text-sm font-medium text-white">No mapped alternatives yet</p>
                <p className="mt-1 text-sm text-zinc-400">
                  Open the exercise library and choose a similar movement for the same muscle group.
                </p>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => openExerciseLibrary()}
            className="premium-button premium-button-primary w-full py-3"
          >
            Open exercise library
          </button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
