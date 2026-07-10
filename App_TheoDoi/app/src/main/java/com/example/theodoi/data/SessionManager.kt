package com.example.theodoi.data

import android.content.Context
import android.content.SharedPreferences

//SessionManager dung de quan ly phien dang nhap gom cac nghiep vu lien quan den assettoken va refreshtoken
//Contructor SessionManager truyen vao 1 context vi su dung SharedPreferences
class SessionManager(context: Context) {

    //mo/tao(neu chua co) SharedPreferences 1 vung luu tru giong tep xml
    // voi mode rieng tu chi ung dung nay duoc doc (mac dinh)
    private val prefs: SharedPreferences = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

    //luu token
    fun saveTokens(accessToken: String, refreshToken: String) {
        val editor = prefs.edit()//tao 1 SharedPreferences  editor de chinh sua tep luu tru
        editor.putString(KEY_ACCESS_TOKEN, accessToken)
        editor.putString(KEY_REFRESH_TOKEN, refreshToken)
        editor.apply()//luu thay doi ghi bat dong bo
    }

    //lay assettoken phuc vu gui request
    fun getAccessToken(): String? {
        return prefs.getString(KEY_ACCESS_TOKEN, null)
    }

    //lay reffreshtoken phuc vu refresh-token
    fun getRefreshToken(): String? {
        return prefs.getString(KEY_REFRESH_TOKEN, null)
    }

    //xoa token khi dang xuat
    fun clearTokens() {
        val editor = prefs.edit()
        editor.clear()
        editor.apply()
    }

    //tao 1 companion object(thuoc ve lop) chua hang so chung
    companion object {
        private const val PREFS_NAME = "auth_prefs"//ten vung luu tru
        private const val KEY_ACCESS_TOKEN = "access_token"//
        private const val KEY_REFRESH_TOKEN = "refresh_token"
    }
}
