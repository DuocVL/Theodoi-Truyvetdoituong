package com.example.theodoi.worker

import android.content.Context
import androidx.work.*
import java.util.concurrent.TimeUnit

/**
 * Goi scheduleSync() sau moi lan luu check-in offline, hoac luc app khoi dong
 * (de phong truong hop app bi kill khi dang offline, chua kip enqueue lai).
 * An toan goi nhieu lan: enqueueUniqueWork + KEEP se khong tao job trung lap.
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