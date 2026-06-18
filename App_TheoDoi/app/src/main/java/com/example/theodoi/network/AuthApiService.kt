package com.example.theodoi.network

import com.example.theodoi.network.dto.ForgotPasswordRequest
import com.example.theodoi.network.dto.LoginRequest
import com.example.theodoi.network.dto.LoginResponse
import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.POST

interface AuthApiService {

    @POST("api/v1/auth/login")
    suspend fun login(@Body request: LoginRequest): Response<LoginResponse>

    @POST("api/v1/auth/forgot-password")
    suspend fun forgotPassword(@Body request: ForgotPasswordRequest): Response<Unit> // Assuming the server returns an empty body on success

}
