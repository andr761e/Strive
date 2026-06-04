package com.yourname.strive;

import android.Manifest;
import android.app.AlarmManager;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.os.Build;
import androidx.core.app.NotificationCompat;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;
import java.util.TimeZone;
import org.json.JSONArray;
import org.json.JSONObject;

final class StriveNotificationHelper {
    static final String ACTION_WORKOUT_REMINDER = "com.yourname.strive.ACTION_WORKOUT_REMINDER";
    private static final String ACTION_ACTIVE_WORKOUT_DISMISSED = "com.yourname.strive.ACTION_ACTIVE_WORKOUT_DISMISSED";
    private static final String ACTIVE_CHANNEL_ID = "strive_active_workout";
    private static final String REMINDER_CHANNEL_ID = "strive_workout_reminders";
    private static final String REMINDER_STORE = "strive_native_notifications";
    private static final String REMINDER_STORE_KEY = "scheduled_reminders";
    static final int ACTIVE_WORKOUT_NOTIFICATION_ID = 1001;
    private static final int REQUEST_CODE_OPEN_APP = 1002;

    private StriveNotificationHelper() {}

    static void createNotificationChannels(Context context) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;

        NotificationManager manager = context.getSystemService(NotificationManager.class);
        if (manager == null) return;

        NotificationChannel activeChannel = new NotificationChannel(
            ACTIVE_CHANNEL_ID,
            "Active workout",
            NotificationManager.IMPORTANCE_LOW
        );
        activeChannel.setDescription("Persistent timer shown while a workout is active.");
        activeChannel.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
        manager.createNotificationChannel(activeChannel);

        NotificationChannel reminderChannel = new NotificationChannel(
            REMINDER_CHANNEL_ID,
            "Workout reminders",
            NotificationManager.IMPORTANCE_DEFAULT
        );
        reminderChannel.setDescription("Daily reminders after your last logged workout.");
        manager.createNotificationChannel(reminderChannel);
    }

    static void showActiveWorkoutNotification(Context context, String workoutName, int elapsedSeconds) {
        if (!canPostNotifications(context)) return;

        Notification notification = buildActiveWorkoutNotification(context, workoutName, elapsedSeconds);
        NotificationManager manager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        if (manager != null) {
            manager.notify(ACTIVE_WORKOUT_NOTIFICATION_ID, notification);
        }
    }

    static Notification buildActiveWorkoutNotification(Context context, String workoutName, int elapsedSeconds) {
        createNotificationChannels(context);
        long chronometerBase = System.currentTimeMillis() - Math.max(0, elapsedSeconds) * 1000L;
        Notification notification = new NotificationCompat.Builder(context, ACTIVE_CHANNEL_ID)
            .setSmallIcon(R.drawable.ic_stat_strive)
            .setColor(Color.rgb(59, 130, 246))
            .setContentTitle("Workout active")
            .setContentText(workoutName + " - timer running")
            .setContentIntent(openAppIntent(context))
            .setDeleteIntent(activeWorkoutDismissIntent(context))
            .setCategory(NotificationCompat.CATEGORY_SERVICE)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setOngoing(true)
            .setAutoCancel(false)
            .setOnlyAlertOnce(true)
            .setForegroundServiceBehavior(NotificationCompat.FOREGROUND_SERVICE_IMMEDIATE)
            .setUsesChronometer(true)
            .setChronometerCountDown(false)
            .setWhen(chronometerBase)
            .setShowWhen(true)
            .build();

        notification.flags |= Notification.FLAG_ONGOING_EVENT | Notification.FLAG_NO_CLEAR | Notification.FLAG_FOREGROUND_SERVICE;
        return notification;
    }

    static void stopActiveWorkoutNotification(Context context) {
        NotificationManager manager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        if (manager != null) {
            manager.cancel(ACTIVE_WORKOUT_NOTIFICATION_ID);
        }
    }

    static void scheduleWorkoutReminder(Context context, JSONObject reminder) {
        createNotificationChannels(context);
        saveReminder(context, reminder);

        long fireAt = parseIsoTime(reminder.optString("fireAt", ""), System.currentTimeMillis());
        Intent intent = new Intent(context, WorkoutReminderReceiver.class)
            .setAction(ACTION_WORKOUT_REMINDER)
            .putExtra("notificationId", notificationIdFor(reminder.optString("id", "")))
            .putExtra("title", reminder.optString("title", "Time to train"))
            .putExtra("body", reminder.optString("body", "Open Strive and log your next workout."))
            .putExtra("workoutId", reminder.optString("workoutId", ""));

        PendingIntent pendingIntent = PendingIntent.getBroadcast(
            context,
            notificationIdFor(reminder.optString("id", "")),
            intent,
            pendingIntentFlags(PendingIntent.FLAG_UPDATE_CURRENT)
        );

        AlarmManager alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        if (alarmManager == null) return;

        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                alarmManager.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, fireAt, pendingIntent);
            } else {
                alarmManager.setExact(AlarmManager.RTC_WAKEUP, fireAt, pendingIntent);
            }
        } catch (SecurityException securityException) {
            alarmManager.set(AlarmManager.RTC_WAKEUP, fireAt, pendingIntent);
        }
    }

    static void cancelWorkoutReminders(Context context, String workoutId) {
        JSONArray reminders = readReminders(context);
        JSONArray kept = new JSONArray();

        for (int index = 0; index < reminders.length(); index++) {
            JSONObject reminder = reminders.optJSONObject(index);
            if (reminder == null) continue;

            boolean shouldCancel = workoutId == null || workoutId.isEmpty() || workoutId.equals(reminder.optString("workoutId", ""));
            if (shouldCancel) {
                cancelReminderAlarm(context, reminder.optString("id", ""));
            } else {
                kept.put(reminder);
            }
        }

        writeReminders(context, kept);
    }

    static void showWorkoutReminder(Context context, int notificationId, String title, String body) {
        if (!canPostNotifications(context)) return;
        createNotificationChannels(context);

        Notification notification = new NotificationCompat.Builder(context, REMINDER_CHANNEL_ID)
            .setSmallIcon(R.drawable.ic_stat_strive)
            .setColor(Color.rgb(59, 130, 246))
            .setContentTitle(title)
            .setContentText(body)
            .setStyle(new NotificationCompat.BigTextStyle().bigText(body))
            .setContentIntent(openAppIntent(context))
            .setCategory(NotificationCompat.CATEGORY_REMINDER)
            .setPriority(NotificationCompat.PRIORITY_DEFAULT)
            .setAutoCancel(true)
            .build();

        NotificationManager manager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        if (manager != null) {
            manager.notify(notificationId, notification);
        }
    }

    private static PendingIntent openAppIntent(Context context) {
        Intent intent = context.getPackageManager().getLaunchIntentForPackage(context.getPackageName());
        if (intent == null) {
            intent = new Intent(context, MainActivity.class);
        }

        intent.setFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        return PendingIntent.getActivity(
            context,
            REQUEST_CODE_OPEN_APP,
            intent,
            pendingIntentFlags(PendingIntent.FLAG_UPDATE_CURRENT)
        );
    }

    private static PendingIntent activeWorkoutDismissIntent(Context context) {
        Intent intent = new Intent(context, ActiveWorkoutNotificationDismissReceiver.class)
            .setAction(ACTION_ACTIVE_WORKOUT_DISMISSED);

        return PendingIntent.getBroadcast(
            context,
            ACTIVE_WORKOUT_NOTIFICATION_ID,
            intent,
            pendingIntentFlags(PendingIntent.FLAG_UPDATE_CURRENT)
        );
    }

    private static void cancelReminderAlarm(Context context, String reminderId) {
        Intent intent = new Intent(context, WorkoutReminderReceiver.class).setAction(ACTION_WORKOUT_REMINDER);
        PendingIntent pendingIntent = PendingIntent.getBroadcast(
            context,
            notificationIdFor(reminderId),
            intent,
            pendingIntentFlags(PendingIntent.FLAG_UPDATE_CURRENT)
        );
        AlarmManager alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        if (alarmManager != null) {
            alarmManager.cancel(pendingIntent);
        }
    }

    private static boolean canPostNotifications(Context context) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU) return true;
        return context.checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) == PackageManager.PERMISSION_GRANTED;
    }

    private static int pendingIntentFlags(int baseFlags) {
        return Build.VERSION.SDK_INT >= Build.VERSION_CODES.M
            ? baseFlags | PendingIntent.FLAG_IMMUTABLE
            : baseFlags;
    }

    private static int notificationIdFor(String value) {
        return 10_000 + Math.abs(value.hashCode() % 1_000_000);
    }

    private static long parseIsoTime(String isoTime, long fallback) {
        if (isoTime == null || isoTime.isEmpty()) return fallback;

        String[] patterns = {
            "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'",
            "yyyy-MM-dd'T'HH:mm:ss'Z'"
        };

        for (String pattern : patterns) {
            try {
                SimpleDateFormat formatter = new SimpleDateFormat(pattern, Locale.US);
                formatter.setTimeZone(TimeZone.getTimeZone("UTC"));
                Date date = formatter.parse(isoTime);
                if (date != null) return date.getTime();
            } catch (ParseException ignored) {
                // Try the next supported ISO shape.
            }
        }

        return fallback;
    }

    private static void saveReminder(Context context, JSONObject reminder) {
        JSONArray reminders = readReminders(context);
        String reminderId = reminder.optString("id", "");
        JSONArray next = new JSONArray();

        for (int index = 0; index < reminders.length(); index++) {
            JSONObject existing = reminders.optJSONObject(index);
            if (existing == null || reminderId.equals(existing.optString("id", ""))) continue;
            next.put(existing);
        }

        next.put(reminder);
        writeReminders(context, next);
    }

    private static JSONArray readReminders(Context context) {
        SharedPreferences preferences = context.getSharedPreferences(REMINDER_STORE, Context.MODE_PRIVATE);
        String raw = preferences.getString(REMINDER_STORE_KEY, "[]");
        try {
            return new JSONArray(raw);
        } catch (Exception ignored) {
            return new JSONArray();
        }
    }

    private static void writeReminders(Context context, JSONArray reminders) {
        context
            .getSharedPreferences(REMINDER_STORE, Context.MODE_PRIVATE)
            .edit()
            .putString(REMINDER_STORE_KEY, reminders.toString())
            .apply();
    }
}
