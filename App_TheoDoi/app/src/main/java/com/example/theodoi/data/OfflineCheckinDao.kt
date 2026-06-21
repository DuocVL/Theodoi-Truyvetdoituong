package com.example.theodoi.data

import androidx.room.*
import java.util.UUID

@Entity(tableName = "offline_checkins")
data class OfflineCheckinEntity(
    // id dong thoi dung lam requestUuid gui len server de chong tao trung check-in
    // khi request bi timeout nhung server da xu ly thanh cong truoc do.
    @PrimaryKey val id: String = UUID.randomUUID().toString(),
    val latitude: Double,
    val longitude: Double,
    val notes: String,
    val faceVerified: Boolean,
    val imagePath: String, // Duong dan anh luu trong filesDir (KHONG dung cacheDir vi co the bi he thong xoa)
    val createdAt: Long = System.currentTimeMillis(),
    val retryCount: Int = 0,         // MOI
    val status: String = "PENDING",  // MOI: PENDING | FAILED
    val lastError: String? = null    // MOI: luu log loi gan nhat de debug/hien thi cho admin
)

@Dao
interface OfflineCheckinDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertCheckin(checkin: OfflineCheckinEntity)

    // SUA: chi lay PENDING, bo qua FAILED (da xac dinh khong the retry vo han)
    @Query("SELECT * FROM offline_checkins WHERE status = 'PENDING' ORDER BY createdAt ASC")
    suspend fun getPendingCheckins(): List<OfflineCheckinEntity>

    // MOI: dung de hien thi badge "X check-in cho dong bo" tren UI
    @Query("SELECT COUNT(*) FROM offline_checkins WHERE status = 'PENDING'")
    suspend fun countPending(): Int

    // MOI: SyncCheckinWorker can ham nay de danh dau FAILED hoac tang retryCount
    @Query("UPDATE offline_checkins SET status = :status, retryCount = retryCount + 1, lastError = :error WHERE id = :id")
    suspend fun updateStatus(id: String, status: String, error: String? = null)

    @Delete
    suspend fun deleteCheckin(checkin: OfflineCheckinEntity)
}