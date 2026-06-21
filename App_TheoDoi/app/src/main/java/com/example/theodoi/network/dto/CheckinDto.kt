package com.example.theodoi.network.dto

import com.google.gson.annotations.SerializedName

data class CheckinResponse(
    @SerializedName("data") val data: CheckinData
)

data class CheckinData(
    @SerializedName("id") val id: String,
    @SerializedName("subject_id") val subjectId: String,
    @SerializedName("notes") val notes: String?,
    @SerializedName("image_id") val imageId: String?,
    @SerializedName("face_verified") val faceVerified: Boolean, // Map chuẩn từ snake_case sang camelCase
    @SerializedName("confidence") val confidence: Double?,
    @SerializedName("latitude") val latitude: Double,
    @SerializedName("longitude") val longitude: Double,
    @SerializedName("status") val status: String
)