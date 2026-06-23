package com.example.theodoi.network.dto

import com.google.gson.annotations.SerializedName

// Request body cho API /register
data class UpdateFCMTokenRequest(
    @SerializedName("fcm_token") val fcm_token: String
)
