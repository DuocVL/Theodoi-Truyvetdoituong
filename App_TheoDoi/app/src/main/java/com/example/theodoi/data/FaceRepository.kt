package com.example.theodoi.data

import com.example.theodoi.network.ApiClient
import com.example.theodoi.network.dto.FaceResponse
import com.example.theodoi.network.dto.RegisterFaceRequest
import retrofit2.Response

class FaceRepository {

    private val faceApiService = ApiClient.faceApiService

    suspend fun registerFaceToServer(token: String, embedding: List<Float>): Response<FaceResponse> {
        val formatToken = if (token.startsWith("Bearer ")) token else "Bearer $token"
        return faceApiService.registerFace(formatToken, RegisterFaceRequest(embedding))
    }

    suspend fun getMyFaceFromServer(token: String): Response<FaceResponse> {
        val formatToken = if (token.startsWith("Bearer ")) token else "Bearer $token"
        return faceApiService.getMyFace(formatToken)
    }
}