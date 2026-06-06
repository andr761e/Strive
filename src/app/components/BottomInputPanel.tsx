import { useEffect, useMemo, useRef, useState, type UIEvent } from 'react';
import { X, ChevronUp, ChevronDown, Check, AlertCircle } from 'lucide-react';
import {
  durationValueToSeconds,
  formatDurationClock,
  getDurationParts,
  secondsToDurationValue,
} from '../utils/timeFormatting';

interface BottomInputPanelProps {
  isOpen: boolean;
  onClose: () => void;
  value: number;
  onChange: (value: number) => void;
  label: string;
  step: number;
  unit?: string;
  min?: number;
  max?: number;
  allowDecimal?: boolean;
  required?: boolean;
  mode?: 'number' | 'time';
  blockingBackdrop?: boolean;
  variant?: 'standard' | 'workout';
  submitLabel?: string;
  onSubmit?: () => void;
  selectionKey?: string;
}

interface TimeWheelColumnProps {
  label: string;
  value: number;
  values: number[];
  onChange: (value: number) => void;
  wrap?: boolean;
}

const wheelItemHeight = 48;
const wheelCycleCount = 7;
const wheelMiddleCycle = Math.floor(wheelCycleCount / 2);
const outsideTapMovementThreshold = 8;

function isBottomInputSwitchTarget(target: EventTarget | null) {
  return target instanceof Element && Boolean(target.closest('[data-bottom-input-switch="true"]'));
}

function wrapIndex(index: number, length: number) {
  return ((index % length) + length) % length;
}

function TimeWheelColumn({ label, value, values, onChange, wrap = false }: TimeWheelColumnProps) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const selectedValueIndex = Math.max(0, values.indexOf(value));
  const displayValues = useMemo(
    () =>
      wrap
        ? Array.from({ length: wheelCycleCount * values.length }, (_, index) => values[index % values.length])
        : values,
    [values, wrap],
  );
  const getTargetIndex = (valueIndex: number) => (wrap ? wheelMiddleCycle * values.length + valueIndex : valueIndex);
  const [activeIndex, setActiveIndex] = useState(() => getTargetIndex(selectedValueIndex));

  useEffect(() => {
    const nextIndex = getTargetIndex(selectedValueIndex);
    setActiveIndex(nextIndex);
    scrollRef.current?.scrollTo({ top: nextIndex * wheelItemHeight });
  }, [selectedValueIndex, values.length, wrap]);

  const handleScroll = (event: UIEvent<HTMLDivElement>) => {
    if (!values.length) return;

    const node = event.currentTarget;
    const rawIndex = Math.round(node.scrollTop / wheelItemHeight);
    const nextValueIndex = wrap
      ? wrapIndex(rawIndex, values.length)
      : Math.max(0, Math.min(values.length - 1, rawIndex));
    const nextValue = values[nextValueIndex];

    if (nextValue !== value) {
      onChange(nextValue);
    }

    if (wrap && (rawIndex < values.length || rawIndex > values.length * (wheelCycleCount - 2))) {
      const recenteredIndex = getTargetIndex(nextValueIndex);
      setActiveIndex(recenteredIndex);
      requestAnimationFrame(() => {
        scrollRef.current?.scrollTo({ top: recenteredIndex * wheelItemHeight });
      });
      return;
    }

    setActiveIndex(wrap ? rawIndex : nextValueIndex);
  };

  return (
    <div className="min-w-0 flex-1">
      <div className="mb-2 text-center text-[10px] font-semibold uppercase tracking-normal text-zinc-500">{label}</div>
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="relative h-44 snap-y snap-mandatory overflow-y-auto overscroll-contain rounded-2xl border border-white/10 bg-black/25 px-1 py-0"
      >
        <div className="h-16 shrink-0" />
        {displayValues.map((option, index) => {
          const isSelected = index === activeIndex;
          return (
            <button
              key={`${index}-${option}`}
              type="button"
              onClick={() => onChange(option)}
              className={`h-12 w-full snap-center rounded-xl text-center font-mono text-lg transition-colors ${
                isSelected ? 'bg-blue-500/15 text-white ring-1 ring-blue-400/35' : 'text-zinc-500 hover:bg-white/[0.04] hover:text-zinc-200'
              }`}
            >
              {option.toString().padStart(2, '0')}
            </button>
          );
        })}
        <div className="h-16 shrink-0" />
        <div className="pointer-events-none absolute inset-x-1 top-1/2 h-12 -translate-y-1/2 rounded-xl border border-blue-400/20 shadow-[0_0_22px_rgba(59,130,246,0.12)]" />
      </div>
    </div>
  );
}

export function BottomInputPanel({
  isOpen,
  onClose,
  value,
  onChange,
  label,
  step,
  unit = '',
  min = 0,
  max = 999,
  allowDecimal = false,
  required = true,
  mode = 'number',
  blockingBackdrop = true,
  variant = 'standard',
  submitLabel,
  onSubmit,
  selectionKey,
}: BottomInputPanelProps) {
  const [draftValue, setDraftValue] = useState(value.toString());
  const [isDraftSelected, setIsDraftSelected] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const outsidePointerRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    hasMoved: boolean;
  } | null>(null);
  const isValid = !required || value > 0;
  const isTimeMode = mode === 'time';
  const isWorkoutVariant = variant === 'workout';
  const maxSeconds = isTimeMode ? durationValueToSeconds(max, unit) : max;
  const selectedSeconds = isTimeMode
    ? Math.min(durationValueToSeconds(value, unit), maxSeconds)
    : 0;
  const timeParts = getDurationParts(selectedSeconds);
  const maxHours = Math.max(0, Math.floor(maxSeconds / 3600));
  const hourValues = useMemo(() => Array.from({ length: maxHours + 1 }, (_, index) => index), [maxHours]);
  const minuteValues = useMemo(() => Array.from({ length: 60 }, (_, index) => index), []);
  const secondValues = minuteValues;

  useEffect(() => {
    if (isOpen) {
      setDraftValue(value.toString());
      setIsDraftSelected(true);
    }
  }, [isOpen, selectionKey]);

  useEffect(() => {
    if (!isOpen) return;

    const handleOutsidePointerDown = (event: globalThis.PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (panelRef.current?.contains(target)) return;

      outsidePointerRef.current = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        hasMoved: false,
      };
    };

    const handleOutsidePointerMove = (event: globalThis.PointerEvent) => {
      const outsidePointer = outsidePointerRef.current;
      if (!outsidePointer || outsidePointer.pointerId !== event.pointerId) return;

      const deltaX = event.clientX - outsidePointer.startX;
      const deltaY = event.clientY - outsidePointer.startY;
      if (Math.hypot(deltaX, deltaY) > outsideTapMovementThreshold) {
        outsidePointer.hasMoved = true;
      }
    };

    const handleOutsidePointerUp = (event: globalThis.PointerEvent) => {
      const outsidePointer = outsidePointerRef.current;
      if (!outsidePointer || outsidePointer.pointerId !== event.pointerId) return;

      outsidePointerRef.current = null;

      const target = event.target;
      if (!(target instanceof Node)) return;
      if (panelRef.current?.contains(target)) return;
      if (isBottomInputSwitchTarget(target)) return;
      if (outsidePointer.hasMoved) return;

      onClose();
    };

    const handleOutsidePointerCancel = (event: globalThis.PointerEvent) => {
      if (outsidePointerRef.current?.pointerId === event.pointerId) {
        outsidePointerRef.current = null;
      }
    };

    window.addEventListener('pointerdown', handleOutsidePointerDown, { capture: true });
    window.addEventListener('pointermove', handleOutsidePointerMove, { capture: true });
    window.addEventListener('pointerup', handleOutsidePointerUp, { capture: true });
    window.addEventListener('pointercancel', handleOutsidePointerCancel, { capture: true });

    return () => {
      outsidePointerRef.current = null;
      window.removeEventListener('pointerdown', handleOutsidePointerDown, { capture: true });
      window.removeEventListener('pointermove', handleOutsidePointerMove, { capture: true });
      window.removeEventListener('pointerup', handleOutsidePointerUp, { capture: true });
      window.removeEventListener('pointercancel', handleOutsidePointerCancel, { capture: true });
    };
  }, [isOpen, onClose]);

  const setDisplayValue = (nextString: string) => {
    setDraftValue(nextString);
    setIsDraftSelected(false);
    const nextValue = parseFloat(nextString);
    onChange(Number.isNaN(nextValue) ? 0 : Math.min(nextValue, max));
  };

  const handleIncrement = () => {
    const newValue = Math.min(value + step, max);
    const normalized = Number(newValue.toFixed(1));
    setDraftValue(normalized.toString());
    setIsDraftSelected(false);
    onChange(normalized);
  };

  const handleDecrement = () => {
    const newValue = Math.max(value - step, min);
    const normalized = Number(newValue.toFixed(1));
    setDraftValue(normalized.toString());
    setIsDraftSelected(false);
    onChange(normalized);
  };

  const handleNumberClick = (num: number) => {
    const currentString = draftValue;
    
    // If the value was just opened/selected, replace it on the first number press.
    if (isDraftSelected || currentString === '0') {
      setDisplayValue(num.toString());
      return;
    }
    
    const newString = currentString + num.toString();
    const newValue = parseFloat(newString);
    
    if (newValue <= max) {
      setDisplayValue(newString);
    }
  };

  const handleDecimalClick = () => {
    if (!allowDecimal) return;
    
    const currentString = draftValue;
    if (isDraftSelected) {
      setDraftValue('0.');
      setIsDraftSelected(false);
      return;
    }
    
    // Don't add decimal if already exists
    if (currentString.includes('.')) return;
    
    setDraftValue(`${currentString || '0'}.`);
    setIsDraftSelected(false);
  };

  const handleBackspace = () => {
    if (isDraftSelected) {
      setDisplayValue('0');
      return;
    }

    const currentString = draftValue;
    if (currentString.length <= 1) {
      setDisplayValue('0');
    } else {
      const newString = currentString.slice(0, -1);
      setDisplayValue(newString || '0');
    }
  };

  const handleClear = () => {
    setDisplayValue('0');
  };

  const handleDone = () => {
    // Always allow advancing/closing, regardless of value.
    if (onSubmit) {
      onSubmit();
      return;
    }
    onClose();
  };

  const updateTimePart = (part: 'hours' | 'minutes' | 'seconds', nextValue: number) => {
    const nextParts = {
      ...timeParts,
      [part]: nextValue,
    };
    const nextSeconds = Math.min(
      maxSeconds,
      nextParts.hours * 3600 + nextParts.minutes * 60 + nextParts.seconds,
    );
    onChange(secondsToDurationValue(nextSeconds, unit));
  };

  if (!isOpen) return null;

  const workoutKeyHeightClass = 'h-[clamp(2rem,5dvh,2.4rem)]';
  const workoutFooterButtonHeightClass = 'h-[clamp(2.25rem,5.5dvh,2.75rem)]';

  return (
    <>
      {/* Backdrop */}
      {blockingBackdrop && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Panel */}
      <div
        ref={panelRef}
        className={`fixed left-0 right-0 z-50 border-t border-white/10 backdrop-blur-xl animate-slide-up ${
          isWorkoutVariant ? 'workout-input-panel-offset' : 'bottom-0'
        } ${
          isWorkoutVariant
            ? `rounded-t-xl bg-zinc-950/98 shadow-[0_-18px_60px_rgba(0,0,0,0.58)] ${
                isTimeMode ? '' : 'max-h-[38dvh] overflow-hidden'
              }`
            : 'rounded-t-2xl bg-zinc-950/95'
        }`}
      >
        <div className={isWorkoutVariant ? 'mx-auto max-w-lg' : 'max-w-md mx-auto'}>
          {/* Header */}
          <div
            className={`flex items-center justify-between border-b ${
              isWorkoutVariant
                ? 'border-blue-300/20 bg-blue-400 px-3 py-2 text-zinc-950'
                : 'border-white/10 px-4 py-3'
            }`}
          >
            <div>
              <h3 className={`font-semibold ${isWorkoutVariant ? 'text-xs text-zinc-950' : 'text-sm text-white'}`}>{label}</h3>
              {!isWorkoutVariant && (
                <p className="text-xs text-zinc-400">
                  {isTimeMode ? 'Hours - Minutes - Seconds' : 'Numeric entry'}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className={`p-2 transition-colors ${
                isWorkoutVariant ? 'text-zinc-950/80 hover:text-zinc-950' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {isTimeMode ? (
            <div className="px-4 py-5">
              <div className="mb-4 rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-center">
                <div className={`font-mono text-4xl font-bold ${isValid ? 'text-white' : 'text-red-400'}`}>
                  {formatDurationClock(value, unit)}
                </div>
                {!isValid && (
                  <div className="mt-2 flex items-center justify-center gap-1 text-xs text-red-400">
                    <AlertCircle className="h-3 w-3" />
                    <span>Required value</span>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <TimeWheelColumn
                  label="Hours"
                  value={timeParts.hours}
                  values={hourValues}
                  onChange={(nextValue) => updateTimePart('hours', nextValue)}
                  wrap={hourValues.length > 1}
                />
                <TimeWheelColumn
                  label="Minutes"
                  value={timeParts.minutes}
                  values={minuteValues}
                  onChange={(nextValue) => updateTimePart('minutes', nextValue)}
                  wrap
                />
                <TimeWheelColumn
                  label="Seconds"
                  value={timeParts.seconds}
                  values={secondValues}
                  onChange={(nextValue) => updateTimePart('seconds', nextValue)}
                  wrap
                />
              </div>
            </div>
          ) : (
            <>
              {/* Value Display */}
              <div className={`${isWorkoutVariant ? 'hidden' : 'bg-black/20 px-4 py-6'}`}>
                <div className="flex items-center justify-center gap-3">
                  <button
                    onClick={handleDecrement}
                    className="premium-button premium-button-secondary flex h-12 w-12 items-center justify-center active:scale-95"
                  >
                    <ChevronDown className="h-6 w-6 text-white" />
                  </button>

                  <div className="max-w-[180px] flex-1">
                    <div
                      role="status"
                      aria-live="polite"
                      className={`w-full border-b-2 bg-transparent text-center font-mono text-4xl font-bold outline-none ${
                        isDraftSelected
                          ? 'rounded-lg border-blue-400 bg-blue-500/25 px-2 text-white'
                          : isValid
                            ? 'border-zinc-700 text-white'
                            : 'border-red-500 text-red-400'
                      }`}
                    >
                      {draftValue}
                    </div>
                    {unit && (
                      <p className="mt-1 text-center text-sm text-zinc-400">{unit}</p>
                    )}
                    {!isValid && (
                      <div className="mt-2 flex items-center justify-center gap-1 text-xs text-red-400">
                        <AlertCircle className="h-3 w-3" />
                        <span>Required value</span>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={handleIncrement}
                    className="premium-button premium-button-secondary flex h-12 w-12 items-center justify-center active:scale-95"
                  >
                    <ChevronUp className="h-6 w-6 text-white" />
                  </button>
                </div>
              </div>

              {/* Number Pad */}
              <div className={isWorkoutVariant ? 'px-3 py-2' : 'px-4 py-4'}>
                {isWorkoutVariant && (
                  <div className="mb-1.5 grid grid-cols-[1fr_1.35fr_1fr] gap-1.5">
                    <button
                      onClick={handleDecrement}
                      className={`premium-button premium-button-secondary ${workoutKeyHeightClass} text-base text-white active:scale-95`}
                    >
                      -{step}
                    </button>
                    <div
                      className={`flex min-w-0 items-center justify-center rounded-lg border px-2 text-center transition-colors ${workoutKeyHeightClass} ${
                        isDraftSelected
                          ? 'border-blue-300/70 bg-blue-500/25 shadow-[0_0_18px_rgba(96,165,250,0.2)]'
                          : 'border-white/10 bg-black/25'
                      }`}
                    >
                      <span className={`truncate font-mono text-xl font-bold ${isValid ? 'text-white' : 'text-red-400'}`}>
                        {draftValue}
                      </span>
                      {unit && <span className="ml-1 shrink-0 text-xs text-zinc-400">{unit}</span>}
                    </div>
                    <button
                      onClick={handleIncrement}
                      className={`premium-button premium-button-secondary ${workoutKeyHeightClass} text-base text-white active:scale-95`}
                    >
                      +{step}
                    </button>
                  </div>
                )}
                <div className={`${isWorkoutVariant ? 'mb-1.5 gap-1.5' : 'mb-2 gap-2'} grid grid-cols-3`}>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                    <button
                      key={num}
                      onClick={() => handleNumberClick(num)}
                      className={`premium-button premium-button-secondary ${
                        isWorkoutVariant ? workoutKeyHeightClass : 'h-12'
                      } text-xl text-white active:scale-95`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
                <div className={`${isWorkoutVariant ? 'gap-1.5' : 'gap-2'} grid grid-cols-3`}>
                  <button
                    onClick={allowDecimal ? handleDecimalClick : handleClear}
                    disabled={allowDecimal && draftValue.includes('.')}
                    className={`premium-button premium-button-secondary ${
                      isWorkoutVariant ? workoutKeyHeightClass : 'h-12'
                    } text-sm text-zinc-400 active:scale-95 ${
                      allowDecimal && draftValue.includes('.') ? 'cursor-not-allowed opacity-45' : ''
                    }`}
                  >
                    {allowDecimal ? '.' : 'Clear'}
                  </button>
                  <button
                    onClick={() => handleNumberClick(0)}
                    className={`premium-button premium-button-secondary ${
                      isWorkoutVariant ? workoutKeyHeightClass : 'h-12'
                    } text-xl text-white active:scale-95`}
                  >
                    0
                  </button>
                  <button
                    onClick={handleBackspace}
                    className={`premium-button premium-button-secondary ${
                      isWorkoutVariant ? workoutKeyHeightClass : 'h-12'
                    } text-sm text-zinc-400 active:scale-95`}
                  >
                    Delete
                  </button>
                </div>
                {allowDecimal && !isWorkoutVariant && (
                  <div className="mt-3 grid grid-cols-3 gap-3">
                    <div className="col-span-2"></div>
                    <button
                      onClick={handleBackspace}
                      className="premium-button premium-button-secondary h-12 text-sm text-zinc-400 active:scale-95"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Done Button */}
          <div className={isWorkoutVariant ? 'px-3 pb-[calc(0.5rem+env(safe-area-inset-bottom))]' : 'px-4 pb-6'}>
            <button
              onClick={handleDone}
              className={`premium-button premium-button-primary flex w-full items-center justify-center gap-2 active:scale-95 ${
                isWorkoutVariant ? workoutFooterButtonHeightClass : 'h-12'
              }`}
            >
              <Check className="w-5 h-5" />
              {submitLabel ?? (isWorkoutVariant ? 'Next' : 'Done')}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
