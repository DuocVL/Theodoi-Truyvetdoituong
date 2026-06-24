package com.example.theodoi.worker

import android.content.Context
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import com.example.theodoi.data.LocationRepository
import kotlinx.coroutines.coroutineScope

class LocationSyncWorker(
    context: Context,
    params: WorkerParameters
) : CoroutineWorker(context, params) {

    override suspend fun doWork(): Result = coroutineScope {
        val repository = LocationRepository(applicationContext)
        val ok = repository.fetchAndSendOnce(this)
        if (ok) Result.success() else Result.retry()
    }
}