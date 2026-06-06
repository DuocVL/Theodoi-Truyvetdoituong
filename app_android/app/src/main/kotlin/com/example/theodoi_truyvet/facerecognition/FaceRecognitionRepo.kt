package com.example.theodoi_truyvet.facerecognition

import com.example.theodoi_truyvet.database.AppDao
import com.example.theodoi_truyvet.database.UserEmbedding
import com.example.theodoi_truyvet.security.CryptoManager
import com.example.theodoi_truyvet.security.EncryptedPayload
import java.nio.ByteBuffer
import java.util.Date
import javax.inject.Inject
import javax.inject.Singleton
import kotlin.math.sqrt

@Singleton
class FaceRecognitionRepo @Inject constructor(
    private val appDao: AppDao,
    private val cryptoManager: CryptoManager
) {

    /**
     * Registers a new user face by saving the encrypted embedding.
     */
    suspend fun registerFace(userId: Int, embedding: FloatArray) {
        val embeddingBytes = floatArrayToByteArray(embedding)
        val encryptedPayload = cryptoManager.encrypt(embeddingBytes)

        val userEmbedding = UserEmbedding(
            userId = userId,
            encryptedEmbedding = encryptedPayload.encryptedData,
            iv = encryptedPayload.iv,
            lastUpdatedAt = Date()
        )
        appDao.insertUserEmbedding(userEmbedding)
    }

    /**
     * Verifies a face embedding against the stored one for a given user.
     */
    suspend fun verifyFace(userId: Int, newEmbedding: FloatArray): VerificationResult {
        val storedEmbeddingData = appDao.getUserEmbedding(userId)
            ?: return VerificationResult.NoFaceRegistered

        val payload = EncryptedPayload(storedEmbeddingData.iv, storedEmbeddingData.encryptedEmbedding)
        val decryptedEmbeddingBytes = cryptoManager.decrypt(payload)
        val storedEmbedding = byteArrayToFloatArray(decryptedEmbeddingBytes)

        val similarity = cosineSimilarity(storedEmbedding, newEmbedding)

        return if (similarity >= SIMILARITY_THRESHOLD) {
            VerificationResult.Success(similarity)
        } else {
            VerificationResult.Failure(similarity)
        }
    }

    private fun cosineSimilarity(x: FloatArray, y: FloatArray): Float {
        var dotProduct = 0.0f
        var normX = 0.0f
        var normY = 0.0f
        for (i in x.indices) {
            dotProduct += x[i] * y[i]
            normX += x[i] * x[i]
            normY += y[i] * y[i]
        }
        return if (normX == 0.0f || normY == 0.0f) 0.0f else (dotProduct / (sqrt(normX) * sqrt(normY)))
    }

    // --- Type Conversion Helpers ---

    private fun floatArrayToByteArray(floatArray: FloatArray): ByteArray {
        val buffer = ByteBuffer.allocate(floatArray.size * 4)
        floatArray.forEach { buffer.putFloat(it) }
        return buffer.array()
    }

    private fun byteArrayToFloatArray(byteArray: ByteArray): FloatArray {
        val buffer = ByteBuffer.wrap(byteArray)
        val floatArray = FloatArray(byteArray.size / 4)
        for (i in floatArray.indices) {
            floatArray[i] = buffer.getFloat()
        }
        return floatArray
    }

    companion object {
        // --- Threshold can be adjusted based on model performance ---
        const val SIMILARITY_THRESHOLD = 0.85f
    }
}

sealed class VerificationResult {
    data class Success(val similarity: Float) : VerificationResult()
    data class Failure(val similarity: Float) : VerificationResult()
    object NoFaceRegistered : VerificationResult()
}
