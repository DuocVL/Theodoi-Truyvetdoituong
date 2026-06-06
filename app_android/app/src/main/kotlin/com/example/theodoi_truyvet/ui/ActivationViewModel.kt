package com.example.theodoi_truyvet.ui

import android.util.Log
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.theodoi_truyvet.models.ActivationRequest
import com.example.theodoi_truyvet.network.ApiService
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class ActivationUiState(
    val isLoading: Boolean = false,
    val error: String? = null,
    val isSuccess: Boolean = false
)

// --- MODIFIED: Use Hilt for ViewModel injection ---
@HiltViewModel
class ActivationViewModel @Inject constructor(
    private val apiService: ApiService
) : ViewModel() {

    private val _uiState = MutableStateFlow(ActivationUiState())
    val uiState: StateFlow<ActivationUiState> = _uiState

    fun activateAccount(token: String, password: String) {
        if (token.isBlank() || password.isBlank()) {
            _uiState.value = ActivationUiState(error = "Token and password cannot be empty.")
            return
        }

        viewModelScope.launch {
            _uiState.value = ActivationUiState(isLoading = true)
            try {
                val request = ActivationRequest(token, password)
                // --- MODIFIED: Use injected apiService ---
                val response = apiService.activateAccount(request)

                if (response.isSuccessful) {
                    _uiState.value = ActivationUiState(isSuccess = true)
                } else {
                    val errorBody = response.errorBody()?.string()
                    Log.e("ActivationViewModel", "Activation failed: ${response.code()} - $errorBody")
                    _uiState.value = ActivationUiState(error = "Invalid or expired token.")
                }
            } catch (e: Exception) {
                Log.e("ActivationViewModel", "Network request failed", e)
                _uiState.value = ActivationUiState(error = e.message ?: "Network request failed")
            }
        }
    }
    
    fun errorShown() {
        _uiState.value = _uiState.value.copy(error = null)
    }
}
