package com.example.theodoi

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Bundle
import android.os.CountDownTimer
import android.util.Log
import android.view.View
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.camera.core.CameraSelector
import androidx.camera.core.ImageAnalysis
import androidx.camera.core.Preview
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import androidx.lifecycle.lifecycleScope
import com.example.facerecog.analyzer.FaceRecognitionAnalyzer
import com.example.theodoi.data.AppDatabase
import com.example.theodoi.data.FaceRepository
import com.example.theodoi.data.SessionManager
import com.example.theodoi.data.UserEntity
import com.example.theodoi.databinding.ActivityRegisterBinding
import com.example.theodoi.security.CryptoManager
import com.example.theodoi.utils.FaceMath
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.util.concurrent.ExecutorService
import java.util.concurrent.Executors
import kotlin.random.Random

/*
                RegisterActivity
                       │
      ┌────────────────┼─────────────────┐
      │                │                 │
      ▼                ▼                 ▼
 CameraX      FaceRecognitionAnalyzer  SessionManager
      │                │                 │
      ▼                ▼                 ▼
 Preview      ML Kit + MobileFaceNet   Access Token
      │
      ▼
 Liveness Detection
      │
      ▼
 Face Embedding
      │
      ▼
 FaceRepository
      │
      ▼
      Server
      │
      ▼
 CryptoManager
      │
      ▼
 Room Database
 */

 /*
 Mở RegisterActivity
        │
        ▼
Xin quyền Camera
        │
        ▼
Khởi động CameraX
        │
        ▼
FaceRecognitionAnalyzer
        │
        ▼
ML Kit phát hiện khuôn mặt
        │
        ▼
Sinh thử thách ngẫu nhiên
(Nháy mắt hoặc mỉm cười)
        │
        ▼
Kiểm tra Liveness
        │
        ▼
Kiểm tra góc khuôn mặt
        │
        ▼
Sinh Face Embedding
        │
        ▼
Gửi embedding lên Server
        │
        ▼
Server lưu dữ liệu
        │
        ▼
Mã hóa embedding bằng AES
        │
        ▼
Lưu vào Room Database
        │
        ▼
Chuyển sang MainActivity
  */

/*
Người dùng
    │
    ▼
Mở RegisterActivity
    │
    ▼
Kiểm tra quyền Camera
    │
    ├── Chưa có → Xin quyền
    │
    └── Đã có
            │
            ▼
Khởi động CameraX
            │
            ├── Preview (Hiển thị camera)
            │
            └── ImageAnalysis
                    │
                    ▼
      FaceRecognitionAnalyzer
                    │
                    ▼
          ML Kit Face Detection
                    │
                    ├── Không phát hiện khuôn mặt
                    │         │
                    │         └── Chờ frame tiếp theo
                    │
                    ├── > 1 khuôn mặt
                    │         │
                    │         └── Hủy đăng ký
                    │
                    └── 1 khuôn mặt
                              │
                              ▼
                  Cắt khuôn mặt (Crop)
                              │
                              ▼
                 Resize về 112 × 112
                              │
                              ▼
               MobileFaceNet (TensorFlow Lite)
                              │
                              ▼
               Sinh Face Embedding (192 chiều)
                              │
                              ▼
                  Trả callback về Activity
                              │
                              ▼
            Sinh thử thách ngẫu nhiên
         (Nháy mắt hoặc Mỉm cười)
                              │
                              ▼
             Người dùng thực hiện thử thách
                              │
                              ▼
               Kiểm tra Liveness
                              │
                  ├── Không đạt
                  │       │
                  │       └── Timeout hoặc Retry
                  │
                  └── Đạt
                          │
                          ▼
             Kiểm tra góc khuôn mặt
            (Yaw ≤ 15°, Roll ≤ 15°)
                          │
                  ├── Không đạt
                  │       │
                  │       └── Yêu cầu nhìn thẳng
                  │
                  └── Đạt
                          │
                          ▼
            FaceRepository.registerFaceToServer()
                          │
                          ▼
                     Backend API
                          │
                 Lưu embedding vào DB
                          │
                 Trả subject_id
                          │
                          ▼
          Chuyển FloatArray → ByteArray
                          │
                          ▼
      CryptoManager.encrypt()
      (AES/GCM với AndroidKeyStore)
                          │
                          ▼
               Sinh CipherText + IV
                          │
                          ▼
             Room Database (UserEntity)
                          │
                          ▼
              Chuyển sang MainActivity
* */

class RegisterActivity : AppCompatActivity() {

    private lateinit var binding: ActivityRegisterBinding
    private lateinit var sessionManager: SessionManager
    private lateinit var cameraExecutor: ExecutorService
    private val cryptoManager = CryptoManager()
    private lateinit var database: AppDatabase
    private val faceRepository = FaceRepository()

    private var isActive = false
    private var isLivenessPassed = false
    private var currentChallenge = ChallengeType.NONE
    private var challengeTimer: CountDownTimer? = null

    enum class ChallengeType { NONE, BLINK_EYES, SMILE_FACE }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        sessionManager = SessionManager(this)
        binding = ActivityRegisterBinding.inflate(layoutInflater)
        setContentView(binding.root)

        database = AppDatabase.getDatabase(this)
        cameraExecutor = Executors.newSingleThreadExecutor()

        binding.btnRetry.setOnClickListener {
            triggerChallenge()
        }

        if (allPermissionsGranted()) {
            startCamera()
            triggerChallenge()
        } else {
            ActivityCompat.requestPermissions(this, arrayOf(Manifest.permission.CAMERA), REQUEST_CODE_PERMISSIONS)
        }
    }

    //thủ thách
    private fun triggerChallenge() {
        challengeTimer?.cancel()

        binding.btnRetry.visibility = View.GONE

        isActive = true
        isLivenessPassed = false
        currentChallenge = if (Random.nextBoolean()) ChallengeType.BLINK_EYES else ChallengeType.SMILE_FACE

        when (currentChallenge) {
            ChallengeType.BLINK_EYES -> {
                binding.txtChallenge.text = "THỬ THÁCH: HÃY NHÁY MẮT"
                binding.txtChallenge.setTextColor(ContextCompat.getColor(this, android.R.color.holo_orange_light))
            }
            ChallengeType.SMILE_FACE -> {
                binding.txtChallenge.text = "THỬ THÁCH: HÃY MỈM CƯỜI"
                binding.txtChallenge.setTextColor(ContextCompat.getColor(this, android.R.color.holo_blue_light))
            }
            else -> {}
        }
        startTimeoutTimer()
    }

    //thời gian thực hiện thủ thách
    private fun startTimeoutTimer() {
        challengeTimer = object : CountDownTimer(10000, 1000) {
            override fun onTick(millisUntilFinished: Long) {
                if (isActive && !isLivenessPassed) {
                    binding.txtStatus.text = "Đang kiểm tra người thật... Còn lại: ${millisUntilFinished / 1000}s"
                }
            }
            override fun onFinish() {
                if (!isLivenessPassed && isActive) {
                    isActive = false
                    binding.txtChallenge.text = "THỬ THÁCH THẤT BẠI ❌"
                    binding.txtChallenge.setTextColor(ContextCompat.getColor(this@RegisterActivity, android.R.color.holo_red_dark))
                    binding.txtStatus.text = "Quá thời gian tương tác (Timeout)!"

                    binding.btnRetry.visibility = View.VISIBLE
                }
            }
        }.start()
    }

    //mở camera
    private fun startCamera() {
        val cameraProviderFuture = ProcessCameraProvider.getInstance(this)
        cameraProviderFuture.addListener({
            val cameraProvider: ProcessCameraProvider = cameraProviderFuture.get()
            val preview = Preview.Builder().build().also {
                it.setSurfaceProvider(binding.viewFinder.surfaceProvider)
            }

            val imageAnalyzer = ImageAnalysis.Builder()
                .setBackpressureStrategy(ImageAnalysis.STRATEGY_KEEP_ONLY_LATEST)
                .build()
                .also {
                    it.setAnalyzer(cameraExecutor, FaceRecognitionAnalyzer(this) { vector, smile, leftEye, rightEye, faceCount, yaw, roll ->
                        // ĐIỀU PHỐI PIPELINE BẢO MẬT CHÍNH
                        handleRegisterPipeline(vector, smile, leftEye, rightEye, faceCount, yaw, roll)
                    })
                }

            try {
                cameraProvider.unbindAll()
                cameraProvider.bindToLifecycle(this, CameraSelector.DEFAULT_FRONT_CAMERA, preview, imageAnalyzer)
            } catch (exc: Exception) {
                Log.e("RegisterActivity", "Lỗi cam", exc)
            }
        }, ContextCompat.getMainExecutor(this))
    }

    //xử lý đăng ký
    private fun handleRegisterPipeline(vector: FloatArray?, smile: Float, leftEye: Float, rightEye: Float, faceCount: Int, yaw: Float, roll: Float) {
        if (!isActive) return

        if (faceCount > 1) {
            challengeTimer?.cancel()
            isActive = false
            runOnUiThread {
                binding.txtChallenge.text = "CẢNH BÁO BẢO MẬT ⚠️"
                binding.txtChallenge.setTextColor(ContextCompat.getColor(this, android.R.color.holo_red_dark))
                binding.txtStatus.text = "Phát hiện nhiều khuôn mặt! Huỷ thao tác."
            }
            return
        }
        if (faceCount == 0 || vector == null) return

        if (!isLivenessPassed) {
            checkLiveness(smile, leftEye, rightEye)
        } else {
            if (Math.abs(yaw) > 15f || Math.abs(roll) > 15f) {
                isActive = false
                runOnUiThread {
                    binding.txtChallenge.text = "ĐĂNG KÝ THẤT BẠI ❌"
                    binding.txtChallenge.setTextColor(ContextCompat.getColor(this, android.R.color.holo_red_dark))
                    binding.txtStatus.text = "Hãy nhìn thẳng trực diện camera!"
                }
                return
            }
            saveFaceToDatabase(vector)
        }
    }

    private fun checkLiveness(smile: Float, leftEye: Float, rightEye: Float) {
        val pass = when (currentChallenge) {
            ChallengeType.BLINK_EYES -> leftEye < 0.25f && rightEye < 0.25f
            ChallengeType.SMILE_FACE -> smile > 0.80f
            else -> false
        }
        if (pass) {
            isLivenessPassed = true
            challengeTimer?.cancel()
            runOnUiThread {
                binding.txtChallenge.text = "XÁC MINH NGƯỜI THẬT THÀNH CÔNG ✔"
                binding.txtChallenge.setTextColor(ContextCompat.getColor(this, android.R.color.holo_green_light))
            }
        }
    }

    //lưu dữ liệu
    private fun saveFaceToDatabase(vector: FloatArray) {
        isActive = false
        val token = sessionManager.getAccessToken()

        if (token == null) {
            Toast.makeText(this, "Không tìm thấy token xác thực!", Toast.LENGTH_SHORT).show()
            return
        }

        val embeddingList = vector.toList()

        lifecycleScope.launch(Dispatchers.IO) {
            try {
                // 1. Đồng bộ lên Server trước
                val response = faceRepository.registerFaceToServer(token, embeddingList)

                if (response.isSuccessful && response.body()?.data != null) {
                    val serverData = response.body()!!.data

                    // 2. Server chấp thuận -> Tiến hành mã hóa dữ liệu cục bộ dưới máy Client
                    val rawBytes = FaceMath.floatArrayToByteArray(vector)
                    val (encryptedBytes, iv) = cryptoManager.encrypt(rawBytes)

                    val newUser = UserEntity(
                        userId = serverData!!.subject_id,
                        name = "User_${serverData.subject_id.substring(0, 6)}",
                        encryptedVector = encryptedBytes,
                        iv = iv
                    )
                    database.userDao().insertUser(newUser)

                    withContext(Dispatchers.Main) {
                        binding.txtStatus.text = "Đăng ký thành công và đã đồng bộ lên hệ thống!"
                        Toast.makeText(this@RegisterActivity, "Hoàn tất đăng ký khuôn mặt!", Toast.LENGTH_SHORT).show()

                        // Đăng ký xong tự động mở lối vào MainActivity
                        startActivity(Intent(this@RegisterActivity, MainActivity::class.java))
                        finish()
                    }
                } else {
                    val errorMsg = response.errorBody()?.string() ?: "Lỗi hệ thống từ chối"
                    withContext(Dispatchers.Main) {
                        binding.txtStatus.text = "Đăng ký thất bại: $errorMsg"
                        Toast.makeText(this@RegisterActivity, "Thử lại sau!", Toast.LENGTH_LONG).show()
                    }
                }
            } catch (e: Exception) {
                withContext(Dispatchers.Main) {
                    Toast.makeText(this@RegisterActivity, "Lỗi kết nối Server: ${e.message}", Toast.LENGTH_LONG).show()
                }
            }
        }
    }

    private fun allPermissionsGranted() = arrayOf(Manifest.permission.CAMERA).all {
        ContextCompat.checkSelfPermission(baseContext, it) == PackageManager.PERMISSION_GRANTED
    }

    override fun onDestroy() {
        super.onDestroy()
        challengeTimer?.cancel()
        cameraExecutor.shutdown()
    }

    companion object {
        private const val REQUEST_CODE_PERMISSIONS = 10
    }
}