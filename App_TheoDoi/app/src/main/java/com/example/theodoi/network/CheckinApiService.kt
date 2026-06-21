package com.example.theodoi.network

import com.example.theodoi.network.dto.CheckinDetailResponse
import com.example.theodoi.network.dto.CheckinResponse
import com.example.theodoi.network.dto.HistoryListResponse
import okhttp3.MultipartBody
import okhttp3.RequestBody
import retrofit2.Response
import retrofit2.http.*


interface CheckinApiService {
    @Multipart
    @POST("api/v1/checkins")
    suspend fun createCheckin(
        @Header("Authorization") token: String,
        @Part("uploadType") uploadType: RequestBody,
        @Part("latitude") latitude: RequestBody,
        @Part("longitude") longitude: RequestBody,
        @Part("notes") notes: RequestBody,
        @Part("face_verified") faceVerified: RequestBody,
        @Part("request_uuid") requestUuid: RequestBody, // MOI: server dung de dedupe
        @Part image: MultipartBody.Part?
    ): Response<CheckinResponse>

    @GET("api/v1/checkins/me")
    suspend fun getMyCheckins(
        @Query("page") page: Int,
        @Query("limit") limit: Int
    ): Response<HistoryListResponse>

    @GET("api/v1/checkins/{id}")
    suspend fun getCheckinById(
        @Path("id") id: String
    ): Response<CheckinDetailResponse>
}