package com.example.theodoi_truyvet.database

import androidx.room.Entity
import androidx.room.PrimaryKey
import java.util.Date

/**
 * Represents the encrypted face embedding of a user stored locally.
 */
@Entity(tableName = "user_embeddings")
data class UserEmbedding(
    @PrimaryKey val userId: Int, // Should match the user ID from the server
    val encryptedEmbedding: ByteArray, // The AES-GCM encrypted embedding
    val iv: ByteArray, // The Initialization Vector for AES
    val lastUpdatedAt: Date
)

/**
 * Represents a check-in that has been successfully validated locally
 * but is pending synchronization with the server.
 */
@Entity(tableName = "pending_check_ins")
data class PendingCheckIn(
    @PrimaryKey(autoGenerate = true) val id: Int = 0,
    val latitude: Double,
    val longitude: Double,
    val imageUrl: String, // Path to the locally saved image
    val createdAt: Date
)
