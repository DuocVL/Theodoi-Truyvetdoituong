package com.example.theodoi

import android.Manifest
import android.content.pm.PackageManager
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import android.os.Bundle
import android.os.CountDownTimer
import android.util.Log
import android.view.View
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.camera.core.CameraSelector
import androidx.camera.core.ImageAnalysis
import androidx.camera.core.ImageCapture
import androidx.camera.core.ImageCaptureException
import androidx.camera.core.Preview
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import androidx.lifecycle.lifecycleScope
import com.example.facerecog.analyzer.FaceRecognitionAnalyzer
import com.example.theodoi.data.CheckinRepository
import com.example.theodoi.data.GpsManager
import com.example.theodoi.data.OfflineCheckinManager
import com.example.theodoi.data.SessionManager
import com.example.theodoi.databinding.ActivityVerifyBinding
import com.example.theodoi.worker.CheckinSyncScheduler
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.io.File
import java.io.IOException
import java.util.UUID
import java.util.concurrent.ExecutorService
import java.util.concurrent.Executors
import kotlin.random.Random

/*
                   VerifyActivity
                         │
 ┌───────────────────────┼────────────────────────┐
 │                       │                        │
 ▼                       ▼                        ▼
CameraX             GpsManager            SessionManager
 │                       │                        │
 ▼                       ▼                        ▼
FaceRecognition      Lấy GPS              Access Token
Analyzer
 │
 ▼
ML Kit + MobileFaceNet
 │
 ▼
Liveness Detection
 │
 ▼
Chụp ảnh bằng chứng
 │
 ▼
CheckinRepository
 │
 ├──────────────► Online → Server
 │
 └──────────────► OfflineCheckinManager
                     │
                     ▼
                SQLite + WorkManager
 */

 /*
 Người dùng mở VerifyActivity
            │
            ▼
Xin quyền Camera + GPS
            │
            ▼
Mở CameraX
            │
            ▼
FaceRecognitionAnalyzer
            │
            ▼
ML Kit phát hiện khuôn mặt
            │
            ▼
MobileFaceNet sinh Embedding
            │
            ▼
Sinh thử thách Liveness
            │
            ▼
Người dùng nháy mắt / mỉm cười
            │
            ▼
Liveness thành công
            │
            ▼
Chụp ảnh bằng chứng
            │
            ▼
Lấy vị trí GPS
            │
            ▼
Có Internet?
      │                    │
     Có                   Không
      │                    │
      ▼                    ▼
Gửi API           Lưu SQLite Offline
      │                    │
      ▼                    ▼
Server          WorkManager đồng bộ sau
      │
      ▼
Check-in thành công
  */

/*VerifyActivity là màn hình xác thực (Face Verification) của hệ thống. 
Đây là Activity trung tâm thực hiện toàn bộ quy trình check-in bằng khuôn mặt, từ mở camera, kiểm tra người thật (Liveness Detection), chụp ảnh bằng chứng,
 lấy vị trí GPS đến gửi dữ liệu lên máy chủ hoặc lưu ngoại tuyến.
 */

class VerifyActivity : AppCompatActivity() {

    private lateinit var binding: ActivityVerifyBinding
    private lateinit var cameraExecutor: ExecutorService
    private lateinit var sessionManager: SessionManager
    private lateinit var checkinRepository: CheckinRepository
    private lateinit var gpsManager: GpsManager
    private lateinit var offlineCheckinManager: OfflineCheckinManager // MOI

    private var imageCapture: ImageCapture? = null
    private var isActive = false
    private var isLivenessPassed = false
    private var currentChallenge = ChallengeType.NONE
    private var challengeTimer: CountDownTimer? = null

    enum class ChallengeType { NONE, BLINK_EYES, SMILE_FACE }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityVerifyBinding.inflate(layoutInflater)
        setContentView(binding.root)

        Log.d("VerifyActivity", "--- OnCreate: Bat dau khoi tao Activity ---")
        sessionManager = SessionManager(this)
        cameraExecutor = Executors.newSingleThreadExecutor()
        checkinRepository = CheckinRepository()
        gpsManager = GpsManager(this)
        offlineCheckinManager = OfflineCheckinManager(this) // MOI

        // MOI: phong truong hop app bi kill luc dang offline, co check-in con
        // ket ket lai trong DB chua duoc bao WorkManager -> sync lai luc mo app
        CheckinSyncScheduler.scheduleSync(this)

        binding.btnRetry.setOnClickListener {
            Log.d("VerifyActivity", "Nguoi dung bam nut thu lai (Retry)")
            triggerChallenge()
        }

        //kiểm tra quyền
        if (allPermissionsGranted()) {
            Log.d("VerifyActivity", "Quyen Camera va GPS da duoc cap truoc do")
            startCamera()
            triggerChallenge()
        } else {
            Log.w("VerifyActivity", "Chua du quyen, yeu cau cap quyen tu nguoi dung")
            ActivityCompat.requestPermissions(this, REQUIRED_PERMISSIONS, REQUEST_CODE_PERMISSIONS)
        }
    }

    //tạo thử thách 1 là nhắm mắt , 2 là mỉm cười
    private fun triggerChallenge() {
        challengeTimer?.cancel()
        binding.btnRetry.visibility = View.GONE
        isActive = true
        isLivenessPassed = false
        currentChallenge = if (Random.nextBoolean()) ChallengeType.BLINK_EYES else ChallengeType.SMILE_FACE

        Log.d("VerifyActivity", "Trigger thu thach moi: $currentChallenge")

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
                    binding.txtStatus.text = "Đang quét FaceID... Còn lại: ${millisUntilFinished / 1000}s"
                }
            }
            override fun onFinish() {
                if (!isLivenessPassed && isActive) {
                    isActive = false
                    Log.w("VerifyActivity", "Het thoi gian 10s nhung nguoi dung khong vuot qua test")
                    binding.txtChallenge.text = "QUÁ THỜI GIAN ❌"
                    binding.txtChallenge.setTextColor(ContextCompat.getColor(this@VerifyActivity, android.R.color.holo_red_dark))
                    binding.txtStatus.text = "Check-in thất bại do không tương tác!"
                    binding.btnRetry.visibility = View.VISIBLE
                }
            }
        }.start()
    }

    //cấu hình camerax
    private fun startCamera() {
        Log.d("VerifyActivity", "Bat dau cau hinh va mo CameraX")
        val cameraProviderFuture = ProcessCameraProvider.getInstance(this)
        cameraProviderFuture.addListener({
            val cameraProvider: ProcessCameraProvider = cameraProviderFuture.get()
            //hiển thị hình ảnh
            val preview = Preview.Builder().build().also {
                it.setSurfaceProvider(binding.viewFinder.surfaceProvider)
            }

            //chụp ảnh
            imageCapture = ImageCapture.Builder()
                .setCaptureMode(ImageCapture.CAPTURE_MODE_MINIMIZE_LATENCY)
                .build()

            //liên tục gửi frame sang FaceRecognitionAnalyzer phân tích
            val imageAnalyzer = ImageAnalysis.Builder()
                .setBackpressureStrategy(ImageAnalysis.STRATEGY_KEEP_ONLY_LATEST)
                .build()
                .also {
                    //trả về các thông số đưa vào handleVerifyPipeline() để xử lý
                    it.setAnalyzer(cameraExecutor, FaceRecognitionAnalyzer(this) { vector, smile, leftEye, rightEye, faceCount, yaw, roll ->
                        handleVerifyPipeline(vector, smile, leftEye, rightEye, faceCount)
                    })
                }

            try {
                cameraProvider.unbindAll()
                cameraProvider.bindToLifecycle(this, CameraSelector.DEFAULT_FRONT_CAMERA, preview, imageAnalyzer, imageCapture)
                Log.d("VerifyActivity", "Bind CameraX vao Lifecycle thanh cong")
            } catch (exc: Exception) {
                Log.e("VerifyActivity", "Loi bind dac ta CameraX vao Lifecycle: ${exc.message}", exc)
            }
        }, ContextCompat.getMainExecutor(this))
    }

    //nhận kết quả từ FaceRecognitionAnalyzer() 
    private fun handleVerifyPipeline(vector: FloatArray?, smile: Float, leftEye: Float, rightEye: Float, faceCount: Int) {
        if (!isActive) return

        if (faceCount > 1) { // kiểm tra nhiều khuôn mặt
            challengeTimer?.cancel()
            isActive = false
            Log.w("VerifyActivity", "Canh bao: Phat hien nhieu khuon mat trong khung hinh ($faceCount)")
            runOnUiThread {
                binding.txtChallenge.text = "CẢNH BÁO BẢO MẬT ⚠️"
                binding.txtChallenge.setTextColor(ContextCompat.getColor(this, android.R.color.holo_red_dark))
                binding.txtStatus.text = "Phát hiện nhiều khuôn mặt!"
                binding.btnRetry.visibility = View.VISIBLE
            }
            return
        }
        if (faceCount == 0 || vector == null) return//không có mặt

        if (!isLivenessPassed) {
            checkLiveness(smile, leftEye, rightEye, vector)//kiểm tra tuân thủ thủ thách
        }
    }

    //kiểm tra tuân thủ thủ thách
    private fun checkLiveness(smile: Float, leftEye: Float, rightEye: Float, vector: FloatArray) {
        val pass = when (currentChallenge) {
            ChallengeType.BLINK_EYES -> leftEye < 0.25f && rightEye < 0.25f
            ChallengeType.SMILE_FACE -> smile > 0.80f
            else -> false
        }
        if (pass) {
            isLivenessPassed = true
            challengeTimer?.cancel()
            Log.d("VerifyActivity", "Xac minh nguoi that (Liveness Check) THANH CONG")
            runOnUiThread {
                binding.txtChallenge.text = "XÁC MINH NGƯỜI THẬT THÀNH CÔNG ✔"
                binding.txtChallenge.setTextColor(ContextCompat.getColor(this, android.R.color.holo_green_light))
                binding.txtStatus.text = "Đang tiến hành chụp ảnh bằng chứng..."
            }
            captureImageAndProceed(vector)
        }
    }

    //chụp ảnh bằng chứng gửi lên server
    private fun captureImageAndProceed(vector: FloatArray) {
        Log.d("VerifyActivity", "Chuan bi chup anh luu vao cacheDir")

        val tempFile = File(cacheDir, "checkin_proof_${System.currentTimeMillis()}.jpg")

        if (imageCapture == null) {
            Log.e("VerifyActivity", "ImageCapture bi null, khong the ra lenh chup!")
            runOnUiThread { binding.txtStatus.text = "Loi thiet bi: Camera bi loi chuc nang chup" }
            return
        }

        val outputOptions = ImageCapture.OutputFileOptions.Builder(tempFile).build()
        Log.d("VerifyActivity", "Goi ham imageCapture.takePicture()")

        imageCapture?.takePicture(
            outputOptions,
            ContextCompat.getMainExecutor(this),
            object : ImageCapture.OnImageSavedCallback {
                override fun onImageSaved(outputFileResults: ImageCapture.OutputFileResults) {
                    Log.d("VerifyActivity", "Chup anh hoan tat. Duong dan: ${tempFile.absolutePath}, Kich thuoc: ${tempFile.length()} bytes")
                    runOnUiThread {
                        binding.txtStatus.text = "Đang định vị tọa độ GPS tươi..."
                    }
                    executeCheckInPipeline(vector, tempFile)
                }

                override fun onError(exception: ImageCaptureException) {
                    Log.e("VerifyActivity", "Loi chup anh tu CameraX: ${exception.message}", exception)
                    runOnUiThread {
                        binding.txtStatus.text = "Lỗi chụp ảnh bằng chứng từ thiết bị!"
                        binding.btnRetry.visibility = View.VISIBLE
                    }
                }
            }
        )
    }

    //sau khi chụp ảnh lấy GPS
    private fun executeCheckInPipeline(vector: FloatArray, imageFile: File) {
        isActive = false

        if (ActivityCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
            Log.w("VerifyActivity", "Khong chay duoc pipeline do thieu quyen vi tri ACCESS_FINE_LOCATION")
            runOnUiThread { Toast.makeText(this, "Chưa cấp quyền vị trí GPS!", Toast.LENGTH_SHORT).show() }
            binding.btnRetry.visibility = View.VISIBLE
            return
        }

        gpsManager.fetchFastLocation(lifecycleScope) { gpsResult ->
            if (gpsResult != null) {
                Log.d("VerifyActivity", "Lay duoc vi tri! Do sai so la: ${gpsResult.accuracy} met")
                uploadCheckInData(vector, gpsResult.latitude, gpsResult.longitude, imageFile)
            } else {
                Log.w("VerifyActivity", "Khong lay duoc vi tri (het han GPS/khong co tin hieu)")
                runOnUiThread {
                    binding.txtChallenge.text = "KHÔNG XÁC ĐỊNH ĐƯỢC VỊ TRÍ ⚠️"
                    binding.txtChallenge.setTextColor(ContextCompat.getColor(this, android.R.color.holo_red_dark))
                    binding.txtStatus.text = "Vui lòng ra nơi thoáng (gần cửa sổ/ngoài trời) và thử lại."
                    binding.btnRetry.visibility = View.VISIBLE
                }
            }
        }
    }

    //gủi dữ liệu lên server
    private fun uploadCheckInData(vector: FloatArray, lat: Double, lng: Double, imageFile: File) {
        val token = sessionManager.getAccessToken() ?: ""
        val notes = "Check-in tu thiet bi Android di dong"
        Log.d("VerifyActivity", "Chuan bi gui thong tin len Repository. Lat=$lat, Lng=$lng, FileSize=${imageFile.length()} bytes")

        lifecycleScope.launch(Dispatchers.IO) {
            // MOI: kiem tra mang truoc, tranh phai cho timeout vo ich khi biet chac chan se fail
            if (!isNetworkAvailable()) {
                Log.w("VerifyActivity", "Khong co mang -> luu offline ngay, khong goi API")
                offlineCheckinManager.saveForLaterSync(lat, lng, notes, true, imageFile)
                CheckinSyncScheduler.scheduleSync(applicationContext)
                withContext(Dispatchers.Main) {
                    binding.txtStatus.text = "📥 Mất mạng - đã lưu check-in, sẽ tự đồng bộ khi có kết nối"
                }
                return@launch
            }

            try {
                val response = checkinRepository.submitCheckin(
                    token = token,
                    latitude = lat,
                    longitude = lng,
                    notes = notes,
                    faceVerified = true,
                    imageFile = imageFile,
                    requestUuid = UUID.randomUUID().toString() // MOI: chong gui trung neu timeout gia
                )

                withContext(Dispatchers.Main) {
                    if (response.isSuccessful && response.body() != null) {
                        val checkinResult = response.body()!!.data
                        Log.d("VerifyActivity", "API thanh cong. ID Checkin tra ve: ${checkinResult.id}, faceVerified=${checkinResult.faceVerified}")
                        if (checkinResult.faceVerified) {
                            binding.txtStatus.text = "Check-in THÀNH CÔNG 🎉\nID: ${checkinResult.id}\nTrạng thái: ${checkinResult.status}"
                        } else {
                            binding.txtStatus.text = "Check-in thành công vị trí nhưng lỗi xác minh khuôn mặt!"
                        }
                    } else {
                        val errorStr = response.errorBody()?.string()
                        Log.e("VerifyActivity", "Server tu choi yeu cau (Error Code: ${response.code()}). Noi dung loi: $errorStr")
                        binding.txtStatus.text = "Check-in thất bại: $errorStr"
                        binding.btnRetry.visibility = View.VISIBLE
                    }
                }
            } catch (e: IOException) {
                // SUA: day la loi mang THUC SU xay ra GIUA luc dang goi API (vd dang gui
                // anh thi mat song) -> luu offline de dong bo sau, khac voi cac loi khac.
                Log.w("VerifyActivity", "Mat mang giua luc goi API -> luu offline: ${e.message}")
                offlineCheckinManager.saveForLaterSync(lat, lng, notes, true, imageFile)
                CheckinSyncScheduler.scheduleSync(applicationContext)
                withContext(Dispatchers.Main) {
                    binding.txtStatus.text = "📥 Mất mạng giữa chừng - đã lưu, sẽ tự đồng bộ sau"
                }
            } catch (e: Exception) {
                // SUA: loi KHAC voi loi mang (parse JSON sai, server tra ve format la...)
                // -> KHONG nen luu offline, vi gui lai cung se loi giong vay du co mang hay khong.
                Log.e("VerifyActivity", "Loi khong phai do mang: ${e.message}", e)
                withContext(Dispatchers.Main) {
                    binding.txtStatus.text = "Lỗi không xác định: ${e.message}"
                    binding.btnRetry.visibility = View.VISIBLE
                }
            }
        }
    }

    // kiểm tra mạng
    private fun isNetworkAvailable(): Boolean {
        val cm = getSystemService(ConnectivityManager::class.java)
        val network = cm.activeNetwork ?: return false
        val capabilities = cm.getNetworkCapabilities(network) ?: return false
        return capabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET) &&
                capabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_VALIDATED)
    }

    private fun allPermissionsGranted() = REQUIRED_PERMISSIONS.all {
        ContextCompat.checkSelfPermission(baseContext, it) == PackageManager.PERMISSION_GRANTED
    }

    override fun onRequestPermissionsResult(requestCode: Int, permissions: Array<String>, grantResults: IntArray) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        if (requestCode == REQUEST_CODE_PERMISSIONS) {
            if (allPermissionsGranted()) {
                Log.d("VerifyActivity", "Nguoi dung vua dong y cap quyen luc runtime")
                startCamera()
                triggerChallenge()
            } else {
                Log.e("VerifyActivity", "Nguoi dung tu choi cap quyen, close activity")
                Toast.makeText(this, "Ứng dụng cần quyền Camera và GPS để điểm danh!", Toast.LENGTH_SHORT).show()
                finish()
            }
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        Log.d("VerifyActivity", "--- OnDestroy Activity ---")
        challengeTimer?.cancel()
        cameraExecutor.shutdown()
    }

    companion object {
        private const val REQUEST_CODE_PERMISSIONS = 10
        private val REQUIRED_PERMISSIONS = arrayOf(
            Manifest.permission.CAMERA,
            Manifest.permission.ACCESS_FINE_LOCATION,
            Manifest.permission.ACCESS_COARSE_LOCATION
        )
    }
}