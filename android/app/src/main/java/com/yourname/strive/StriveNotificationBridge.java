package com.yourname.strive;

import android.Manifest;
import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.os.Build;
import android.webkit.JavascriptInterface;
import androidx.core.content.ContextCompat;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;
import java.util.TimeZone;
import org.json.JSONArray;
import org.json.JSONObject;

public class StriveNotificationBridge {
    private static final int POST_NOTIFICATIONS_REQUEST_CODE = 4701;
    private final Activity activity;

    public StriveNotificationBridge(Activity activity) {
        this.activity = activity;
        StriveNotificationHelper.createNotificationChannels(activity.getApplicationContext());
    }

    @JavascriptInterface
    public void requestPostNotificationsPermission() {
        requestPostNotificationsPermissionIfNeeded();
    }

    @JavascriptInterface
    public void scheduleWorkoutReminders(String remindersJson) {
        requestPostNotificationsPermissionIfNeeded();

        try {
            JSONArray reminders = new JSONArray(remindersJson);
            for (int index = 0; index < reminders.length(); index++) {
                JSONObject reminder = reminders.getJSONObject(index);
                StriveNotificationHelper.scheduleWorkoutReminder(activity.getApplicationContext(), reminder);
            }
        } catch (Exception ignored) {
            // Notification scheduling should never crash the WebView.
        }
    }

    @JavascriptInterface
    public void cancelWorkoutReminders(String workoutId) {
        try {
            StriveNotificationHelper.cancelWorkoutReminders(activity.getApplicationContext(), workoutId);
        } catch (Exception ignored) {
            // Notification cancellation is best-effort.
        }
    }

    @JavascriptInterface
    public void startActiveWorkoutNotification(String payloadJson) {
        requestPostNotificationsPermissionIfNeeded();
        showActiveWorkoutNotification(payloadJson);
    }

    @JavascriptInterface
    public void updateActiveWorkoutNotification(String payloadJson) {
        showActiveWorkoutNotification(payloadJson);
    }

    @JavascriptInterface
    public void stopActiveWorkoutNotification() {
        Context context = activity.getApplicationContext();
        ActiveWorkoutNotificationService.clearStoredState(context);
        context.stopService(new Intent(context, ActiveWorkoutNotificationService.class));
        StriveNotificationHelper.stopActiveWorkoutNotification(context);
    }

    private void showActiveWorkoutNotification(String payloadJson) {
        try {
            JSONObject payload = new JSONObject(payloadJson);
            String workoutName = payload.optString("workoutName", "Workout");
            int elapsedSeconds = payload.optInt("elapsedSeconds", 0);
            long startedAtMillis = parseIsoTime(payload.optString("startedAt", ""), 0L);
            JSONObject restTimer = payload.optJSONObject("restTimer");
            Context context = activity.getApplicationContext();
            Intent intent = new Intent(context, ActiveWorkoutNotificationService.class)
                .putExtra(ActiveWorkoutNotificationService.EXTRA_WORKOUT_NAME, workoutName)
                .putExtra(ActiveWorkoutNotificationService.EXTRA_ELAPSED_SECONDS, elapsedSeconds)
                .putExtra(ActiveWorkoutNotificationService.EXTRA_STARTED_AT_MILLIS, startedAtMillis);
            if (restTimer != null) {
                intent
                    .putExtra(
                        ActiveWorkoutNotificationService.EXTRA_REST_EXERCISE_NAME,
                        restTimer.optString("exerciseName", "")
                    )
                    .putExtra(
                        ActiveWorkoutNotificationService.EXTRA_REST_ENDS_AT_MILLIS,
                        restTimer.optLong("endsAt", 0L)
                    );
            }
            ContextCompat.startForegroundService(context, intent);
        } catch (Exception ignored) {
            // Active workout notifications should never crash the WebView.
        }
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

    private void requestPostNotificationsPermissionIfNeeded() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU) return;
        if (activity.checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) == PackageManager.PERMISSION_GRANTED) return;

        activity.runOnUiThread(() ->
            activity.requestPermissions(
                new String[] { Manifest.permission.POST_NOTIFICATIONS },
                POST_NOTIFICATIONS_REQUEST_CODE
            )
        );
    }
}
