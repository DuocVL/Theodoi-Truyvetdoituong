package com.example.theodoi.ui.auth

import android.content.Intent
import android.os.Bundle
import android.provider.Settings
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.example.theodoi.MainActivity
import com.example.theodoi.data.AuthRepository
import com.example.theodoi.data.SessionManager
import com.example.theodoi.databinding.ActivityLoginBinding
import kotlinx.coroutines.launch

class LoginActivity : AppCompatActivity() {

    private lateinit var binding: ActivityLoginBinding
    private val authRepository = AuthRepository()
    private lateinit var sessionManager: SessionManager

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityLoginBinding.inflate(layoutInflater)
        setContentView(binding.root)

        sessionManager = SessionManager(this)

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
        val deviceId = getDeviceId()

        if (username.isEmpty() || password.isEmpty()) {
            Toast.makeText(this, "Vui lòng nhập đầy đủ thông tin", Toast.LENGTH_SHORT).show()
            return
        }

        // Show progress indicator (optional)

        lifecycleScope.launch {
            try {
                val response = authRepository.login(username, password, deviceId)
                if (response.isSuccessful && response.body() != null) {
                    val loginResponse = response.body()!!
                    sessionManager.saveTokens(loginResponse.accessToken, loginResponse.refreshToken)
                    Toast.makeText(this@LoginActivity, "Đăng nhập thành công!", Toast.LENGTH_SHORT).show()
                    navigateToMain()
                } else {
                    // Handle login error (e.g., wrong credentials)
                    val errorBody = response.errorBody()?.string() ?: "Đăng nhập thất bại"
                    Toast.makeText(this@LoginActivity, errorBody, Toast.LENGTH_LONG).show()
                }
            } catch (e: Exception) {
                // Handle network error
                Toast.makeText(this@LoginActivity, "Lỗi kết nối: ${e.message}", Toast.LENGTH_LONG).show()
            }
        }
    }

    private fun navigateToMain() {
        val intent = Intent(this, MainActivity::class.java)
        startActivity(intent)
        finish() // Finish LoginActivity so user can't go back to it
    }

     private fun getDeviceId(): String {
        return Settings.Secure.getString(contentResolver, Settings.Secure.ANDROID_ID)
    }
}
