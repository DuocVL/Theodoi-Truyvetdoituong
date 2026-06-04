
package com.example.theodoi_truyvet.ui

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.theodoi_truyvet.models.LoginRequest
import com.example.theodoi_truyvet.network.AuthTokenManager
import com.example.theodoi_truyvet.network.RetrofitInstance
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch

data class LoginUiState(
    val isLoading: Boolean = false,
    val error: String? = null,
    val isSuccess: Boolean = false
)

class LoginViewModel : ViewModel() {

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
                val response = RetrofitInstance.api.login(request)

                if (response.isSuccessful && response.body() != null) {
                    val token = response.body()!!.token
                    AuthTokenManager.saveToken(token) // Save the token
                    _uiState.value = LoginUiState(isSuccess = true)
                } else {
                    val errorBody = response.errorBody()?.string() ?: "Invalid credentials"
                    _uiState.value = LoginUiState(error = errorBody)
                }
            } catch (e: Exception) {
                _uiState.value = LoginUiState(error = e.message ?: "Network request failed")
            }
        }
    }

    fun errorShown() {
        _uiState.value = _uiState.value.copy(error = null)
    }
}
