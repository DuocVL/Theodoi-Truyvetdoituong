package com.example.theodoi.ui.auth

import android.content.Intent
import android.os.Bundle
import android.util.Log
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.example.theodoi.MainActivity
import com.example.theodoi.data.AuthRepository
import com.example.theodoi.data.SessionManager
import com.example.theodoi.databinding.ActivityLoginBinding
import com.example.theodoi.utils.DeviceUtils
import com.google.firebase.messaging.FirebaseMessaging
import kotlinx.coroutines.launch
import kotlinx.coroutines.tasks.await

class LoginActivity : AppCompatActivity() {

    private lateinit var binding: ActivityLoginBinding
    private val authRepository by lazy { AuthRepository() }
    private lateinit var sessionManager: SessionManager

    companion object {
        private const val TAG = "DEVICE_INFO"
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityLoginBinding.inflate(layoutInflater)
        setContentView(binding.root)

        sessionManager = SessionManager(this)

        // Log device information for debugging and analytics
        logDeviceInfo()

        // If user is already logged in, go to MainActivity
        if (sessionManager.getAccessToken() != null) {
            navigateToMain()
            return
        }

        binding.btnLogin.setOnClickListener {
            handleLogin()
        }

        binding.tvForgotPassword.setOnClickListener {
            val intent = Intent(this, ForgotPasswordActivity::class.java)
            startActivity(intent)
        }
    }

    private fun handleLogin() {
        val username = binding.etUsername.text.toString().trim()
        val password = binding.etPassword.text.toString().trim()
        val deviceId = getDeviceAndroidId()

        if (username.isEmpty() || password.isEmpty()) {
            Toast.makeText(this, "Vui lòng nhập đầy đủ thông tin", Toast.LENGTH_SHORT).show()
            return
        }

        lifecycleScope.launch {
            try {
                // Hiển thị loading (nếu có UI spinner)
                // binding.progressBar.visibility = View.VISIBLE

                // Sử dụng await() để lấy token đồng bộ trong coroutine
                val fcmToken = try {
                    FirebaseMessaging.getInstance().token.await()
                } catch (e: Exception) {
                    Log.e("FCM_TAG", "Không thể lấy token: ${e.message}")
                    "" // Nếu lỗi thì trả về chuỗi rỗng hoặc xử lý logic theo yêu cầu
                }

                // Gọi API đăng nhập với token đã có
                val response = authRepository.login(username, password, deviceId, fcmToken)

                if (response.isSuccessful && response.body() != null) {
                    val loginResponse = response.body()!!
                    sessionManager.saveTokens(loginResponse.accessToken, loginResponse.refreshToken)

                    Toast.makeText(this@LoginActivity, "Đăng nhập thành công!", Toast.LENGTH_SHORT).show()
                    navigateToMain()
                } else {
                    val errorBody = response.errorBody()?.string() ?: "Đăng nhập thất bại"
                    Toast.makeText(this@LoginActivity, errorBody, Toast.LENGTH_LONG).show()
                }
            } catch (e: Exception) {
                // Bắt lỗi network hoặc các lỗi khác
                Toast.makeText(this@LoginActivity, "Lỗi: ${e.message}", Toast.LENGTH_LONG).show()
            } finally {
                // Ẩn loading nếu có
                // binding.progressBar.visibility = View.GONE
            }
        }
    }

    private fun navigateToMain() {
        val intent = Intent(this, MainActivity::class.java)
        startActivity(intent)
        finish() // Finish LoginActivity so user can't go back to it
    }

    private fun getDeviceAndroidId(): String {
        return DeviceUtils.getAndroidId(this)
    }

    private fun logDeviceInfo() {
        Log.i(TAG, "==================== Device Info ====================")
        Log.i(TAG, "Manufacturer: ${DeviceUtils.manufacturer}")
        Log.i(TAG, "Model: ${DeviceUtils.model}")
        Log.i(TAG, "Android Version: ${DeviceUtils.androidVersion} (SDK ${DeviceUtils.sdkVersion})")
        Log.i(TAG, "Android ID: ${getDeviceAndroidId()}")
        Log.i(TAG, "Is Emulator: ${DeviceUtils.isEmulator}")
        Log.i(TAG, "Is Rooted: ${DeviceUtils.isRooted}")
        Log.i(TAG, "====================================================")
    }

}
