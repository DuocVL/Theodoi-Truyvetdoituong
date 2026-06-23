package com.example.theodoi.network

import com.example.theodoi.network.dto.UpdateFCMTokenRequest
import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.Header
import retrofit2.http.Multipart
import retrofit2.http.PUT


interface SubjectApiService {
    @Multipart
    @PUT("/api/v1/subjects/face-token")
    suspend fun updateFCMToken(
        @Header("Authorization") token: String,
        @Body request: UpdateFCMTokenRequest
    ): Response<Unit>

}