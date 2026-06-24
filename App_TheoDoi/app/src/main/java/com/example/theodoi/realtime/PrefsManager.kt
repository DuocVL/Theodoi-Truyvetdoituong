package com.example.theodoi.realtime

import android.content.Context

object PrefsManager {
    private const val PREF_NAME = "theodoi_prefs"
    private const val KEY_INTERVAL_MS = "interval_ms"
    private const val KEY_SERVER_URL = "server_url"
    private const val KEY_TRACKING_ENABLED = "tracking_enabled"
    private const val KEY_DEVICE_ID = "device_id"

    private const val DEFAULT_INTERVAL_MS = 60_000L // 60s mặc định

    private fun prefs(context: Context) =
        context.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE)

    fun getIntervalMs(context: Context): Long =
        prefs(context).getLong(KEY_INTERVAL_MS, DEFAULT_INTERVAL_MS)

    fun setIntervalMs(context: Context, value: Long) {
        prefs(context).edit().putLong(KEY_INTERVAL_MS, value).apply()
    }

    fun getServerUrl(context: Context): String =
        prefs(context).getString(KEY_SERVER_URL, "http://192.168.44.101:3333/api/v1/locations/") ?: ""

    fun setServerUrl(context: Context, url: String) {
        prefs(context).edit().putString(KEY_SERVER_URL, url).apply()
    }

    fun isTrackingEnabled(context: Context): Boolean =
        prefs(context).getBoolean(KEY_TRACKING_ENABLED, false)

    fun setTrackingEnabled(context: Context, enabled: Boolean) {
        prefs(context).edit().putBoolean(KEY_TRACKING_ENABLED, enabled).apply()
    }

    fun getDeviceId(context: Context): String {
        var id = prefs(context).getString(KEY_DEVICE_ID, null)
        if (id == null) {
            id = java.util.UUID.randomUUID().toString()
            prefs(context).edit().putString(KEY_DEVICE_ID, id).apply()
        }
        return id
    }
}