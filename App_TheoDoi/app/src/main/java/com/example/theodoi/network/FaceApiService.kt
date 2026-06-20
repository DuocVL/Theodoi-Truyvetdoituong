package com.example.theodoi.network

import com.example.theodoi.network.dto.FaceResponse
import com.example.theodoi.network.dto.RegisterFaceRequest
import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.Header
import retrofit2.http.POST

interface FaceApiService {

    @POST("/api/v1/face/register")
    suspend fun registerFace(
        @Header("Authorization") token: String,
        @Body request: RegisterFaceRequest
    ): Response<FaceResponse>

    @GET("/api/v1/face/me")
    suspend fun getMyFace(
        @Header("Authorization") token: String
    ): Response<FaceResponse>
}