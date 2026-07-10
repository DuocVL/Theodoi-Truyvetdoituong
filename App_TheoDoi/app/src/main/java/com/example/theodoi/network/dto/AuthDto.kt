package com.example.theodoi.network.dto

import com.google.gson.annotations.SerializedName

// Request cho Refresh Token & Logout
data class RefreshTokenRequest(
    @SerializedName("refreshToken") val refreshToken: String
)

//Reponse token trả về cả lúc đăng nhập và refresh
data class TokenReponse(
    @SerializedName("accessToken") val accessToken: String,
    @SerializedName("refreshToken") val refreshToken: String
)