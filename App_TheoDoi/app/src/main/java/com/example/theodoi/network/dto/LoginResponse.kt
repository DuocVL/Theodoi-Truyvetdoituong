package com.example.theodoi.network.dto

data class LoginResponse(
    val accessToken: String,
    val refreshToken: String
)