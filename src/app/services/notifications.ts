const NOTIFICATION_SCHEDULE_STORAGE_KEY = 'strive_notification_schedule_v1';
const NOTIFICATION_PERMISSION_PROMPT_STORAGE_KEY = 'strive_notification_permission_prompted_v1';

export const POST_WORKOUT_REMINDER_HOURS = [24, 48, 60, 68, 71, 72, 96, 120, 144, 168] as const;

const POST_WORKOUT_REMINDER_COPY: Record<number, { title: string; body: string }> = {
  24: {
    title: '24 hours since your last workout',
    body: 'One day is fine. Keep the rhythm easy to continue.',
  },
  48: {
    title: '48 hours since your last workout',
    body: 'You still have time to keep the streak alive. Plan the next session today.',
  },
  60: {
    title: '12 hours to protect your streak',
    body: 'Your workout streak resets at 72 hours. A short session still counts.',
  },
  68: {
    title: '4 hours left on your streak',
    body: 'This is the save point. Open Strive and log the next workout before the streak resets.',
  },
  71: {
    title: '1 hour left to keep the streak',
    body: 'Last call before the 72-hour reset. Get something logged if you want to keep it alive.',
  },
  72: {
    title: '72 hours since your last workout',
    body: 'Your streak resets now. Log a workout to start building it again.',
  },
  96: {
    title: '4 days since your last workout',
    body: 'Momentum is easier to rebuild when you start today.',
  },
  120: {
    title: '5 days since your last workout',
    body: 'A quick workout is enough to restart the streak and get back on track.',
  },
  144: {
    title: '6 days since your last workout',
    body: 'Even a short session beats disappearing from the plan.',
  },
  168: {
    title: '7 days since your last workout',
    body: 'A full week has passed. Open Strive and make the next workout simple.',
  },
};

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

function getReminderFireAtMs(reminder: ScheduledWorkoutReminder) {
  const fireAtMs = new Date(reminder.fireAt).getTime();
  if (Number.isNaN(fireAtMs)) return Number.NEGATIVE_INFINITY;
  return fireAtMs;
}

function getReminderCompletedAtMs(reminder: ScheduledWorkoutReminder) {
  const fireAtMs = getReminderFireAtMs(reminder);
  if (!Number.isFinite(fireAtMs)) return Number.NEGATIVE_INFINITY;
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
    const copy = POST_WORKOUT_REMINDER_COPY[hoursAfterWorkout] ?? {
      title: 'Time to train',
      body: 'Open Strive and log your next workout.',
    };

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
  if (storedReminders.length === 0) return;

  const latestReminder = storedReminders.reduce<ScheduledWorkoutReminder | null>((latest, reminder) => {
    if (!latest) return reminder;
    return getReminderCompletedAtMs(reminder) > getReminderCompletedAtMs(latest) ? reminder : latest;
  }, null);

  if (!latestReminder?.workoutId) {
    await cancelPostWorkoutReminders();
    return;
  }

  const latestWorkoutId = latestReminder.workoutId;
  const latestWorkoutReminders = storedReminders.filter((reminder) => reminder.workoutId === latestWorkoutId);
  const staleWorkoutIds = Array.from(
    new Set(
      storedReminders
        .map((reminder) => reminder.workoutId)
        .filter((workoutId) => workoutId && workoutId !== latestWorkoutId),
    ),
  );

  const completedAtMs = getReminderCompletedAtMs(latestReminder);
  const bridge = getBridge();

  if (!Number.isFinite(completedAtMs)) {
    if (staleWorkoutIds.length > 0) {
      storeReminders(latestWorkoutReminders);
      await Promise.allSettled(staleWorkoutIds.map((workoutId) => bridge?.cancelWorkoutReminders?.(workoutId)));
    }
    return;
  }

  const nowMs = Date.now();
  const refreshedLatestReminders = buildPostWorkoutReminders({
    userId: latestReminder.userId,
    workoutId: latestWorkoutId,
    workoutName: latestReminder.workoutName,
    completedAt: new Date(completedAtMs).toISOString(),
  }).filter((reminder) => getReminderFireAtMs(reminder) > nowMs);
  const latestFutureReminders = latestWorkoutReminders.filter((reminder) => getReminderFireAtMs(reminder) > nowMs);
  const hasCurrentLatestChain =
    latestFutureReminders.length === refreshedLatestReminders.length &&
    refreshedLatestReminders.every((expectedReminder) =>
      latestFutureReminders.some(
        (storedReminder) =>
          storedReminder.hoursAfterWorkout === expectedReminder.hoursAfterWorkout &&
          storedReminder.fireAt === expectedReminder.fireAt &&
          storedReminder.title === expectedReminder.title &&
          storedReminder.body === expectedReminder.body,
      ),
    );

  if (refreshedLatestReminders.length === 0) {
    storeReminders([]);
    await bridge?.cancelWorkoutReminders?.(latestWorkoutId);
    await Promise.allSettled(staleWorkoutIds.map((workoutId) => bridge?.cancelWorkoutReminders?.(workoutId)));
    return;
  }

  if (!hasCurrentLatestChain) {
    storeReminders(refreshedLatestReminders);
    await bridge?.cancelWorkoutReminders?.(latestWorkoutId);
    await Promise.allSettled(staleWorkoutIds.map((workoutId) => bridge?.cancelWorkoutReminders?.(workoutId)));
    await bridge?.scheduleWorkoutReminders?.(refreshedLatestReminders);
    return;
  }

  if (staleWorkoutIds.length > 0 || latestFutureReminders.length !== latestWorkoutReminders.length) {
    storeReminders(latestFutureReminders);
    await Promise.allSettled(staleWorkoutIds.map((workoutId) => bridge?.cancelWorkoutReminders?.(workoutId)));
  }
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
