package com.yourname.strive;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

public class WorkoutReminderReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
        if (intent == null || !StriveNotificationHelper.ACTION_WORKOUT_REMINDER.equals(intent.getAction())) {
            return;
        }

        int notificationId = intent.getIntExtra("notificationId", 12001);
        String title = intent.getStringExtra("title");
        String body = intent.getStringExtra("body");

        StriveNotificationHelper.showWorkoutReminder(
            context,
            notificationId,
            title != null ? title : "Time to train",
            body != null ? body : "Open Strive and log your next workout."
        );
    }
}

