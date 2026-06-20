package com.example.theodoi

import android.Manifest
import android.content.pm.PackageManager
import android.os.Bundle
import android.os.CountDownTimer
import android.util.Log
import android.view.View
import androidx.appcompat.app.AlertDialog
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
import com.example.theodoi.databinding.ActivityVerifyBinding
import com.example.theodoi.security.CryptoManager
import com.example.theodoi.utils.FaceMath
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.util.concurrent.ExecutorService
import java.util.concurrent.Executors
import kotlin.random.Random

class VerifyActivity : AppCompatActivity() {

    private lateinit var binding: ActivityVerifyBinding
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
        binding = ActivityVerifyBinding.inflate(layoutInflater)
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

    private fun startTimeoutTimer() {
        challengeTimer = object : CountDownTimer(10000, 1000) {
            override fun onTick(millisUntilFinished: Long) {
                if (isActive && !isLivenessPassed) {
                    binding.txtStatus.text = "Đang quét FaceID... Còn lại: ${millisUntilFinished / 1000}s"
                }
            }
            override fun onFinish() {
                if (!isLivenessPassed && isActive) {
                    isActive = false
                    binding.txtChallenge.text = "QUÁ THỜI GIAN ❌"
                    binding.txtChallenge.setTextColor(ContextCompat.getColor(this@VerifyActivity, android.R.color.holo_red_dark))
                    binding.txtStatus.text = "Xác thực không thành công do không tương tác!"

                    binding.btnRetry.visibility = View.VISIBLE
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
                        handleVerifyPipeline(vector, smile, leftEye, rightEye, faceCount)
                    })
                }

            try {
                cameraProvider.unbindAll()
                cameraProvider.bindToLifecycle(this, CameraSelector.DEFAULT_FRONT_CAMERA, preview, imageAnalyzer)
            } catch (exc: Exception) {
                Log.e("VerifyActivity", "Lỗi cam", exc)
            }
        }, ContextCompat.getMainExecutor(this))
    }

    private fun handleVerifyPipeline(vector: FloatArray?, smile: Float, leftEye: Float, rightEye: Float, faceCount: Int) {
        if (!isActive) return

        if (faceCount > 1) {
            challengeTimer?.cancel()
            isActive = false
            runOnUiThread {
                binding.txtChallenge.text = "CẢNH BÁO BẢO MẬT ⚠️"
                binding.txtChallenge.setTextColor(ContextCompat.getColor(this, android.R.color.holo_red_dark))
                binding.txtStatus.text = "Phát hiện nhiều khuôn mặt! Huỷ phiên."
            }
            return
        }
        if (faceCount == 0 || vector == null) return

        if (!isLivenessPassed) {
            checkLiveness(smile, leftEye, rightEye)
        } else {
            verifyFace(vector)
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

    private fun verifyFace(vector: FloatArray) {
        isActive = false

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
                    binding.txtStatus.text = "Khớp danh tính: ${matchedUser.name} (${(maxSimilarity * 100).toInt()}%)"
                } else {
                    binding.txtStatus.text = "Không trùng khớp dữ liệu FaceID!"
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