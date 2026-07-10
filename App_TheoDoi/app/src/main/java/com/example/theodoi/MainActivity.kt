package com.example.theodoi

import android.content.Intent
import android.os.Build
import android.os.Bundle
import android.util.Log
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.example.theodoi.data.AppDatabase
import com.example.theodoi.data.AuthRepository
import com.example.theodoi.data.FaceRepository
import com.example.theodoi.data.SessionManager
import com.example.theodoi.data.UserEntity
import com.example.theodoi.databinding.ActivityMainBinding
import com.example.theodoi.network.ApiClient
import com.example.theodoi.security.CryptoManager
import com.example.theodoi.ui.HistoryActivity
import com.example.theodoi.ui.auth.LoginActivity
import com.example.theodoi.utils.FaceMath
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import android.Manifest
import androidx.core.content.ContextCompat
import android.content.pm.PackageManager
import android.net.Uri
import android.os.PowerManager
import android.provider.Settings
import com.example.theodoi.realtime.PrefsManager
import com.example.theodoi.realtime.LocationForegroundService

//Màn hình chính sau khi người dùng đăng nhập

class MainActivity : AppCompatActivity() {

    private lateinit var binding: ActivityMainBinding//liên kết giao diện XML
    private lateinit var sessionManager: SessionManager//QUnr lý phiên(token)
    private lateinit var database: AppDatabase//cơ sở dữ liệu room

    private val faceRepository = FaceRepository()//api xử lý khuôn mặt
    private val cryptoManager = CryptoManager()//mã hóa dữ liệu FaceID trước khi lưu

    //Được gọi đầu tiên khi MainActivity được khởi tạo
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        //Khởi tạo binding liên kết đến giao diện
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        //Thiết lập chu kỳ quét GPS và cấu hình địa chỉ URL
        PrefsManager.setIntervalMs(this, 60_000L)//1 phút 60000ms
        PrefsManager.setServerUrl(this, "http://192.168.44.101:3333/api/v1/locations/")

        //Khởi động chuỗi rà soát và yêu cầu cấp quyền hệ thống vị trí , thông báo ảnh ,...
        requestAllPermissions()

        //Khởi tạo SessionManager và database để lấy token , dữ liệu face_data
        sessionManager = SessionManager(this)
        database = AppDatabase.getDatabase(this)//khởi tạo singleton của room database

        //xin quyền notifiacation có thể phải gộp
        askNotificationPermission()

        // Thực hiện kiểm tra đồng bộ khuôn mặt từ Server nếu trong room chưa có
        checkAndSyncFaceBiometric()

        //Thực hiện check-in
        binding.btnGoToVerify.setOnClickListener {
            startActivity(Intent(this, VerifyActivity::class.java))
        }

        //Thwucj hiện logic khi Logout
        binding.btnLogout.setOnClickListener {
            val refreshToken = sessionManager.getRefreshToken()//lấy refresh token
            if (!refreshToken.isNullOrEmpty()) {
                lifecycleScope.launch(Dispatchers.IO) {
                    try {
                        // Gọi API báo hủy Token lên hệ thống Backend
                        AuthRepository().logout(refreshToken)
                    } catch (e: Exception) {
                        Log.e("THEODOI_LOGOUT",e.toString())
                    }

                    withContext(Dispatchers.Main) {
                        // Xóa SharedPreferences
                        sessionManager.clearTokens()

                        //TODO xóa face_data đã lưu, kiểm tra có dữ liệu cần đồng bộ không
                        database.userDao().deleteAllUsers()

                        // Điều hướng quay lại LoginActivity
                        val intent = Intent(this@MainActivity, LoginActivity::class.java)
                        intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
                        startActivity(intent)
                        finish()
                    }
                }
            }
        }

        //đến activity lịch sử chekc-in
        binding.btnGoToHistory.setOnClickListener {
            startActivity(Intent(this, HistoryActivity::class.java))
        }

    }


    private val requestPermissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { isGranted ->
        if (!isGranted) {
            Log.w("FCM", "Người dùng từ chối quyền thông báo")
        }
    }

    //xin quyền thông báo từ ANDROID 13+ yêu cầu
    private fun askNotificationPermission() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS)
                != PackageManager.PERMISSION_GRANTED) {
                requestPermissionLauncher.launch(Manifest.permission.POST_NOTIFICATIONS)
            }
        }
    }

    private fun requestAllPermissions() {
        val permissions = mutableListOf(
            Manifest.permission.ACCESS_FINE_LOCATION,
            Manifest.permission.ACCESS_COARSE_LOCATION
        )
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            permissions.add(Manifest.permission.POST_NOTIFICATIONS)
        }
        requestPermissions.launch(permissions.toTypedArray())
    }

    private fun requestBackgroundLocationIfNeeded() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            requestBackgroundLocation.launch(Manifest.permission.ACCESS_BACKGROUND_LOCATION)
        } else {
            startTrackingService()
        }
    }

    /** Xin user loại app khỏi Doze/tối ưu pin — quan trọng cho trường hợp tắt màn hình lâu. */
    private fun askIgnoreBatteryOptimization() {
        val pm = getSystemService(POWER_SERVICE) as PowerManager
        if (!pm.isIgnoringBatteryOptimizations(packageName)) {
            try {
                val intent = Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS).apply {
                    data = Uri.parse("package:$packageName")
                }
                startActivity(intent)
            } catch (e: Exception) {
                // một số máy không hỗ trợ intent này -> dẫn user vào Settings thủ công
            }
        }
    }

    private fun startTrackingService() {
        PrefsManager.setTrackingEnabled(this, true)
        LocationForegroundService.start(this)
    }

    fun stopTrackingService() {
        LocationForegroundService.stop(this)
    }

    private val requestPermissions = registerForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { results ->
        val fineGranted = results[Manifest.permission.ACCESS_FINE_LOCATION] == true
        if (fineGranted) {
            requestBackgroundLocationIfNeeded()
        }
    }

    private val requestBackgroundLocation = registerForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { granted ->
        if (granted) askIgnoreBatteryOptimization()
        startTrackingService()
    }

    //đồng bộ dữu liệu khuôn mặt
    private fun checkAndSyncFaceBiometric() {
        val token = sessionManager.getAccessToken()//lấy accesstoken
        if (token == null) {
            Toast.makeText(this, "Phiên đăng nhập hết hạn!", Toast.LENGTH_SHORT).show()
            return
        }

        lifecycleScope.launch(Dispatchers.IO) {
            // Kiểm tra xem Room Local DB đã lưu cấu hình FaceID nào chưa
            val localUsers = database.userDao().getAllUsers()

            if (localUsers.isEmpty()) {
                // Nếu Local trống, gọi API lấy dữ liệu từ server về đồng bộ
                withContext(Dispatchers.Main) {
                    Toast.makeText(this@MainActivity, "Đang đồng bộ dữ liệu FaceID...", Toast.LENGTH_SHORT).show()
                }

                try {
                    val response = faceRepository.getMyFaceFromServer(token)
                    if (response.isSuccessful && response.body()?.data != null) {
                        val faceData = response.body()!!.data

                        // Chuyển mảng List<Float> của server thành FloatArray để khớp với Module AI hiện tại
                        val floatArrayVector = faceData!!.embedding.toFloatArray()
                        val rawBytes = FaceMath.floatArrayToByteArray(floatArrayVector)

                        // Thực hiện mã hóa bảo mật trước khi đẩy xuống SQLite cục bộ
                        val (encryptedBytes, iv) = cryptoManager.encrypt(rawBytes)
                        val userId = faceData.subject_id.substring(0, 6)

                        val syncedUser = UserEntity(
                            userId = faceData.subject_id,
                            name = "User_$userId",
                            encryptedVector = encryptedBytes,
                            iv = iv
                        )
                        database.userDao().insertUser(syncedUser)

                        withContext(Dispatchers.Main) {
                            Toast.makeText(this@MainActivity, "Đồng bộ FaceID thành công!", Toast.LENGTH_SHORT).show()
                        }
                    } else if (response.code() != 200) {
                        // Trường hợp mã lỗi 404: Bắt buộc chuyển hướng đến RegisterActivity
                        withContext(Dispatchers.Main) {
                            Toast.makeText(this@MainActivity, "Bạn chưa đăng ký dữ liệu khuôn mặt. Hãy thiết lập ngay!", Toast.LENGTH_LONG).show()
                            val intent = Intent(this@MainActivity, RegisterActivity::class.java)
                            startActivity(intent)
                            finish() // Khóa màn hình chính lại, không cho tương tác tiếp
                        }
                    }
                } catch (e: Exception) {
                    withContext(Dispatchers.Main) {
                        Toast.makeText(this@MainActivity, "Lỗi kết nối đồng bộ: ${e.message}", Toast.LENGTH_LONG).show()
                    }
                }
            }
        }
    }
}