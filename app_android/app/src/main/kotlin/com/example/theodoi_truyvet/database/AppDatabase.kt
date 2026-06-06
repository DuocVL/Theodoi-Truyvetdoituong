package com.example.theodoi_truyvet.database

import androidx.room.Database
import androidx.room.RoomDatabase
import androidx.room.TypeConverters

@Database(
    entities = [UserEmbedding::class, PendingCheckIn::class],
    version = 1,
    exportSchema = false
)
@TypeConverters(Converters::class) // We'll create this next
abstract class AppDatabase : RoomDatabase() {
    abstract fun appDao(): AppDao
}
