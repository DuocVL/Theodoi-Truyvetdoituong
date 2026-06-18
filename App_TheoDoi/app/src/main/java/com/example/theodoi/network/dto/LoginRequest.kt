package com.example.theodoi.network.dto

data class LoginRequest(
    val username: String,
    val password: String,
    val device_id: String
)