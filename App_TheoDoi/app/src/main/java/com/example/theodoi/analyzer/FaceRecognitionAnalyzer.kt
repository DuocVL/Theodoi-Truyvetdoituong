package com.example.facerecog.analyzer

import android.content.Context
import android.graphics.Bitmap
import android.graphics.Matrix
import android.graphics.Rect
import androidx.camera.core.ImageAnalysis
import androidx.camera.core.ImageProxy
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.face.FaceDetection
import com.google.mlkit.vision.face.FaceDetectorOptions
import org.tensorflow.lite.Interpreter
import java.io.FileInputStream
import java.nio.ByteBuffer
import java.nio.ByteOrder
import java.nio.channels.FileChannel

/*
CameraX
   │
   ▼
ImageAnalysis
   │
   ▼
FaceRecognitionAnalyzer
   │
   ├────────► ML Kit Face Detection
   │              │
   │              ▼
   │        Phát hiện khuôn mặt
   │              │
   │              ▼
   │       Bounding Box + Góc mặt
   │
   ▼
Cắt khuôn mặt
   │
   ▼
Resize 112×112
   │
   ▼
MobileFaceNet (.tflite)
   │
   ▼
Face Embedding (192 chiều)
   │
   ▼
Callback về Activity
 */

 /*

 CameraX
      │
      ▼
ImageProxy
      │
      ▼
ML Kit Face Detection
      │
      ▼
Đếm số khuôn mặt
      │
      ├── 0 hoặc >1
      │      │
      │      ▼
      │   Trả null
      │
      ▼
Lấy Bounding Box
      │
      ▼
Cắt khuôn mặt
      │
      ▼
Resize 112×112
      │
      ▼
Chuẩn hóa pixel
      │
      ▼
MobileFaceNet
      │
      ▼
Embedding 192 chiều
      │
      ▼
Callback
      │
      ▼
Đăng ký hoặc xác thực khuôn mặt
  */


//FaceRecognitionAnalyzer là thành phần xử lý ảnh từ camera theo thời gian thực. Nó nhận từng khung hình từ CameraX, 
//phát hiện khuôn mặt bằng ML Kit, sau đó cắt khuôn mặt và đưa vào mô hình MobileFaceNet để sinh ra vector đặc trưng (Face Embedding) dùng cho nhận dạng
//ImageAnalysis.Analyzer là giao diện của CameraX.
//Mỗi khi camera có một frame mới, CameraX sẽ gọi
class FaceRecognitionAnalyzer(
    context: Context,
    private val onFaceAnalyzed: (
        vector: FloatArray?,
        smile: Float,
        leftEye: Float,
        rightEye: Float,
        faceCount: Int,
        yaw: Float,
        roll: Float
    ) -> Unit
) : ImageAnalysis.Analyzer {

    // dùng Google ML Kit Face Detection 
    // không nhận dạng người 
    //chỉ phát hiện có khuôn mặt , vị trí khuôn mặt
    //góc đầu , nụ cười, mắt
    private val faceDetector = FaceDetection.getClient(
        FaceDetectorOptions.Builder()
            .setPerformanceMode(FaceDetectorOptions.PERFORMANCE_MODE_FAST)//ưu tiên tốc độ
            .setClassificationMode(FaceDetectorOptions.CLASSIFICATION_MODE_ALL)//tính toán smile , eye
            .setLandmarkMode(FaceDetectorOptions.LANDMARK_MODE_NONE)//không phát hiện mũi , miệng , tai
            .build()
    )

    //TensorFlow Lite Interpreter.
    private var tflite: Interpreter

    init {
        val assetFileDescriptor = context.assets.openFd("mobilefacenet.tflite")//khởi tạo mobilefacenet
        val fileInputStream = FileInputStream(assetFileDescriptor.fileDescriptor)
        val fileChannel = fileInputStream.channel
        val startOffset = assetFileDescriptor.startOffset
        val declaredLength = assetFileDescriptor.declaredLength
        val tfliteModel = fileChannel.map(FileChannel.MapMode.READ_ONLY, startOffset, declaredLength)
        tflite = Interpreter(tfliteModel)
    }

    @androidx.camera.core.ExperimentalGetImage
    //cameraX truyền frame dưới dạng YUV
    override fun analyze(imageProxy: ImageProxy) {
        val mediaImage = imageProxy.image
        if (mediaImage != null) {
            val rotationDegrees = imageProxy.imageInfo.rotationDegrees
            val image = InputImage.fromMediaImage(mediaImage, rotationDegrees)//chuyển đổi sang InputImage
            //ML Kit trả về List<Face>
            faceDetector.process(image)
                .addOnSuccessListener { faces ->
                    val faceCount = faces.size//đếm số người

                    //Nếu phát hiện không có mặt hoặc nhiều hơn 1 mặt, chặn phân tích AI ngay
                    if (faceCount != 1) {
                        onFaceAnalyzed(null, 0f, 0f, 0f, faceCount, 0f, 0f)
                        return@addOnSuccessListener
                    }

                    val face = faces[0]
                    val smileProb = face.smilingProbability ?: 0.0f
                    val leftEyeOpenProb = face.leftEyeOpenProbability ?: 1.0f
                    val rightEyeOpenProb = face.rightEyeOpenProbability ?: 1.0f

                    //Trích xuất góc quay trái/phải (Yaw) và góc nghiêng đầu (Roll)
                    val yaw = face.headEulerAngleY
                    val roll = face.headEulerAngleZ

                    //để TensorFlow Lite xử lý
                    var fullBitmap = imageProxy.toBitmap()
                    if (rotationDegrees != 0) {
                        val matrix = Matrix().apply { postRotate(rotationDegrees.toFloat()) }
                        fullBitmap = Bitmap.createBitmap(fullBitmap, 0, 0, fullBitmap.width, fullBitmap.height, matrix, true)
                    }

                    //cắt khuôn mặt
                    val croppedFace = cropFace(fullBitmap, face.boundingBox)
                    if (croppedFace != null) {
                        val scaledFace = Bitmap.createScaledBitmap(croppedFace, 112, 112, false)
                        val vector = runMobileFaceNet(scaledFace)//mobilefacenet phân tích

                        onFaceAnalyzed(vector, smileProb, leftEyeOpenProb, rightEyeOpenProb, faceCount, yaw, roll)
                    }
                }
                .addOnCompleteListener {
                    imageProxy.close()
                }
        } else {
            imageProxy.close()
        }
    }

    //lấy vector embedding ảnh
    private fun runMobileFaceNet(bitmap: Bitmap): FloatArray {
        val batchSize = 2
        val imgData = ByteBuffer.allocateDirect(batchSize * 112 * 112 * 3 * 4).apply {//chuẩn hóa đầu vào
            order(ByteOrder.nativeOrder())
        }
        val intValues = IntArray(112 * 112)
        bitmap.getPixels(intValues, 0, bitmap.width, 0, 0, bitmap.width, bitmap.height)

        for (i in 0 until 2) {
            for (pixelValue in intValues) {
                imgData.putFloat(((pixelValue shr 16 and 0xFF) - 127.5f) / 127.5f)
                imgData.putFloat(((pixelValue shr 8 and 0xFF) - 127.5f) / 127.5f)
                imgData.putFloat(((pixelValue and 0xFF) - 127.5f) / 127.5f)
            }
        }

        val outputMap = Array(2) { FloatArray(192) } 
        tflite.run(imgData, outputMap)
        return outputMap[0]
    }

    //cắt vùng ảnh
    private fun cropFace(bitmap: Bitmap, rect: Rect): Bitmap? {
        return try {
            val x = rect.left.coerceAtLeast(0)
            val y = rect.top.coerceAtLeast(0)
            val width = rect.width().coerceAtMost(bitmap.width - x)
            val height = rect.height().coerceAtMost(bitmap.height - y)
            Bitmap.createBitmap(bitmap, x, y, width, height)
        } catch (e: Exception) {
            null
        }
    }
}