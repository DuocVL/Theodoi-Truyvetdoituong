package com.example.theodoi.network

import com.example.theodoi.network.dto.CheckinResponse
import okhttp3.MultipartBody
import okhttp3.RequestBody
import retrofit2.Response
import retrofit2.http.Header
import retrofit2.http.Multipart
import retrofit2.http.POST
import retrofit2.http.Part

interface CheckinApiService {
    @Multipart
    @POST("api/v1/checkins")
    suspend fun createCheckin(
        @Header("Authorization") token: String,
        @Part("uploadType") uploadType: RequestBody,
        @Part("latitude") latitude: RequestBody,
        @Part("longitude") longitude: RequestBody,
        @Part("notes") notes: RequestBody,
        @Part("face_verified") faceVerified: RequestBody, // Thêm phần này phục vụ kiểm tra từ client
        @Part image: MultipartBody.Part?
    ): Response<CheckinResponse>
}