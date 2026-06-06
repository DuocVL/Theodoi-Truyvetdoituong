package com.example.theodoi_truyvet.view

import android.graphics.Bitmap
import androidx.camera.core.ImageProxy
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.theodoi_truyvet.facerecognition.FaceAnalyzer
import com.example.theodoi_truyvet.facerecognition.FaceRecognitionRepo
import com.example.theodoi_truyvet.facerecognition.VerificationResult
import com.example.theodoi_truyvet.location.LocationProvider
import com.example.theodoi_truyvet.repository.CheckInRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class CameraViewModel @Inject constructor(
    private val faceAnalyzer: FaceAnalyzer,
    private val faceRecognitionRepo: FaceRecognitionRepo,
    private val locationProvider: LocationProvider,
    private val checkInRepository: CheckInRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow<CameraUiState>(CameraUiState.Idle)
    val uiState = _uiState.asStateFlow()

    // For simplicity, we assume a logged-in user with ID 1.
    // In a real app, you would get this from a user management module.
    private val userId = 1

    fun onImageCaptured(imageProxy: ImageProxy) {
        // Prevent multiple analyses from running at the same time
        if (_uiState.value is CameraUiState.Processing) return

        _uiState.value = CameraUiState.Processing("Đang phân tích khuôn mặt...")

        faceAnalyzer.analyze(
            imageProxy = imageProxy,
            onFaceDetected = { embedding ->
                _uiState.value = CameraUiState.Processing("Đã phát hiện, đang xác thực...")
                verifyFace(embedding)
            },
            onError = { exception ->
                _uiState.value = CameraUiState.Error(exception.message ?: "Đã xảy ra lỗi không xác định.")
            }
        )
    }

    private fun verifyFace(embedding: FloatArray) {
        viewModelScope.launch {
            when (val result = faceRecognitionRepo.verifyFace(userId, embedding)) {
                is VerificationResult.Success -> {
                    _uiState.value = CameraUiState.Success("Xác thực thành công!", result.similarity)
                    performCheckIn()
                }
                is VerificationResult.Failure -> {
                    _uiState.value = CameraUiState.Error("Xác thực thất bại. Thử lại.")
                }
                VerificationResult.NoFaceRegistered -> {
                     // For now, we will register the first face detected as the user's face
                    faceRecognitionRepo.registerFace(userId, embedding)
                    _uiState.value = CameraUiState.Success("Đã đăng ký khuôn mặt lần đầu.", 1.0f)
                    performCheckIn()
                }
            }
        }
    }

    private fun performCheckIn() {
        viewModelScope.launch {
            _uiState.value = CameraUiState.Processing("Đang lấy vị trí...")
            val locationResult = locationProvider.getCurrentLocation()

            locationResult.onSuccess {
                _uiState.value = CameraUiState.Processing("Đang thực hiện check-in...")
                // In a real app, you would get the image URL from a cloud storage service
                // after uploading the captured face image. For now, we use a placeholder.
                val placeholderImageUrl = "https://example.com/image.jpg"
                checkInRepository.performCheckIn(it, placeholderImageUrl)
                _uiState.value = CameraUiState.Success("Check-in thành công!", -1f) // Use a flag for similarity

            }.onFailure {
                _uiState.value = CameraUiState.Error("Không thể lấy vị trí. Check-in thất bại.")
            }
        }
    }

    fun resetState(){
        _uiState.value = CameraUiState.Idle
    }
}

sealed class CameraUiState {
    object Idle : CameraUiState()
    data class Processing(val message: String) : CameraUiState()
    data class Success(val message: String, val similarity: Float) : CameraUiState()
    data class Error(val message: String) : CameraUiState()
}
