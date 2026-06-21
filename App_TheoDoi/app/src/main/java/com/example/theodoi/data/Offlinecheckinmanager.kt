package com.example.theodoi.data

import android.content.Context
import java.io.File

/**
 * Quan ly viec luu check-in tam thoi khi mat mang, de SyncCheckinWorker
 * dong bo lai sau khi co mang. Goi tu VerifyActivity khi submitCheckin()
 * that bai do loi mang (IOException).
 */
class OfflineCheckinManager(private val context: Context) {

    private val dao = AppDatabase.getDatabase(context).offlineCheckinDao()

    suspend fun saveForLaterSync(
        latitude: Double,
        longitude: Double,
        notes: String,
        faceVerified: Boolean,
        sourceImageFile: File
    ) {
        // QUAN TRONG: copy anh tu cacheDir (co the bi he thong xoa bat ky luc nao
        // de giai phong dung luong) sang filesDir (ben vung, chi mat khi user xoa app)
        val persistDir = File(context.filesDir, "offline_checkins").apply { mkdirs() }
        val persistFile = File(persistDir, "checkin_${System.currentTimeMillis()}.jpg")
        sourceImageFile.copyTo(persistFile, overwrite = true)

        val entity = OfflineCheckinEntity(
            latitude = latitude,
            longitude = longitude,
            notes = notes,
            faceVerified = faceVerified,
            imagePath = persistFile.absolutePath
        )
        dao.insertCheckin(entity)
    }

    suspend fun countPending(): Int = dao.countPending()
}