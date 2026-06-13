import { useState, useEffect, useMemo, useRef, type CSSProperties, type PointerEvent } from 'react';
import { useNavigate, useLocation } from 'react-router';
import {
  BookOpen,
  Check,
  ChevronDown,
  ChevronUp,
  Clock,
  GripVertical,
  Link2,
  ListOrdered,
  MoreVertical,
  Plus,
  ArrowRight,
  RefreshCw,
  Trash2,
  Unlink,
  X,
} from 'lucide-react';
import {
  type Exercise,
  type ExerciseLog,
  type ExerciseLoggingSchema,
  type LoggingFieldDefinition,
  type LoggingFieldKey,
  type SetType,
  type WorkoutSet,
  canCompleteLoggedSet,
  exercises,
  getExerciseLogging,
} from '../data/mockData';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../components/ui/alert-dialog';
import { useWorkout } from '../contexts/WorkoutContext';
import { ExerciseThumbnail } from '../components/ExerciseThumbnail';
import { BottomInputPanel } from '../components/BottomInputPanel';
import { SetTypeSelector, getSetTypeStyles } from '../components/SetTypeSelector';
import { InfoModal } from '../components/InfoModal';
import { useSettings } from '../contexts/SettingsContext';
import { useAuth } from '../contexts/AuthContext';
import { DataService } from '../services/db';
import { formatDurationClock } from '../utils/timeFormatting';
import { ExerciseRankCard, getExerciseRank, type ExerciseRankResult } from '../features/exercise-ranks';
import { BottomNav } from '../components/BottomNav';
import { WorkoutCollapsedHeader } from '../components/WorkoutCollapsedHeader';
import { triggerHaptic } from '../utils/haptics';

interface InputState {
  exerciseId: string;
  setIndex: number;
  field: LoggingFieldKey;
  value: number;
}

function isInteractiveSheetDragTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  return Boolean(target.closest('button, a, input, textarea, select, [role="button"], [data-no-sheet-drag="true"]'));
}

const ACTIVE_WORKOUT_SHEET_TRANSITION_MS = 900;
const ACTIVE_WORKOUT_SHEET_EASING = 'cubic-bezier(0.25, 0.1, 0.25, 1)';

const ACTIVE_WORKOUT_COLLAPSED_BAR_HEIGHT = 68;
const ACTIVE_WORKOUT_BOTTOM_NAV_HEIGHT = 68;
const DEFAULT_REST_SECONDS = 90;
const REST_STEP_SECONDS = 15;
const MIN_REST_SECONDS = 15;
const MAX_REST_SECONDS = 600;

function clampNumber(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function clampRestSeconds(value: number | null | undefined) {
  const normalizedValue = Number(value ?? DEFAULT_REST_SECONDS);
  if (!Number.isFinite(normalizedValue)) return DEFAULT_REST_SECONDS;
  return Math.max(MIN_REST_SECONDS, Math.min(MAX_REST_SECONDS, Math.round(normalizedValue)));
}

function getExerciseLogRestSeconds(exercise: Pick<ExerciseLog, 'restSeconds'>) {
  return clampRestSeconds(exercise.restSeconds);
}

function getPreferredExerciseRestSeconds(userId: string | undefined, exerciseId: string, fallback?: number) {
  return userId
    ? DataService.getExerciseRestSeconds(userId, exerciseId, fallback ?? DEFAULT_REST_SECONDS)
    : clampRestSeconds(fallback);
}

function formatRestTimer(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const secs = Math.max(0, seconds % 60);
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

function withPreferredRestSeconds(exerciseLog: ExerciseLog, userId?: string): ExerciseLog {
  return {
    ...exerciseLog,
    restSeconds: getPreferredExerciseRestSeconds(userId, exerciseLog.exerciseId, exerciseLog.restSeconds),
  };
}

function getActiveWorkoutCollapsedOffset() {
  if (typeof window === 'undefined') return 560;
  return Math.max(0, window.innerHeight - ACTIVE_WORKOUT_BOTTOM_NAV_HEIGHT - ACTIVE_WORKOUT_COLLAPSED_BAR_HEIGHT);
}

function getActiveWorkoutCollapseThreshold() {
  const collapsedOffset = getActiveWorkoutCollapsedOffset();
  return Math.min(260, Math.max(128, collapsedOffset * 0.34));
}

function createExerciseLogsForWorkout(items: Array<Exercise | ExerciseLog>, userId?: string): ExerciseLog[] {
  if (items.length === 0) return [];

  if ('sets' in items[0]) {
    return (items as ExerciseLog[]).map((exerciseLog) => ({
      ...withPreferredRestSeconds(exerciseLog, userId),
      previousSets: userId
        ? DataService.getPreviousWorkoutSets(userId, exerciseLog.exerciseId) ?? exerciseLog.previousSets
        : exerciseLog.previousSets,
    }));
  }

  return (items as Exercise[]).map((exercise) => ({
    exerciseId: exercise.id,
    exerciseName: exercise.name,
    mainMuscles: exercise.mainMuscles,
    sets: [],
    restSeconds: getPreferredExerciseRestSeconds(userId, exercise.id),
    previousSets: userId ? DataService.getPreviousWorkoutSets(userId, exercise.id) ?? undefined : undefined,
  }));
}

function readOpenFromMinimizedFlag() {
  if (typeof window === 'undefined') return false;

  const shouldAnimate = window.sessionStorage.getItem('strive_open_workout_from_minimized') === '1';
  if (shouldAnimate) {
    window.sessionStorage.removeItem('strive_open_workout_from_minimized');
  }

  return shouldAnimate;
}

interface DraggableExerciseProps {
  exercise: ExerciseLog;
  allExercises: ExerciseLog[];
  showExtras: boolean;
  onToggleExtras: () => void;
  onAddSet: () => void;
  onOpenInput: (setIndex: number, field: LoggingFieldKey, value: number) => void;
  onToggleSetCompletion: (setIndex: number) => void;
  onDeleteSet: (setIndex: number) => void;
  onSetTypeChange: (setIndex: number, type: SetType) => void;
  onShowAlternatives: () => void;
  onShowHowToLog: () => void;
  onOpenReorder: () => void;
  onOpenSupersetPicker: () => void;
  onAdjustRestTime: () => void;
  onClearSuperset: () => void;
  onRemoveExercise: () => void;
  rankResult?: ExerciseRankResult | null;
  activeInput?: InputState | null;
  restTimersEnabled: boolean;
}

function getSetFieldValue(set: WorkoutSet, field: LoggingFieldKey) {
  return Number(set[field] ?? 0);
}

function formatFieldValue(set: WorkoutSet, field: LoggingFieldDefinition) {
  const value = getSetFieldValue(set, field.key);
  if (value === 0 && field.key !== 'rir' && field.required) return '-';
  if (value === 0 && field.key !== 'rir' && !field.required) return '-';
  if (field.key === 'duration') return formatDurationClock(value, field.unit);
  return Number.isInteger(value) ? value.toString() : value.toFixed(1);
}

function formatPreviousSet(set: WorkoutSet | undefined, logging: ExerciseLoggingSchema) {
  if (!set) return '-';
  const parts = logging.fields
    .filter((field) => field.key !== 'rir')
    .map((field) => {
      const value = getSetFieldValue(set, field.key);
      if (value <= 0) return null;
      if (field.key === 'duration') return formatDurationClock(value, field.unit);
      return `${value}${field.unit ? field.unit : ''}`;
    })
    .filter(Boolean);
  return parts.length ? parts.join(' / ') : '-';
}

function createSetFromPrevious(setNumber: number, previous: WorkoutSet | undefined, logging: ExerciseLoggingSchema): WorkoutSet {
  const nextSet: WorkoutSet = {
    setNumber,
    weight: 0,
    reps: 0,
    completed: false,
    type: 'normal',
  };
  const writableSet = nextSet as WorkoutSet & Record<LoggingFieldKey, number | undefined>;

  logging.fields.forEach((field) => {
    writableSet[field.key] = getSetFieldValue(previous ?? nextSet, field.key);
  });

  return nextSet;
}

function canCompleteSet(set: WorkoutSet, logging: ExerciseLoggingSchema) {
  return canCompleteLoggedSet(set, logging);
}

function createSupersetGroupId() {
  return `superset-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeSupersetGroups(exerciseLogs: ExerciseLog[]) {
  const groupCounts = new Map<string, number>();

  exerciseLogs.forEach((exerciseLog) => {
    if (!exerciseLog.supersetGroupId) return;
    groupCounts.set(exerciseLog.supersetGroupId, (groupCounts.get(exerciseLog.supersetGroupId) ?? 0) + 1);
  });

  return exerciseLogs.map((exerciseLog) =>
    exerciseLog.supersetGroupId && (groupCounts.get(exerciseLog.supersetGroupId) ?? 0) < 2
      ? { ...exerciseLog, supersetGroupId: undefined }
      : exerciseLog,
  );
}

interface SwipeSetRowProps {
  set: WorkoutSet;
  setIndex: number;
  previousSet?: WorkoutSet;
  logging: ExerciseLoggingSchema;
  loggingFields: LoggingFieldDefinition[];
  setGridStyle: { gridTemplateColumns: string };
  activeInput?: Pick<InputState, 'setIndex' | 'field'> | null;
  getSetTypeLabel: (setIndex: number) => string;
  getSetTypeButtonClass: (set: WorkoutSet) => string;
  onSetTypeClick: (setIndex: number) => void;
  onOpenInput: (setIndex: number, field: LoggingFieldKey, value: number) => void;
  onToggleSetCompletion: (setIndex: number) => void;
  onDeleteSet: (setIndex: number) => void;
}

function SwipeSetRow({
  set,
  setIndex,
  previousSet,
  logging,
  loggingFields,
  setGridStyle,
  activeInput,
  getSetTypeLabel,
  getSetTypeButtonClass,
  onSetTypeClick,
  onOpenInput,
  onToggleSetCompletion,
  onDeleteSet,
}: SwipeSetRowProps) {
  const startXRef = useRef<number | null>(null);
  const swipeBaseOffsetRef = useRef(0);
  const didSwipeRef = useRef(false);
  const [dragOffset, setDragOffset] = useState<number | null>(null);
  const [deleteRevealed, setDeleteRevealed] = useState(false);
  const isCompleted = set.completed;
  const isReadyToComplete = canCompleteSet(set, logging);
  const canToggleCompletion = isCompleted || isReadyToComplete;
  const translateX = isCompleted ? 0 : dragOffset ?? (deleteRevealed ? -72 : 0);
  const revealWidth = Math.abs(translateX);
  const revealOpacity = Math.min(1, revealWidth / 56);

  useEffect(() => {
    if (!isCompleted) return;

    setDeleteRevealed(false);
    setDragOffset(null);
    startXRef.current = null;
    didSwipeRef.current = false;
  }, [isCompleted]);

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (isCompleted) return;

    startXRef.current = event.clientX;
    swipeBaseOffsetRef.current = deleteRevealed ? -72 : 0;
    didSwipeRef.current = false;
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (isCompleted) return;
    if (startXRef.current === null) return;

    const delta = event.clientX - startXRef.current;
    if (Math.abs(delta) > 8) {
      didSwipeRef.current = true;
      event.preventDefault();
      const nextOffset = Math.max(-80, Math.min(0, swipeBaseOffsetRef.current + delta));
      setDragOffset(nextOffset);
    }
  };

  const handlePointerEnd = () => {
    if (didSwipeRef.current && dragOffset !== null) {
      setDeleteRevealed(dragOffset < -36);
    }
    setDragOffset(null);
    startXRef.current = null;
    didSwipeRef.current = false;
  };

  return (
    <div className="relative w-full overflow-hidden rounded-[11px]">
      <div
        className="absolute inset-y-0 right-0 flex items-center justify-end overflow-hidden rounded-[11px] pr-0.5 transition-[width,opacity] duration-150"
        style={{
          width: `${revealWidth}px`,
          opacity: revealOpacity,
        }}
        aria-hidden={!deleteRevealed}
      >
        <button
          type="button"
          onClick={() => {
            setDeleteRevealed(false);
            onDeleteSet(setIndex);
          }}
          className="active-set-delete-action flex h-[calc(100%-0.35rem)] w-[4.25rem] items-center justify-center rounded-xl text-white shadow-[0_10px_24px_rgba(239,68,68,0.24)] transition-transform duration-150 active:scale-95"
          style={{
            pointerEvents: deleteRevealed && !isCompleted ? 'auto' : 'none',
          }}
          aria-label={`Delete set ${setIndex + 1}`}
        >
          <Trash2 className="h-5 w-5" />
        </button>
      </div>
      <div
        className={`active-set-grid active-set-row w-full touch-pan-y transition-transform ${
          isCompleted ? 'active-set-row-complete' : ''
        }`}
        style={{ ...setGridStyle, transform: `translateX(${translateX}px)` }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onPointerCancel={handlePointerEnd}
      >
        <button
          type="button"
          onClick={() => !isCompleted && onSetTypeClick(setIndex)}
          disabled={isCompleted}
          className={`active-workout-field h-8 w-8 text-sm font-bold ${getSetTypeButtonClass(set)}`}
        >
          {getSetTypeLabel(setIndex)}
        </button>
        <div className="min-w-0 text-center text-[11px] leading-tight text-zinc-500 [overflow-wrap:anywhere]">
          {formatPreviousSet(previousSet, logging)}
        </div>
        {loggingFields.map((field) => (
          <button
            key={field.key}
            type="button"
            data-bottom-input-switch="true"
            onClick={(event) => {
              event.stopPropagation();
              if (!isCompleted) {
                onOpenInput(setIndex, field.key, getSetFieldValue(set, field.key));
              }
            }}
            disabled={isCompleted}
            className={`active-workout-field min-w-0 w-full px-1 text-sm ${
              activeInput?.setIndex === setIndex && activeInput.field === field.key
                ? 'border-blue-300/70 bg-blue-500/25 text-white shadow-[0_0_18px_rgba(96,165,250,0.18)]'
                : isCompleted
                  ? 'workout-field-complete cursor-not-allowed'
                  : 'workout-field hover:border-white/20'
            }`}
          >
            {formatFieldValue(set, field)}
          </button>
        ))}
        <button
          type="button"
          data-haptic={isCompleted ? 'tiny' : canToggleCompletion ? 'strong' : 'none'}
          onClick={() => {
            if (canToggleCompletion) {
              onToggleSetCompletion(setIndex);
            }
          }}
          className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
            isCompleted
              ? 'bg-green-500/20 text-green-300 border border-green-500/25'
              : isReadyToComplete
                ? 'border border-blue-300/35 bg-blue-500/15 text-blue-100 shadow-[0_0_14px_rgba(59,130,246,0.14)] hover:bg-blue-500/22'
                : 'border border-white/5 bg-black/25 text-zinc-700'
          }`}
          title={
            isCompleted
              ? 'Mark as incomplete'
              : isReadyToComplete
                ? 'Mark as complete'
                : 'Complete the required fields first'
          }
        >
          <Check className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

interface ReorderExercisesOverlayProps {
  exercisesList: ExerciseLog[];
  onClose: () => void;
  onSave: (nextExercises: ExerciseLog[]) => void;
}

interface ReorderDragPreview {
  exercise: ExerciseLog;
  x: number;
  y: number;
  width: number;
  offsetX: number;
  offsetY: number;
}

function moveItem<T>(items: T[], fromIndex: number, toIndex: number) {
  if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0 || fromIndex >= items.length || toIndex >= items.length) {
    return items;
  }

  const next = [...items];
  const [moved] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, moved);
  return next;
}

function ReorderExercisesOverlay({ exercisesList, onClose, onSave }: ReorderExercisesOverlayProps) {
  const [draftExercises, setDraftExercises] = useState(exercisesList);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [dragPreview, setDragPreview] = useState<ReorderDragPreview | null>(null);
  const draggingIndexRef = useRef<number | null>(null);
  const activePointerIdRef = useRef<number | null>(null);

  useEffect(() => {
    setDraftExercises(exercisesList);
  }, [exercisesList]);

  const handlePointerMove = (event: { clientX: number; clientY: number; preventDefault?: () => void }) => {
    if (draggingIndexRef.current === null) return;

    event.preventDefault?.();
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
      ?.closest('[data-reorder-index]') as HTMLElement | null;
    if (!target) return;

    const targetIndex = Number(target.dataset.reorderIndex);
    const currentIndex = draggingIndexRef.current;
    if (!Number.isInteger(targetIndex) || targetIndex === currentIndex) return;

    setDraftExercises((current) => moveItem(current, currentIndex, targetIndex));
    draggingIndexRef.current = targetIndex;
    setDraggingIndex(targetIndex);
  };

  const handlePointerEnd = () => {
    activePointerIdRef.current = null;
    draggingIndexRef.current = null;
    setDraggingIndex(null);
    setDragPreview(null);
  };

  useEffect(() => {
    if (draggingIndex === null) return;

    const handleWindowPointerMove = (event: globalThis.PointerEvent) => {
      if (activePointerIdRef.current !== null && event.pointerId !== activePointerIdRef.current) return;
      handlePointerMove(event);
    };
    const handleWindowPointerEnd = (event: globalThis.PointerEvent) => {
      if (activePointerIdRef.current !== null && event.pointerId !== activePointerIdRef.current) return;
      handlePointerEnd();
    };
    const handleWindowBlur = () => {
      handlePointerEnd();
    };

    window.addEventListener('pointermove', handleWindowPointerMove, { passive: false });
    window.addEventListener('pointerup', handleWindowPointerEnd);
    window.addEventListener('pointercancel', handleWindowPointerEnd);
    window.addEventListener('blur', handleWindowBlur);

    return () => {
      window.removeEventListener('pointermove', handleWindowPointerMove);
      window.removeEventListener('pointerup', handleWindowPointerEnd);
      window.removeEventListener('pointercancel', handleWindowPointerEnd);
      window.removeEventListener('blur', handleWindowBlur);
    };
  }, [draggingIndex]);

  return (
    <div className="fixed inset-0 z-50 bg-zinc-950 text-white">
      <div className="flex min-h-full flex-col">
        <div className="sticky top-0 z-10 border-b border-white/10 bg-zinc-950/95 px-4 py-4 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-zinc-400 transition-colors hover:bg-white/[0.06] hover:text-white"
              aria-label="Close reorder exercises"
            >
              <X className="h-6 w-6" />
            </button>
            <h2 className="text-2xl font-semibold">Reorder Exercises</h2>
          </div>
        </div>

        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4 pb-28">
          {draftExercises.map((exerciseLog, index) => {
            const exerciseData = exercises.find((exercise) => exercise.id === exerciseLog.exerciseId);
            return (
              <div
                key={exerciseLog.exerciseId}
                data-reorder-index={index}
                className={`reorder-exercise-row premium-row flex items-center gap-3 p-3 transition-colors ${
                  draggingIndex === index ? 'border-blue-400/40 bg-blue-500/10' : ''
                } ${dragPreview?.exercise.exerciseId === exerciseLog.exerciseId ? 'opacity-[0.45]' : ''}`}
              >
                {exerciseData && <ExerciseThumbnail exercise={exerciseData} size="md" />}
                <div className="min-w-0 flex-1">
                  <div className="truncate text-lg font-medium text-white">{exerciseLog.exerciseName}</div>
                  <div className="mt-1 text-xs text-zinc-500">{exerciseLog.sets.length} sets</div>
                </div>
                <button
                  type="button"
                  onPointerDown={(event) => {
                    const row = event.currentTarget.closest('[data-reorder-index]') as HTMLElement | null;
                    const rect = row?.getBoundingClientRect();
                    activePointerIdRef.current = event.pointerId;
                    draggingIndexRef.current = index;
                    setDraggingIndex(index);
                    if (rect) {
                      setDragPreview({
                        exercise: exerciseLog,
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
                  aria-label={`Drag ${exerciseLog.exerciseName}`}
                >
                  <GripVertical className="h-6 w-6" />
                </button>
              </div>
            );
          })}
        </div>

        {dragPreview && (
          <div
            className="reorder-drag-preview fixed z-[60] pointer-events-none premium-row flex items-center gap-3 p-3"
            style={{
              left: `${dragPreview.x}px`,
              top: `${dragPreview.y}px`,
              width: `${dragPreview.width}px`,
            }}
          >
            {(() => {
              const exerciseData = exercises.find((exercise) => exercise.id === dragPreview.exercise.exerciseId);
              return exerciseData ? <ExerciseThumbnail exercise={exerciseData} size="md" /> : null;
            })()}
            <div className="min-w-0 flex-1">
              <div className="truncate text-lg font-medium text-white">{dragPreview.exercise.exerciseName}</div>
              <div className="mt-1 text-xs text-zinc-500">{dragPreview.exercise.sets.length} sets</div>
            </div>
            <GripVertical className="h-6 w-6 shrink-0 text-blue-200" />
          </div>
        )}

        <div className="fixed bottom-0 left-0 right-0 border-t border-white/10 bg-zinc-950/95 px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-4 backdrop-blur-xl">
          <button
            type="button"
            onClick={() => onSave(draftExercises)}
            className="premium-button premium-button-primary mx-auto flex h-14 w-full max-w-sm items-center justify-center text-lg font-semibold"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

function DraggableExercise({
  exercise,
  allExercises,
  showExtras,
  onToggleExtras,
  onAddSet,
  onOpenInput,
  onToggleSetCompletion,
  onDeleteSet,
  onSetTypeChange,
  onShowAlternatives,
  onShowHowToLog,
  onOpenReorder,
  onOpenSupersetPicker,
  onAdjustRestTime,
  onClearSuperset,
  onRemoveExercise,
  rankResult,
  activeInput,
  restTimersEnabled,
}: DraggableExerciseProps) {
  const [setTypeSelectorOpen, setSetTypeSelectorOpen] = useState(false);
  const [selectedSetIndex, setSelectedSetIndex] = useState<number | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const exerciseData = exercises.find(ex => ex.id === exercise.exerciseId);
  const logging = getExerciseLogging(exerciseData);
  const loggingFields = logging.fields;
  const fieldGridColumns = loggingFields
    .map((field) => (field.key === 'duration' ? 'minmax(2.5rem, 1fr)' : 'minmax(2.25rem, 0.88fr)'))
    .join(' ');
  const setGridStyle = {
    gridTemplateColumns: `2rem minmax(3.9rem, 1.2fr) ${fieldGridColumns} 2rem`,
  };
  const hasRankProgression = Boolean(rankResult?.eligible);
  const visibleMuscles = exercise.mainMuscles.slice(0, 3);
  const hiddenMuscleCount = Math.max(0, exercise.mainMuscles.length - visibleMuscles.length);
  const supersetPartner = exercise.supersetGroupId
    ? allExercises.find((item) => item.exerciseId !== exercise.exerciseId && item.supersetGroupId === exercise.supersetGroupId)
    : null;

  const getSetTypeLabel = (setIndex: number) => {
    const set = exercise.sets[setIndex];
    const type = set.type;
    
    if (!type || type === 'normal') {
      // Count only normal sets before this one
      const normalSetsBefore = exercise.sets
        .slice(0, setIndex)
        .filter(s => !s.type || s.type === 'normal').length;
      return (normalSetsBefore + 1).toString();
    }
    if (type === 'warmup') return 'W';
    if (type === 'drop') return 'D';
    if (type === 'failure') return 'F';
    return '#';
  };

  const handleSetTypeClick = (setIndex: number) => {
    setSelectedSetIndex(setIndex);
    setSetTypeSelectorOpen(true);
  };

  const handleSetTypeSelect = (type: SetType) => {
    if (selectedSetIndex !== null) {
      onSetTypeChange(selectedSetIndex, type);
    }
  };

  const getSetTypeButtonClass = (set: WorkoutSet) => {
    const type = set.type || 'normal';
    const isSpecialType = type !== 'normal';

    if (isSpecialType) {
      return `${getSetTypeStyles(type).compact} ${set.completed ? 'cursor-not-allowed' : 'hover:brightness-125'}`;
    }

    return set.completed
      ? 'workout-field-complete cursor-not-allowed'
      : 'workout-field hover:border-white/20';
  };

  return (
    <div className="premium-card active-exercise-card relative overflow-visible">
      {/* Exercise Header */}
      <div className="active-exercise-header p-3 sm:p-4">
        <div className="flex items-start gap-3">
        {exerciseData && <ExerciseThumbnail exercise={exerciseData} size="md" />}
        
        <div className="min-w-0 flex-1">
          {exercise.supersetGroupId && (
            <div className="mb-1.5 flex min-w-0 items-center gap-2">
              <span className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-blue-300/25 bg-blue-500/12 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-normal text-blue-200 shadow-[0_0_16px_rgba(59,130,246,0.12)]">
                <Link2 className="h-3 w-3 shrink-0" />
                <span className="truncate">
                  Superset{supersetPartner ? ` with ${supersetPartner.exerciseName}` : ''}
                </span>
              </span>
            </div>
          )}
          <h3 className="truncate text-base font-semibold leading-tight text-white">{exercise.exerciseName}</h3>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {visibleMuscles.map((muscle) => (
              <span
                key={muscle}
                className="premium-badge px-2 py-0.5 text-[11px] text-blue-300"
              >
                {muscle}
              </span>
            ))}
            {hiddenMuscleCount > 0 && (
              <span className="premium-badge px-2 py-0.5 text-[11px] text-zinc-400">+{hiddenMuscleCount}</span>
            )}
          </div>
        </div>

        <div className="flex shrink-0 items-start gap-2">
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/[0.035] text-zinc-400 transition-colors hover:bg-white/[0.06] hover:text-white"
            aria-label={`Open ${exercise.exerciseName} menu`}
          >
            <MoreVertical className="h-5 w-5" />
          </button>
        </div>
        </div>

        {menuOpen && (
          <>
            <button
              type="button"
              className="fixed inset-0 z-30 cursor-default"
              aria-label="Close exercise menu"
              onClick={() => setMenuOpen(false)}
            />
            <div className="absolute right-3 top-12 z-40 w-64 overflow-hidden rounded-2xl border border-white/15 bg-zinc-950 shadow-[0_20px_60px_rgba(0,0,0,0.6)]">
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onOpenReorder();
                }}
                className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-zinc-100 transition-colors hover:bg-white/[0.06]"
              >
                <ListOrdered className="h-4 w-4 text-blue-300" />
                Reorder Exercises
              </button>
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onShowAlternatives();
                }}
                className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-zinc-100 transition-colors hover:bg-white/[0.06]"
              >
                <RefreshCw className="h-4 w-4 text-blue-300" />
                Suggest Alternative
              </button>
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onOpenSupersetPicker();
                }}
                className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-zinc-100 transition-colors hover:bg-white/[0.06]"
              >
                <Link2 className="h-4 w-4 text-blue-300" />
                {exercise.supersetGroupId ? 'Change Superset' : 'Add to Superset'}
              </button>
              {exercise.supersetGroupId && (
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onClearSuperset();
                  }}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-zinc-100 transition-colors hover:bg-white/[0.06]"
                >
                  <Unlink className="h-4 w-4 text-zinc-300" />
                  Remove Superset
                </button>
              )}
              {restTimersEnabled && (
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onAdjustRestTime();
                  }}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-zinc-100 transition-colors hover:bg-white/[0.06]"
                >
                  <Clock className="h-4 w-4 text-blue-300" />
                  Adjust Rest Time
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onShowHowToLog();
                }}
                className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-zinc-100 transition-colors hover:bg-white/[0.06]"
              >
                <BookOpen className="h-4 w-4 text-blue-300" />
                How to Log
              </button>
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onRemoveExercise();
                }}
                className="flex w-full items-center gap-3 border-t border-white/10 px-4 py-3 text-left text-sm text-red-200 transition-colors hover:bg-red-500/10"
              >
                <Trash2 className="h-4 w-4" />
                Remove Exercise
              </button>
            </div>
          </>
        )}

      </div>

      {/* Sets Table - Always Visible */}
      <div className="px-2 py-3 sm:px-3">
        {exercise.sets.length > 0 && (
          <div className="mb-3 space-y-1.5">
            <div className="active-set-grid px-1.5 text-center text-[10px] font-semibold uppercase tracking-normal text-zinc-500 sm:px-2" style={setGridStyle}>
              <span className="text-left">Set</span>
              <span>Prev</span>
            {loggingFields.map((field) => (
                <span key={field.key}>{field.label}</span>
              ))}
              <span></span>
            </div>
            {exercise.sets.map((set, idx) => {
              const prevSet = exercise.previousSets && exercise.previousSets[idx];
              return (
                <SwipeSetRow
                  key={idx}
                  set={set}
                  setIndex={idx}
                  previousSet={prevSet}
                  logging={logging}
                  loggingFields={loggingFields}
                  setGridStyle={setGridStyle}
                  activeInput={activeInput?.exerciseId === exercise.exerciseId ? activeInput : null}
                  getSetTypeLabel={getSetTypeLabel}
                  getSetTypeButtonClass={getSetTypeButtonClass}
                  onSetTypeClick={handleSetTypeClick}
                  onOpenInput={onOpenInput}
                  onToggleSetCompletion={onToggleSetCompletion}
                  onDeleteSet={onDeleteSet}
                />
              );
            })}
          </div>
        )}

        {/* Add Set Button */}
        <button
          onClick={onAddSet}
          className="premium-button premium-button-primary w-full py-2.5 flex items-center justify-center gap-2 mb-2"
        >
          <Plus className="w-4 h-4" />
          Add Set
        </button>

        {hasRankProgression && (
          <button
            onClick={onToggleExtras}
            className="w-full rounded-lg py-2 text-sm text-zinc-400 transition-colors hover:bg-white/[0.035] hover:text-zinc-200 flex items-center justify-center gap-2"
          >
            {showExtras ? (
              <>
                <ChevronUp className="w-4 h-4" />
                Hide Exercise Progression
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4" />
                Exercise Progression
              </>
            )}
          </button>
        )}
      </div>

      {/* Extras Section (Collapsible) */}
      {showExtras && hasRankProgression && (
        <div className="px-4 pb-4 border-t border-white/10 pt-3 space-y-2">
          {rankResult?.eligible && (
            <ExerciseRankCard result={rankResult} className="p-3" />
          )}
        </div>
      )}

      {/* Set Type Selector */}
      <SetTypeSelector
        isOpen={setTypeSelectorOpen}
        onClose={() => setSetTypeSelectorOpen(false)}
        currentType={selectedSetIndex !== null ? (exercise.sets[selectedSetIndex]?.type || 'normal') : 'normal'}
        onSelectType={handleSetTypeSelect}
      />
    </div>
  );
}

function ActiveWorkoutPageContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const { weightIncrement, weightUnit, restTimers } = useSettings();
  const { user } = useAuth();
  const {
    minimizeWorkout,
    workoutExercises: contextExercises,
    workoutName: contextWorkoutName,
    updateWorkoutExercises,
    elapsedSeconds,
    workoutSheetOffset,
    isWorkoutSheetOffsetDragging,
    setWorkoutSheetOffset,
    activeRestTimer,
    setActiveRestTimer,
  } = useWorkout();
  
  const shouldAnimateOpenFromMinimized = useMemo(() => readOpenFromMinimizedFlag(), []);
  const workoutName = contextWorkoutName || 'Active Workout';
  const initialSheetDragOffset =
    workoutSheetOffset ?? (shouldAnimateOpenFromMinimized ? getActiveWorkoutCollapsedOffset() : 0);

  const [workoutExercises, setWorkoutExercises] = useState<ExerciseLog[]>(() => {
    if (contextExercises.length > 0) {
      return contextExercises.map((exerciseLog) => withPreferredRestSeconds(exerciseLog, user?.id));
    }
    return [];
  });

  const [expandedExtras, setExpandedExtras] = useState<Set<string>>(new Set());
  const [inputState, setInputState] = useState<InputState | null>(null);
  const [alternativeDialogOpen, setAlternativeDialogOpen] = useState(false);
  const [addExerciseDialogOpen, setAddExerciseDialogOpen] = useState(false);
  const [deleteExerciseDialogOpen, setDeleteExerciseDialogOpen] = useState(false);
  const [exerciseToDelete, setExerciseToDelete] = useState<string | null>(null);
  const [selectedExerciseForAlternative, setSelectedExerciseForAlternative] = useState<string | null>(null);
  const [exerciseSearchQuery, setExerciseSearchQuery] = useState('');
  const [reorderExercisesOpen, setReorderExercisesOpen] = useState(false);
  const [infoModalOpen, setInfoModalOpen] = useState(false);
  const [infoModalMessage, setInfoModalMessage] = useState('');
  const [infoModalTitle, setInfoModalTitle] = useState('');
  const [selectedExerciseForHelp, setSelectedExerciseForHelp] = useState<string | null>(null);
  const [selectedExerciseForSuperset, setSelectedExerciseForSuperset] = useState<string | null>(null);
  const [selectedExerciseForRest, setSelectedExerciseForRest] = useState<string | null>(null);
  const [restNow, setRestNow] = useState(() => Date.now());
  const [restPanelOpen, setRestPanelOpen] = useState(false);
  const [sheetDragOffset, setSheetDragOffset] = useState(initialSheetDragOffset);
  const [isSheetDragging, setIsSheetDragging] = useState(false);
  const [isSheetClosing, setIsSheetClosing] = useState(false);
  const [isSheetOpening, setIsSheetOpening] = useState(shouldAnimateOpenFromMinimized);
  const sheetDragStartYRef = useRef(0);
  const sheetDragOffsetRef = useRef(initialSheetDragOffset);
  const sheetPointerIdRef = useRef<number | null>(null);
  const sheetCloseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isSheetClosingRef = useRef(false);
  const isSheetDraggingRef = useRef(false);

  // Sync with context whenever local state changes
  useEffect(() => {
    updateWorkoutExercises(workoutExercises);
  }, [workoutExercises]);

  useEffect(() => {
    if (!activeRestTimer) return;

    setRestNow(Date.now());
    const interval = window.setInterval(() => {
      setRestNow(Date.now());
    }, 250);

    return () => window.clearInterval(interval);
  }, [activeRestTimer]);

  useEffect(() => {
    if (!activeRestTimer) return;

    const remainingSeconds = Math.max(0, Math.ceil((activeRestTimer.endsAt - restNow) / 1000));
    if (remainingSeconds > 0 || activeRestTimer.completedNotified) return;

    triggerHaptic('success', { force: true });
    setRestPanelOpen(false);
    setActiveRestTimer((timer) => (timer && timer.endsAt === activeRestTimer.endsAt ? null : timer));
  }, [activeRestTimer, restNow, setActiveRestTimer]);

  useEffect(() => {
    if (restTimers) return;

    setActiveRestTimer(null);
    setRestPanelOpen(false);
    setSelectedExerciseForRest(null);
  }, [restTimers]);

  useEffect(() => {
    if (!activeRestTimer) return;
    if (workoutExercises.some((exercise) => exercise.exerciseId === activeRestTimer.exerciseId)) return;

    setActiveRestTimer(null);
    setRestPanelOpen(false);
  }, [activeRestTimer, workoutExercises]);

  const toggleExtras = (exerciseId: string) => {
    setExpandedExtras(prev => {
      const newSet = new Set(prev);
      if (newSet.has(exerciseId)) {
        newSet.delete(exerciseId);
      } else {
        newSet.add(exerciseId);
      }
      return newSet;
    });
  };

  const addSet = (exerciseId: string) => {
    setWorkoutExercises((prev) =>
      prev.map((ex) =>
        ex.exerciseId === exerciseId
          ? {
              ...ex,
              sets: [
                ...ex.sets,
                createSetFromPrevious(
                  ex.sets.length + 1,
                  ex.sets.length > 0 ? ex.sets[ex.sets.length - 1] : undefined,
                  getExerciseLogging(exercises.find((item) => item.id === exerciseId)),
                ),
              ],
            }
          : ex
      )
    );
  };

  const openInput = (exerciseId: string, setIndex: number, field: LoggingFieldKey, value: number) => {
    setInputState({ exerciseId, setIndex, field, value });
  };

  const closeInput = () => {
    setInputState(null);
  };

  const handleInputChange = (value: number) => {
    if (!inputState) return;
    
    setWorkoutExercises((prev) =>
      prev.map((ex) =>
        ex.exerciseId === inputState.exerciseId
          ? {
              ...ex,
              sets: ex.sets.map((set, idx) =>
                idx === inputState.setIndex ? { ...set, [inputState.field]: value } : set
              ),
            }
          : ex
      )
    );
    
    setInputState({ ...inputState, value });
  };

  const startRestTimer = (exercise: ExerciseLog) => {
    if (!restTimers) return;

    const durationSeconds = getExerciseLogRestSeconds(exercise);
    const now = Date.now();
    setRestNow(now);
    setActiveRestTimer({
      exerciseId: exercise.exerciseId,
      exerciseName: exercise.exerciseName,
      durationSeconds,
      endsAt: now + durationSeconds * 1000,
      completedNotified: false,
    });
    setRestPanelOpen(false);
  };

  const adjustActiveRestTimer = (deltaSeconds: number) => {
    setActiveRestTimer((timer) => {
      if (!timer) return timer;

      const now = Date.now();
      const remainingSeconds = Math.max(0, Math.ceil((timer.endsAt - now) / 1000));
      const nextRemainingSeconds = Math.max(0, Math.min(MAX_REST_SECONDS, remainingSeconds + deltaSeconds));
      setRestNow(now);

      return {
        ...timer,
        durationSeconds: clampRestSeconds(timer.durationSeconds + deltaSeconds),
        endsAt: now + nextRemainingSeconds * 1000,
        completedNotified: nextRemainingSeconds <= 0,
      };
    });
  };

  const skipRestTimer = () => {
    setActiveRestTimer(null);
    setRestPanelOpen(false);
  };

  const adjustExerciseRestTime = (exerciseId: string, deltaSeconds: number) => {
    const currentExercise = workoutExercises.find((exercise) => exercise.exerciseId === exerciseId);
    const nextRestSeconds = clampRestSeconds(getExerciseLogRestSeconds(currentExercise ?? {}) + deltaSeconds);

    if (user) {
      DataService.updateExerciseRestSeconds(user.id, exerciseId, nextRestSeconds);
    }

    setWorkoutExercises((prev) =>
      prev.map((exercise) =>
        exercise.exerciseId === exerciseId
          ? {
              ...exercise,
              restSeconds: nextRestSeconds,
            }
          : exercise,
      ),
    );
  };

  const toggleSetCompletion = (exerciseId: string, setIndex: number) => {
    const exercise = workoutExercises.find(ex => ex.exerciseId === exerciseId);
    const set = exercise?.sets[setIndex];

    if (set && !set.completed) {
      const exerciseMeta = exercises.find((item) => item.id === exerciseId);
      const logging = getExerciseLogging(exerciseMeta);
      if (!canCompleteSet(set, logging)) {
        return;
      }

      closeInput();
      startRestTimer(exercise);
    }
    
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

  const setSetType = (exerciseId: string, setIndex: number, type: SetType) => {
    setWorkoutExercises((prev) =>
      prev.map((ex) =>
        ex.exerciseId === exerciseId
          ? {
              ...ex,
              sets: ex.sets.map((set, idx) =>
                idx === setIndex ? { ...set, type } : set
              ),
            }
          : ex
      )
    );
  };

  const confirmRemoveExercise = (exerciseId: string) => {
    setExerciseToDelete(exerciseId);
    setDeleteExerciseDialogOpen(true);
  };

  const removeExercise = () => {
    if (exerciseToDelete) {
      setWorkoutExercises((prev) => normalizeSupersetGroups(prev.filter((ex) => ex.exerciseId !== exerciseToDelete)));
      setExerciseToDelete(null);
      setDeleteExerciseDialogOpen(false);
    }
  };

  const openSupersetPicker = (exerciseId: string) => {
    closeInput();
    setSelectedExerciseForSuperset(exerciseId);
  };

  const assignSuperset = (sourceExerciseId: string, partnerExerciseId: string) => {
    const sourceExercise = workoutExercises.find((exercise) => exercise.exerciseId === sourceExerciseId);
    const partnerExercise = workoutExercises.find((exercise) => exercise.exerciseId === partnerExerciseId);
    if (!sourceExercise || !partnerExercise) return;

    const previousGroups = new Set(
      [sourceExercise.supersetGroupId, partnerExercise.supersetGroupId].filter((groupId): groupId is string => Boolean(groupId)),
    );
    const nextGroupId = createSupersetGroupId();

    setWorkoutExercises((prev) =>
      normalizeSupersetGroups(
        prev.map((exercise) => {
          if (exercise.exerciseId === sourceExerciseId || exercise.exerciseId === partnerExerciseId) {
            return { ...exercise, supersetGroupId: nextGroupId };
          }

          if (exercise.supersetGroupId && previousGroups.has(exercise.supersetGroupId)) {
            return { ...exercise, supersetGroupId: undefined };
          }

          return exercise;
        }),
      ),
    );
    setSelectedExerciseForSuperset(null);
  };

  const clearSuperset = (exerciseId: string) => {
    const groupId = workoutExercises.find((exercise) => exercise.exerciseId === exerciseId)?.supersetGroupId;
    if (!groupId) return;

    setWorkoutExercises((prev) =>
      prev.map((exercise) => (exercise.supersetGroupId === groupId ? { ...exercise, supersetGroupId: undefined } : exercise)),
    );
  };

  const addNewExercise = (exercise: Exercise) => {
    const previousSets = user ? DataService.getPreviousWorkoutSets(user.id, exercise.id) : null;
    const newExerciseLog: ExerciseLog = {
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      mainMuscles: exercise.mainMuscles,
      sets: [],
      restSeconds: getPreferredExerciseRestSeconds(user?.id, exercise.id),
      previousSets: previousSets || undefined,
    };
    setWorkoutExercises((prev) => [...prev, newExerciseLog]);
    setAddExerciseDialogOpen(false);
    setExerciseSearchQuery('');
  };

  const handleAddExerciseClick = () => {
    // Navigate to exercise selection with a flag to return to active workout
    navigate('/exercise-selection', { 
      state: { 
        fromActiveWorkout: true,
        currentExercises: workoutExercises.map(ex => ex.exerciseId)
      } 
    });
  };

  const showAlternatives = (exerciseId: string) => {
    setSelectedExerciseForAlternative(exerciseId);
    setAlternativeDialogOpen(true);
  };

  const showHowToLog = (exerciseId: string) => {
    const exerciseData = exercises.find(ex => ex.id === exerciseId);
    if (exerciseData && exerciseData.loggingGuidance) {
      setInfoModalTitle('How to Log');
      setInfoModalMessage(exerciseData.loggingGuidance);
      setInfoModalOpen(true);
    }
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
                supersetGroupId: oldExercise.supersetGroupId,
                restSeconds: getPreferredExerciseRestSeconds(user?.id, newExercise.id),
                previousSets: user ? DataService.getPreviousWorkoutSets(user.id, newExercise.id) ?? undefined : undefined,
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
      .slice(0, 6);
  };

  const filteredAddExercises = exercises.filter(
    (ex) =>
      !workoutExercises.find((we) => we.exerciseId === ex.id) &&
      ex.name.toLowerCase().includes(exerciseSearchQuery.toLowerCase())
  );

  const handleFinishClick = () => {
    navigate('/finish-workout');
  };

  const clearSheetCloseTimeout = () => {
    if (sheetCloseTimeoutRef.current) {
      clearTimeout(sheetCloseTimeoutRef.current);
      sheetCloseTimeoutRef.current = null;
    }
  };

  const completeMinimize = () => {
    clearSheetCloseTimeout();

    sheetPointerIdRef.current = null;
    sheetDragOffsetRef.current = 0;
    isSheetDraggingRef.current = false;
    isSheetClosingRef.current = false;
    setIsSheetDragging(false);
    setIsSheetClosing(false);
    setIsSheetOpening(false);
    setSheetDragOffset(0);
    setWorkoutSheetOffset(null, false);
    minimizeWorkout();
  };

  const handleMinimize = (withGestureAnimation = false) => {
    closeInput();

    if (!withGestureAnimation || typeof window === 'undefined') {
      completeMinimize();
      return;
    }

    clearSheetCloseTimeout();

    sheetPointerIdRef.current = null;
    isSheetDraggingRef.current = false;
    isSheetClosingRef.current = true;
    setIsSheetDragging(false);
    setIsSheetClosing(true);
    setIsSheetOpening(false);
    setWorkoutSheetOffset(null, false);
    const collapsedOffset = getActiveWorkoutCollapsedOffset();
    const startOffset = sheetDragOffsetRef.current;
    setSheetDragOffset(startOffset);
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        sheetDragOffsetRef.current = collapsedOffset;
        setSheetDragOffset(collapsedOffset);
      });
    });
    sheetCloseTimeoutRef.current = setTimeout(() => {
      completeMinimize();
    }, ACTIVE_WORKOUT_SHEET_TRANSITION_MS + 80);
  };

  useEffect(
    () => () => {
      if (sheetCloseTimeoutRef.current) {
        clearTimeout(sheetCloseTimeoutRef.current);
      }
    },
    [],
  );

  useEffect(() => {
    if (!shouldAnimateOpenFromMinimized) return;

    const frameId = window.requestAnimationFrame(() => {
      sheetDragOffsetRef.current = 0;
      setSheetDragOffset(0);
    });
    const timeoutId = window.setTimeout(() => {
      setIsSheetOpening(false);
    }, ACTIVE_WORKOUT_SHEET_TRANSITION_MS + 80);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.clearTimeout(timeoutId);
    };
  }, []);

  useEffect(() => {
    if (workoutSheetOffset === null) {
      setIsSheetOpening(false);
      return;
    }

    sheetDragOffsetRef.current = workoutSheetOffset;
    setSheetDragOffset(workoutSheetOffset);
    setIsSheetClosing(false);
    setIsSheetOpening(!isWorkoutSheetOffsetDragging);
  }, [isWorkoutSheetOffsetDragging, workoutSheetOffset]);

  useEffect(() => {
    if (!isSheetDragging) return;

    const handleWindowPointerMove = (event: globalThis.PointerEvent) => {
      if (sheetPointerIdRef.current !== null && event.pointerId !== sheetPointerIdRef.current) return;
      if (!isSheetDraggingRef.current) return;

      const deltaY = event.clientY - sheetDragStartYRef.current;
      const maxOffset = getActiveWorkoutCollapsedOffset();
      const clampedOffset = clampNumber(deltaY, 0, maxOffset);
      sheetDragOffsetRef.current = clampedOffset;
      setSheetDragOffset(clampedOffset);

      if (Math.abs(deltaY) > 4) {
        event.preventDefault();
      }
    };

    const handleWindowPointerEnd = (event: globalThis.PointerEvent) => {
      if (sheetPointerIdRef.current !== null && event.pointerId !== sheetPointerIdRef.current) return;
      if (!isSheetDraggingRef.current) return;

      const shouldMinimize = sheetDragOffsetRef.current > getActiveWorkoutCollapseThreshold();
      sheetPointerIdRef.current = null;
      isSheetDraggingRef.current = false;
      setIsSheetDragging(false);

      if (shouldMinimize) {
        handleMinimize(true);
        return;
      }

      sheetDragOffsetRef.current = 0;
      setSheetDragOffset(0);
    };

    const handleWindowBlur = () => {
      sheetPointerIdRef.current = null;
      isSheetDraggingRef.current = false;
      isSheetClosingRef.current = false;
      setIsSheetDragging(false);
      setIsSheetClosing(false);
      setIsSheetOpening(false);
      sheetDragOffsetRef.current = 0;
      setSheetDragOffset(0);
    };

    window.addEventListener('pointermove', handleWindowPointerMove, { passive: false });
    window.addEventListener('pointerup', handleWindowPointerEnd);
    window.addEventListener('pointercancel', handleWindowPointerEnd);
    window.addEventListener('blur', handleWindowBlur);

    return () => {
      window.removeEventListener('pointermove', handleWindowPointerMove);
      window.removeEventListener('pointerup', handleWindowPointerEnd);
      window.removeEventListener('pointercancel', handleWindowPointerEnd);
      window.removeEventListener('blur', handleWindowBlur);
    };
  }, [isSheetDragging]);

  const startSheetDrag = (event: PointerEvent<HTMLElement>) => {
    if (isSheetOpening || isSheetClosingRef.current || isSheetClosing || sheetPointerIdRef.current !== null) {
      event.preventDefault();
      return;
    }

    clearSheetCloseTimeout();
    closeInput();
    sheetPointerIdRef.current = event.pointerId;
    sheetDragStartYRef.current = event.clientY;
    sheetDragOffsetRef.current = 0;
    setSheetDragOffset(0);
    isSheetClosingRef.current = false;
    isSheetDraggingRef.current = true;
    setIsSheetClosing(false);
    setIsSheetOpening(false);
    setIsSheetDragging(true);
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.setPointerCapture(event.pointerId);
    }
    event.preventDefault();
  };

  const handleSaveReorder = (nextExercises: ExerciseLog[]) => {
    setWorkoutExercises(nextExercises);
    setReorderExercisesOpen(false);
  };

  const advanceInputField = () => {
    if (!inputState || !inputExerciseData || !inputExercise) {
      closeInput();
      return;
    }

    const fields = getExerciseLogging(inputExerciseData).fields;
    const currentFieldIndex = fields.findIndex((field) => field.key === inputState.field);
    const nextField = fields[currentFieldIndex + 1];

    if (nextField) {
      setInputState({
        exerciseId: inputState.exerciseId,
        setIndex: inputState.setIndex,
        field: nextField.key,
        value: getSetFieldValue(inputExercise.sets[inputState.setIndex], nextField.key),
      });
      return;
    }

    const nextSetIndex = inputState.setIndex + 1;
    const firstField = fields[0];
    const nextSet = inputExercise.sets[nextSetIndex];

    if (nextSet && firstField) {
      setInputState({
        exerciseId: inputState.exerciseId,
        setIndex: nextSetIndex,
        field: firstField.key,
        value: getSetFieldValue(nextSet, firstField.key),
      });
      return;
    }

    closeInput();
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

  const inputExercise = inputState ? workoutExercises.find((exercise) => exercise.exerciseId === inputState.exerciseId) : null;
  const inputExerciseData = inputExercise ? exercises.find((exercise) => exercise.id === inputExercise.exerciseId) : null;
  const inputField = inputState
    ? getExerciseLogging(inputExerciseData).fields.find((field) => field.key === inputState.field)
    : null;
  const inputLabel = inputField?.label ?? (inputState?.field === 'weight' ? 'Weight' : 'Reps');
  const inputPanelLabel =
    inputField?.key === 'weight'
      ? 'Log the total weight'
      : inputField?.key === 'reps'
        ? 'Log the total number of reps'
        : inputField?.key === 'duration'
          ? 'Log the time'
          : inputField?.key === 'distance'
            ? 'Log the distance'
            : inputField?.key === 'incline'
              ? 'Log the incline'
              : inputLabel;
  const inputUnit = inputField?.key === 'weight' ? weightUnit : inputField?.unit ?? '';
  const historicalRankWorkouts = useMemo(
    () => (user ? DataService.getWorkoutsByUserId(user.id) : []),
    [user?.id],
  );
  const workoutsForRank = useMemo(
    () =>
      user
        ? [
            {
              id: 'active-workout-preview',
              workoutName,
              date: new Date().toISOString().slice(0, 10),
              bodyweightKg: user.weight,
              exercises: workoutExercises,
            },
            ...historicalRankWorkouts,
          ]
        : [],
    [historicalRankWorkouts, user?.weight, workoutExercises, workoutName],
  );
  const rankResultsByExerciseId = useMemo(() => {
    const results = new Map<string, ExerciseRankResult | null>();

    workoutExercises.forEach((exerciseLog) => {
      const exerciseData = exercises.find((item) => item.id === exerciseLog.exerciseId);
      results.set(exerciseLog.exerciseId, getExerciseRank(exerciseData, workoutsForRank, user?.weight, user?.gender));
    });

    return results;
  }, [user?.gender, user?.weight, workoutExercises, workoutsForRank]);

  const supersetSourceExercise = selectedExerciseForSuperset
    ? workoutExercises.find((exercise) => exercise.exerciseId === selectedExerciseForSuperset) ?? null
    : null;
  const supersetPartnerOptions = supersetSourceExercise
    ? workoutExercises.filter((exercise) => exercise.exerciseId !== supersetSourceExercise.exerciseId)
    : [];
  const restRemainingSeconds = activeRestTimer
    ? Math.max(0, Math.ceil((activeRestTimer.endsAt - restNow) / 1000))
    : 0;
  const restTimerActive = Boolean(restTimers && activeRestTimer && restRemainingSeconds > 0);
  const restProgressPercent = activeRestTimer
    ? Math.max(0, Math.min(100, 100 - (restRemainingSeconds / Math.max(1, activeRestTimer.durationSeconds)) * 100))
    : 0;
  const restStatusLabel = formatRestTimer(restRemainingSeconds);
  const selectedRestExercise = selectedExerciseForRest
    ? workoutExercises.find((exercise) => exercise.exerciseId === selectedExerciseForRest) ?? null
    : null;

  const isSheetTranslating = sheetDragOffset > 0 || isSheetClosing || isSheetOpening;
  const collapsedOffset = getActiveWorkoutCollapsedOffset();
  const navRevealProgress = clampNumber(sheetDragOffset / Math.max(1, collapsedOffset), 0, 1);
  const headerMorphProgress = clampNumber((navRevealProgress - 0.08) / 0.84, 0, 1);
  const expandedHeaderOpacity = 1 - headerMorphProgress;
  const headerMorphTransition = isSheetDragging || isWorkoutSheetOffsetDragging
    ? 'none'
    : `opacity ${ACTIVE_WORKOUT_SHEET_TRANSITION_MS}ms ${ACTIVE_WORKOUT_SHEET_EASING}, transform ${ACTIVE_WORKOUT_SHEET_TRANSITION_MS}ms ${ACTIVE_WORKOUT_SHEET_EASING}`;
  const sheetBottomInset = ACTIVE_WORKOUT_BOTTOM_NAV_HEIGHT * navRevealProgress;
  const sheetTransition = `transform ${ACTIVE_WORKOUT_SHEET_TRANSITION_MS}ms ${ACTIVE_WORKOUT_SHEET_EASING}, height ${ACTIVE_WORKOUT_SHEET_TRANSITION_MS}ms ${ACTIVE_WORKOUT_SHEET_EASING}, max-height ${ACTIVE_WORKOUT_SHEET_TRANSITION_MS}ms ${ACTIVE_WORKOUT_SHEET_EASING}`;
  const sheetDragStyle: CSSProperties | undefined = isSheetTranslating
    ? {
        transform: `translate3d(0, ${sheetDragOffset}px, 0)`,
        height: `calc(100dvh - ${sheetDragOffset + sheetBottomInset}px)`,
        maxHeight: `calc(100dvh - ${sheetDragOffset + sheetBottomInset}px)`,
        minHeight: `${ACTIVE_WORKOUT_COLLAPSED_BAR_HEIGHT}px`,
        overflowY: sheetDragOffset > 4 ? 'hidden' : undefined,
        transition: isSheetDragging || isWorkoutSheetOffsetDragging ? 'none' : sheetTransition,
      }
    : undefined;

  return (
    <>
      <BottomNav
        activePath={location.pathname}
        className="active-workout-drag-nav"
        ariaHidden
        style={{
          opacity: navRevealProgress,
          transform: `translateY(${(1 - navRevealProgress) * 12}px)`,
          transition: isSheetDragging || isWorkoutSheetOffsetDragging
            ? 'none'
            : `opacity ${ACTIVE_WORKOUT_SHEET_TRANSITION_MS}ms ${ACTIVE_WORKOUT_SHEET_EASING}, transform ${ACTIVE_WORKOUT_SHEET_TRANSITION_MS}ms ${ACTIVE_WORKOUT_SHEET_EASING}`,
        }}
      />
      <div
        className={`screen-shell active-workout-shell active-workout-sheet ${
          isSheetDragging ? 'active-workout-shell-dragging' : ''
        }`}
        style={sheetDragStyle}
      >
      {/* Header */}
      <div
        className="sticky-header active-workout-topbar"
        onPointerDown={(event) => {
          if (!isInteractiveSheetDragTarget(event.target)) {
            startSheetDrag(event);
          }
        }}
      >
        <div
          className="pointer-events-none absolute inset-x-2 top-0 z-10"
          style={{
            opacity: headerMorphProgress,
            transform: `translate3d(0, ${(1 - headerMorphProgress) * 0.55}rem, 0)`,
            transition: headerMorphTransition,
          }}
          aria-hidden={headerMorphProgress < 0.5}
        >
          <WorkoutCollapsedHeader
            workoutName={workoutName}
            elapsedSeconds={elapsedSeconds}
            restRemainingSeconds={restTimerActive ? restRemainingSeconds : undefined}
          />
        </div>
        <div
          className="active-workout-expanded-header relative z-0 px-4 py-3"
          style={{
            opacity: expandedHeaderOpacity,
            transform: `translate3d(0, ${headerMorphProgress * -0.35}rem, 0)`,
            transition: headerMorphTransition,
            pointerEvents: headerMorphProgress > 0.72 ? 'none' : undefined,
          }}
        >
          <button
            type="button"
            onPointerDown={startSheetDrag}
            className="active-workout-drag-handle mb-2 flex w-full touch-none items-center justify-center py-1"
            aria-label="Drag to minimize workout"
          >
            <span />
          </button>
          <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <button
              type="button"
              onPointerDown={(event) => {
                event.stopPropagation();
              }}
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                handleMinimize(true);
              }}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.035] text-zinc-400 transition-colors hover:bg-white/[0.06] hover:text-white"
              aria-label="Minimize workout"
            >
              <ChevronDown className="w-6 h-6" />
            </button>
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-xl font-semibold leading-tight">{workoutName}</h1>
              <div className="mt-1 flex h-5 min-w-0 flex-nowrap items-center gap-2 overflow-hidden whitespace-nowrap text-xs text-zinc-400">
                <Clock className="w-3.5 h-3.5 text-blue-300" />
                <span className="font-mono text-zinc-200">{formatTime(elapsedSeconds)}</span>
                {restTimerActive && (
                  <>
                    <span className="text-zinc-600">-</span>
                    <button
                      type="button"
                      data-no-sheet-drag="true"
                      onPointerDown={(event) => event.stopPropagation()}
                      onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        setRestPanelOpen((open) => !open);
                      }}
                      className="flex h-5 shrink-0 items-center rounded-full border border-emerald-400/25 bg-emerald-500/12 px-2 py-0 font-mono text-[11px] font-semibold leading-none text-emerald-200 transition-colors hover:bg-emerald-500/18"
                    >
                      Rest {restStatusLabel}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={handleFinishClick}
            onPointerDown={(event) => {
              event.stopPropagation();
            }}
            className="premium-button premium-button-primary flex h-10 min-h-10 w-10 shrink-0 items-center justify-center p-0"
            aria-label="Finish workout"
          >
            <ArrowRight className="w-5 h-5 text-white" />
          </button>
          </div>
          {restTimerActive && restPanelOpen && (
            <div
              className="rest-timer-panel mt-3 rounded-2xl border border-emerald-400/20 bg-emerald-500/[0.08] p-3 shadow-[0_18px_45px_rgba(16,185,129,0.08)]"
              data-no-sheet-drag="true"
              onPointerDown={(event) => event.stopPropagation()}
            >
              <div className="mb-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-xs font-semibold uppercase tracking-normal text-emerald-200/80">Rest timer</div>
                  <div className="truncate text-sm text-zinc-300">{activeRestTimer?.exerciseName}</div>
                </div>
                <div className="font-mono text-2xl font-bold text-white">{restStatusLabel}</div>
              </div>
              <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-black/30">
                <div
                  className="h-full rounded-full bg-emerald-400 transition-[width] duration-300"
                  style={{ width: `${restProgressPercent}%` }}
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => adjustActiveRestTimer(REST_STEP_SECONDS)}
                  className="premium-button premium-button-secondary min-h-10 text-sm font-semibold text-zinc-100"
                >
                  +15 sec
                </button>
                <button
                  type="button"
                  onClick={() => adjustActiveRestTimer(-REST_STEP_SECONDS)}
                  className="premium-button premium-button-secondary min-h-10 text-sm font-semibold text-zinc-100"
                >
                  -15 sec
                </button>
                <button
                  type="button"
                  onClick={skipRestTimer}
                  className="premium-button premium-button-danger min-h-10 text-sm font-semibold"
                >
                  Skip
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Exercise List */}
      <div className={`px-2.5 py-4 space-y-4 sm:px-4 ${inputState ? 'pb-[25rem]' : ''}`}>
        {workoutExercises.map((exercise) => (
          <DraggableExercise
            key={exercise.exerciseId}
            exercise={exercise}
            allExercises={workoutExercises}
            showExtras={expandedExtras.has(exercise.exerciseId)}
            onToggleExtras={() => toggleExtras(exercise.exerciseId)}
            onAddSet={() => addSet(exercise.exerciseId)}
            onOpenInput={(setIndex, field, value) => openInput(exercise.exerciseId, setIndex, field, value)}
            onToggleSetCompletion={(setIndex) => toggleSetCompletion(exercise.exerciseId, setIndex)}
            onDeleteSet={(setIndex) => deleteSet(exercise.exerciseId, setIndex)}
            onSetTypeChange={(setIndex, type) => setSetType(exercise.exerciseId, setIndex, type)}
            onShowAlternatives={() => showAlternatives(exercise.exerciseId)}
            onShowHowToLog={() => showHowToLog(exercise.exerciseId)}
            onOpenReorder={() => setReorderExercisesOpen(true)}
            onOpenSupersetPicker={() => openSupersetPicker(exercise.exerciseId)}
            onAdjustRestTime={() => setSelectedExerciseForRest(exercise.exerciseId)}
            onClearSuperset={() => clearSuperset(exercise.exerciseId)}
            onRemoveExercise={() => confirmRemoveExercise(exercise.exerciseId)}
            rankResult={rankResultsByExerciseId.get(exercise.exerciseId)}
            activeInput={inputState}
            restTimersEnabled={restTimers}
          />
        ))}

        {/* Add Exercise Button */}
        <button
          onClick={handleAddExerciseClick}
          className="empty-state w-full py-4 flex items-center justify-center gap-2 text-zinc-400 transition-colors hover:border-blue-400/30 hover:text-zinc-200"
        >
          <Plus className="w-5 h-5" />
          Add Exercise
        </button>
      </div>

      {/* Bottom Input Panel */}
      {inputState && (
        <BottomInputPanel
          isOpen={true}
          onClose={closeInput}
          value={inputState.value}
          onChange={handleInputChange}
          label={inputPanelLabel}
          step={inputField?.key === 'weight' ? weightIncrement : inputField?.step ?? 1}
          unit={inputUnit}
          allowDecimal={inputField?.key === 'weight' ? true : inputField?.allowDecimal}
          required={inputField?.required}
          max={inputField?.max}
          mode={inputField?.key === 'duration' ? 'time' : 'number'}
          blockingBackdrop={false}
          variant="workout"
          submitLabel="Next"
          onSubmit={advanceInputField}
          selectionKey={`${inputState.exerciseId}:${inputState.setIndex}:${inputState.field}`}
        />
      )}

      {reorderExercisesOpen && (
        <ReorderExercisesOverlay
          exercisesList={workoutExercises}
          onClose={() => setReorderExercisesOpen(false)}
          onSave={handleSaveReorder}
        />
      )}

      {/* Rest Time Dialog */}
      <Dialog
        open={Boolean(selectedExerciseForRest)}
        onOpenChange={(open) => {
          if (!open) setSelectedExerciseForRest(null);
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Adjust Rest Time</DialogTitle>
            <DialogDescription>
              {selectedRestExercise
                ? `Set the default rest countdown after ${selectedRestExercise.exerciseName}.`
                : 'Set the default rest countdown for this exercise.'}
            </DialogDescription>
          </DialogHeader>
          {selectedRestExercise && (
            <div className="mt-4 space-y-4">
              <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-5 text-center">
                <div className="text-xs font-semibold uppercase tracking-normal text-zinc-500">Default rest</div>
                <div className="mt-2 font-mono text-4xl font-bold text-white">
                  {formatRestTimer(getExerciseLogRestSeconds(selectedRestExercise))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => adjustExerciseRestTime(selectedRestExercise.exerciseId, -REST_STEP_SECONDS)}
                  className="premium-button premium-button-secondary min-h-12 text-sm font-semibold text-zinc-100"
                >
                  -15 sec
                </button>
                <button
                  type="button"
                  onClick={() => adjustExerciseRestTime(selectedRestExercise.exerciseId, REST_STEP_SECONDS)}
                  className="premium-button premium-button-primary min-h-12 text-sm font-semibold"
                >
                  +15 sec
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Superset Picker Dialog */}
      <Dialog
        open={Boolean(selectedExerciseForSuperset)}
        onOpenChange={(open) => {
          if (!open) setSelectedExerciseForSuperset(null);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add to Superset</DialogTitle>
            <DialogDescription>
              {supersetSourceExercise
                ? `Choose one exercise to pair with ${supersetSourceExercise.exerciseName}.`
                : 'Choose one exercise to pair.'}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 space-y-2">
            {supersetPartnerOptions.length > 0 ? (
              supersetPartnerOptions.map((exerciseLog) => {
                const exerciseData = exercises.find((exercise) => exercise.id === exerciseLog.exerciseId);
                const isCurrentPartner =
                  Boolean(supersetSourceExercise?.supersetGroupId) &&
                  exerciseLog.supersetGroupId === supersetSourceExercise?.supersetGroupId;

                return (
                  <button
                    key={exerciseLog.exerciseId}
                    type="button"
                    onClick={() => {
                      if (supersetSourceExercise) {
                        assignSuperset(supersetSourceExercise.exerciseId, exerciseLog.exerciseId);
                      }
                    }}
                    className={`premium-row w-full p-3 text-left transition-colors flex items-center gap-3 hover:bg-white/[0.035] ${
                      isCurrentPartner ? 'border-blue-400/40 bg-blue-500/10' : ''
                    }`}
                  >
                    {exerciseData && <ExerciseThumbnail exercise={exerciseData} size="sm" />}
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-white">{exerciseLog.exerciseName}</div>
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        {exerciseLog.mainMuscles.slice(0, 3).map((muscle) => (
                          <span key={muscle} className="premium-badge px-2 py-0.5 text-[11px] text-blue-200">
                            {muscle}
                          </span>
                        ))}
                      </div>
                    </div>
                    {exerciseLog.supersetGroupId && (
                      <span className="shrink-0 rounded-full border border-blue-300/25 bg-blue-500/12 px-2 py-1 text-[10px] font-semibold uppercase tracking-normal text-blue-200">
                        Superset
                      </span>
                    )}
                  </button>
                );
              })
            ) : (
              <div className="empty-state p-4 text-sm text-zinc-400">
                Add another exercise to this workout before creating a superset.
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Alternative Exercise Dialog */}
      <Dialog open={alternativeDialogOpen} onOpenChange={setAlternativeDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Suggest Alternative</DialogTitle>
            <DialogDescription>
              Select a replacement exercise targeting similar muscles
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 mt-4 max-h-96 overflow-y-auto">
            {selectedExerciseForAlternative &&
              getAlternativeExercises(selectedExerciseForAlternative).map((ex) => (
                <button
                  key={ex.id}
                  onClick={() => replaceExercise(ex.id)}
                  className="premium-row w-full p-3 text-left transition-colors flex items-center gap-3 hover:bg-white/[0.035]"
                >
                  <ExerciseThumbnail exercise={ex} size="sm" />
                  <div className="flex-1">
                    <div className="text-white mb-1">{ex.name}</div>
                    <div className="flex gap-2">
                      {ex.mainMuscles.map((muscle) => (
                        <span
                          key={muscle}
                          className="premium-badge text-xs text-blue-200 px-2 py-0.5"
                        >
                          {muscle}
                        </span>
                      ))}
                    </div>
                  </div>
                </button>
              ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Exercise Dialog */}
      <Dialog open={addExerciseDialogOpen} onOpenChange={setAddExerciseDialogOpen}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Add Exercise</DialogTitle>
            <DialogDescription>
              Search and add exercises to your current workout
            </DialogDescription>
          </DialogHeader>
          <input
            type="text"
            placeholder="Search exercises..."
            value={exerciseSearchQuery}
            onChange={(e) => setExerciseSearchQuery(e.target.value)}
            className="premium-input w-full px-3 py-2 mb-3"
          />
          <div className="space-y-2 overflow-y-auto flex-1">
            {filteredAddExercises.map((ex) => (
              <button
                key={ex.id}
                onClick={() => addNewExercise(ex)}
                className="premium-row w-full p-3 text-left transition-colors flex items-center gap-3 hover:bg-white/[0.035]"
              >
                <ExerciseThumbnail exercise={ex} size="sm" />
                <div className="flex-1">
                  <div className="text-white mb-1">{ex.name}</div>
                  <div className="flex gap-2">
                    {ex.mainMuscles.map((muscle) => (
                      <span
                        key={muscle}
                        className="premium-badge text-xs text-blue-200 px-2 py-0.5"
                      >
                        {muscle}
                      </span>
                    ))}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Exercise Confirmation */}
      <AlertDialog open={deleteExerciseDialogOpen} onOpenChange={setDeleteExerciseDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Exercise?</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              This will remove the exercise and all its logged sets from this workout. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="premium-button premium-button-secondary border-white/10 text-white">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={removeExercise}
              className="premium-button premium-button-danger"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Info Modal */}
      <InfoModal
        isOpen={infoModalOpen}
        onClose={() => setInfoModalOpen(false)}
        title={infoModalTitle}
        message={infoModalMessage}
      />
      </div>
    </>
  );
}

export function ActiveWorkoutOverlay() {
  const location = useLocation();
  const { isWorkoutActive, isMinimized, workoutStartTime, workoutSheetOffset } = useWorkout();
  const hiddenRoutes = new Set(['/active-workout', '/exercise-selection', '/finish-workout']);
  const shouldRenderOverlay = isWorkoutActive && (!isMinimized || workoutSheetOffset !== null);

  useEffect(() => {
    if (!shouldRenderOverlay || hiddenRoutes.has(location.pathname)) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [shouldRenderOverlay, location.pathname]);

  if (!shouldRenderOverlay || hiddenRoutes.has(location.pathname)) {
    return null;
  }

  return <ActiveWorkoutPageContent key={workoutStartTime?.toISOString() ?? 'active-workout'} />;
}

export function ActiveWorkoutPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const {
    isWorkoutActive,
    workoutExercises,
    startWorkout,
    updateWorkoutExercises,
    expandWorkout,
  } = useWorkout();
  const processedRef = useRef(false);

  useEffect(() => {
    if (processedRef.current) return;
    processedRef.current = true;

    const routeState = (location.state as any) || {};
    const addExercises = Array.isArray(routeState.addExercises) ? routeState.addExercises : [];
    const startingExercises = Array.isArray(routeState.exercises) ? routeState.exercises : [];

    if (addExercises.length > 0 && isWorkoutActive) {
      const existingIds = new Set(workoutExercises.map((exercise) => exercise.exerciseId));
      const nextExerciseLogs = createExerciseLogsForWorkout(addExercises, user?.id).filter(
        (exercise) => !existingIds.has(exercise.exerciseId),
      );
      updateWorkoutExercises([...workoutExercises, ...nextExerciseLogs]);
      expandWorkout();
      navigate('/', { replace: true, state: {} });
      return;
    }

    if (startingExercises.length > 0) {
      if (isWorkoutActive) {
        if (typeof window !== 'undefined') {
          window.sessionStorage.setItem('strive_open_workout_from_minimized', '1');
        }
        expandWorkout();
        navigate('/', { replace: true, state: {} });
        return;
      }

      startWorkout(
        routeState.workoutName || 'Active Workout',
        createExerciseLogsForWorkout(startingExercises, user?.id),
        routeState.routineId,
        routeState.routineName,
      );
      navigate('/', { replace: true, state: {} });
      return;
    }

    if (isWorkoutActive) {
      if (typeof window !== 'undefined') {
        window.sessionStorage.setItem('strive_open_workout_from_minimized', '1');
      }
      expandWorkout();
    }

    navigate('/', { replace: true, state: {} });
  }, []);

  return null;
}
