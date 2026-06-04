import { useEffect, useMemo, useRef, useState, type PointerEvent } from 'react';
import { useLocation } from 'react-router';
import { Filter, GripVertical, ListOrdered, Settings2, TrendingDown, TrendingUp, X } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { AnatomicalBodyDiagram } from '../components/AnatomicalBodyDiagram';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { ExerciseFilterPicker } from '../components/ExerciseFilterPicker';
import { useAuth } from '../contexts/AuthContext';
import {
  ExerciseRankCard,
  MAX_REPS_FOR_RANK,
  MIN_REPS_FOR_RANK,
  RankBadge,
  getExerciseRank,
} from '../features/exercise-ranks';
import { DataService, progressMuscleGroups, progressSections, type ProgressSectionKey } from '../services/db';
import { type MuscleGroup } from '../data/mockData';

type TimeRange = '30d' | '90d' | '180d' | 'all';

interface ProgressRouteState {
  focusExerciseId?: string;
  focusExerciseName?: string;
  focusMuscleGroup?: MuscleGroup;
}

interface SectionDragPreview {
  sectionKey: ProgressSectionKey;
  label: string;
  isVisible: boolean;
  x: number;
  y: number;
  width: number;
  offsetX: number;
  offsetY: number;
}

interface ReorderSectionsOverlayProps {
  sectionOrder: ProgressSectionKey[];
  visibleSections: Record<ProgressSectionKey, boolean>;
  onClose: () => void;
  onSave: (nextSectionOrder: ProgressSectionKey[]) => void;
}

const statusLabel = {
  progressing: 'Progressing',
  balanced: 'Balanced',
  watch: 'Watch',
  undertrained: 'Undertrained',
  overtrained: 'Overtrained',
  recovering: 'Recovering',
};

const defaultVisibleSections = progressSections.reduce(
  (acc, section) => ({ ...acc, [section.key]: true }),
  {} as Record<ProgressSectionKey, boolean>,
);
const defaultSectionOrder = progressSections.map((section) => section.key);
const defaultVisibleMuscles = progressMuscleGroups.filter(
  (muscle) => muscle !== 'Cardio' && muscle !== 'Warm-up' && muscle !== 'Abs',
);
const MAX_TRACKED_EXERCISES = 5;

function moveItem<T>(items: T[], fromIndex: number, toIndex: number) {
  if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0 || fromIndex >= items.length || toIndex >= items.length) {
    return items;
  }

  const next = [...items];
  const [moved] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, moved);
  return next;
}

function getProgressSectionLabel(sectionKey: ProgressSectionKey) {
  return progressSections.find((section) => section.key === sectionKey)?.label ?? sectionKey;
}

function ReorderSectionsOverlay({ sectionOrder, visibleSections, onClose, onSave }: ReorderSectionsOverlayProps) {
  const [draftSections, setDraftSections] = useState(sectionOrder);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [dragPreview, setDragPreview] = useState<SectionDragPreview | null>(null);
  const draggingIndexRef = useRef<number | null>(null);

  useEffect(() => {
    setDraftSections(sectionOrder);
  }, [sectionOrder]);

  const handlePointerMove = (event: PointerEvent<HTMLElement>) => {
    if (draggingIndexRef.current === null) return;

    setDragPreview((preview) =>
      preview
        ? {
            ...preview,
            x: event.clientX - preview.offsetX,
            y: event.clientY - preview.offsetY,
          }
        : preview,
    );

    const target = document
      .elementFromPoint(event.clientX, event.clientY)
      ?.closest('[data-reorder-section-index]') as HTMLElement | null;
    if (!target) return;

    const targetIndex = Number(target.dataset.reorderSectionIndex);
    const currentIndex = draggingIndexRef.current;
    if (!Number.isInteger(targetIndex) || targetIndex === currentIndex) return;

    setDraftSections((current) => moveItem(current, currentIndex, targetIndex));
    draggingIndexRef.current = targetIndex;
    setDraggingIndex(targetIndex);
  };

  const handlePointerEnd = () => {
    draggingIndexRef.current = null;
    setDraggingIndex(null);
    setDragPreview(null);
  };

  return (
    <div className="fixed inset-0 z-[80] bg-zinc-950 text-white">
      <div className="flex min-h-full flex-col">
        <div className="sticky top-0 z-10 border-b border-white/10 bg-zinc-950/95 px-4 py-4 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-zinc-400 transition-colors hover:bg-white/[0.06] hover:text-white"
              aria-label="Close reorder sections"
            >
              <X className="h-6 w-6" />
            </button>
            <h2 className="text-2xl font-semibold">Reorder Sections</h2>
          </div>
        </div>

        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4 pb-28">
          {draftSections.map((sectionKey, index) => {
            const label = getProgressSectionLabel(sectionKey);
            const isVisible = visibleSections[sectionKey];

            return (
              <div
                key={sectionKey}
                data-reorder-section-index={index}
                className={`reorder-exercise-row premium-row flex items-center gap-3 p-3 transition-colors ${
                  draggingIndex === index ? 'border-blue-400/40 bg-blue-500/10' : ''
                } ${dragPreview?.sectionKey === sectionKey ? 'opacity-[0.45]' : isVisible ? '' : 'opacity-60'}`}
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.035] font-mono text-sm text-zinc-400">
                  {index + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-lg font-medium text-white">{label}</div>
                  <div className="mt-1 text-xs text-zinc-500">{isVisible ? 'Visible' : 'Hidden'}</div>
                </div>
                <button
                  type="button"
                  onPointerDown={(event) => {
                    const row = event.currentTarget.closest('[data-reorder-section-index]') as HTMLElement | null;
                    const rect = row?.getBoundingClientRect();
                    draggingIndexRef.current = index;
                    setDraggingIndex(index);
                    if (rect) {
                      setDragPreview({
                        sectionKey,
                        label,
                        isVisible,
                        x: rect.left,
                        y: rect.top,
                        width: rect.width,
                        offsetX: event.clientX - rect.left,
                        offsetY: event.clientY - rect.top,
                      });
                    }
                    event.currentTarget.setPointerCapture(event.pointerId);
                    event.preventDefault();
                  }}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerEnd}
                  onPointerCancel={handlePointerEnd}
                  className="flex h-12 w-12 shrink-0 touch-none items-center justify-center rounded-xl text-zinc-300 transition-colors hover:bg-white/[0.06] hover:text-white"
                  aria-label={`Drag ${label}`}
                >
                  <GripVertical className="h-6 w-6" />
                </button>
              </div>
            );
          })}
        </div>

        {dragPreview && (
          <div
            className="reorder-drag-preview fixed z-[90] pointer-events-none premium-row flex items-center gap-3 p-3"
            style={{
              left: `${dragPreview.x}px`,
              top: `${dragPreview.y}px`,
              width: `${dragPreview.width}px`,
            }}
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-blue-300/20 bg-blue-500/10 text-blue-200">
              <GripVertical className="h-6 w-6" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-lg font-medium text-white">{dragPreview.label}</div>
              <div className="mt-1 text-xs text-zinc-500">{dragPreview.isVisible ? 'Visible' : 'Hidden'}</div>
            </div>
            <GripVertical className="h-6 w-6 shrink-0 text-blue-200" />
          </div>
        )}

        <div className="fixed bottom-0 left-0 right-0 border-t border-white/10 bg-zinc-950/95 px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-4 backdrop-blur-xl">
          <button
            type="button"
            onClick={() => onSave(draftSections)}
            className="premium-button premium-button-primary mx-auto flex h-14 w-full max-w-sm items-center justify-center text-lg font-semibold"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

export function ProgressPage() {
  const { user } = useAuth();
  const location = useLocation();
  const routeState = location.state as ProgressRouteState | null;
  const handledRouteStateKeyRef = useRef<string | null>(null);
  const preferences = useMemo(() => (user ? DataService.getProgressPreferences(user.id) : null), [user]);
  const [timeRange, setTimeRange] = useState<TimeRange>('all');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [exercisePickerOpen, setExercisePickerOpen] = useState(false);
  const [muscleSettingsOpen, setMuscleSettingsOpen] = useState(false);
  const [sectionReorderOpen, setSectionReorderOpen] = useState(false);
  const [trackedExerciseIds, setTrackedExerciseIds] = useState<string[]>(preferences?.trackedExerciseIds ?? []);
  const [visibleSections, setVisibleSections] = useState<Record<ProgressSectionKey, boolean>>(
    preferences?.visibleSections ?? defaultVisibleSections,
  );
  const [sectionOrder, setSectionOrder] = useState<ProgressSectionKey[]>(
    preferences?.sectionOrder ?? defaultSectionOrder,
  );
  const [visibleMuscleGroups, setVisibleMuscleGroups] = useState<MuscleGroup[]>(
    preferences?.visibleMuscleGroups ?? defaultVisibleMuscles,
  );
  const [selectedExerciseId, setSelectedExerciseId] = useState(trackedExerciseIds[0] ?? '1');

  const availableExercises = useMemo(() => (user ? DataService.getProgressExerciseOptions(user.id) : []), [user]);
  const activeExerciseId = trackedExerciseIds.includes(selectedExerciseId)
    ? selectedExerciseId
    : trackedExerciseIds[0] ?? availableExercises[0]?.id ?? '1';
  const selectedExercise = availableExercises.find((exercise) => exercise.id === activeExerciseId);
  const progressData = useMemo(
    () =>
      user
        ? DataService.getProgressSeries(user.id, activeExerciseId).map((point, index) => ({
            ...point,
            uniqueKey: `${point.date}-${index}`,
          }))
        : [],
    [activeExerciseId, user?.id],
  );
  const muscleAnalysis = useMemo(() => (user ? DataService.getMuscleAnalysis(user.id) : []), [user?.id]);
  const displayedMuscleAnalysis = muscleAnalysis.filter((item) => visibleMuscleGroups.includes(item.muscle));
  const mostImproved = useMemo(() => (user ? DataService.getMostImprovedExercises(user.id) : []), [user?.id]);
  const plateaus = useMemo(() => (user ? DataService.getPotentialPlateaus(user.id) : []), [user?.id]);
  const records = useMemo(() => (user ? DataService.getPersonalRecords(user.id) : []), [user?.id]);
  const workouts = useMemo(() => (user ? DataService.getWorkoutsByUserId(user.id) : []), [user?.id]);
  const hasTrainingData = workouts.length > 0;
  const selectedExerciseRank = useMemo(
    () => (selectedExercise && user ? getExerciseRank(selectedExercise, workouts, user.weight) : null),
    [selectedExercise, user?.weight, workouts],
  );

  const filteredProgressData = useMemo(() => {
    if (timeRange === 'all') return progressData;
    const daysMap = { '30d': 30, '90d': 90, '180d': 180 };
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - daysMap[timeRange]);
    return progressData.filter((point) => new Date(`${point.date}T00:00:00`) >= cutoff);
  }, [progressData, timeRange]);

  const latestPoint = progressData[progressData.length - 1];
  const previousPoint = progressData[progressData.length - 2];
  const latestTrend =
    latestPoint && previousPoint && previousPoint.value > 0
      ? ((latestPoint.value - previousPoint.value) / previousPoint.value) * 100
      : 0;
  const latestPointIsOutsideRankWindow = Boolean(
    selectedExerciseRank?.eligible &&
      latestPoint &&
      (latestPoint.reps < MIN_REPS_FOR_RANK || latestPoint.reps > MAX_REPS_FOR_RANK) &&
      latestPoint.value > (selectedExerciseRank.estimatedOneRepMax ?? 0),
  );

  const savePreferences = (updates: {
    trackedExerciseIds?: string[];
    visibleSections?: Record<ProgressSectionKey, boolean>;
    sectionOrder?: ProgressSectionKey[];
    visibleMuscleGroups?: MuscleGroup[];
  }) => {
    const nextTrackedExerciseIds = updates.trackedExerciseIds ?? trackedExerciseIds;
    const nextVisibleSections = updates.visibleSections ?? visibleSections;
    const nextSectionOrder = updates.sectionOrder ?? sectionOrder;
    const nextVisibleMuscleGroups = updates.visibleMuscleGroups ?? visibleMuscleGroups;

    setTrackedExerciseIds(nextTrackedExerciseIds);
    setVisibleSections(nextVisibleSections);
    setSectionOrder(nextSectionOrder);
    setVisibleMuscleGroups(nextVisibleMuscleGroups);

    if (user) {
      DataService.updateProgressPreferences(user.id, {
        trackedExerciseIds: nextTrackedExerciseIds,
        visibleSections: nextVisibleSections,
        sectionOrder: nextSectionOrder,
        visibleMuscleGroups: nextVisibleMuscleGroups,
      });
    }
  };

  useEffect(() => {
    if (!user || !routeState || handledRouteStateKeyRef.current === location.key) return;

    const focusedExercise = routeState.focusExerciseId
      ? availableExercises.find((exercise) => exercise.id === routeState.focusExerciseId)
      : routeState.focusExerciseName
        ? availableExercises.find(
            (exercise) => exercise.name.toLowerCase() === routeState.focusExerciseName?.toLowerCase(),
          )
        : undefined;

    const nextTrackedExerciseIds =
      focusedExercise && !trackedExerciseIds.includes(focusedExercise.id)
        ? trackedExerciseIds.length >= MAX_TRACKED_EXERCISES
          ? [...trackedExerciseIds.slice(1), focusedExercise.id]
          : [...trackedExerciseIds, focusedExercise.id]
        : trackedExerciseIds;
    const nextVisibleSections = routeState.focusMuscleGroup
      ? { ...visibleSections, muscleBalance: true, bodyMap: true }
      : visibleSections;
    const nextVisibleMuscleGroups =
      routeState.focusMuscleGroup && !visibleMuscleGroups.includes(routeState.focusMuscleGroup)
        ? [...visibleMuscleGroups, routeState.focusMuscleGroup]
        : visibleMuscleGroups;

    if (
      nextTrackedExerciseIds !== trackedExerciseIds ||
      nextVisibleSections !== visibleSections ||
      nextVisibleMuscleGroups !== visibleMuscleGroups
    ) {
      savePreferences({
        trackedExerciseIds: nextTrackedExerciseIds,
        visibleSections: nextVisibleSections,
        visibleMuscleGroups: nextVisibleMuscleGroups,
      });
    }

    if (focusedExercise) {
      setSelectedExerciseId(focusedExercise.id);
    }

    handledRouteStateKeyRef.current = location.key;
  }, [
    availableExercises,
    location.key,
    routeState,
    trackedExerciseIds,
    user,
    visibleMuscleGroups,
    visibleSections,
  ]);

  const toggleTrackedExercise = (exerciseId: string) => {
    const isTracked = trackedExerciseIds.includes(exerciseId);
    if (!isTracked && trackedExerciseIds.length >= MAX_TRACKED_EXERCISES) return;

    const next = isTracked
      ? trackedExerciseIds.filter((id) => id !== exerciseId)
      : [...trackedExerciseIds, exerciseId];

    savePreferences({ trackedExerciseIds: next });

    if (!isTracked && trackedExerciseIds.length === 0) {
      setSelectedExerciseId(exerciseId);
    }
    if (isTracked && selectedExerciseId === exerciseId) {
      setSelectedExerciseId(next[0] ?? availableExercises[0]?.id ?? '1');
    }
  };

  const toggleSection = (section: ProgressSectionKey) => {
    savePreferences({
      visibleSections: {
        ...visibleSections,
        [section]: !visibleSections[section],
      },
    });
  };

  const toggleMuscleGroup = (muscle: MuscleGroup) => {
    const isVisible = visibleMuscleGroups.includes(muscle);
    if (isVisible && visibleMuscleGroups.length === 1) return;

    savePreferences({
      visibleMuscleGroups: isVisible
        ? visibleMuscleGroups.filter((item) => item !== muscle)
        : [...visibleMuscleGroups, muscle],
    });
  };

  const getRankForExerciseId = (exerciseId: string) => {
    const exercise = availableExercises.find((item) => item.id === exerciseId);
    return exercise && user ? getExerciseRank(exercise, workouts, user.weight) : null;
  };

  if (!user) return null;

  const renderSection = (sectionKey: ProgressSectionKey) => {
    if (!visibleSections[sectionKey]) return null;

    if (sectionKey === 'strengthChart') {
      return (
        <div key={sectionKey} className="px-4 py-4">
          <div className="premium-card p-4">
            <div className="flex items-center justify-between mb-4 gap-3">
              <div>
                <h2 className="text-lg">{selectedExercise?.name ?? 'Exercise'} Progress</h2>
                <p className="text-xs text-zinc-500">Estimated 1RM from best set across all rep ranges</p>
              </div>
              <TrendingUp className="w-5 h-5 text-blue-400" />
            </div>
            {latestPoint && (
              <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="premium-row p-3">
                  <div className="text-xs text-zinc-500 mb-1">Est. 1RM</div>
                  <div className="stat-number text-lg">{latestPoint.value.toFixed(0)}</div>
                </div>
                <div className="premium-row p-3">
                  <div className="text-xs text-zinc-500 mb-1">Best Set</div>
                  <div className="stat-number text-lg">{latestPoint.weight}x{latestPoint.reps}</div>
                </div>
                <div className="premium-row p-3">
                  <div className="text-xs text-zinc-500 mb-1">Last Move</div>
                  <div className={`stat-number text-lg ${latestTrend >= 0 ? 'text-green-400' : 'text-orange-400'}`}>
                    {latestTrend >= 0 ? '+' : ''}{latestTrend.toFixed(1)}%
                  </div>
                </div>
              </div>
            )}
            <ExerciseRankCard result={selectedExerciseRank} className="mb-4" />
            {latestPointIsOutsideRankWindow && (
              <div className="mb-4 rounded-xl border border-amber-400/20 bg-amber-500/10 p-3 text-xs leading-relaxed text-amber-100">
                Your latest chart PR is {latestPoint?.weight}kg x {latestPoint?.reps}, but exercise ranks only use
                valid {MIN_REPS_FOR_RANK}-{MAX_REPS_FOR_RANK} rep sets. Log a heavier set in that range to move the
                rank.
              </div>
            )}
            {filteredProgressData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={filteredProgressData} key={activeExerciseId}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
                  <XAxis
                    dataKey="date"
                    stroke="#71717a"
                    tick={{ fill: '#71717a', fontSize: 12 }}
                    tickFormatter={(value) => {
                      const date = new Date(`${value}T00:00:00`);
                      return `${date.getMonth() + 1}/${date.getDate()}`;
                    }}
                  />
                  <YAxis stroke="#71717a" tick={{ fill: '#71717a', fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#18181b',
                      border: '1px solid #3f3f46',
                      borderRadius: '8px',
                      color: '#fff',
                    }}
                    formatter={(value, name, props) => [
                      `${value} est. 1RM (${props.payload.weight}kg x ${props.payload.reps})`,
                      'Best set',
                    ]}
                  />
                  <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6', r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-state h-52 flex items-center justify-center text-center text-sm text-zinc-500">
                {hasTrainingData
                  ? 'No logged sets for this exercise yet.'
                  : 'Log a workout to start building progress charts and exercise ranks.'}
              </div>
            )}
          </div>
        </div>
      );
    }

    if (sectionKey === 'muscleBalance') {
      return (
        <div key={sectionKey} className="px-4 py-2">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">Muscle Group Status</h2>
            <button
              type="button"
              onClick={() => setMuscleSettingsOpen(true)}
              className="premium-button premium-button-secondary flex h-9 w-9 items-center justify-center p-0"
              aria-label="Customize muscle groups"
            >
              <Settings2 className="h-4 w-4" />
            </button>
          </div>
          <div className="space-y-2">
            {!hasTrainingData ? (
              <div className="empty-state p-4 text-sm text-zinc-400">
                Muscle status starts after your first logged workout. Strive will use effective sets instead of counting every
                secondary muscle as a full set.
              </div>
            ) : displayedMuscleAnalysis.length > 0 ? (
              displayedMuscleAnalysis.map((item) => {
                const Icon = item.status === 'undertrained' || item.status === 'overtrained' ? TrendingDown : TrendingUp;
                return (
                  <div key={item.muscle} className="premium-card-muted p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${item.color}`} />
                        <div>
                          <div className="text-white font-medium">{item.muscle}</div>
                          <div className="text-xs text-zinc-500">{item.lastTrained}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center justify-end gap-2 text-sm text-zinc-300">
                          <Icon className="w-4 h-4" />
                          {statusLabel[item.status]}
                        </div>
                        <div className="text-xs text-zinc-500">{item.weeklySets} eff. sets/wk</div>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="empty-state p-4 text-sm text-zinc-400">
                Choose muscle groups from this section's settings to display them here.
              </div>
            )}
          </div>
        </div>
      );
    }

    if (sectionKey === 'bodyMap') {
      return (
        <div key={sectionKey} className="px-4 py-4">
          <h2 className="text-lg font-semibold mb-3">Body Map</h2>
          <div className="premium-card p-4">
            <AnatomicalBodyDiagram
              onMuscleSelect={() => {}}
              selectedMuscles={[]}
              colorMode="status"
              gender={user?.gender}
              muscleStatuses={
                hasTrainingData
                  ? muscleAnalysis.reduce((acc, item) => {
                      acc[item.muscle] = { status: item.status, color: item.color, weeklySets: item.weeklySets };
                      return acc;
                    }, {} as Record<string, { status: string; color: string; weeklySets: number }>)
                  : {}
              }
            />
            {!hasTrainingData && (
              <p className="mt-3 text-center text-sm text-zinc-500">
                The body map will light up as you log exercises for each muscle group.
              </p>
            )}
          </div>
        </div>
      );
    }

    if (sectionKey === 'bestMovers') {
      return (
        <div key={sectionKey} className="px-4 py-2">
          <div className="premium-card p-4">
            <h3 className="text-white font-medium mb-3 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-400" />
              Best Movers
            </h3>
            <div className="space-y-2">
              {mostImproved.length > 0 ? (
                mostImproved.map((item) => (
                  <div key={item.exerciseId} className="flex justify-between items-center gap-3 py-2 border-b border-white/10 last:border-0">
                    <span className="text-zinc-300 truncate">{item.exerciseName}</span>
                    <span className="text-green-400">+{item.changePercent.toFixed(1)}%</span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-zinc-500">More logged sessions will unlock improvement rankings.</p>
              )}
            </div>
          </div>
        </div>
      );
    }

    if (sectionKey === 'plateauWatch') {
      return (
        <div key={sectionKey} className="px-4 py-2">
          <div className="premium-card p-4">
            <h3 className="text-white font-medium mb-3 flex items-center gap-2">
              <TrendingDown className="w-5 h-5 text-orange-400" />
              Plateau Watch
            </h3>
            <div className="space-y-2">
              {plateaus.length > 0 ? (
                plateaus.map((item) => (
                  <div key={item.exerciseId} className="flex justify-between items-center gap-3 py-2 border-b border-white/10 last:border-0">
                    <span className="text-zinc-300 truncate">{item.exerciseName}</span>
                    <span className="text-orange-400">{item.sessions} flat sessions</span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-zinc-500">No plateaus detected from current logs.</p>
              )}
            </div>
          </div>
        </div>
      );
    }

    return (
      <div key={sectionKey} className="px-4 py-2">
        <div className="premium-card p-4">
          <h3 className="text-white font-medium mb-3">Recent Records</h3>
          <div className="space-y-2">
            {records.length > 0 ? (
              records.slice(0, 5).map((record) => {
                const rankResult = getRankForExerciseId(record.exerciseId);
                return (
                  <div key={`${record.exercise}-${record.date}`} className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 py-2 border-b border-white/10 last:border-0">
                    <div className="min-w-0">
                      <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
                        <div className="min-w-0 truncate text-zinc-300">{record.exercise}</div>
                        {rankResult?.eligible && (
                          <RankBadge
                            rank={rankResult.rank}
                            division={rankResult.division}
                            size="sm"
                            className="max-w-[7.75rem] overflow-hidden"
                          />
                        )}
                      </div>
                      <div className="mt-1 text-xs text-zinc-500">{record.date}</div>
                    </div>
                    <span className="shrink-0 pt-0.5 text-sm text-blue-400">
                      {record.weight}kg x {record.reps}
                    </span>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-zinc-500">Records appear after you log workouts.</p>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="screen-shell">
      <div className="screen-header">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-3xl font-semibold leading-tight mb-1">Progress</h1>
            <p className="text-zinc-400 text-sm">Strength, balance, and recovery signals.</p>
          </div>
          <button
            onClick={() => setSettingsOpen(true)}
            className="premium-button premium-button-secondary p-2"
            aria-label="Customize progress dashboard"
          >
            <Settings2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="px-4 py-4 flex gap-2 overflow-x-auto">
        {(['30d', '90d', '180d', 'all'] as TimeRange[]).map((range) => (
          <button
            key={range}
            onClick={() => setTimeRange(range)}
            className={`premium-button px-4 py-2 text-sm whitespace-nowrap ${
              timeRange === range ? 'premium-button-primary' : 'premium-button-secondary text-zinc-400'
            }`}
          >
            {range === 'all' ? 'All Time' : range.toUpperCase()}
          </button>
        ))}
      </div>

      <div className="px-4 pb-2 flex gap-2 overflow-x-auto">
        {trackedExerciseIds.map((exerciseId) => {
          const exercise = availableExercises.find((item) => item.id === exerciseId);
          if (!exercise) return null;
          return (
            <button
              key={exerciseId}
              onClick={() => setSelectedExerciseId(exerciseId)}
              title={exercise.name}
              className={`premium-button flex min-w-0 max-w-[10.5rem] shrink-0 items-center px-3 py-2 text-sm border ${
                activeExerciseId === exerciseId
                  ? 'premium-button-primary'
                  : 'premium-button-secondary text-zinc-300'
              }`}
            >
              <span className="block min-w-0 truncate">{exercise.name}</span>
            </button>
          );
        })}
        <button
          onClick={() => setExercisePickerOpen(true)}
          className="premium-button premium-button-secondary shrink-0 px-3 py-2 text-sm whitespace-nowrap border-dashed text-zinc-400"
        >
          Add {trackedExerciseIds.length}/{MAX_TRACKED_EXERCISES}
        </button>
      </div>

      {sectionOrder.map((sectionKey) => renderSection(sectionKey))}

      <Dialog open={exercisePickerOpen} onOpenChange={setExercisePickerOpen}>
        <DialogContent className="max-w-md max-h-[84vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Tracked Exercises</DialogTitle>
            <DialogDescription>
              Choose up to {MAX_TRACKED_EXERCISES} exercises to show in your progress chart.
            </DialogDescription>
          </DialogHeader>

          <ExerciseFilterPicker
            exercises={availableExercises}
            selectedExerciseIds={trackedExerciseIds}
            onToggleExercise={(exercise) => toggleTrackedExercise(exercise.id)}
            isExerciseDisabled={(exercise) =>
              !trackedExerciseIds.includes(exercise.id) && trackedExerciseIds.length >= MAX_TRACKED_EXERCISES
            }
            className="flex-1"
            searchPlaceholder="Search tracked exercises..."
            unselectedIcon="x"
            pinSelectedToTop
          />
        </DialogContent>
      </Dialog>

      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="max-w-md max-h-[84vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Progress Settings</DialogTitle>
            <DialogDescription>Choose which sections show and where they appear.</DialogDescription>
          </DialogHeader>

          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto pr-1">
            <div>
              <div className="flex items-center gap-2 mb-3 text-sm text-zinc-400">
                <Filter className="w-4 h-4" />
                Sections and order
              </div>
              <button
                type="button"
                onClick={() => {
                  setSettingsOpen(false);
                  setSectionReorderOpen(true);
                }}
                className="premium-row mb-3 flex w-full items-center gap-3 p-3 text-left transition-colors hover:bg-white/[0.045]"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-blue-400/20 bg-blue-500/10 text-blue-200">
                  <ListOrdered className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-white">Reorder sections</div>
                  <div className="truncate text-xs text-zinc-500">
                    {sectionOrder.map((sectionKey) => getProgressSectionLabel(sectionKey)).join(' / ')}
                  </div>
                </div>
              </button>

              <div className="space-y-2">
                {sectionOrder.map((sectionKey) => {
                  const section = progressSections.find((item) => item.key === sectionKey);
                  if (!section) return null;
                  const isVisible = visibleSections[sectionKey];

                  return (
                    <button
                      type="button"
                      key={sectionKey}
                      onClick={() => toggleSection(sectionKey)}
                      className={`premium-row flex w-full items-center gap-3 p-3 text-left transition-colors hover:bg-white/[0.035] ${
                        isVisible ? '' : 'opacity-60'
                      }`}
                    >
                      <span
                        className={`h-3 w-3 shrink-0 rounded-full ${
                          isVisible ? 'bg-blue-400 shadow-[0_0_16px_rgba(96,165,250,0.35)]' : 'bg-zinc-700'
                        }`}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium text-white">{section.label}</div>
                        <div className="text-xs text-zinc-500">{isVisible ? 'Visible' : 'Hidden'}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {sectionReorderOpen && (
        <ReorderSectionsOverlay
          sectionOrder={sectionOrder}
          visibleSections={visibleSections}
          onClose={() => setSectionReorderOpen(false)}
          onSave={(nextSectionOrder) => {
            savePreferences({ sectionOrder: nextSectionOrder });
            setSectionReorderOpen(false);
          }}
        />
      )}

      <Dialog open={muscleSettingsOpen} onOpenChange={setMuscleSettingsOpen}>
        <DialogContent className="max-w-md max-h-[84vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Muscle Group Status</DialogTitle>
            <DialogDescription>Choose which muscle groups appear in this section.</DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-2 overflow-y-auto pr-1">
            {progressMuscleGroups.map((muscle) => {
              const isVisible = visibleMuscleGroups.includes(muscle);
              const isLastVisible = isVisible && visibleMuscleGroups.length === 1;

              return (
                <button
                  key={muscle}
                  type="button"
                  onClick={() => toggleMuscleGroup(muscle)}
                  disabled={isLastVisible}
                  className={`rounded-xl border p-3 text-left text-sm transition-colors disabled:cursor-not-allowed ${
                    isVisible
                      ? 'border-blue-400/40 bg-blue-500/15 text-white'
                      : 'border-white/10 bg-white/[0.035] text-zinc-400 hover:bg-white/[0.06] hover:text-zinc-200'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span>{muscle}</span>
                    {isVisible && <span className="h-2 w-2 rounded-full bg-blue-400" />}
                  </div>
                </button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
