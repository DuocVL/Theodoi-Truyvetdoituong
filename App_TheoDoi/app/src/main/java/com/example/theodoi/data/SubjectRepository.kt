package com.example.theodoi.data

import com.example.theodoi.network.ApiClient

import com.example.theodoi.network.dto.UpdateFCMTokenRequest
import retrofit2.Response

class SubjectRepository {

    private val subjectApiService by lazy { ApiClient.subjectApiService }

    suspend fun updateFCMToken(token: String, fcmToken: String): Response<Unit> {
        val formatToken = if (token.startsWith("Bearer ")) token else "Bearer $token"
        return subjectApiService.updateFCMToken(formatToken,UpdateFCMTokenRequest(fcmToken))
    }
}
