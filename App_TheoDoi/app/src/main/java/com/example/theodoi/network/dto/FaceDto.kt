package com.example.theodoi.network.dto

import com.google.gson.annotations.SerializedName

// Request body cho API /register
data class RegisterFaceRequest(
    @SerializedName("embedding") val embedding: List<Float>
)

// Response body chung cho cả /register và /me
data class FaceResponse(
    @SerializedName("data") val data: FaceData? = null,
    @SerializedName("message") val message: String? = null
)

data class FaceData(
    @SerializedName("id") val id: String,
    @SerializedName("subject_id") val subject_id: String,
    @SerializedName("created_at") val createdAt: String,
    @SerializedName("update_at") val updatedAt: String,
    @SerializedName("embedding") val embedding: List<Float>
)