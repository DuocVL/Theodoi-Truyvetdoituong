
package com.example.theodoi_truyvet

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.example.theodoi_truyvet.ui.ActivationScreen
import com.example.theodoi_truyvet.ui.LoginScreen
import com.example.theodoi_truyvet.ui.MainScreen

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            MaterialTheme {
                Surface {
                    val navController = rememberNavController()
                    val startDestination = if (AuthTokenManager.getToken() != null) "main" else "login"

                    NavHost(navController = navController, startDestination = startDestination) {
                        composable("login") { LoginScreen(navController) }
                        composable("activate") { ActivationScreen(navController) }
                        composable("main") { MainScreen() }
                    }
                }
            }
        }
    }
}
