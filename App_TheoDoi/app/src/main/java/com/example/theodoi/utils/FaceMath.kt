package com.example.theodoi.utils

import java.nio.ByteBuffer

/*
                Face Embedding
                      │
          ┌───────────┴────────────┐
          ▼                        ▼
floatArrayToByteArray()     cosineSimilarity()
          │                        │
          ▼                        ▼
   Mã hóa + SQLite         So sánh khuôn mặt
          │
          ▼
byteArrayToFloatArray()
 */

//Lớp tiện ích chứa các phép toán phục vụ nhận dạng

object FaceMath {
    // Tính Cosine Similarity (Giá trị từ -1 đến 1. Gần 1 là càng giống nhau)
    //đo mức độ giống nhau giữa 2 vector khuôn mặt
    /*
    Công thức
    Hàm đang tính:

    Similarity= A⋅B / (∣∣A∣∣×∣∣B∣∣)

    Trong đó
    A⋅B là tích vô hướng (Dot Product).
    ∥A∥ là độ dài vector A.
    ∥B∥ là độ dài vector B.
     */
    fun cosineSimilarity(vectorA: FloatArray, vectorB: FloatArray): Float {
        var dotProduct = 0.0f
        var normA = 0.0f
        var normB = 0.0f
        for (i in vectorA.indices) {//tính tích vô hướng
            dotProduct += vectorA[i] * vectorB[i]
            normA += vectorA[i] * vectorA[i] //độ dài vector 
            normB += vectorB[i] * vectorB[i]
        }
        if (normA == 0.0f || normB == 0.0f) return 0.0f //vector vô hướng
        return (dotProduct / (Math.sqrt(normA.toDouble()) * Math.sqrt(normB.toDouble()))).toFloat()
    }

    //ĐỔi sang ByteArrray trước khi mã hóa và lưu
    fun floatArrayToByteArray(floats: FloatArray): ByteArray {
        val buffer = ByteBuffer.allocate(floats.size * 4)//mỗi float 4 byte
        for (f in floats) buffer.putFloat(f)//ghi từng byte vào bộ nhớ
        return buffer.array()
    }

    //Giải mã ByteArray
    fun byteArrayToFloatArray(bytes: ByteArray): FloatArray {
        val buffer = ByteBuffer.wrap(bytes)
        val floats = FloatArray(bytes.size / 4)
        for (i in floats.indices) {
            floats[i] = buffer.float
        }
        return floats
    }
}