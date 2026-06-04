import { useState, useEffect, useMemo, useRef, type PointerEvent } from 'react';
import { useNavigate, useLocation } from 'react-router';
import {
  BookOpen,
  Check,
  ChevronDown,
  ChevronUp,
  Clock,
  GripVertical,
  ListOrdered,
  MoreVertical,
  Plus,
  ArrowRight,
  RefreshCw,
  Trash2,
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

interface InputState {
  exerciseId: string;
  setIndex: number;
  field: LoggingFieldKey;
  value: number;
}

interface DraggableExerciseProps {
  exercise: ExerciseLog;
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
  onRemoveExercise: () => void;
  rankResult?: ExerciseRankResult | null;
  activeInput?: InputState | null;
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
  const [dragOffset, setDragOffset] = useState<number | null>(null);
  const [deleteRevealed, setDeleteRevealed] = useState(false);
  const isCompleted = set.completed;
  const translateX = dragOffset ?? (deleteRevealed ? -72 : 0);
  const revealWidth = Math.abs(translateX);
  const revealOpacity = Math.min(1, revealWidth / 56);

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    startXRef.current = event.clientX;
    setDragOffset(deleteRevealed ? -72 : 0);
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (startXRef.current === null) return;

    const delta = event.clientX - startXRef.current;
    const base = deleteRevealed ? -72 : 0;
    const nextOffset = Math.max(-80, Math.min(0, base + delta));
    if (Math.abs(delta) > 8) {
      event.preventDefault();
    }
    setDragOffset(nextOffset);
  };

  const handlePointerEnd = () => {
    if (dragOffset !== null) {
      setDeleteRevealed(dragOffset < -36);
    }
    setDragOffset(null);
    startXRef.current = null;
  };

  return (
    <div className="relative w-full overflow-hidden rounded-[11px]">
      <button
        type="button"
        onClick={() => {
          setDeleteRevealed(false);
          onDeleteSet(setIndex);
        }}
        className="absolute inset-y-0 right-0 flex items-center justify-center rounded-r-[11px] bg-red-600 text-white transition-[width,opacity] duration-150"
        style={{
          width: `${revealWidth}px`,
          opacity: revealOpacity,
          pointerEvents: deleteRevealed ? 'auto' : 'none',
        }}
        aria-label={`Delete set ${setIndex + 1}`}
      >
        <Trash2 className="h-5 w-5" />
      </button>
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
            onClick={() => !isCompleted && onOpenInput(setIndex, field.key, getSetFieldValue(set, field.key))}
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
          onClick={() => onToggleSetCompletion(setIndex)}
          className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
            isCompleted
              ? 'bg-green-500/20 text-green-300 border border-green-500/25'
              : 'border border-white/10 bg-white/5 text-zinc-400 hover:bg-white/10'
          }`}
          title={isCompleted ? 'Mark as incomplete' : 'Mark as complete'}
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

  useEffect(() => {
    setDraftExercises(exercisesList);
  }, [exercisesList]);

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
    draggingIndexRef.current = null;
    setDraggingIndex(null);
    setDragPreview(null);
  };

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
  onRemoveExercise,
  rankResult,
  activeInput,
}: DraggableExerciseProps) {
  const { weightUnit } = useSettings();
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
  const completedSetCount = exercise.sets.filter((set) => set.completed).length;
  const totalVolume = exercise.sets.reduce((total, set) => total + set.weight * set.reps, 0);
  const hasLoadVolume = loggingFields.some((field) => field.key === 'weight') && loggingFields.some((field) => field.key === 'reps');
  const hasRankProgression = Boolean(rankResult?.eligible);
  const visibleMuscles = exercise.mainMuscles.slice(0, 3);
  const hiddenMuscleCount = Math.max(0, exercise.mainMuscles.length - visibleMuscles.length);

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
          <div className="hidden rounded-lg border border-white/10 bg-white/[0.035] px-2.5 py-1.5 text-right sm:block">
            <div className="text-xs font-medium text-white">{completedSetCount}/{exercise.sets.length}</div>
            <div className="text-[10px] uppercase tracking-normal text-zinc-500">sets</div>
          </div>
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

        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="rounded-lg border border-white/10 bg-black/15 px-2.5 py-2 sm:px-3">
            <div className="text-[10px] uppercase tracking-normal text-zinc-500">Done</div>
            <div className="stat-number text-sm">{completedSetCount}/{exercise.sets.length}</div>
          </div>
          <div className="rounded-lg border border-white/10 bg-black/15 px-2.5 py-2 sm:px-3">
            <div className="text-[10px] uppercase tracking-normal text-zinc-500">{hasLoadVolume ? 'Volume' : 'Format'}</div>
            <div className="stat-number truncate text-sm">{hasLoadVolume ? `${Math.round(totalVolume).toLocaleString()} ${weightUnit}` : logging.label}</div>
          </div>
        </div>
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
  const { weightIncrement, weightUnit } = useSettings();
  const { user } = useAuth();
  const { startWorkout, minimizeWorkout, workoutExercises: contextExercises, updateWorkoutExercises, elapsedSeconds } = useWorkout();
  
  const initialExercises = (location.state as any)?.exercises || [];
  const workoutName = (location.state as any)?.workoutName || 'Active Workout';
  const routineId = (location.state as any)?.routineId || null;
  const routineName = (location.state as any)?.routineName || null;

  const [workoutExercises, setWorkoutExercises] = useState<ExerciseLog[]>(() => {
    if (contextExercises.length > 0) {
      return contextExercises;
    }
    // If initialExercises already has ExerciseLog format (with sets), use it directly
    if (initialExercises.length > 0 && initialExercises[0].sets !== undefined) {
      return initialExercises;
    }
    // Otherwise, convert from Exercise format
    return initialExercises.map((ex: Exercise) => {
      const previousSets = user ? DataService.getPreviousWorkoutSets(user.id, ex.id) : null;
      return {
        exerciseId: ex.id,
        exerciseName: ex.name,
        mainMuscles: ex.mainMuscles,
        sets: [],
        previousSets: previousSets || undefined,
      };
    });
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

  // Initialize workout session
  useEffect(() => {
    if (contextExercises.length === 0 && initialExercises.length > 0) {
      let exerciseLogs: ExerciseLog[];
      
      // If initialExercises already has ExerciseLog format, use it
      if (initialExercises[0].sets !== undefined) {
        exerciseLogs = initialExercises;
      } else {
        // Convert from Exercise format
        exerciseLogs = initialExercises.map((ex: Exercise) => {
          const previousSets = user ? DataService.getPreviousWorkoutSets(user.id, ex.id) : null;
          return {
            exerciseId: ex.id,
            exerciseName: ex.name,
            mainMuscles: ex.mainMuscles,
            sets: [],
            previousSets: previousSets || undefined,
          };
        });
      }
      startWorkout(workoutName, exerciseLogs, routineId, routineName);
    }
  }, []);

  // Sync with context whenever local state changes
  useEffect(() => {
    updateWorkoutExercises(workoutExercises);
  }, [workoutExercises]);

  // Handle adding new exercises from selection page
  useEffect(() => {
    const addExercises = (location.state as any)?.addExercises;
    if (addExercises && addExercises.length > 0) {
      const newExerciseLogs = addExercises.map((ex: Exercise) => {
        const previousSets = user ? DataService.getPreviousWorkoutSets(user.id, ex.id) : null;
        return {
          exerciseId: ex.id,
          exerciseName: ex.name,
          mainMuscles: ex.mainMuscles,
          sets: [],
          previousSets: previousSets || undefined,
        };
      });
      setWorkoutExercises((prev) => [...prev, ...newExerciseLogs]);
      
      // Clear the state so it doesn't add again on re-render
      navigate('/active-workout', { replace: true, state: {} });
    }
  }, [location.state]);

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

  const toggleSetCompletion = (exerciseId: string, setIndex: number) => {
    const exercise = workoutExercises.find(ex => ex.exerciseId === exerciseId);
    const set = exercise?.sets[setIndex];
    
    // If trying to mark as complete, validate only the fields required by this exercise's logging schema.
    if (set && !set.completed) {
      const exerciseMeta = exercises.find((item) => item.id === exerciseId);
      const logging = getExerciseLogging(exerciseMeta);
      const missingField = logging.fields.find((field) => field.required && getSetFieldValue(set, field.key) <= 0);
      const hasAnyLoggedValue = logging.fields.some((field) => getSetFieldValue(set, field.key) > 0);

      if (missingField) {
        setInfoModalTitle('Missing Set Data');
        setInfoModalMessage(`${missingField.label} must be greater than 0 for ${exercise?.exerciseName ?? 'this exercise'}.`);
        setInfoModalOpen(true);
        return;
      }
      if (!hasAnyLoggedValue) {
        setInfoModalTitle('Missing Set Data');
        setInfoModalMessage(`Log at least one value for ${exercise?.exerciseName ?? 'this exercise'} before completing the set.`);
        setInfoModalOpen(true);
        return;
      }
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
      setWorkoutExercises((prev) => prev.filter((ex) => ex.exerciseId !== exerciseToDelete));
      setExerciseToDelete(null);
      setDeleteExerciseDialogOpen(false);
    }
  };

  const addNewExercise = (exercise: Exercise) => {
    const previousSets = user ? DataService.getPreviousWorkoutSets(user.id, exercise.id) : null;
    const newExerciseLog: ExerciseLog = {
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      mainMuscles: exercise.mainMuscles,
      sets: [],
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

  const handleMinimize = () => {
    minimizeWorkout();
    navigate('/');
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

  const totalSetCount = workoutExercises.reduce((total, exercise) => total + exercise.sets.length, 0);
  const completedSetCount = workoutExercises.reduce(
    (total, exercise) => total + exercise.sets.filter((set) => set.completed).length,
    0,
  );
  const totalVolume = workoutExercises.reduce(
    (total, exercise) =>
      total + exercise.sets.reduce((setTotal, set) => setTotal + set.weight * set.reps, 0),
    0,
  );
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
      results.set(exerciseLog.exerciseId, getExerciseRank(exerciseData, workoutsForRank, user?.weight));
    });

    return results;
  }, [user?.weight, workoutExercises, workoutsForRank]);

  return (
    <div className="screen-shell active-workout-shell">
      {/* Header */}
      <div className="sticky-header active-workout-topbar">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <button
              onClick={handleMinimize}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.035] text-zinc-400 transition-colors hover:bg-white/[0.06] hover:text-white"
              aria-label="Minimize workout"
            >
              <ChevronDown className="w-6 h-6" />
            </button>
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-xl font-semibold leading-tight">{workoutName}</h1>
              <div className="mt-1 flex items-center gap-2 text-xs text-zinc-400">
                <Clock className="w-3.5 h-3.5 text-blue-300" />
                <span className="font-mono text-zinc-200">{formatTime(elapsedSeconds)}</span>
                <span className="text-zinc-600">-</span>
                <span>{workoutExercises.length} exercises</span>
              </div>
            </div>
          </div>
          <button
            onClick={handleFinishClick}
            className="premium-button premium-button-primary flex h-10 min-h-10 w-10 shrink-0 items-center justify-center p-0"
            aria-label="Finish workout"
          >
            <ArrowRight className="w-5 h-5 text-white" />
          </button>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2">
            <div className="active-workout-stat">
              <div className="text-[10px] uppercase tracking-normal text-zinc-500">Sets</div>
              <div className="stat-number text-base">{completedSetCount}/{totalSetCount}</div>
            </div>
            <div className="active-workout-stat">
              <div className="text-[10px] uppercase tracking-normal text-zinc-500">Volume</div>
              <div className="stat-number truncate text-base">{Math.round(totalVolume).toLocaleString()} {weightUnit}</div>
            </div>
            <div className="active-workout-stat">
              <div className="text-[10px] uppercase tracking-normal text-zinc-500">Elapsed</div>
              <div className="stat-number text-base font-mono">{formatTime(elapsedSeconds)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Exercise List */}
      <div className={`px-2.5 py-4 space-y-4 sm:px-4 ${inputState ? 'pb-[25rem]' : ''}`}>
        {workoutExercises.map((exercise) => (
          <DraggableExercise
            key={exercise.exerciseId}
            exercise={exercise}
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
            onRemoveExercise={() => confirmRemoveExercise(exercise.exerciseId)}
            rankResult={rankResultsByExerciseId.get(exercise.exerciseId)}
            activeInput={inputState}
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
  );
}

export function ActiveWorkoutPage() {
  return <ActiveWorkoutPageContent />;
}
