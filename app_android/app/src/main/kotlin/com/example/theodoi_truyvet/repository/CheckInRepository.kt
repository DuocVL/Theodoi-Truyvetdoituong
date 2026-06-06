package com.example.theodoi_truyvet.repository

import com.example.theodoi_truyvet.api.ApiService
import com.example.theodoi_truyvet.api.CheckInRequest
import com.example.theodoi_truyvet.database.AppDao
import com.example.theodoi_truyvet.database.PendingCheckIn
import com.example.theodoi_truyvet.location.AppLocation
import java.util.Date
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class CheckInRepository @Inject constructor(
    private val apiService: ApiService,
    private val appDao: AppDao
) {

    /**
     * Attempts to perform a check-in. If there's an internet connection,
     * it sends the request to the server. Otherwise, it saves the check-in
     * locally to be synced later.
     */
    suspend fun performCheckIn(location: AppLocation, imageUrl: String) {
        try {
            // Attempt to call the API first
            val request = CheckInRequest(
                latitude = location.latitude,
                longitude = location.longitude,
                imageUrl = imageUrl
            )
            apiService.checkIn(request) // Assume this returns a successful response

            // Optional: If successful, you might want to ensure any pending check-ins are also sent.
            // syncPendingCheckIns()

        } catch (e: Exception) {
            // This will catch network errors, server errors, etc.
            // Save the check-in locally
            savePendingCheckIn(location, imageUrl)
        }
    }

    /**
     * Saves a check-in to the local database for later synchronization.
     */
    private suspend fun savePendingCheckIn(location: AppLocation, imageUrl: String) {
        val pendingCheckIn = PendingCheckIn(
            latitude = location.latitude,
            longitude = location.longitude,
            imageUrl = imageUrl,
            createdAt = Date()
        )
        appDao.insertPendingCheckIn(pendingCheckIn)
    }

    /**
     * Goes through all pending check-ins and tries to sync them with the server.
     * This should be called periodically, e.g., using WorkManager.
     */
    suspend fun syncPendingCheckIns() {
        val pendingList = appDao.getAllPendingCheckIns()
        for (pending in pendingList) {
            try {
                val request = CheckInRequest(pending.latitude, pending.longitude, pending.imageUrl)
                apiService.checkIn(request)
                // If successful, remove it from the local database
                appDao.deletePendingCheckIn(pending.id)
            } catch (e: Exception) {
                // If it fails again, we leave it for the next sync attempt.
                continue
            }
        }
    }
}
