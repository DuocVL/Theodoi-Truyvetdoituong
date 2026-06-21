package com.example.theodoi.data

import android.util.Log
import com.example.theodoi.network.ApiClient
import com.example.theodoi.network.dto.CheckinResponse
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.MultipartBody
import okhttp3.RequestBody
import okhttp3.RequestBody.Companion.toRequestBody
import retrofit2.Response
import java.io.File

class CheckinRepository {

    private val checkinApiService = ApiClient.checkinService

    suspend fun submitCheckin(
        token: String,
        latitude: Double,
        longitude: Double,
        notes: String,
        faceVerified: Boolean,
        imageFile: File
    ): Response<CheckinResponse> {

        Log.d("CheckinRepository", "submitCheckin Repository duoc goi: Lat=$latitude, Lng=$longitude, FileSize=${imageFile.length()} bytes")

        // 1. Khoi tao cac truong text duoi dang RequestBody
        val uploadTypeBody = "checkins".toRequestBody("text/plain".toMediaTypeOrNull())
        val latBody = latitude.toString().toRequestBody("text/plain".toMediaTypeOrNull())
        val lngBody = longitude.toString().toRequestBody("text/plain".toMediaTypeOrNull())
        val notesBody = notes.toRequestBody("text/plain".toMediaTypeOrNull())
        val faceVerifiedBody = faceVerified.toString().toRequestBody("text/plain".toMediaTypeOrNull())

        // 2. Dong goi tep tin hinh anh duoi dang MultipartBody.Part
        val requestFile = RequestBody.create("image/jpeg".toMediaTypeOrNull(), imageFile)
        val imagePart = MultipartBody.Part.createFormData("image", imageFile.name, requestFile)

        Log.d("CheckinRepository", "Bat dau ban thong tin thong qua Retrofit Interface")

        // Thu tu cac Part truyen vao day se quyet dinh thu tu gui len Server dung nhu spec yeu cau (uploadType truoc image)
        return checkinApiService.createCheckin(
            token = "Bearer $token",
            uploadType = uploadTypeBody,
            latitude = latBody,
            longitude = lngBody,
            notes = notesBody,
            faceVerified = faceVerifiedBody,
            image = imagePart
        )
    }
}