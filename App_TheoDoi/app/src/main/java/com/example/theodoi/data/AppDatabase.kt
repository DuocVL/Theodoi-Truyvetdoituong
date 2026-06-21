package com.example.theodoi.data

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase

@Database(
    // SUA: them OfflineCheckinEntity, neu khong Room se khong tao bang offline_checkins
    entities = [UserEntity::class, OfflineCheckinEntity::class],
    version = 2, // SUA: tang version vi schema thay doi (them bang moi)
    exportSchema = false
)
abstract class AppDatabase : RoomDatabase() {
    abstract fun userDao(): UserDao
    abstract fun offlineCheckinDao(): OfflineCheckinDao

    companion object {
        @Volatile private var INSTANCE: AppDatabase? = null
        fun getDatabase(context: Context): AppDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    AppDatabase::class.java,
                    "face_recog_db"
                )
                    // SUA: tranh app crash voi nguoi dung da co DB version cu tren may.
                    // Luu y: cach nay se XOA sach du lieu cu khi nang version.
                    // Neu UserEntity dang co du lieu quan trong, nen viet Migration() rieng
                    // thay vi dung fallback nay khi len production.
                    .fallbackToDestructiveMigration()
                    .build()
                INSTANCE = instance
                instance
            }
        }
    }
}