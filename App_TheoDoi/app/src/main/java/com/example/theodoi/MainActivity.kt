package com.example.theodoi

import android.content.Intent
import android.os.Bundle
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.example.theodoi.data.AppDatabase
import com.example.theodoi.data.FaceRepository
import com.example.theodoi.data.SessionManager
import com.example.theodoi.data.UserEntity
import com.example.theodoi.databinding.ActivityMainBinding
import com.example.theodoi.security.CryptoManager
import com.example.theodoi.utils.FaceMath
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

class MainActivity : AppCompatActivity() {

    private lateinit var binding: ActivityMainBinding
    private lateinit var sessionManager: SessionManager
    private lateinit var database: AppDatabase
    private val faceRepository = FaceRepository()
    private val cryptoManager = CryptoManager()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        sessionManager = SessionManager(this)
        database = AppDatabase.getDatabase(this)

        // Thực hiện kiểm tra đồng bộ khuôn mặt từ Server
        checkAndSyncFaceBiometric()

        binding.btnGoToRegister.setOnClickListener {
            startActivity(Intent(this, RegisterActivity::class.java))
        }

        binding.btnGoToVerify.setOnClickListener {
            startActivity(Intent(this, VerifyActivity::class.java))
        }
    }

    private fun checkAndSyncFaceBiometric() {
        val token = sessionManager.getAccessToken()
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
                    } else if (response.code() == 404) {
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