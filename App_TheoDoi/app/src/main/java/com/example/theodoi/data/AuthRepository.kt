package com.example.theodoi.data

import com.example.theodoi.network.ApiClient
import com.example.theodoi.network.dto.ForgotPasswordRequest
import com.example.theodoi.network.dto.LoginRequest
import com.example.theodoi.network.dto.LoginResponse
import com.example.theodoi.network.dto.RefreshTokenRequest
import retrofit2.Response

class AuthRepository {

    private val authApiService by lazy { ApiClient.authApiService }

    suspend fun login(username: String, password: String, deviceId: String): Response<LoginResponse> {
        val request = LoginRequest(username, password, deviceId)
        return authApiService.login(request)
    }

    suspend fun forgotPassword(email: String): Response<Unit> {
        val request = ForgotPasswordRequest(email)
        return authApiService.forgotPassword(request)
    }

    suspend fun logout(refreshToken: String): Response<Unit> {
        return authApiService.logout(RefreshTokenRequest(refreshToken))
    }
}
