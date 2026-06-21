package com.example.theodoi.data

import android.Manifest
import android.annotation.SuppressLint
import android.content.Context
import android.content.pm.PackageManager
import android.location.Location
import android.location.LocationManager
import android.util.Log
import androidx.core.content.ContextCompat
import com.google.android.gms.location.*
import com.google.android.gms.tasks.CancellationTokenSource
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.launch
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlinx.coroutines.withTimeoutOrNull
import kotlin.coroutines.resume

data class GpsResult(
    val latitude: Double,
    val longitude: Double,
    val accuracy: Float,
    val timestamp: Long,
    val isMock: Boolean
)

class GpsManager(private val context: Context) {

    companion object {
        private const val TAG = "GpsManager"
        private const val CACHE_MAX_AGE = 300000L   // 5 phut
        private const val ACCEPT_ACCURACY = 150f
        private const val GPS_TIMEOUT = 3000L        // 3s - timeout THUC SU, khong phu thuoc Play Services tu huy
    }

    private val fusedLocationClient = LocationServices.getFusedLocationProviderClient(context)

    fun fetchFastLocation(
        coroutineScope: CoroutineScope,
        callback: (GpsResult?) -> Unit
    ) {
        if (!hasLocationPermission()) {
            Log.e(TAG, "Missing location permission")
            callback(null)
            return
        }

        // Canh bao neu nguoi dung tat het Location Services -> se cham/khong co ket qua
        if (!isLocationServiceEnabled()) {
            Log.w(TAG, "Location Services dang bi tat tren thiet bi - se rat cham hoac fail")
        }

        coroutineScope.launch {
            val result = resolveLocation()
            callback(result)
        }
    }

    @SuppressLint("MissingPermission")
    private suspend fun resolveLocation(): GpsResult? {
        // 1. Thu cache truoc (khong ton thoi gian)
        val cached = getCachedLocationOrNull()
        if (cached != null) {
            val age = System.currentTimeMillis() - cached.time
            Log.d(TAG, "Cached location: age=${age / 1000}s, accuracy=${cached.accuracy}m")
            if (age < CACHE_MAX_AGE && cached.accuracy <= ACCEPT_ACCURACY) {
                Log.d(TAG, "Dung cache - tra ket qua ngay")
                return convert(cached)
            }
        }

        // 2. Quet vi tri moi, NHUNG voi timeout o tang coroutine - LUON tra ve dung han
        Log.d(TAG, "Quet vi tri moi voi timeout cung ${GPS_TIMEOUT}ms")
        val fresh = withTimeoutOrNull(GPS_TIMEOUT) {
            requestCurrentLocationSuspend()
        }

        return when {
            fresh != null -> {
                Log.d(TAG, "Quet thanh cong trong han: ${fresh.latitude}, ${fresh.longitude}")
                convert(fresh)
            }
            cached != null -> {
                Log.w(TAG, "Qua han ${GPS_TIMEOUT}ms -> dung fallback cache cu (accuracy=${cached.accuracy}m)")
                convert(cached)
            }
            else -> {
                Log.e(TAG, "Qua han va khong co cache fallback -> tra null")
                null
            }
        }
    }

    @SuppressLint("MissingPermission")
    private suspend fun getCachedLocationOrNull(): Location? =
        suspendCancellableCoroutine { cont ->
            fusedLocationClient.lastLocation
                .addOnSuccessListener { cont.resume(it) }
                .addOnFailureListener { cont.resume(null) }
        }

    /**
     * Quan trong: day la suspendCancellableCoroutine THUAN, khong dua vao
     * CancellationTokenSource.cancel() de dam bao callback tra ve.
     * Khi withTimeoutOrNull huy coroutine ngoai, invokeOnCancellation se
     * goi token.cancel() chi de tiet kiem pin/mang, KHONG dung de cho doi
     * ket qua tra ve nua (vi withTimeoutOrNull da tu tra null roi).
     */
    @SuppressLint("MissingPermission")
    private suspend fun requestCurrentLocationSuspend(): Location? =
        suspendCancellableCoroutine { cont ->
            val token = CancellationTokenSource()

            fusedLocationClient.getCurrentLocation(Priority.PRIORITY_BALANCED_POWER_ACCURACY, token.token)
                .addOnSuccessListener { location ->
                    if (cont.isActive) cont.resume(location)
                }
                .addOnFailureListener { e ->
                    Log.e(TAG, "Quet vi tri loi: ${e.message}")
                    if (cont.isActive) cont.resume(null)
                }

            cont.invokeOnCancellation {
                // Chi de don dep tai nguyen, KHONG dung de quyet dinh timeout nua
                token.cancel()
            }
        }

    private fun convert(location: Location): GpsResult = GpsResult(
        latitude = location.latitude,
        longitude = location.longitude,
        accuracy = location.accuracy,
        timestamp = location.time,
        isMock = location.isFromMockProvider
    )

    private fun hasLocationPermission(): Boolean =
        ContextCompat.checkSelfPermission(
            context, Manifest.permission.ACCESS_FINE_LOCATION
        ) == PackageManager.PERMISSION_GRANTED

    private fun isLocationServiceEnabled(): Boolean {
        val lm = context.getSystemService(Context.LOCATION_SERVICE) as LocationManager
        return lm.isProviderEnabled(LocationManager.GPS_PROVIDER) ||
                lm.isProviderEnabled(LocationManager.NETWORK_PROVIDER)
    }
}