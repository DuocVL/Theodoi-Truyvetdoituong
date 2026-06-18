package com.example.theodoi.utils

import android.content.Context
import android.os.Build
import android.provider.Settings
import java.io.File

object DeviceUtils {

    /**
     * Gets the device manufacturer.
     * e.g., "Google"
     */
    val manufacturer: String
        get() = Build.MANUFACTURER

    /**
     * Gets the device model.
     * e.g., "Pixel 6"
     */
    val model: String
        get() = Build.MODEL

    /**
     * Gets the Android version name.
     * e.g., "13"
     */
    val androidVersion: String
        get() = Build.VERSION.RELEASE

    /**
     * Gets the Android SDK level.
     * e.g., 33
     */
    val sdkVersion: Int
        get() = Build.VERSION.SDK_INT

    /**
     * Gets the unique Android ID for the device.
     */
    fun getAndroidId(context: Context): String {
        return Settings.Secure.getString(context.contentResolver, Settings.Secure.ANDROID_ID)
    }

    /**
     * Checks if the app is running on an emulator.
     * This is not a foolproof method but covers common cases.
     */
    val isEmulator: Boolean
        get() = (Build.FINGERPRINT.startsWith("generic")
                || Build.FINGERPRINT.startsWith("unknown")
                || Build.MODEL.contains("google_sdk")
                || Build.MODEL.contains("Emulator")
                || Build.MODEL.contains("Android SDK built for x86")
                || Build.MANUFACTURER.contains("Genymotion")
                || (Build.BRAND.startsWith("generic") && Build.DEVICE.startsWith("generic"))
                || "google_sdk" == Build.PRODUCT)

    /**
     * Checks if the device is likely rooted.
     * This is a basic check and not guaranteed to be accurate.
     */
    val isRooted: Boolean
        get() = checkRootMethod1() || checkRootMethod2() || checkRootMethod3()

    private fun checkRootMethod1(): Boolean {
        val buildTags = Build.TAGS
        return buildTags != null && buildTags.contains("test-keys")
    }

    private fun checkRootMethod2(): Boolean {
        val paths = arrayOf(
            "/system/app/Superuser.apk", "/sbin/su", "/system/bin/su", "/system/xbin/su",
            "/data/local/xbin/su", "/data/local/bin/su", "/system/sd/xbin/su",
            "/system/bin/failsafe/su", "/data/local/su", "/su/bin/su"
        )
        for (path in paths) {
            if (File(path).exists()) return true
        }
        return false
    }

    private fun checkRootMethod3(): Boolean {
        var process: Process? = null
        return try {
            process = Runtime.getRuntime().exec(arrayOf("/system/xbin/which", "su"))
            val `in` = process.inputStream
            `in`.read() != -1
        } catch (t: Throwable) {
            false
        } finally {
            process?.destroy()
        }
    }
}
