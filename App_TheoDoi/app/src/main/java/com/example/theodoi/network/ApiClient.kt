package com.example.theodoi.network

import android.content.Context
import com.example.theodoi.data.SessionManager
import okhttp3.Interceptor
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory

object ApiClient {

    private const val BASE_URL = "http://192.168.44.100:3333/"
    fun getAbsoluteImageUrl(relativeUrl: String): String = "$BASE_URL${relativeUrl.removePrefix("/")}"

    private lateinit var appContext: Context
    lateinit var sessionManager: SessionManager // Đổi sang public để các file khác có thể dùng chung nếu cần

    // Hàm khởi tạo bắt buộc gọi ở Application class hoặc MainActivity trước khi dùng mạng
    fun init(context: Context) {
        appContext = context.applicationContext
        sessionManager = SessionManager(appContext)
    }

    // Interceptor tự động thêm Header Authorization vào mọi Request trừ API refresh-token
    private val authInterceptor = Interceptor { chain ->
        val originalRequest = chain.request()
        val token = if (::sessionManager.isInitialized) sessionManager.getAccessToken() else null

        val requestBuilder = originalRequest.newBuilder()
        // Không tự động nhét token cũ vào request gọi làm mới token hoặc login
        if (token != null && originalRequest.header("Authorization") == null &&
            !originalRequest.url.encodedPath.contains("api/v1/auth/refresh-token")) {
            requestBuilder.addHeader("Authorization", "Bearer $token")
        }
        chain.proceed(requestBuilder.build())
    }

    private val httpClient by lazy {
        OkHttpClient.Builder()
            .addInterceptor(authInterceptor)
            .addInterceptor(HttpLoggingInterceptor().apply { level = HttpLoggingInterceptor.Level.BODY })
            // SỬA TẠI ĐÂY: Dùng class chuẩn của bạn thay vì object ẩn danh
            .authenticator(TokenAuthenticator(appContext, sessionManager))
            .build()
    }

    private val retrofit by lazy {
        Retrofit.Builder()
            .baseUrl(BASE_URL)
            .client(httpClient)
            .addConverterFactory(GsonConverterFactory.create())
            .build()
    }

    val authApiService: AuthApiService by lazy { retrofit.create(AuthApiService::class.java) }
    val faceApiService: FaceApiService by lazy { retrofit.create(FaceApiService::class.java) }
    val checkinService: CheckinApiService by lazy { retrofit.create(CheckinApiService::class.java) }
    val subjectApiService: SubjectApiService by lazy { retrofit.create(SubjectApiService::class.java) }
}