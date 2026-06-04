package com.yourname.strive;

import android.app.Notification;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.ServiceInfo;
import android.os.Build;
import android.os.IBinder;

public class ActiveWorkoutNotificationService extends Service {
    static final String EXTRA_WORKOUT_NAME = "workoutName";
    static final String EXTRA_ELAPSED_SECONDS = "elapsedSeconds";
    static final String EXTRA_STARTED_AT_MILLIS = "startedAtMillis";
    private static final String STORE_NAME = "strive_active_workout_service";
    private static final String KEY_WORKOUT_NAME = "workout_name";
    private static final String KEY_STARTED_AT_MILLIS = "started_at_millis";

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        ActiveWorkoutState state = getStateFromIntent(intent);
        if (state == null) {
            state = readStoredState(this);
        }

        if (state == null) {
            stopSelf();
            return START_NOT_STICKY;
        }

        storeState(this, state);
        int elapsedSeconds = (int) Math.max(0, (System.currentTimeMillis() - state.startedAtMillis) / 1000L);
        Notification notification = StriveNotificationHelper.buildActiveWorkoutNotification(
            this,
            state.workoutName,
            elapsedSeconds
        );

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            startForeground(
                StriveNotificationHelper.ACTIVE_WORKOUT_NOTIFICATION_ID,
                notification,
                ServiceInfo.FOREGROUND_SERVICE_TYPE_DATA_SYNC
            );
        } else {
            startForeground(StriveNotificationHelper.ACTIVE_WORKOUT_NOTIFICATION_ID, notification);
        }

        return START_STICKY;
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    static void clearStoredState(Context context) {
        getPreferences(context).edit().clear().apply();
    }

    static boolean hasStoredState(Context context) {
        return readStoredState(context) != null;
    }

    private static ActiveWorkoutState getStateFromIntent(Intent intent) {
        if (intent == null) return null;

        boolean hasWorkoutName = intent.hasExtra(EXTRA_WORKOUT_NAME);
        boolean hasElapsedSeconds = intent.hasExtra(EXTRA_ELAPSED_SECONDS);
        boolean hasStartedAtMillis = intent.hasExtra(EXTRA_STARTED_AT_MILLIS);
        if (!hasWorkoutName && !hasElapsedSeconds && !hasStartedAtMillis) {
            return null;
        }

        String workoutName = intent.getStringExtra(EXTRA_WORKOUT_NAME);
        if (workoutName == null || workoutName.trim().isEmpty()) {
            workoutName = "Workout";
        }

        long startedAtMillis = intent.getLongExtra(EXTRA_STARTED_AT_MILLIS, 0L);
        if (startedAtMillis <= 0L) {
            int elapsedSeconds = Math.max(0, intent.getIntExtra(EXTRA_ELAPSED_SECONDS, 0));
            startedAtMillis = System.currentTimeMillis() - elapsedSeconds * 1000L;
        }
        return new ActiveWorkoutState(workoutName, startedAtMillis);
    }

    private static ActiveWorkoutState readStoredState(Context context) {
        SharedPreferences preferences = getPreferences(context);
        String workoutName = preferences.getString(KEY_WORKOUT_NAME, null);
        long startedAtMillis = preferences.getLong(KEY_STARTED_AT_MILLIS, 0L);

        if (workoutName == null || startedAtMillis <= 0L) {
            return null;
        }

        return new ActiveWorkoutState(workoutName, startedAtMillis);
    }

    private static void storeState(Context context, ActiveWorkoutState state) {
        getPreferences(context)
            .edit()
            .putString(KEY_WORKOUT_NAME, state.workoutName)
            .putLong(KEY_STARTED_AT_MILLIS, state.startedAtMillis)
            .apply();
    }

    private static SharedPreferences getPreferences(Context context) {
        return context.getSharedPreferences(STORE_NAME, Context.MODE_PRIVATE);
    }

    private static final class ActiveWorkoutState {
        final String workoutName;
        final long startedAtMillis;

        ActiveWorkoutState(String workoutName, long startedAtMillis) {
            this.workoutName = workoutName;
            this.startedAtMillis = startedAtMillis;
        }
    }
}
