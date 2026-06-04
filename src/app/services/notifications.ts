const NOTIFICATION_SCHEDULE_STORAGE_KEY = 'strive_notification_schedule_v1';

export const POST_WORKOUT_REMINDER_HOURS = [24, 48, 72, 96, 120, 144, 168] as const;

export interface ScheduledWorkoutReminder {
  id: string;
  userId: string;
  workoutId: string;
  workoutName: string;
  hoursAfterWorkout: number;
  fireAt: string;
  title: string;
  body: string;
}

export interface ActiveWorkoutNotificationPayload {
  workoutName: string;
  startedAt: string;
  elapsedSeconds: number;
}

interface StriveNotificationBridge {
  scheduleWorkoutReminders?: (reminders: ScheduledWorkoutReminder[]) => Promise<void> | void;
  cancelWorkoutReminders?: (workoutId?: string) => Promise<void> | void;
  startActiveWorkoutNotification?: (payload: ActiveWorkoutNotificationPayload) => Promise<void> | void;
  updateActiveWorkoutNotification?: (payload: ActiveWorkoutNotificationPayload) => Promise<void> | void;
  stopActiveWorkoutNotification?: () => Promise<void> | void;
}

interface AndroidStriveNotificationBridge {
  scheduleWorkoutReminders?: (remindersJson: string) => void;
  cancelWorkoutReminders?: (workoutId: string) => void;
  startActiveWorkoutNotification?: (payloadJson: string) => void;
  updateActiveWorkoutNotification?: (payloadJson: string) => void;
  stopActiveWorkoutNotification?: () => void;
}

declare global {
  interface Window {
    StriveNotifications?: StriveNotificationBridge;
    AndroidStriveNotifications?: AndroidStriveNotificationBridge;
  }
}

function getBridge() {
  if (typeof window === 'undefined') return undefined;
  if (window.StriveNotifications) return window.StriveNotifications;

  const nativeBridge = window.AndroidStriveNotifications;
  if (!nativeBridge) return undefined;

  return {
    scheduleWorkoutReminders: (reminders: ScheduledWorkoutReminder[]) =>
      nativeBridge.scheduleWorkoutReminders?.(JSON.stringify(reminders)),
    cancelWorkoutReminders: (workoutId?: string) => nativeBridge.cancelWorkoutReminders?.(workoutId ?? ''),
    startActiveWorkoutNotification: (payload: ActiveWorkoutNotificationPayload) =>
      nativeBridge.startActiveWorkoutNotification?.(JSON.stringify(payload)),
    updateActiveWorkoutNotification: (payload: ActiveWorkoutNotificationPayload) =>
      nativeBridge.updateActiveWorkoutNotification?.(JSON.stringify(payload)),
    stopActiveWorkoutNotification: () => nativeBridge.stopActiveWorkoutNotification?.(),
  } satisfies StriveNotificationBridge;
}

function readStoredReminders() {
  if (typeof window === 'undefined') return [];

  try {
    const raw = window.localStorage.getItem(NOTIFICATION_SCHEDULE_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ScheduledWorkoutReminder[]) : [];
  } catch {
    return [];
  }
}

function storeReminders(reminders: ScheduledWorkoutReminder[]) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(NOTIFICATION_SCHEDULE_STORAGE_KEY, JSON.stringify(reminders));
}

export function buildPostWorkoutReminders({
  userId,
  workoutId,
  workoutName,
  completedAt = new Date().toISOString(),
}: {
  userId: string;
  workoutId: string;
  workoutName: string;
  completedAt?: string;
}): ScheduledWorkoutReminder[] {
  const completedDate = new Date(completedAt);

  return POST_WORKOUT_REMINDER_HOURS.map((hoursAfterWorkout) => {
    const fireAt = new Date(completedDate.getTime() + hoursAfterWorkout * 60 * 60 * 1000);
    const dayNumber = hoursAfterWorkout / 24;

    const reminderCopy: Record<number, { title: string; body: string }> = {
      1: {
        title: '24 hours since your last workout',
        body: 'One day is fine. Two starts looking like a pattern. Get the next session on the board.',
      },
      2: {
        title: '48 hours. You are drifting.',
        body: 'Recovery window is open. Momentum is easier to keep than rebuild.',
      },
      3: {
        title: '3 days. This is officially slacking.',
        body: 'No drama. Just open Strive, pick a routine, and do the work.',
      },
      4: {
        title: '4 days. Momentum is leaking.',
        body: 'Your future numbers are being decided right now. Go train or log an intentional rest day.',
      },
      5: {
        title: '5 days. The weights are not moving themselves.',
        body: 'This is the point where a break becomes a slide. Pull it back today.',
      },
      6: {
        title: '6 days. One excuse from a full week off.',
        body: 'Even a short session beats disappearing. Get something done.',
      },
      7: {
        title: '7 days. Enough.',
        body: 'A full week without a logged workout. Time to stop negotiating and get back in.',
      },
    };
    const copy = reminderCopy[dayNumber];

    return {
      id: `${workoutId}-${hoursAfterWorkout}h`,
      userId,
      workoutId,
      workoutName,
      hoursAfterWorkout,
      fireAt: fireAt.toISOString(),
      title: copy.title,
      body: copy.body,
    };
  });
}

export async function schedulePostWorkoutReminders(input: {
  userId: string;
  workoutId: string;
  workoutName: string;
  completedAt?: string;
}) {
  const reminders = buildPostWorkoutReminders(input);
  const existing = readStoredReminders().filter((reminder) => reminder.workoutId !== input.workoutId);
  storeReminders([...existing, ...reminders]);

  await getBridge()?.scheduleWorkoutReminders?.(reminders);
  return reminders;
}

export async function cancelPostWorkoutReminders(workoutId?: string) {
  const remainingReminders = workoutId
    ? readStoredReminders().filter((reminder) => reminder.workoutId !== workoutId)
    : [];

  storeReminders(remainingReminders);
  await getBridge()?.cancelWorkoutReminders?.(workoutId);
}

export async function startActiveWorkoutNotification(payload: ActiveWorkoutNotificationPayload) {
  await getBridge()?.startActiveWorkoutNotification?.(payload);
}

export async function updateActiveWorkoutNotification(payload: ActiveWorkoutNotificationPayload) {
  await getBridge()?.updateActiveWorkoutNotification?.(payload);
}

export async function stopActiveWorkoutNotification() {
  await getBridge()?.stopActiveWorkoutNotification?.();
}
