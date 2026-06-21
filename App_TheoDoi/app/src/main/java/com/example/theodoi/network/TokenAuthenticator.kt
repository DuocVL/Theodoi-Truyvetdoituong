package com.example.theodoi.network

import android.content.Context
import android.content.Intent
import android.util.Log
import com.example.theodoi.data.SessionManager
import com.example.theodoi.network.dto.RefreshTokenRequest
import okhttp3.Authenticator
import okhttp3.Request
import okhttp3.Response
import okhttp3.Route
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory

class TokenAuthenticator(
    private val context: Context,
    private val sessionManager: SessionManager
) : Authenticator {

    override fun authenticate(route: Route?, response: Response): Request? {

        if (response.request.url.encodedPath.contains("api/v1/auth/refresh-token")) {
            return null
        }


        if (responseCount(response) >= 3) {
            handleLogout()
            return null
        }

        synchronized(this) {
            val localAccessToken = sessionManager.getAccessToken()
            val requestHeaderToken = response.request.header("Authorization")?.replace("Bearer ", "")

            if (requestHeaderToken != localAccessToken) {
                return response.request.newBuilder()
                    .header("Authorization", "Bearer $localAccessToken")
                    .build()
            }

            val refreshToken = sessionManager.getRefreshToken()
            if (!refreshToken.isNullOrEmpty()) {
                try {
                    // Cải tiến: Tạo một Retrofit độc lập hoàn toàn không chứa interceptor thêm header cũ để gọi Refresh
                    val localRetrofit = Retrofit.Builder()
                        .baseUrl("http://192.168.44.101:3333/")
                        .addConverterFactory(GsonConverterFactory.create())
                        .build()
                    val isolatedAuthService = localRetrofit.create(AuthApiService::class.java)

                    val refreshCall = isolatedAuthService.refreshTokenSync(RefreshTokenRequest(refreshToken))
                    val refreshResponse = refreshCall.execute() // Chạy đồng bộ ngầm
                    Log.e(
                        "REFRESH",
                        "code=${refreshResponse.code()} body=${refreshResponse.body()} error=${refreshResponse.errorBody()?.string()}"
                    )
                    if (refreshResponse.isSuccessful && refreshResponse.body() != null) {
                        val newTokens = refreshResponse.body()!!

                        // Cập nhật token mới vào bộ nhớ
                        sessionManager.saveTokens(newTokens.accessToken, newTokens.refreshToken)

                        Log.e("TheoDoi", newTokens.toString())

                        // Nạp token mới vào request đang bị kẹt để chạy tiếp tục
                        return response.request.newBuilder()
                            .header("Authorization", "Bearer ${newTokens.accessToken}")
                            .build()
                    }
                } catch (e: Exception) {
                    e.printStackTrace()
                }
            }

            // Nếu lọt xuống đây tức là mọi nỗ lực refresh đều thất bại (Token hết hạn thật sự) -> Đá văng ra Login
            handleLogout()
            return null
        }
    }

    private fun responseCount(response: Response): Int {
        var result = 1
        var priorResponse = response.priorResponse
        while (priorResponse != null) {
            result++
            priorResponse = priorResponse.priorResponse
        }
        return result
    }

    private fun handleLogout() {
        sessionManager.clearTokens()
        // Cưỡng bức xóa sạch toàn bộ các Activity cũ (bao gồm cả HistoryActivity) để quay về màn hình đầu tiên
        val intent = context.packageManager.getLaunchIntentForPackage(context.packageName)?.apply {
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK)
        }
        context.startActivity(intent)
    }
}