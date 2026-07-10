package com.example.theodoi.service


import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import android.os.Build
import android.util.Log
import androidx.core.app.NotificationCompat
import com.example.theodoi.R
import com.example.theodoi.data.SessionManager
import com.example.theodoi.data.SubjectRepository
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch

//thực hiện gửi yêu cầu cập nhật fcm_token khi có thay đổi

class MyFirebaseMessagingService : FirebaseMessagingService() {

    private lateinit var sessionManager: SessionManager
    private lateinit var subjectRepository: SubjectRepository
    private val serviceScope = CoroutineScope(Dispatchers.IO + SupervisorJob())

    override fun onCreate() {
        super.onCreate()

        sessionManager = SessionManager(applicationContext)
        subjectRepository = SubjectRepository()
    }
    override fun onNewToken(token: String) {
        super.onNewToken(token)
        Log.d("FCM", "New token: $token")

        // gửi token về server
        sendNewTokenToServer(token)
    }

    private fun sendNewTokenToServer(token: String) {
        serviceScope.launch {
            try {
                // Kiểm tra xem user đã đăng nhập chưa bằng SessionManager
                val assetToken = sessionManager.getAccessToken()
                if (assetToken != null) {
                    subjectRepository.updateFCMToken(assetToken, token)
                    Log.d("FCM", "Đã cập nhật token lên server thành công")
                }
            } catch (e: Exception) {
                Log.e("FCM", "Lỗi cập nhật token: ${e.message}")
            }
        }
    }

    override fun onMessageReceived(message: RemoteMessage) {
        super.onMessageReceived(message)

        val title = message.notification?.title ?: "Thông báo"
        val body = message.notification?.body ?: "Bạn có thông báo mới"

        showNotification(title, body)
    }

    private fun showNotification(title: String, body: String) {
        val channelId = "default_channel"
        val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                channelId,
                "Thông báo kiểm tra",
                NotificationManager.IMPORTANCE_HIGH
            )
            manager.createNotificationChannel(channel)
        }

        val builder = NotificationCompat.Builder(this, channelId)
            .setSmallIcon(R.drawable.ic_notification) // Đảm bảo file này tồn tại
            .setContentTitle(title)
            .setContentText(body)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setAutoCancel(true)

        manager.notify(0, builder.build())
    }

    override fun onDestroy() {
        super.onDestroy()
        serviceScope.cancel() // Hủy coroutine khi service bị hủy
    }
}