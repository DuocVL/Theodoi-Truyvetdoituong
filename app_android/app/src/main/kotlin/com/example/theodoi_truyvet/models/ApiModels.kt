
package com.example.theodoi_truyvet.models

import com.google.gson.annotations.SerializedName
import java.util.Date

// For /auth/login
data class LoginRequest(val username: String, val password: String)
data class LoginResponse(val token: String, val message: String)

// For /subjects/activate
data class ActivationRequest(val token: String, val password: String)

// For /tracking/check-in
data class CheckInRequest(val latitude: Double, val longitude: Double)
data class CheckInResponse(
    val message: String,
    val data: CheckInData
)
data class CheckInData(
    val checkinId: String,
    val timestamp: String,
    val distance: Double,
    val is_within_zone: Boolean,
    val zone_name: String?
)

// For /auth/me and /subjects/{id}
data class SubjectProfileResponse(
    val data: SubjectData
)

data class SubjectData(
    val id: String,
    @SerializedName("full_name") val fullName: String,
    val dob: Date?,
    val gender: String?,
    @SerializedName("id_number") val idNumber: String?,
    val address: String?,
    val phone: String?,
    @SerializedName("monitoring_start") val monitoringStart: Date?,
    @SerializedName("monitoring_end") val monitoringEnd: Date?,
    val account: AccountData,
    @SerializedName("check_ins") val checkIns: List<CheckInHistoryItem> // History
)

data class AccountData(
    val username: String,
    val email: String,
    val status: String
)

data class CheckInHistoryItem(
    val id: String,
    val timestamp: Date,
    val latitude: Double,
    val longitude: Double,
    val is_within_zone: Boolean,
    @SerializedName("zone_name") val zoneName: String?
)
