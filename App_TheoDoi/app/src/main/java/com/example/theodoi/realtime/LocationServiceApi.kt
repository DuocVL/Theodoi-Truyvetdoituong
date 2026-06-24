package com.example.theodoi.data

import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.POST

data class LocationPayload(
    val deviceId: String,
    val latitude: Double,
    val longitude: Double,
    val accuracy: Float,
    val timestamp: Long,
    val isMock: Boolean
)

interface ApiService {
    @POST("location")
    suspend fun sendLocation(@Body payload: LocationPayload): Response<Unit>
}