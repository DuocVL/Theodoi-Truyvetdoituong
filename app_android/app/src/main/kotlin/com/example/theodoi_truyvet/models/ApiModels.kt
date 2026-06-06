package com.example.theodoi_truyvet.models

import com.google.gson.annotations.SerializedName
import java.util.Date

// --- REQUEST MODELS ---

data class LoginRequest(
    val username: String,
    val password: String
)

data class ActivationRequest(
    val token: String,
    val password: String
)

data class CheckInRequest(
    @SerializedName("image_url") val imageUrl: String,
    val latitude: Double,
    val longitude: Double
)

// --- RESPONSE MODELS ---

data class LoginResponse(
    val token: String,
    val user: User
)

data class User(
    val id: Int,
    val username: String,
    @SerializedName("full_name") val fullName: String,
    val role: String
)

data class CheckIn(
    val id: Int,
    @SerializedName("image_url") val imageUrl: String,
    val latitude: Double,
    val longitude: Double,
    // --- MODIFIED: Use Date type for timestamp ---
    @SerializedName("created_at") val createdAt: Date
)

// --- GENERIC RESPONSE ---

data class MessageResponse(val message: String)
