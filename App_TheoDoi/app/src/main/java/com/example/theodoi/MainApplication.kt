package com.example.theodoi

import android.app.Application
import com.example.theodoi.network.ApiClient

//lop dai dien toan cuc ung dung
//khoi chay khi ung dung duoc bat va tat khi ung dung kill khi báo trong AndroidManifest.xml
class MainApplication : Application() {
    //phuong thuc goi 1 lần duy nhất khi ứng dụng được khởi động
    override fun onCreate() {
        super.onCreate()
        // Khởi tạo ApiClient tại đây giúp hệ thống luôn có Contex
        // ngay khi ứng dụng vừa được bật lên, trước cả màn hình Login 
        ApiClient.init(this)
    }
}