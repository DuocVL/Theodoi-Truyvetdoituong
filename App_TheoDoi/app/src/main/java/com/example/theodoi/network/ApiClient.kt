package com.example.theodoi.network

import android.content.Context
import com.example.theodoi.data.SessionManager
import com.example.theodoi.network.dto.RefreshTokenRequest
import okhttp3.Authenticator
import okhttp3.Interceptor
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.Response
import okhttp3.Route
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory

object ApiClient {

    private const val BASE_URL = "http://192.168.44.101:3333/"
    fun getAbsoluteImageUrl(relativeUrl: String): String = "$BASE_URL${relativeUrl.removePrefix("/")}"

    private lateinit var sessionManager: SessionManager

    // Hàm khởi tạo bắt buộc gọi ở Application class hoặc MainActivity trước khi dùng mạng
    fun init(context: Context) {
        sessionManager = SessionManager(context)
    }

    // Interceptor tự động thêm Header Authorization vào mọi Request
    private val authInterceptor = Interceptor { chain ->
        val originalRequest = chain.request()
        val token = if (::sessionManager.isInitialized) sessionManager.getAccessToken() else null

        val requestBuilder = originalRequest.newBuilder()
        if (token != null && originalRequest.header("Authorization") == null) {
            requestBuilder.addHeader("Authorization", "Bearer $token")
        }
        chain.proceed(requestBuilder.build())
    }

    // Authenticator tự động xử lý khi nhận mã lỗi 401 từ Server
    private val tokenAuthenticator = object : Authenticator {
        override fun authenticate(route: Route?, response: Response): Request? {
            // Nếu request đã refresh thất bại trước đó rồi thì không thử lại nữa để tránh lặp vô hạn
            if (response.priorResponse != null) return null

            synchronized(this) {
                val currentRefreshToken = sessionManager.getRefreshToken() ?: return null

                // Tạo một instance Retrofit độc lập để gọi làm mới token, tránh lặp vòng lặp vô hạn
                val localRetrofit = Retrofit.Builder()
                    .baseUrl(BASE_URL)
                    .addConverterFactory(GsonConverterFactory.create())
                    .build()
                val service = localRetrofit.create(AuthApiService::class.java)

                try {
                    val call = service.refreshTokenSync(RefreshTokenRequest(currentRefreshToken))
                    val res = call.execute() // Chạy đồng bộ trong luồng ngầm của OkHttp

                    if (res.isSuccessful && res.body() != null) {
                        val newTokenData = res.body()!!.data
                        // Lưu token mới vào bộ nhớ thiết bị
                        sessionManager.saveTokens(newTokenData.accessToken, newTokenData.refreshToken)

                        // Thực hiện lại Request cũ với Token mới vừa lấy
                        return response.request.newBuilder()
                            .header("Authorization", "Bearer ${newTokenData.accessToken}")
                            .build()
                    } else {
                        // Refresh Token cũng hết hạn luôn -> Ép người dùng đăng xuất
                        sessionManager.clearTokens()
                        return null
                    }
                } catch (e: Exception) {
                    return null
                }
            }
        }
    }

    private val httpClient by lazy {
        OkHttpClient.Builder()
            .addInterceptor(authInterceptor)
            .addInterceptor(HttpLoggingInterceptor().apply { level = HttpLoggingInterceptor.Level.BODY })
            .authenticator(tokenAuthenticator)
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
}