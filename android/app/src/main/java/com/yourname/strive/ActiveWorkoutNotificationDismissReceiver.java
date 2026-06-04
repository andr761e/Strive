package com.yourname.strive;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import androidx.core.content.ContextCompat;

public class ActiveWorkoutNotificationDismissReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
        if (!ActiveWorkoutNotificationService.hasStoredState(context)) return;

        ContextCompat.startForegroundService(
            context,
            new Intent(context, ActiveWorkoutNotificationService.class)
        );
    }
}
