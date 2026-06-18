package com.example.theodoi.ui.auth

import android.os.Bundle
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.example.theodoi.data.AuthRepository
import com.example.theodoi.databinding.ActivityForgotPasswordBinding
import kotlinx.coroutines.launch

class ForgotPasswordActivity : AppCompatActivity() {

    private lateinit var binding: ActivityForgotPasswordBinding
    private val authRepository = AuthRepository()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityForgotPasswordBinding.inflate(layoutInflater)
        setContentView(binding.root)

        binding.btnSubmit.setOnClickListener {
            handleSubmit()
        }
    }

    private fun handleSubmit() {
        val email = binding.etEmail.text.toString().trim()

        if (email.isEmpty() || !android.util.Patterns.EMAIL_ADDRESS.matcher(email).matches()) {
            Toast.makeText(this, "Vui lòng nhập địa chỉ email hợp lệ", Toast.LENGTH_SHORT).show()
            return
        }

        lifecycleScope.launch {
            try {
                val response = authRepository.forgotPassword(email)
                if (response.isSuccessful) {
                    Toast.makeText(this@ForgotPasswordActivity, "Yêu cầu đã được gửi. Vui lòng kiểm tra email.", Toast.LENGTH_LONG).show()
                    finish() // Close this activity
                } else {
                    val errorBody = response.errorBody()?.string() ?: "Yêu cầu thất bại"
                    Toast.makeText(this@ForgotPasswordActivity, errorBody, Toast.LENGTH_LONG).show()
                }
            } catch (e: Exception) {
                Toast.makeText(this@ForgotPasswordActivity, "Lỗi kết nối: ${e.message}", Toast.LENGTH_LONG).show()
            }
        }
    }
}
