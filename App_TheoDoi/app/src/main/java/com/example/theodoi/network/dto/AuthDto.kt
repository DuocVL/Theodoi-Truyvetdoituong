package com.example.theodoi.network.dto

import com.google.gson.annotations.SerializedName

// Request cho Refresh Token & Logout
data class RefreshTokenRequest(
    @SerializedName("refreshToken") val refreshToken: String
)

data class TokenReponse(
    @SerializedName("accessToken") val accessToken: String,
    @SerializedName("refreshToken") val refreshToken: String
)