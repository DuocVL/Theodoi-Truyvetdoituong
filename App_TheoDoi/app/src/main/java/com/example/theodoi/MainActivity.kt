package com.example.theodoi

import android.Manifest
import android.content.pm.PackageManager
import android.os.Bundle
import android.os.CountDownTimer
import android.util.Log
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.camera.core.CameraSelector
import androidx.camera.core.ImageAnalysis
import androidx.camera.core.Preview
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import com.example.facerecog.analyzer.FaceRecognitionAnalyzer
import com.example.theodoi.data.AppDatabase
import com.example.theodoi.data.UserEntity
import com.example.theodoi.databinding.ActivityMainBinding
import com.example.theodoi.security.CryptoManager
import com.example.theodoi.utils.FaceMath
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.util.UUID
import java.util.concurrent.ExecutorService
import java.util.concurrent.Executors
import kotlin.random.Random

class MainActivity : AppCompatActivity() {

    private lateinit var binding: ActivityMainBinding
    private lateinit var cameraExecutor: ExecutorService
    private val cryptoManager = CryptoManager()
    private lateinit var database: AppDatabase

    private var currentSystemMode = SystemMode.IDLE
    private var currentChallenge = ChallengeType.NONE
    private var isLivenessPassed = false

    // LỖ HỔNG 2: Bộ đếm ngược thời gian tương tác tránh treo máy
    private var challengeTimer: CountDownTimer? = null

    enum class SystemMode { IDLE, REGISTER, VERIFY }
    enum class ChallengeType { NONE, BLINK_EYES, SMILE_FACE }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        database = AppDatabase.getDatabase(this)
        cameraExecutor = Executors.newSingleThreadExecutor()

        if (allPermissionsGranted()) {
            startCamera()
        } else {
            ActivityCompat.requestPermissions(
                this, arrayOf(Manifest.permission.CAMERA), REQUEST_CODE_PERMISSIONS
            )
        }

        binding.btnRegister.setOnClickListener { resetLivenessChallenge(SystemMode.REGISTER) }
        binding.btnVerify.setOnClickListener { resetLivenessChallenge(SystemMode.VERIFY) }
    }

    private fun resetLivenessChallenge(mode: SystemMode) {
        // Hủy bộ đếm cũ nếu người dùng bấm đổi nút liên tục
        challengeTimer?.cancel()

        currentSystemMode = mode
        isLivenessPassed = false
        currentChallenge = if (Random.nextBoolean()) ChallengeType.BLINK_EYES else ChallengeType.SMILE_FACE

        runOnUiThread {
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
        }
        // Kích hoạt bộ đếm ngược mới
        startTimeoutTimer()
    }

    // LỖ HỔNG 2: Hàm đếm ngược 10 giây thử thách
    private fun startTimeoutTimer() {
        challengeTimer = object : CountDownTimer(10000, 1000) {
            override fun onTick(millisUntilFinished: Long) {
                if (currentSystemMode != SystemMode.IDLE && !isLivenessPassed) {
                    binding.txtStatus.text = "Hệ thống bảo mật đang quét... Còn lại: ${millisUntilFinished / 1000}s"
                }
            }

            override fun onFinish() {
                if (!isLivenessPassed && currentSystemMode != SystemMode.IDLE) {
                    currentSystemMode = SystemMode.IDLE
                    currentChallenge = ChallengeType.NONE
                    runOnUiThread {
                        binding.txtChallenge.text = "THỬ THÁCH THẤT BẠI ❌"
                        binding.txtChallenge.setTextColor(ContextCompat.getColor(this@MainActivity, android.R.color.holo_red_dark))
                        binding.txtStatus.text = "Kết quả: Quá thời gian tương tác (Timeout)!"
                    }
                }
            }
        }.start()
    }

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
                        handleSystemPipeline(vector, smile, leftEye, rightEye, faceCount, yaw, roll)
                    })
                }

            val cameraSelector = CameraSelector.DEFAULT_FRONT_CAMERA
            try {
                cameraProvider.unbindAll()
                cameraProvider.bindToLifecycle(this, cameraSelector, preview, imageAnalyzer)
            } catch (exc: Exception) {
                Log.e("FaceRecog", "Khởi động CameraX thất bại", exc)
            }
        }, ContextCompat.getMainExecutor(this))
    }

    private fun handleSystemPipeline(
        vector: FloatArray?, smile: Float, leftEye: Float, rightEye: Float,
        faceCount: Int, yaw: Float, roll: Float
    ) {
        if (currentSystemMode == SystemMode.IDLE) return

        // LỖ HỔNG 1: Xử lý bộ lọc số lượng khuôn mặt
        if (faceCount > 1) {
            challengeTimer?.cancel()
            currentSystemMode = SystemMode.IDLE
            runOnUiThread {
                binding.txtChallenge.text = "CẢNH BÁO BẢO MẬT ⚠️"
                binding.txtChallenge.setTextColor(ContextCompat.getColor(this, android.R.color.holo_red_dark))
                binding.txtStatus.text = "Phát hiện nhiều khuôn mặt cùng lúc! Huỷ lệnh."
            }
            return
        }
        if (faceCount == 0 || vector == null) return // Đang chờ lọt mặt vào cam

        // Thực hiện kiểm tra chống giả mạo
        if (!isLivenessPassed) {
            checkAntiSpoofing(smile, leftEye, rightEye)
        } else {
            // Khi liveness đã pass, tiến hành đối sánh Face ID

            // LỖ HỔNG 3: Kiểm soát chất lượng ảnh đầu vào (Chỉ áp dụng khi đăng ký)
            if (currentSystemMode == SystemMode.REGISTER) {
                // Nếu mặt quay quá 15 độ trái/phải hoặc nghiêng đầu quá 15 độ -> Loại bỏ ảnh chất lượng thấp
                if (Math.abs(yaw) > 15f || Math.abs(roll) > 15f) {
                    currentSystemMode = SystemMode.IDLE
                    runOnUiThread {
                        binding.txtChallenge.text = "ĐĂNG KÝ THẤT BẠI ❌"
                        binding.txtChallenge.setTextColor(ContextCompat.getColor(this, android.R.color.holo_red_dark))
                        binding.txtStatus.text = "Chất lượng ảnh kém: Hãy nhìn thẳng trực diện vào camera!"
                    }
                    return
                }
            }

            // Đủ điều kiện an toàn -> Chạy hàm nghiệp vụ dữ liệu
            handleFaceRecognition(vector)
        }
    }

    private fun checkAntiSpoofing(smileProb: Float, leftEyeProb: Float, rightEyeProb: Float) {
        when (currentChallenge) {
            ChallengeType.BLINK_EYES -> {
                if (leftEyeProb < 0.25f && rightEyeProb < 0.25f) {
                    isLivenessPassed = true
                    challengeTimer?.cancel() // Tắt đếm ngược ngay khi pass
                    updateLivenessSuccessUI()
                }
            }
            ChallengeType.SMILE_FACE -> {
                if (smileProb > 0.80f) {
                    isLivenessPassed = true
                    challengeTimer?.cancel()
                    updateLivenessSuccessUI()
                }
            }
            ChallengeType.NONE -> {}
        }
    }

    private fun updateLivenessSuccessUI() {
        runOnUiThread {
            binding.txtChallenge.text = "XÁC MINH NGƯỜI THẬT THÀNH CÔNG ✔"
            binding.txtChallenge.setTextColor(ContextCompat.getColor(this, android.R.color.holo_green_light))
        }
    }

    private fun handleFaceRecognition(vector: FloatArray) {
        val mode = currentSystemMode
        currentSystemMode = SystemMode.IDLE

        when (mode) {
            SystemMode.REGISTER -> {
                val rawBytes = FaceMath.floatArrayToByteArray(vector)
                val (encryptedBytes, iv) = cryptoManager.encrypt(rawBytes)

                CoroutineScope(Dispatchers.IO).launch {
                    val userId = UUID.randomUUID().toString().substring(0, 6)
                    val newUser = UserEntity(userId, "User_$userId", encryptedBytes, iv)
                    database.userDao().insertUser(newUser)

                    withContext(Dispatchers.Main) {
                        binding.txtStatus.text = "Kết quả: Đã lưu FaceID thành công (ID: $userId)"
                        Toast.makeText(this@MainActivity, "Đăng ký hoàn tất!", Toast.LENGTH_SHORT).show()
                    }
                }
            }
            SystemMode.VERIFY -> {
                CoroutineScope(Dispatchers.IO).launch {
                    val allUsers = database.userDao().getAllUsers()
                    var matchedUser: UserEntity? = null
                    var maxSimilarity = 0.0f
                    val threshold = 0.76f

                    for (user in allUsers) {
                        val decryptedBytes = cryptoManager.decrypt(user.encryptedVector, user.iv)
                        val savedVector = FaceMath.byteArrayToFloatArray(decryptedBytes)
                        val similarity = FaceMath.cosineSimilarity(vector, savedVector)

                        if (similarity > maxSimilarity && similarity >= threshold) {
                            maxSimilarity = similarity
                            matchedUser = user
                        }
                    }

                    withContext(Dispatchers.Main) {
                        if (matchedUser != null) {
                            binding.txtStatus.text = "Kết quả: Khớp danh tính: ${matchedUser.name} (${(maxSimilarity * 100).toInt()}%)"
                        } else {
                            binding.txtStatus.text = "Kết quả: Không trùng khớp FaceID hệ thống!"
                        }
                    }
                }
            }
            SystemMode.IDLE -> {}
        }
    }

    private fun allPermissionsGranted() = arrayOf(Manifest.permission.CAMERA).all {
        ContextCompat.checkSelfPermission(baseContext, it) == PackageManager.PERMISSION_GRANTED
    }

    override fun onRequestPermissionsResult(
        requestCode: Int, permissions: Array<String>, grantResults: IntArray
    ) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        if (requestCode == REQUEST_CODE_PERMISSIONS) {
            if (allPermissionsGranted()) {
                startCamera()
            } else {
                Toast.makeText(this,
                    "Quyền truy cập Camera bị từ chối.",
                    Toast.LENGTH_SHORT).show()
                finish()
            }
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        challengeTimer?.cancel() // Tránh rò rỉ bộ nhớ (Memory leak) khi đóng ứng dụng đột ngột
        cameraExecutor.shutdown()
    }

    companion object {
        private const val REQUEST_CODE_PERMISSIONS = 10
    }
}
