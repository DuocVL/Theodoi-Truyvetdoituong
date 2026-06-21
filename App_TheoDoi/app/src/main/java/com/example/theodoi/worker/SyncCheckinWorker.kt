package com.example.theodoi.worker

import android.content.Context
import android.util.Log
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import com.example.theodoi.data.AppDatabase
import com.example.theodoi.data.CheckinRepository
import com.example.theodoi.data.SessionManager
import java.io.File
import java.io.IOException

class SyncCheckinWorker(
    context: Context,
    workerParams: WorkerParameters
) : CoroutineWorker(context, workerParams) {

    companion object {
        private const val TAG = "SyncCheckinWorker"
        private const val MAX_RETRY = 5 // qua so lan nay coi nhu loi vinh vien, khong retry vo han nua
    }

    private val db = AppDatabase.getDatabase(context)
    private val offlineDao = db.offlineCheckinDao() // SUA: dung dung ten ham khai bao trong AppDatabase
    private val repository = CheckinRepository()
    private val sessionManager = SessionManager(context)

    override suspend fun doWork(): Result {
        Log.d(TAG, "WorkManager bat dau kiem tra va dong bo du lieu offline")

        // SUA: dung ten ham giong VerifyActivity dang goi (getAccessToken).
        // Neu SessionManager cua ban ten khac, doi lai cho dung.
        val token = sessionManager.getAccessToken()
        if (token.isNullOrEmpty()) {
            Log.w(TAG, "Khong co token (co the user da dang xuat) -> dung sync, cho lan dang nhap sau")
            return Result.failure()
        }

        val pendingList = offlineDao.getPendingCheckins()
        if (pendingList.isEmpty()) {
            Log.d(TAG, "Khong co checkin nao can dong bo")
            return Result.success()
        }

        Log.d(TAG, "Co ${pendingList.size} checkin dang cho dong bo")
        var hasNetworkError = false

        for (item in pendingList) {
            val file = File(item.imagePath)
            if (!file.exists()) {
                Log.e(TAG, "File anh khong ton tai: ${item.imagePath}. Xoa record loi.")
                offlineDao.deleteCheckin(item)
                continue
            }

            try {
                Log.d(TAG, "Dang dong bo record ID: ${item.id} len server...")
                val response = repository.submitCheckin(
                    token = token,
                    latitude = item.latitude,
                    longitude = item.longitude,
                    notes = item.notes,
                    faceVerified = item.faceVerified,
                    imageFile = file,
                    requestUuid = item.id // MOI: dung chinh id local lam idempotency key chong gui trung
                )

                if (response.isSuccessful) {
                    Log.d(TAG, "Dong bo thanh cong ID: ${item.id}. Tien hanh don dep.")
                    offlineDao.deleteCheckin(item)
                    file.delete()
                } else {
                    val code = response.code()
                    Log.w(TAG, "Server tu choi record ${item.id} voi HTTP Code: $code")

                    if (code in 400..499) {
                        // Loi du lieu/token het han -> khong retry vo han, danh dau FAILED de xem xet
                        offlineDao.updateStatus(item.id, "FAILED", "HTTP $code")
                    } else {
                        // Loi 5xx server -> coi nhu tam thoi, de WorkManager backoff roi thu lai
                        hasNetworkError = true
                    }
                }
            } catch (e: IOException) {
                // SUA: day moi la loi mang THUC SU (timeout, mat ket noi giua chung...)
                Log.e(TAG, "Mat mang giua luc dong bo record ${item.id}: ${e.message}")
                hasNetworkError = true
                break // mang da mat thi cac item con lai cung se fail, dung som tiet kiem pin/data
            } catch (e: Exception) {
                // Loi khac (parse JSON sai, du lieu local hong...) -> KHONG nen coi la loi mang,
                // vi retry vo han cung khong giai quyet duoc.
                Log.e(TAG, "Loi khong xac dinh khi dong bo record ${item.id}: ${e.message}", e)
                val newRetryCount = item.retryCount + 1
                if (newRetryCount >= MAX_RETRY) {
                    offlineDao.updateStatus(item.id, "FAILED", e.message)
                } else {
                    offlineDao.updateStatus(item.id, "PENDING", e.message)
                }
            }
        }

        return if (hasNetworkError) {
            Log.w(TAG, "Co loi mang xay ra trong qua trinh dong bo. WorkManager se tu backoff va retry sau.")
            Result.retry()
        } else {
            Log.d(TAG, "Hoan thanh chu ky dong bo.")
            Result.success()
        }
    }
}