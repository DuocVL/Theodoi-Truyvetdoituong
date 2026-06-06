package com.example.theodoi_truyvet.network

import com.example.theodoi_truyvet.models.ActivationRequest
import com.example.theodoi_truyvet.models.CheckIn
import com.example.theodoi_truyvet.models.CheckInRequest
import com.example.theodoi_truyvet.models.LoginRequest
import com.example.theodoi_truyvet.models.LoginResponse
import com.example.theodoi_truyvet.models.MessageResponse
import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST

interface ApiService {

    // --- MODIFIED: More RESTful endpoints ---

    @POST("auth/login")
    suspend fun login(@Body request: LoginRequest): Response<LoginResponse>

    @POST("auth/activate")
    suspend fun activateAccount(@Body request: ActivationRequest): Response<MessageResponse>

    @POST("check-ins")
    suspend fun createCheckIn(@Body request: CheckInRequest): Response<CheckIn>

    @GET("check-ins")
    suspend fun getCheckInHistory(): Response<List<CheckIn>>

}
