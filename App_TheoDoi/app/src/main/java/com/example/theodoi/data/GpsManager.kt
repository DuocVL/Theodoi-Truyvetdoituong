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

//Lớp chịu trách nhiệm lấy vị trí của thiết bị một cách nhanh , có giới hạn thời gian và có cơ chế dự phòng

//Kết quả trả về
data class GpsResult(
    val latitude: Double,
    val longitude: Double,
    val accuracy: Float,//sai số
    val timestamp: Long,
    val isMock: Boolean,//cho biết GPS có phải giả lập không
)


class GpsManager(private val context: Context) {

    companion object {
        private const val TAG = "GpsManager"
        private const val CACHE_MAX_AGE = 300000L   //5 phút - cache cũ hơn 5 phút không được dùng
        private const val ACCEPT_ACCURACY = 150f//sai số chấp nhận 150m
        private const val GPS_TIMEOUT = 3000L        // 3s - timeouts nếu GPS chưa trả kết quả trong 3s - dừng chờ
    }

    //API của Google Play Services kết hợp GPS + WIFI + Cell Tower + Bluetooth nhanh hơn và tiết kiệm pin
    private val fusedLocationClient = LocationServices.getFusedLocationProviderClient(context)

    fun fetchFastLocation(coroutineScope: CoroutineScope, callback: (GpsResult?) -> Unit ) {
        if (!hasLocationPermission()) {//kiểm tra quyền
            Log.e(TAG, "Missing location permission")
            callback(null)
            return
        }

        //Kiểm tra người dùng có bật GPS không
        if (!isLocationServiceEnabled()) {
            Log.w(TAG, "Location Services dang bi tat tren thiet bi - se rat cham hoac fail")
        }

        coroutineScope.launch {
            val result = resolveLocation()//lấy vị trí
            callback(result)
        }
    }

    @SuppressLint("MissingPermission")
    private suspend fun resolveLocation(): GpsResult? {
        //Lấy vị trí cache của Google Play Services
        val cached = getCachedLocationOrNull()
        if (cached != null) {
            val age = System.currentTimeMillis() - cached.time//tính age của cache
            Log.d(TAG, "Cached location: age=${age / 1000}s, accuracy=${cached.accuracy}m")
            if (age < CACHE_MAX_AGE && cached.accuracy <= ACCEPT_ACCURACY) {//kiểm tra các thông tin về age và độ chính xác
                Log.d(TAG, "Dung cache - tra ket qua ngay")
                return convert(cached)
            }
        }

        //Lấy vị trí GPS mới với thời gian timeout là 3s
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
     Quan trong: day la suspendCancellableCoroutine THUAN, khong dua vao
     CancellationTokenSource.cancel() de dam bao callback tra ve.
     Khi withTimeoutOrNull huy coroutine ngoai, invokeOnCancellation se
     goi token.cancel() chi de tiet kiem pin/mang, KHONG dung de cho doi
     ket qua tra ve nua (vi withTimeoutOrNull da tu tra null roi).
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

        //chuyển đổi dữ liệu
    private fun convert(location: Location): GpsResult = GpsResult(
        latitude = location.latitude,
        longitude = location.longitude,
        accuracy = location.accuracy,
        timestamp = location.time,
        isMock = location.isFromMockProvider
    )

    //kiểm tra quyền vị trí
    private fun hasLocationPermission(): Boolean =
        ContextCompat.checkSelfPermission(
            context, Manifest.permission.ACCESS_FINE_LOCATION
        ) == PackageManager.PERMISSION_GRANTED

    //kiểm tra GPS Provider hoặc Network Provider
    private fun isLocationServiceEnabled(): Boolean {
        val lm = context.getSystemService(Context.LOCATION_SERVICE) as LocationManager
        return lm.isProviderEnabled(LocationManager.GPS_PROVIDER) ||
                lm.isProviderEnabled(LocationManager.NETWORK_PROVIDER)
    }
}