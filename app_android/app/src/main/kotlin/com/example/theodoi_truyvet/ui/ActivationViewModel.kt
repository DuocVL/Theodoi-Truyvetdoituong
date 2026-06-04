
package com.example.theodoi_truyvet.ui

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.theodoi_truyvet.models.ActivationRequest
import com.example.theodoi_truyvet.network.RetrofitInstance
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch

// Represents the state of the activation screen
data class ActivationUiState(
    val isLoading: Boolean = false,
    val error: String? = null,
    val isSuccess: Boolean = false
)

class ActivationViewModel : ViewModel() {

    private val _uiState = MutableStateFlow(ActivationUiState())
    val uiState: StateFlow<ActivationUiState> = _uiState

    fun activateAccount(token: String, password: String) {
        // Validate input
        if (token.isBlank() || password.isBlank()) {
            _uiState.value = ActivationUiState(error = "Token and password cannot be empty.")
            return
        }

        viewModelScope.launch {
            _uiState.value = ActivationUiState(isLoading = true)
            try {
                val request = ActivationRequest(token, password)
                val response = RetrofitInstance.api.activateAccount(request)

                if (response.isSuccessful) {
                    _uiState.value = ActivationUiState(isSuccess = true)
                } else {
                    // Attempt to parse the error message from the server
                    val errorBody = response.errorBody()?.string() ?: "Unknown error occurred"
                    _uiState.value = ActivationUiState(error = errorBody)
                }
            } catch (e: Exception) {
                _uiState.value = ActivationUiState(error = e.message ?: "Network request failed")
            }
        }
    }
    
    // Function to reset the error state after it's been shown
    fun errorShown() {
        _uiState.value = _uiState.value.copy(error = null)
    }
}
