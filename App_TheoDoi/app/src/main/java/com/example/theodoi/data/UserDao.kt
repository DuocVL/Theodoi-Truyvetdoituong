package com.example.theodoi.data

import androidx.room.*

@Entity(tableName = "users")
data class UserEntity(
    @PrimaryKey val userId: String,
    val name: String,
    @ColumnInfo(typeAffinity = ColumnInfo.BLOB) val encryptedVector: ByteArray,
    @ColumnInfo(typeAffinity = ColumnInfo.BLOB) val iv: ByteArray
)

@Dao
interface UserDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertUser(user: UserEntity)

    @Query("SELECT * FROM users")
    suspend fun getAllUsers(): List<UserEntity>
}