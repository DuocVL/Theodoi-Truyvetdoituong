package com.example.theodoi.realtime

import android.app.*
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.IBinder
import android.os.PowerManager
import androidx.core.app.NotificationCompat
import com.example.theodoi.MainActivity
import com.example.theodoi.R
import com.example.theodoi.data.LocationRepository
import kotlinx.coroutines.*

class LocationForegroundService : Service() {

    private val serviceScope = CoroutineScope(SupervisorJob() + Dispatchers.IO)
    private var trackingJob: Job? = null
    private lateinit var repository: LocationRepository
    private var wakeLock: PowerManager.WakeLock? = null

    companion object {
        const val CHANNEL_ID = "location_tracking_channel"
        const val NOTIFICATION_ID = 1001
        const val ACTION_START = "ACTION_START"
        const val ACTION_STOP = "ACTION_STOP"

        fun start(context: Context) {
            val intent = Intent(context, LocationForegroundService::class.java).apply {
                action = ACTION_START
            }
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(intent)
            } else {
                context.startService(intent)
            }
        }

        fun stop(context: Context) {
            context.stopService(Intent(context, LocationForegroundService::class.java))
        }
    }

    override fun onCreate() {
        super.onCreate()
        repository = LocationRepository(applicationContext)
        createNotificationChannel()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_STOP -> {
                stopTracking()
                stopSelf()
                return START_NOT_STICKY
            }
            else -> startTracking()
        }
        return START_STICKY
    }

    private fun startTracking() {
        startForeground(NOTIFICATION_ID, buildNotification())
        acquireWakeLock()

        trackingJob?.cancel()
        trackingJob = serviceScope.launch {
            while (isActive) {
                val intervalMs = PrefsManager.getIntervalMs(applicationContext)
                val ok = repository.fetchAndSendOnce(this)
                updateNotification(ok)
                delay(intervalMs)
            }
        }
    }

    private fun stopTracking() {
        trackingJob?.cancel()
        releaseWakeLock()
        PrefsManager.setTrackingEnabled(applicationContext, false)
    }

    /** Giữ CPU thức đủ để xử lý đúng giờ ngay cả khi tắt màn hình. */
    @Suppress("DEPRECATION")
    private fun acquireWakeLock() {
        val pm = getSystemService(Context.POWER_SERVICE) as PowerManager
        wakeLock = pm.newWakeLock(
            PowerManager.PARTIAL_WAKE_LOCK,
            "TheoDoi::LocationWakeLock"
        ).apply { acquire(10 * 60 * 1000L /* tối đa 10 phút/lần, tự renew theo loop */) }
    }

    private fun releaseWakeLock() {
        if (wakeLock?.isHeld == true) wakeLock?.release()
        wakeLock = null
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "Theo dõi vị trí",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Thông báo khi app đang gửi vị trí định kỳ"
            }
            val manager = getSystemService(NotificationManager::class.java)
            manager.createNotificationChannel(channel)
        }
    }

    private fun buildNotification(lastSentOk: Boolean? = null): Notification {
        val openAppIntent = Intent(this, MainActivity::class.java)
        val pendingIntent = PendingIntent.getActivity(
            this, 0, openAppIntent,
            PendingIntent.FLAG_IMMUTABLE
        )

        val statusText = when (lastSentOk) {
            true -> "Đang gửi vị trí - lần gần nhất: thành công"
            false -> "Đang gửi vị trí - lần gần nhất: lỗi, sẽ thử lại"
            null -> "Đang khởi động theo dõi vị trí..."
        }

        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("Theo dõi vị trí")
            .setContentText(statusText)
            .setSmallIcon(R.drawable.ic_notification)
            .setOngoing(true)
            .setContentIntent(pendingIntent)
            .build()
    }

    private fun updateNotification(lastSentOk: Boolean) {
        val manager = getSystemService(NotificationManager::class.java)
        manager.notify(NOTIFICATION_ID, buildNotification(lastSentOk))
    }

    /**
     * Người dùng vuốt app khỏi Recent Apps (không phải Force Stop).
     * Thử khởi động lại service ngay. Nhiều OEM (MIUI, ColorOS...) vẫn
     * sẽ chặn việc này trừ khi user đã whitelist app trong cài đặt pin.
     */
    override fun onTaskRemoved(rootIntent: Intent?) {
        val restartIntent = Intent(applicationContext, LocationForegroundService::class.java).apply {
            action = ACTION_START
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            applicationContext.startForegroundService(restartIntent)
        } else {
            applicationContext.startService(restartIntent)
        }
        super.onTaskRemoved(rootIntent)
    }

    override fun onDestroy() {
        stopTracking()
        serviceScope.cancel()
        super.onDestroy()
    }

    override fun onBind(intent: Intent?): IBinder? = null
}