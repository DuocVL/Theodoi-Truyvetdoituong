package com.example.theodoi

import android.app.Application
import com.example.theodoi.network.ApiClient

class MainApplication : Application() {
    override fun onCreate() {
        super.onCreate()
        // Khởi tạo ApiClient tại đây giúp hệ thống luôn có Context
        // ngay khi ứng dụng vừa được bật lên, trước cả màn hình Login
        ApiClient.init(this)
    }
}