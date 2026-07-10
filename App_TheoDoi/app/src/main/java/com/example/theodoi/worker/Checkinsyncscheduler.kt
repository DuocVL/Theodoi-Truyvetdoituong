package com.example.theodoi.worker

import android.content.Context
import androidx.work.*
import java.util.concurrent.TimeUnit

/**
ớp quản lý việc lên lịch (schedule) cho WorkManager. 
Nó không thực hiện đồng bộ dữ liệu, mà chỉ có nhiệm vụ đăng ký để SyncCheckinWorker chạy khi đủ điều kiện
 */

 /*
 VerifyActivity
       │
       ▼
CheckinSyncScheduler
       │
       ▼
WorkManager
       │
       ▼
SyncCheckinWorker
       │
       ▼
Server
  */
object CheckinSyncScheduler {

    private const val UNIQUE_WORK_NAME = "offline_checkin_sync"

    fun scheduleSync(context: Context) {
        val constraints = Constraints.Builder()
            .setRequiredNetworkType(NetworkType.CONNECTED) // WorkManager TU CHO den khi co mang moi chay
            .build()

        val request = OneTimeWorkRequestBuilder<SyncCheckinWorker>()
            .setConstraints(constraints)
            .setBackoffCriteria(BackoffPolicy.EXPONENTIAL, 30, TimeUnit.SECONDS)
            .build()

        WorkManager.getInstance(context).enqueueUniqueWork(
            UNIQUE_WORK_NAME,
            ExistingWorkPolicy.KEEP, // neu da co job dang cho mang, khong tao job moi trung lap
            request
        )
    }
}