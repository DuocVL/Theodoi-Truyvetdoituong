package com.example.theodoi_truyvet.ui

import android.util.Log
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.theodoi_truyvet.models.LoginRequest
import com.example.theodoi_truyvet.network.ApiService
import com.example.theodoi_truyvet.network.AuthTokenManager
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class LoginUiState(
    val isLoading: Boolean = false,
    val error: String? = null,
    val isSuccess: Boolean = false
)

// --- MODIFIED: Use Hilt for ViewModel injection ---
@HiltViewModel
class LoginViewModel @Inject constructor(
    private val apiService: ApiService,
    private val authTokenManager: AuthTokenManager
) : ViewModel() {

    private val _uiState = MutableStateFlow(LoginUiState())
    val uiState: StateFlow<LoginUiState> = _uiState

    fun login(username: String, password: String) {
        if (username.isBlank() || password.isBlank()) {
            _uiState.value = LoginUiState(error = "Username and password cannot be empty.")
            return
        }

        viewModelScope.launch {
            _uiState.value = LoginUiState(isLoading = true)
            try {
                val request = LoginRequest(username, password)
                // --- MODIFIED: Use injected apiService ---
                val response = apiService.login(request)

                if (response.isSuccessful && response.body() != null) {
                    response.body()?.let { body ->
                        // --- MODIFIED: Use injected authTokenManager ---
                        authTokenManager.saveToken(body.token)
                        _uiState.value = LoginUiState(isSuccess = true)
                    } ?: run {
                        _uiState.value = LoginUiState(error = "Invalid response from server.")
                    }
                } else {
                    val errorBody = response.errorBody()?.string()
                    Log.e("LoginViewModel", "Login failed: ${response.code()} - $errorBody")
                    _uiState.value = LoginUiState(error = "Invalid credentials or server error.")
                }
            } catch (e: Exception) {
                Log.e("LoginViewModel", "Network request failed", e)
                _uiState.value = LoginUiState(error = e.message ?: "Network request failed")
            }
        }
    }

    fun errorShown() {
        _uiState.value = _uiState.value.copy(error = null)
    }
}
