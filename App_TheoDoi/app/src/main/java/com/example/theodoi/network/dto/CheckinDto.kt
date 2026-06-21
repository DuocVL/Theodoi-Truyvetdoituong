package com.example.theodoi.network.dto

import com.google.gson.annotations.SerializedName


// DTO cho danh sách check-in
data class HistoryListResponse(
    @SerializedName("data") val data: List<CheckinSummaryData>,
    @SerializedName("pagination") val pagination: PaginationInfo
)

data class CheckinSummaryData(
    @SerializedName("id") val id: String,
    @SerializedName("notes") val notes: String?,
    @SerializedName("face_verified") val faceVerified: Boolean,
    @SerializedName("latitude") val latitude: Double,
    @SerializedName("longitude") val longitude: Double,
    @SerializedName("status") val status: String,
    @SerializedName("checkin_time") val checkinTime: String
)

data class PaginationInfo(
    @SerializedName("page") val page: Int,
    @SerializedName("limit") val limit: Int,
    @SerializedName("total") val total: Int,
    @SerializedName("totalPages") val totalPages: Int
)

// DTO cho xem chi tiết 1 lần check-in
data class CheckinDetailResponse(
    @SerializedName("data") val data: CheckinDetailData
)

data class CheckinDetailData(
    @SerializedName("id") val id: String,
    @SerializedName("notes") val notes: String?,
    @SerializedName("face_verified") val faceVerified: Boolean,
    @SerializedName("latitude") val latitude: Double,
    @SerializedName("longitude") val longitude: Double,
    @SerializedName("status") val status: String,
    @SerializedName("checkin_time") val checkinTime: String,
    @SerializedName("image") val image: CheckinImageData?
)

data class CheckinImageData(
    @SerializedName("id") val id: String,
    @SerializedName("file_name") val fileName: String,
    @SerializedName("url") val url: String, // Đường dẫn tương đối từ server (/uploads/...)
    @SerializedName("size") val size: Long
)

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