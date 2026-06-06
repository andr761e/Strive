import { useEffect, useRef, useState, type PointerEvent } from 'react';
import { useLocation } from 'react-router';
import { useWorkout } from '../contexts/WorkoutContext';
import { WorkoutCollapsedHeader } from './WorkoutCollapsedHeader';

const COLLAPSED_BAR_HEIGHT = 68;
const BOTTOM_NAV_HEIGHT = 68;
const OPEN_DRAG_THRESHOLD = 96;
const DRAG_START_THRESHOLD = 4;
const OPEN_SETTLE_MS = 460;

function clampNumber(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function getCollapsedOffset() {
  if (typeof window === 'undefined') return 560;
  return Math.max(0, window.innerHeight - BOTTOM_NAV_HEIGHT - COLLAPSED_BAR_HEIGHT);
}

export function PersistentWorkoutBar() {
  const location = useLocation();
  const {
    isWorkoutActive,
    workoutName,
    elapsedSeconds,
    workoutExercises,
    isMinimized,
    expandWorkout,
    workoutSheetOffset,
    setWorkoutSheetOffset,
  } = useWorkout();
  const [isPointerActive, setIsPointerActive] = useState(false);
  const pointerIdRef = useRef<number | null>(null);
  const startYRef = useRef(0);
  const offsetRef = useRef(0);
  const maxMovementRef = useRef(0);
  const hasStartedSheetDragRef = useRef(false);
  const settleTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearSettleTimeout = () => {
    if (settleTimeoutRef.current) {
      clearTimeout(settleTimeoutRef.current);
      settleTimeoutRef.current = null;
    }
  };

  const finishOpen = () => {
    clearSettleTimeout();
    const currentOffset = offsetRef.current;
    hasStartedSheetDragRef.current = false;
    setWorkoutSheetOffset(currentOffset, false);
    expandWorkout();
    window.requestAnimationFrame(() => {
      setWorkoutSheetOffset(0, false);
    });
    settleTimeoutRef.current = setTimeout(() => {
      setWorkoutSheetOffset(null, false);
    }, OPEN_SETTLE_MS + 40);
  };

  const finishClosed = () => {
    clearSettleTimeout();
    const collapsedOffset = getCollapsedOffset();
    hasStartedSheetDragRef.current = false;
    setWorkoutSheetOffset(offsetRef.current, false);
    window.requestAnimationFrame(() => {
      setWorkoutSheetOffset(collapsedOffset, false);
    });
    settleTimeoutRef.current = setTimeout(() => {
      setWorkoutSheetOffset(null, false);
    }, OPEN_SETTLE_MS + 40);
  };

  useEffect(
    () => () => {
      clearSettleTimeout();
    },
    [],
  );

  useEffect(() => {
    if (!isPointerActive) return;

    const handlePointerMove = (event: globalThis.PointerEvent) => {
      if (pointerIdRef.current !== null && event.pointerId !== pointerIdRef.current) return;

      const collapsedOffset = getCollapsedOffset();
      const deltaY = event.clientY - startYRef.current;
      maxMovementRef.current = Math.max(maxMovementRef.current, Math.abs(deltaY));

      if (!hasStartedSheetDragRef.current) {
        if (deltaY >= -DRAG_START_THRESHOLD) {
          if (Math.abs(deltaY) > DRAG_START_THRESHOLD) {
            event.preventDefault();
          }
          return;
        }

        hasStartedSheetDragRef.current = true;
      }

      const nextOffset = clampNumber(collapsedOffset + deltaY, 0, collapsedOffset);
      offsetRef.current = nextOffset;
      setWorkoutSheetOffset(nextOffset, true);

      if (Math.abs(deltaY) > 4) {
        event.preventDefault();
      }
    };

    const handlePointerEnd = (event: globalThis.PointerEvent) => {
      if (pointerIdRef.current !== null && event.pointerId !== pointerIdRef.current) return;

      const collapsedOffset = getCollapsedOffset();
      const openedDistance = collapsedOffset - offsetRef.current;
      const shouldOpen = maxMovementRef.current < 8 || (hasStartedSheetDragRef.current && openedDistance >= OPEN_DRAG_THRESHOLD);

      pointerIdRef.current = null;
      setIsPointerActive(false);

      if (shouldOpen) {
        if (!hasStartedSheetDragRef.current) {
          offsetRef.current = collapsedOffset;
        }
        finishOpen();
      } else if (hasStartedSheetDragRef.current) {
        finishClosed();
      } else {
        hasStartedSheetDragRef.current = false;
        setWorkoutSheetOffset(null, false);
      }
    };

    const handleBlur = () => {
      pointerIdRef.current = null;
      setIsPointerActive(false);
      if (hasStartedSheetDragRef.current) {
        finishClosed();
        return;
      }
      hasStartedSheetDragRef.current = false;
      setWorkoutSheetOffset(null, false);
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: false });
    window.addEventListener('pointerup', handlePointerEnd);
    window.addEventListener('pointercancel', handlePointerEnd);
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerEnd);
      window.removeEventListener('pointercancel', handlePointerEnd);
      window.removeEventListener('blur', handleBlur);
    };
  }, [isPointerActive]);

  const handleDragStart = (event: PointerEvent<HTMLDivElement>) => {
    if (pointerIdRef.current !== null) {
      event.preventDefault();
      return;
    }

    clearSettleTimeout();
    const collapsedOffset = getCollapsedOffset();
    pointerIdRef.current = event.pointerId;
    startYRef.current = event.clientY;
    offsetRef.current = collapsedOffset;
    maxMovementRef.current = 0;
    hasStartedSheetDragRef.current = false;
    setIsPointerActive(true);
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.setPointerCapture(event.pointerId);
    }
    event.preventDefault();
  };

  if (!isWorkoutActive || !isMinimized || location.pathname === '/active-workout') {
    return null;
  }

  return (
    <div
      onPointerDown={handleDragStart}
      className={`fixed bottom-[68px] left-1/2 z-40 w-full max-w-md -translate-x-1/2 cursor-pointer touch-none px-2 transition-opacity ${
        workoutSheetOffset !== null ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <WorkoutCollapsedHeader
        workoutName={workoutName}
        elapsedSeconds={elapsedSeconds}
        exerciseCount={workoutExercises.length}
      />
    </div>
  );
}
