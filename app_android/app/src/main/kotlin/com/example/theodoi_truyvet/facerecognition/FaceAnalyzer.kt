package com.example.theodoi_truyvet.facerecognition

import android.content.Context
import android.graphics.Bitmap
import android.graphics.Rect
import androidx.camera.core.ImageAnalysis
import androidx.camera.core.ImageProxy
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.face.Face
import com.google.mlkit.vision.face.FaceDetection
import com.google.mlkit.vision.face.FaceDetectorOptions
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import org.tensorflow.lite.Interpreter
import java.io.FileInputStream
import java.nio.ByteBuffer
import java.nio.ByteOrder
import java.nio.channels.FileChannel
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class FaceAnalyzer @Inject constructor(
    @ApplicationContext private val context: Context
) {

    // --- TFLite Interpreter ---
    private val tflite: Interpreter by lazy {
        Interpreter(loadModelFile(), Interpreter.Options())
    }

    // --- ML Kit Face Detector ---
    private val faceDetector = FaceDetection.getClient(
        FaceDetectorOptions.Builder()
            .setPerformanceMode(FaceDetectorOptions.PERFORMANCE_MODE_ACCURATE)
            .build()
    )

    // --- Analysis Logic ---
    fun analyze(
        imageProxy: ImageProxy,
        onFaceDetected: (embedding: FloatArray) -> Unit,
        onError: (Exception) -> Unit
    ) {
        val mediaImage = imageProxy.image
        if (mediaImage != null) {
            val image = InputImage.fromMediaImage(mediaImage, imageProxy.imageInfo.rotationDegrees)

            faceDetector.process(image)
                .addOnSuccessListener { faces ->
                    if (faces.isNotEmpty()) {
                        // For simplicity, we'll use the first detected face.
                        val face = faces[0]
                        CoroutineScope(Dispatchers.IO).launch {
                            val embedding = getFaceEmbedding(imageProxy.toBitmap(), face.boundingBox)
                            onFaceDetected(embedding)
                        }
                    }
                }
                .addOnFailureListener { e -> onError(e) }
                .addOnCompleteListener { imageProxy.close() }
        }
    }

    private fun getFaceEmbedding(bitmap: Bitmap, boundingBox: Rect): FloatArray {
        // 1. Crop the face from the original bitmap
        val croppedBitmap = Bitmap.createBitmap(
            bitmap,
            boundingBox.left,
            boundingBox.top,
            boundingBox.width(),
            boundingBox.height()
        )

        // 2. Resize the cropped bitmap to the model's input size
        val resizedBitmap = Bitmap.createScaledBitmap(croppedBitmap, MODEL_INPUT_SIZE, MODEL_INPUT_SIZE, true)

        // 3. Convert the bitmap to a ByteBuffer and normalize pixel values
        val byteBuffer = ByteBuffer.allocateDirect(4 * MODEL_INPUT_SIZE * MODEL_INPUT_SIZE * 3)
        byteBuffer.order(ByteOrder.nativeOrder())
        val intValues = IntArray(MODEL_INPUT_SIZE * MODEL_INPUT_SIZE)
        resizedBitmap.getPixels(intValues, 0, resizedBitmap.width, 0, 0, resizedBitmap.width, resizedBitmap.height)

        var pixel = 0
        for (i in 0 until MODEL_INPUT_SIZE) {
            for (j in 0 until MODEL_INPUT_SIZE) {
                val value = intValues[pixel++]
                byteBuffer.putFloat(((value shr 16 and 0xFF) - 127.5f) / 127.5f) // R
                byteBuffer.putFloat(((value shr 8 and 0xFF) - 127.5f) / 127.5f)  // G
                byteBuffer.putFloat(((value and 0xFF) - 127.5f) / 127.5f)      // B
            }
        }

        // 4. Run inference with the TFLite model
        val faceEmbedding = Array(1) { FloatArray(MODEL_OUTPUT_SIZE) }
        tflite.run(byteBuffer, faceEmbedding)

        // 5. Return the embedding
        return faceEmbedding[0]
    }

    // --- TFLite Model Loading ---
    private fun loadModelFile(): ByteBuffer {
        val assetFileDescriptor = context.assets.openFd(MODEL_FILE)
        val fileInputStream = FileInputStream(assetFileDescriptor.fileDescriptor)
        val fileChannel = fileInputStream.channel
        val startOffset = assetFileDescriptor.startOffset
        val declaredLength = assetFileDescriptor.declaredLength
        return fileChannel.map(FileChannel.MapMode.READ_ONLY, startOffset, declaredLength)
    }

    companion object {
        private const val MODEL_FILE = "facenet.tflite" // MAKE SURE to add this file to app/src/main/assets
        private const val MODEL_INPUT_SIZE = 160 // Input size for FaceNet model
        private const val MODEL_OUTPUT_SIZE = 128 // Output size (embedding length)
    }
}
