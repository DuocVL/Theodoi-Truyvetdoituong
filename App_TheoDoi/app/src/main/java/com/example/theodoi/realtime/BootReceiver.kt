package com.example.theodoi.receiver

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import com.example.theodoi.realtime.PrefsManager
import com.example.theodoi.realtime.LocationForegroundService

class BootReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action == Intent.ACTION_BOOT_COMPLETED ||
            intent.action == "android.intent.action.QUICKBOOT_POWERON"
        ) {
            if (PrefsManager.isTrackingEnabled(context)) {
                LocationForegroundService.start(context)
            }
        }
    }
}