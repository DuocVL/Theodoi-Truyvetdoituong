package com.example.theodoi_truyvet.database

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query

@Dao
interface AppDao {

    // --- UserEmbedding Queries ---

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertUserEmbedding(embedding: UserEmbedding)

    @Query("SELECT * FROM user_embeddings WHERE userId = :userId LIMIT 1")
    suspend fun getUserEmbedding(userId: Int): UserEmbedding?

    @Query("DELETE FROM user_embeddings")
    suspend fun clearAllEmbeddings()

    // --- PendingCheckIn Queries ---

    @Insert
    suspend fun insertPendingCheckIn(checkIn: PendingCheckIn)

    @Query("SELECT * FROM pending_check_ins ORDER BY createdAt ASC")
    suspend fun getAllPendingCheckIns(): List<PendingCheckIn>

    @Query("DELETE FROM pending_check_ins WHERE id = :id")
    suspend fun deletePendingCheckIn(id: Int)

}
