package com.example.theodoi.network.dto

data class LocationRequest(
    val latitude: Number,
    val password: String,
    val device_id: String,
    val fcm_token: String
)