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

class FaceRecognitionAnalyzer(
    context: Context,
    // CẬP NHẬT: Thêm faceCount, yaw, roll vào luồng trả dữ liệu
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

    private val faceDetector = FaceDetection.getClient(
        FaceDetectorOptions.Builder()
            .setPerformanceMode(FaceDetectorOptions.PERFORMANCE_MODE_FAST)
            .setClassificationMode(FaceDetectorOptions.CLASSIFICATION_MODE_ALL)
            // KÍCH HOẠT: Đo góc nghiêng của khuôn mặt hình học
            .setLandmarkMode(FaceDetectorOptions.LANDMARK_MODE_NONE)
            .build()
    )

    private var tflite: Interpreter

    init {
        val assetFileDescriptor = context.assets.openFd("mobilefacenet.tflite")
        val fileInputStream = FileInputStream(assetFileDescriptor.fileDescriptor)
        val fileChannel = fileInputStream.channel
        val startOffset = assetFileDescriptor.startOffset
        val declaredLength = assetFileDescriptor.declaredLength
        val tfliteModel = fileChannel.map(FileChannel.MapMode.READ_ONLY, startOffset, declaredLength)
        tflite = Interpreter(tfliteModel)
    }

    @androidx.camera.core.ExperimentalGetImage
    override fun analyze(imageProxy: ImageProxy) {
        val mediaImage = imageProxy.image
        if (mediaImage != null) {
            val rotationDegrees = imageProxy.imageInfo.rotationDegrees
            val image = InputImage.fromMediaImage(mediaImage, rotationDegrees)

            faceDetector.process(image)
                .addOnSuccessListener { faces ->
                    val faceCount = faces.size

                    // LỖ HỔNG 1: Nếu phát hiện không có mặt hoặc nhiều hơn 1 mặt, chặn phân tích AI ngay
                    if (faceCount != 1) {
                        onFaceAnalyzed(null, 0f, 0f, 0f, faceCount, 0f, 0f)
                        return@addOnSuccessListener
                    }

                    val face = faces[0]
                    val smileProb = face.smilingProbability ?: 0.0f
                    val leftEyeOpenProb = face.leftEyeOpenProbability ?: 1.0f
                    val rightEyeOpenProb = face.rightEyeOpenProbability ?: 1.0f

                    // LỖ HỔNG 3: Trích xuất góc quay trái/phải (Yaw) và góc nghiêng đầu (Roll)
                    val yaw = face.headEulerAngleY
                    val roll = face.headEulerAngleZ

                    var fullBitmap = imageProxy.toBitmap()
                    if (rotationDegrees != 0) {
                        val matrix = Matrix().apply { postRotate(rotationDegrees.toFloat()) }
                        fullBitmap = Bitmap.createBitmap(fullBitmap, 0, 0, fullBitmap.width, fullBitmap.height, matrix, true)
                    }

                    val croppedFace = cropFace(fullBitmap, face.boundingBox)
                    if (croppedFace != null) {
                        val scaledFace = Bitmap.createScaledBitmap(croppedFace, 112, 112, false)
                        val vector = runMobileFaceNet(scaledFace)

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

    private fun runMobileFaceNet(bitmap: Bitmap): FloatArray {
        val batchSize = 2
        val imgData = ByteBuffer.allocateDirect(batchSize * 112 * 112 * 3 * 4).apply {
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