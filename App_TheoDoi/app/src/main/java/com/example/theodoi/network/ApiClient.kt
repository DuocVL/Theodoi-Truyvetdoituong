package com.example.theodoi.network

import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory

object ApiClient {

    // IMPORTANT: Replace with your computer's actual IP address in the local network.
    // 'localhost' or '127.0.0.1' will not work from an Android emulator or device.
    private const val BASE_URL = "http://192.168.1.10:3333/"

    // Create a logging interceptor to view request and response logs in Logcat.
    // This is extremely helpful for debugging.
    private val loggingInterceptor = HttpLoggingInterceptor().apply {
        level = HttpLoggingInterceptor.Level.BODY
    }

    // Create a custom OkHttpClient to add the logging interceptor.
    private val httpClient = OkHttpClient.Builder()
        .addInterceptor(loggingInterceptor)
        .build()

    // Configure Retrofit.
    private val retrofit = Retrofit.Builder()
        .baseUrl(BASE_URL)
        .client(httpClient) // Use the custom OkHttpClient.
        .addConverterFactory(GsonConverterFactory.create())
        .build()

    // Lazily create the service instance.
    val authApiService: AuthApiService by lazy {
        retrofit.create(AuthApiService::class.java)
    }
}
