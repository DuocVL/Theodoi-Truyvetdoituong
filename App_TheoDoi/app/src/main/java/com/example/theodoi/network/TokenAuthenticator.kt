package com.example.theodoi.network

import android.content.Context
import android.content.Intent
import android.util.Log
import com.example.theodoi.data.SessionManager
import com.example.theodoi.network.dto.RefreshTokenRequest
import com.example.theodoi.network.dto.TokenReponse
import okhttp3.Authenticator
import okhttp3.Request
import okhttp3.Response
import okhttp3.Route

//Thành phần chịu trách nhiệm xử lý khi token hết hạn đảm bảo duy trì phiên đăng nhập
//được OkHttpClient gọi chỉ khi Server trả về mã lỗi 401 Unauthorized

class TokenAuthenticator(private val context: Context, private val sessionManager: SessionManager) : Authenticator {

    //hàm xử lý sẽ trả về
    //Request → OkHttp sẽ gửi lại request.
    //null → OkHttp dừng lại và trả lỗi cho ứng dụng.
    override fun authenticate(route: Route?, response: Response): Request? {

        //không refresh chính request refresh-token
        if (response.request.url.encodedPath.contains("api/v1/auth/refresh-token")) { return null }

        //Giới hạn số lần gửi lại yêu cầu refresh tối đa 3 nếu quá yêu cầu đăng nhập lại
        if (responseCount(response) >= 3) {
            handleLogout()
            return null
        }

        //cơ chế đông bộ hóa 
        //ví dụ gửi 5 request A,B,C,D cùng lúc đều bị 401 không có đồng bộ hóa -> cả 5 request cùng refresh
        //khi dùng đồng bộ sẽ chỉ có A gửi refresh B,c,D,E dùng token mới
        synchronized(this) {
            val localAccessToken = sessionManager.getAccessToken()//lấy assettoken đã lưu
            val requestHeaderToken = response.request.header("Authorization")?.replace("Bearer ", "")//lấy assettoken của request vừa gửi

            //so sáng 2 assettoken nếu khác nhau chỉ cần gửi lại request với assettoken đã lưu
            if (requestHeaderToken != localAccessToken) {
                return response.request.newBuilder()
                    .header("Authorization", "Bearer $localAccessToken")
                    .build()
            }

            
            val refreshToken = sessionManager.getRefreshToken()//lấy refreshtoken 
            if (!refreshToken.isNullOrEmpty()) {//xử lý refreshtoken
                try {
//                    //Tạo một Retrofit độc lập hoàn toàn không chứa interceptor thêm header cũ để gọi Refresh
//                    val localRetrofit = Retrofit.Builder()
//                        .baseUrl("http://192.168.44.101:3333/")
//                        .addConverterFactory(GsonConverterFactory.create())
//                        .build()
//                    val isolatedAuthService = localRetrofit.create(AuthApiService::class.java)
//
//                    val refreshCall = isolatedAuthService.refreshTokenSync(RefreshTokenRequest(refreshToken))
                    val refreshCall = ApiClient.authApiService.refreshTokenSync(RefreshTokenRequest(refreshToken))//tạo yêu cầu lấy token mới
                    val refreshResponse = refreshCall.execute() //Gọi đồng bộ lấy token
                    Log.e("THEODOI_REFRESH","code=${refreshResponse.code()} body=${refreshResponse.body()} error=${refreshResponse.errorBody()?.string()}")
                    if (refreshResponse.isSuccessful && refreshResponse.body() != null) {//xử lý khi lấy thành công

                        //lấy danh sách token
                        val newTokens = refreshResponse.body() as TokenReponse
                        // Cập nhật token mới vào bộ nhớ
                        sessionManager.saveTokens(newTokens.accessToken, newTokens.refreshToken)
                        Log.e("TheoDoi_REFRESH", newTokens.toString())

                        // Nạp token mới vào request đang bị kẹt để chạy tiếp tục
                        return response.request.newBuilder()
                            .header("Authorization", "Bearer ${newTokens.accessToken}")
                            .build()
                    }
                } catch (e: Exception) {
                    e.printStackTrace()
                }
            }

            //Ra màn hình khi tất cả mọi nỗ lực refresh-token đều thất bại token hết hạn ,...
            handleLogout()
            return null
        }
    }

    //đếm số reponse trước đó để tránh gửi refresh vô hạn
    //piorResponse là reponse trước đó dẫn tới reponse này (linkedin) 
    //ví dụ gửi GET /subject -> 401 nên Authenticator chạy sau đó thành công gửi lại request khi này reponse200 -> piorReponse->reponse401
    //nếu 
    private fun responseCount(response: Response): Int {
        var result = 1 //tính reponse hiện tịa là 1
        var priorResponse = response.priorResponse //lấy piorResponse của hiện tại
        while (priorResponse != null) {//lặp lại với các reponse cũ
            result++
            priorResponse = priorResponse.priorResponse
        }
        return result
    }

    //xử lý logout khi mọi phương pháp lấy token mới thất bại
    private fun handleLogout() {
        sessionManager.clearTokens()//xóa token cũ
        //Xóa sạch toàn bộ các Activity cũ để quay về màn hình đầu tiên
        //tạo intent mở activity khởi động ứng dụng
        //FLAG_ACTIVITY_NEW_TASK: tạo task mới , FLAG_ACTIVITY_CLEAR_TASK: xóa saxhj activity trong ngăn xếp
        val intent = context.packageManager.getLaunchIntentForPackage(context.packageName)?.apply {
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK)
        }
        context.startActivity(intent)
    }
}