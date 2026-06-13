package com.yourname.strive;

import android.app.Notification;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.ServiceInfo;
import android.os.Build;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;

public class ActiveWorkoutNotificationService extends Service {
    static final String EXTRA_WORKOUT_NAME = "workoutName";
    static final String EXTRA_ELAPSED_SECONDS = "elapsedSeconds";
    static final String EXTRA_STARTED_AT_MILLIS = "startedAtMillis";
    static final String EXTRA_REST_EXERCISE_NAME = "restExerciseName";
    static final String EXTRA_REST_ENDS_AT_MILLIS = "restEndsAtMillis";
    private static final String STORE_NAME = "strive_active_workout_service";
    private static final String KEY_WORKOUT_NAME = "workout_name";
    private static final String KEY_STARTED_AT_MILLIS = "started_at_millis";
    private static final String KEY_REST_EXERCISE_NAME = "rest_exercise_name";
    private static final String KEY_REST_ENDS_AT_MILLIS = "rest_ends_at_millis";
    private final Handler handler = new Handler(Looper.getMainLooper());
    private ActiveWorkoutState currentState = null;
    private final Runnable restTicker = new Runnable() {
        @Override
        public void run() {
            ActiveWorkoutState state = currentState;
            if (state == null) return;

            showNotification(state, false);
            if (state.hasRestTimer() && state.getRestRemainingSeconds() > 0) {
                handler.postDelayed(this, 1000L);
            }
        }
    };

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
        currentState = state;
        showNotification(state, true);
        scheduleRestTicker(state);

        return START_STICKY;
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    @Override
    public void onDestroy() {
        handler.removeCallbacks(restTicker);
        currentState = null;
        super.onDestroy();
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
        boolean hasRestExerciseName = intent.hasExtra(EXTRA_REST_EXERCISE_NAME);
        boolean hasRestEndsAtMillis = intent.hasExtra(EXTRA_REST_ENDS_AT_MILLIS);
        if (!hasWorkoutName && !hasElapsedSeconds && !hasStartedAtMillis && !hasRestExerciseName && !hasRestEndsAtMillis) {
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

        String restExerciseName = intent.getStringExtra(EXTRA_REST_EXERCISE_NAME);
        if (restExerciseName == null) {
            restExerciseName = "";
        }
        long restEndsAtMillis = intent.getLongExtra(EXTRA_REST_ENDS_AT_MILLIS, 0L);
        return new ActiveWorkoutState(workoutName, startedAtMillis, restExerciseName, restEndsAtMillis);
    }

    private static ActiveWorkoutState readStoredState(Context context) {
        SharedPreferences preferences = getPreferences(context);
        String workoutName = preferences.getString(KEY_WORKOUT_NAME, null);
        long startedAtMillis = preferences.getLong(KEY_STARTED_AT_MILLIS, 0L);
        String restExerciseName = preferences.getString(KEY_REST_EXERCISE_NAME, "");
        long restEndsAtMillis = preferences.getLong(KEY_REST_ENDS_AT_MILLIS, 0L);

        if (workoutName == null || startedAtMillis <= 0L) {
            return null;
        }

        return new ActiveWorkoutState(workoutName, startedAtMillis, restExerciseName, restEndsAtMillis);
    }

    private static void storeState(Context context, ActiveWorkoutState state) {
        getPreferences(context)
            .edit()
            .putString(KEY_WORKOUT_NAME, state.workoutName)
            .putLong(KEY_STARTED_AT_MILLIS, state.startedAtMillis)
            .putString(KEY_REST_EXERCISE_NAME, state.restExerciseName)
            .putLong(KEY_REST_ENDS_AT_MILLIS, state.restEndsAtMillis)
            .apply();
    }

    private static SharedPreferences getPreferences(Context context) {
        return context.getSharedPreferences(STORE_NAME, Context.MODE_PRIVATE);
    }

    private void showNotification(ActiveWorkoutState state, boolean foreground) {
        int elapsedSeconds = state.getElapsedSeconds();
        Notification notification = StriveNotificationHelper.buildActiveWorkoutNotification(
            this,
            state.workoutName,
            elapsedSeconds,
            state.restExerciseName,
            state.hasRestTimer() ? state.getRestRemainingSeconds() : -1
        );

        if (foreground) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                startForeground(
                    StriveNotificationHelper.ACTIVE_WORKOUT_NOTIFICATION_ID,
                    notification,
                    ServiceInfo.FOREGROUND_SERVICE_TYPE_DATA_SYNC
                );
            } else {
                startForeground(StriveNotificationHelper.ACTIVE_WORKOUT_NOTIFICATION_ID, notification);
            }
            return;
        }

        StriveNotificationHelper.showActiveWorkoutNotification(this, notification);
    }

    private void scheduleRestTicker(ActiveWorkoutState state) {
        handler.removeCallbacks(restTicker);
        if (state.hasRestTimer() && state.getRestRemainingSeconds() > 0) {
            handler.postDelayed(restTicker, 1000L);
        }
    }

    private static final class ActiveWorkoutState {
        final String workoutName;
        final long startedAtMillis;
        final String restExerciseName;
        final long restEndsAtMillis;

        ActiveWorkoutState(String workoutName, long startedAtMillis, String restExerciseName, long restEndsAtMillis) {
            this.workoutName = workoutName;
            this.startedAtMillis = startedAtMillis;
            this.restExerciseName = restExerciseName == null ? "" : restExerciseName;
            this.restEndsAtMillis = restEndsAtMillis;
        }

        int getElapsedSeconds() {
            return (int) Math.max(0, (System.currentTimeMillis() - startedAtMillis) / 1000L);
        }

        int getRestRemainingSeconds() {
            return (int) Math.max(0, (restEndsAtMillis - System.currentTimeMillis() + 999L) / 1000L);
        }

        boolean hasRestTimer() {
            return restEndsAtMillis > 0L;
        }
    }
}
