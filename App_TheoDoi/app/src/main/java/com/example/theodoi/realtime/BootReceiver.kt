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

/*
MainActivity
      │
      ▼
LocationForegroundService
      │
      ├─────────────── Foreground Notification
      │
      ├─────────────── WakeLock
      │
      ▼
Coroutine (while true)
      │
      ▼
Đọc interval (PrefsManager)
      │
      ▼
LocationRepository
      │
      ▼
GpsManager
      │
      ├── Cache còn mới → dùng cache
      │
      └── Cache cũ/không có → FusedLocationProviderClient
                               │
                               ├── GPS
                               ├── Wi-Fi
                               └── Trạm phát sóng
      │
      ▼
LocationPayload
      │
      ▼
Retrofit + OkHttp
      │
      ▼
REST API Server
      │
      ▼
HTTP Response
      │
      ▼
Cập nhật Notification
      │
      ▼
delay(interval)
      │
      └─────────────── lặp lại
 */