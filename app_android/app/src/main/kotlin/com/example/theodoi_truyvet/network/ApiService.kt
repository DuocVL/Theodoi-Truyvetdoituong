
package com.example.theodoi_truyvet.network

import com.example.theodoi_truyvet.models.* // We will create these models later
import okhttp3.MultipartBody
import okhttp3.RequestBody
import retrofit2.Response
import retrofit2.http.*

interface ApiService {

    // --- AUTH --- //

    @POST("/api/v1/subjects/activate")
    suspend fun activateAccount(@Body activationRequest: ActivationRequest): Response<GenericResponse>

    @POST("/api/v1/auth/login")
    suspend fun login(@Body loginRequest: LoginRequest): Response<LoginResponse>

    // --- PROFILE & FACE --- //
    
    @GET("/api/v1/auth/me")
    suspend fun getMyProfile(): Response<SubjectProfileResponse> // Assuming the /me route returns subject details

    @Multipart
    @POST("/api/v1/face/register") // Assuming this is the endpoint
    suspend fun registerFace(
        @Part files: List<MultipartBody.Part>
    ): Response<GenericResponse>


    // --- CHECK-IN --- //

    @Multipart
    @POST("/api/v1/face/check-in")
    suspend fun checkIn(
        @Part("latitude") latitude: RequestBody,
        @Part("longitude") longitude: RequestBody,
        @Part files: MultipartBody.Part
    ): Response<CheckInResponse>


    // --- HISTORY --- //
    
    @GET("/api/v1/subjects/{id}") // We get history from the subject details endpoint
    suspend fun getSubjectDetails(@Path("id") subjectId: String): Response<SubjectProfileResponse>
}

// A generic response for simple success messages
data class GenericResponse(val message: String)
