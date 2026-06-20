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
import com.example.theodoi.databinding.ActivityRegisterBinding
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

class RegisterActivity : AppCompatActivity() {

    private lateinit var binding: ActivityRegisterBinding
    private lateinit var cameraExecutor: ExecutorService
    private val cryptoManager = CryptoManager()
    private lateinit var database: AppDatabase

    private var isActive = false
    private var isLivenessPassed = false
    private var currentChallenge = ChallengeType.NONE
    private var challengeTimer: CountDownTimer? = null

    enum class ChallengeType { NONE, BLINK_EYES, SMILE_FACE }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityRegisterBinding.inflate(layoutInflater)
        setContentView(binding.root)

        database = AppDatabase.getDatabase(this)
        cameraExecutor = Executors.newSingleThreadExecutor()

        if (allPermissionsGranted()) {
            startCamera()
            triggerChallenge()
        } else {
            ActivityCompat.requestPermissions(this, arrayOf(Manifest.permission.CAMERA), REQUEST_CODE_PERMISSIONS)
        }
    }

    private fun triggerChallenge() {
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

    private fun saveFaceToDatabase(vector: FloatArray) {
        isActive = false
        val rawBytes = FaceMath.floatArrayToByteArray(vector)
        val (encryptedBytes, iv) = cryptoManager.encrypt(rawBytes)

        CoroutineScope(Dispatchers.IO).launch {
            val userId = UUID.randomUUID().toString().substring(0, 6)
            val newUser = UserEntity(userId, "User_$userId", encryptedBytes, iv)
            database.userDao().insertUser(newUser)

            withContext(Dispatchers.Main) {
                binding.txtStatus.text = "Đã lưu FaceID thành công (ID: $userId)"
                Toast.makeText(this@RegisterActivity, "Hoàn tất đăng ký!", Toast.LENGTH_SHORT).show()
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