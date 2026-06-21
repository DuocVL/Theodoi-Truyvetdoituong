package com.example.theodoi.network.dto

import com.google.gson.annotations.SerializedName

// Request cho Refresh Token & Logout
data class RefreshTokenRequest(
    @SerializedName("refreshToken") val refreshToken: String
)

// Response khi Refresh Token thành công
data class TokenResponse(
    @SerializedName("data") val data: TokenData
)

data class TokenData(
    @SerializedName("accessToken") val accessToken: String,
    @SerializedName("refreshToken") val refreshToken: String
)