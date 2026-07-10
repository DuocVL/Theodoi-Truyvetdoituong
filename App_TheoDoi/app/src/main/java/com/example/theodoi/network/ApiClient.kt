package com.example.theodoi.network

import android.content.Context
import com.example.theodoi.data.SessionManager
import okhttp3.Interceptor
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory

//ApiClient la 1 Singleton chi co 1 trong toan bo ưng dung

//object tạo Singleton
object ApiClient {

    private const val BASE_URL = "http://192.168.44.101:3333/" //duong dan den may chu
    //ham tien ich dinh nghia duong dan anh
    fun getAbsoluteImageUrl(relativeUrl: String): String = "$BASE_URL${relativeUrl.removePrefix("/")}"

    private lateinit var appContext: Context//bien lưu tru ngu canh ung dung
    lateinit var sessionManager: SessionManager //luu cac thong tin trong phien

    // Hàm khởi tạo bắt buộc gọi ở MainApplication ngay sau khi khoi dong ung dung
    //nham nap ngu canh va kich hoat SessionManager
    fun init(context: Context) {
        appContext = context.applicationContext//luu tru ngu canh ung dung
        sessionManager = SessionManager(appContext)//kich hoat 1 SessionManger voi app context quan ly token ,...
    }

    // Interceptor tự động thêm Header Authorization vào mọi Request trừ API refresh-token
    private val authInterceptor = Interceptor { chain ->
        val originalRequest = chain.request()//lay request goc

        //Kiểm tra an toàn xem sessionManager đã được nạp qua hàm init() chưa trước khi lấy Token
        val token = if (::sessionManager.isInitialized) sessionManager.getAccessToken() else null

        //Tao Request Builder de chinh sua Request
        val requestBuilder = originalRequest.newBuilder()

        // Không tự động nhét token cũ vào request gọi làm mới token
        if (token != null && originalRequest.header("Authorization") == null &&// kiem tra request da co token chua
            !originalRequest.url.encodedPath.contains("api/v1/auth/refresh-token")) {//bo qua refresh-token vi ko can assettoken
            requestBuilder.addHeader("Authorization", "Bearer $token")//them asset token vao header
        }
        //thay doi Request voi noi dung moi
        chain.proceed(requestBuilder.build())
    }

    //Khoi tao cau hinh httpclient
    //by lazy chi tao khi can lan dau tien
    private val httpClient by lazy {
        OkHttpClient.Builder()
            .addInterceptor(authInterceptor)//moi Request deu tu them Author
            .addInterceptor(HttpLoggingInterceptor().apply { level = HttpLoggingInterceptor.Level.BODY })//logging
            .authenticator(TokenAuthenticator(appContext, sessionManager))//TokenAuthenticator sẽ cử lý việc lấy token mới khi server trả mã 401
            .build()
    }

    //tao doi tuong Retrofit
    //by lazy chi tao khi can lan dau tien
    private val retrofit by lazy {
        Retrofit.Builder()
            .baseUrl(BASE_URL)//cau hinh URL den backend
            .client(httpClient)//su dung cau hinh httpclient
            .addConverterFactory(GsonConverterFactory.create())//tu dong chuyen doi giua JSON va cac lop Kotlin
            .build()
    }

    //Khoi tao cac API Service
    //Retrofit sẽ tạo một đối tượng triển khai interface.
    val authApiService: AuthApiService by lazy { retrofit.create(AuthApiService::class.java) }
    val faceApiService: FaceApiService by lazy { retrofit.create(FaceApiService::class.java) }
    val checkinService: CheckinApiService by lazy { retrofit.create(CheckinApiService::class.java) }
    val subjectApiService: SubjectApiService by lazy { retrofit.create(SubjectApiService::class.java) }
}