package com.example.theodoi.data

import android.content.Context
import android.util.Log
import com.example.theodoi.realtime.PrefsManager
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlin.coroutines.resume

class LocationRepository(private val context: Context) {

    private val gpsManager = GpsManager(context)
    private val apiService = RetrofitClient.create(context)

    companion object {
        private const val TAG = "LocationRepository"
    }

    /** Lấy vị trí + gửi lên server. Trả về true nếu gửi thành công. */
    suspend fun fetchAndSendOnce(scope: CoroutineScope): Boolean {
        val gps = fetchLocationSuspend(scope) ?: run {
            Log.w(TAG, "Khong lay duoc vi tri, bo qua lan nay")
            return false
        }
        return sendToServer(gps)
    }

    private suspend fun fetchLocationSuspend(scope: CoroutineScope): GpsResult? =
        suspendCancellableCoroutine { cont ->
            gpsManager.fetchFastLocation(scope) { result ->
                if (cont.isActive) cont.resume(result)
            }
        }

    private suspend fun sendToServer(gps: GpsResult): Boolean {
        return try {
            val payload = LocationPayload(
                deviceId = PrefsManager.getDeviceId(context),
                latitude = gps.latitude,
                longitude = gps.longitude,
                accuracy = gps.accuracy,
                timestamp = gps.timestamp,
                isMock = gps.isMock
            )
            val response = apiService.sendLocation(payload)
            Log.d(TAG, "Gui vi tri: code=${response.code()}")
            response.isSuccessful
        } catch (e: Exception) {
            Log.e(TAG, "Loi gui vi tri: ${e.message}")
            false
        }
    }
}