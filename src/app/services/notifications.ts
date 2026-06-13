const NOTIFICATION_SCHEDULE_STORAGE_KEY = 'strive_notification_schedule_v1';
const NOTIFICATION_PERMISSION_PROMPT_STORAGE_KEY = 'strive_notification_permission_prompted_v1';

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
  restTimer?: {
    exerciseName: string;
    endsAt: number;
  };
}

interface StriveNotificationBridge {
  requestPostNotificationsPermission?: () => Promise<void> | void;
  scheduleWorkoutReminders?: (reminders: ScheduledWorkoutReminder[]) => Promise<void> | void;
  cancelWorkoutReminders?: (workoutId?: string) => Promise<void> | void;
  startActiveWorkoutNotification?: (payload: ActiveWorkoutNotificationPayload) => Promise<void> | void;
  updateActiveWorkoutNotification?: (payload: ActiveWorkoutNotificationPayload) => Promise<void> | void;
  stopActiveWorkoutNotification?: () => Promise<void> | void;
}

interface AndroidStriveNotificationBridge {
  requestPostNotificationsPermission?: () => void;
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
    requestPostNotificationsPermission: () => nativeBridge.requestPostNotificationsPermission?.(),
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

function getPermissionPromptStorageKey(userId?: string) {
  return userId
    ? `${NOTIFICATION_PERMISSION_PROMPT_STORAGE_KEY}:${userId}`
    : NOTIFICATION_PERMISSION_PROMPT_STORAGE_KEY;
}

async function requestWebNotificationPermission() {
  if (typeof window === 'undefined') return;
  if (!('Notification' in window)) return;

  const permission = window.Notification.permission;
  if (permission === 'default') {
    await window.Notification.requestPermission();
  }
}

export async function requestNotificationPermissionOnce(userId?: string) {
  if (typeof window === 'undefined') return;

  const storageKey = getPermissionPromptStorageKey(userId);
  if (window.localStorage.getItem(storageKey) === '1') return;

  window.localStorage.setItem(storageKey, '1');

  const bridge = getBridge();
  if (bridge?.requestPostNotificationsPermission) {
    await bridge.requestPostNotificationsPermission();
    return;
  }

  await requestWebNotificationPermission();
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

function getReminderCompletedAtMs(reminder: ScheduledWorkoutReminder) {
  const fireAtMs = new Date(reminder.fireAt).getTime();
  if (Number.isNaN(fireAtMs)) return Number.NEGATIVE_INFINITY;
  return fireAtMs - reminder.hoursAfterWorkout * 60 * 60 * 1000;
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

  // Reminder notifications represent time since the latest logged workout.
  // A new completed workout must replace the entire previous reminder chain,
  // otherwise stale 48h/72h/etc. alarms from older workouts can still fire.
  await cancelPostWorkoutReminders();
  storeReminders(reminders);

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

export async function reconcilePostWorkoutReminderSchedule() {
  const storedReminders = readStoredReminders();
  if (storedReminders.length <= POST_WORKOUT_REMINDER_HOURS.length) return;

  const latestReminder = storedReminders.reduce<ScheduledWorkoutReminder | null>((latest, reminder) => {
    if (!latest) return reminder;
    return getReminderCompletedAtMs(reminder) > getReminderCompletedAtMs(latest) ? reminder : latest;
  }, null);

  if (!latestReminder?.workoutId) {
    await cancelPostWorkoutReminders();
    return;
  }

  const latestWorkoutId = latestReminder.workoutId;
  const staleWorkoutIds = Array.from(
    new Set(
      storedReminders
        .map((reminder) => reminder.workoutId)
        .filter((workoutId) => workoutId && workoutId !== latestWorkoutId),
    ),
  );

  if (staleWorkoutIds.length === 0) return;

  // Older app versions could keep reminder chains from previous workouts.
  // Keep the latest workout's chain and cancel every stale native alarm.
  storeReminders(storedReminders.filter((reminder) => reminder.workoutId === latestWorkoutId));
  const bridge = getBridge();
  await Promise.allSettled(staleWorkoutIds.map((workoutId) => bridge?.cancelWorkoutReminders?.(workoutId)));
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
