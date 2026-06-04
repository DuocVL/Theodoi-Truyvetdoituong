package com.example.theodoi_truyvet.ui

import android.Manifest
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.navigation.NavDestination.Companion.hierarchy
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import com.google.accompanist.permissions.ExperimentalPermissionsApi
import com.google.accompanist.permissions.isGranted
import com.google.accompanist.permissions.rememberPermissionState
import com.google.accompanist.permissions.shouldShowRationale

// ... (LoginScreen and ActivationScreen remain the same) ...

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MainScreen() {
    val navController = rememberNavController()
    val navItems = listOf(NavigationItem.CheckIn, NavigationItem.History, NavigationItem.Profile)

    Scaffold(
        bottomBar = {
            NavigationBar {
                val navBackStackEntry by navController.currentBackStackEntryAsState()
                val currentDestination = navBackStackEntry?.destination

                navItems.forEach { screen ->
                    NavigationBarItem(
                        icon = { Icon(screen.icon, contentDescription = null) },
                        label = { Text(screen.title) },
                        selected = currentDestination?.hierarchy?.any { it.route == screen.route } == true,
                        onClick = {
                            navController.navigate(screen.route) {
                                popUpTo(navController.graph.findStartDestination().id) {
                                    saveState = true
                                }
                                launchSingleTop = true
                                restoreState = true
                            }
                        }
                    )
                }
            }
        }
    ) { innerPadding ->
        NavHost(
            navController = navController,
            startDestination = NavigationItem.CheckIn.route,
            modifier = Modifier.padding(innerPadding)
        ) {
            composable(NavigationItem.CheckIn.route) { CheckInScreen() }
            composable(NavigationItem.History.route) { HistoryScreen() }
            composable(NavigationItem.Profile.route) { ProfileScreen() }
        }
    }
}

@OptIn(ExperimentalPermissionsApi::class)
@Composable
fun CheckInScreen() {
    val cameraPermissionState = rememberPermissionState(Manifest.permission.CAMERA)

    if (cameraPermissionState.status.isGranted) {
        Column(
            modifier = Modifier.fillMaxSize(),
            verticalArrangement = Arrangement.Center,
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text("Quyền truy cập camera đã được cấp.", modifier = Modifier.padding(16.dp))
            Button(onClick = { /* TODO: Navigate to Camera Screen */ }) {
                Text("Mở Camera")
            }
        }
    } else {
        Column(
            modifier = Modifier.fillMaxSize(),
            verticalArrangement = Arrangement.Center,
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            val textToShow = if (cameraPermissionState.status.shouldShowRationale) {
                // Nếu người dùng đã từ chối trước đó, hiển thị giải thích tại sao cần quyền.
                "Để check-in bằng khuôn mặt, bạn cần cấp quyền sử dụng camera. Hãy nhấn nút và cho phép ứng dụng khi được hỏi."
            } else {
                // Lần đầu tiên yêu cầu quyền.
                "Chức năng này cần quyền truy cập camera để hoạt động."
            }

            Text(text = textToShow, modifier = Modifier.padding(16.dp))
            Button(onClick = { cameraPermissionState.launchPermissionRequest() }) {
                Text("Yêu cầu quyền")
            }
        }
    }
}

@Composable
fun HistoryScreen() {
    Column(
        modifier = Modifier.fillMaxSize(),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Text(text = "History Screen", style = MaterialTheme.typography.headlineMedium)
    }
}

@Composable
fun ProfileScreen() {
    Column(
        modifier = Modifier.fillMaxSize(),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Text(text = "Profile Screen", style = MaterialTheme.typography.headlineMedium)
    }
}


// ... (The rest of the file remains the same) ...